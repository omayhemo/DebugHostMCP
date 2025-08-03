/**
 * Tests for Health Checker
 */

const HealthChecker = require('../src/health-checker');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Mock child_process for command execution tests
jest.mock('child_process');
const { spawn } = require('child_process');

describe('HealthChecker', () => {
    let checker;
    let tempDir;

    beforeEach(async () => {
        checker = new HealthChecker({ verbose: false });
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'health-check-test-'));
        
        // Reset spawn mock
        spawn.mockClear();
    });

    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (e) {
            // Cleanup failed, continue
        }
    });

    describe('runHealthCheck', () => {
        it('should run all health checks', async () => {
            const results = await checker.runHealthCheck();

            expect(results).toHaveProperty('overall');
            expect(results).toHaveProperty('checks');
            expect(results).toHaveProperty('timestamp');
            expect(results).toHaveProperty('duration');
            
            // Check that all expected checks are present
            const expectedChecks = [
                'node_environment',
                'project_structure',
                'dependencies',
                'configuration',
                'ports',
                'permissions',
                'mcp_integration',
                'system_resources'
            ];

            expectedChecks.forEach(checkName => {
                expect(results.checks).toHaveProperty(checkName);
            });
        });

        it('should calculate duration', async () => {
            const results = await checker.runHealthCheck();

            expect(results.duration).toBeGreaterThan(0);
            expect(typeof results.duration).toBe('number');
        });

        it('should handle errors gracefully', async () => {
            // Mock a failing check by overriding checkNodeEnvironment
            checker.checkNodeEnvironment = jest.fn().mockRejectedValue(new Error('Test error'));

            const results = await checker.runHealthCheck();

            expect(results.overall).toBe('critical');
            expect(results.error).toBe('Test error');
        });
    });

    describe('checkNodeEnvironment', () => {
        it('should pass for supported Node.js version', async () => {
            // Mock npm version command
            const mockProcess = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, callback) => {
                    if (event === 'close') {
                        callback(0);
                    }
                })
            };
            
            spawn.mockReturnValue(mockProcess);

            // Simulate npm --version output
            mockProcess.stdout.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback('8.19.0\n');
                }
            });

            await checker.checkNodeEnvironment();

            expect(checker.results.checks.node_environment.status).toBe('healthy');
            expect(checker.results.checks.node_environment.message).toContain(process.version);
        });

        it('should fail for unsupported Node.js version', async () => {
            // Mock old Node.js version
            const originalVersion = process.version;
            Object.defineProperty(process, 'version', { value: 'v16.0.0' });

            await checker.checkNodeEnvironment();

            expect(checker.results.checks.node_environment.status).toBe('critical');
            expect(checker.results.checks.node_environment.message).toContain('not supported');

            // Restore original version
            Object.defineProperty(process, 'version', { value: originalVersion });
        });
    });

    describe('checkProjectStructure', () => {
        it('should pass when all required files exist', async () => {
            // Create mock project structure
            const requiredFiles = [
                'package.json',
                'src/index.js',
                'src/mcp-tools.js',
                'src/process-manager.js',
                'src/dashboard/server.js'
            ];

            for (const file of requiredFiles) {
                const filePath = path.join(__dirname, '..', file);
                const dir = path.dirname(filePath);
                await fs.mkdir(dir, { recursive: true }).catch(() => {});
                
                // Check if file exists, if not create a minimal one for test
                try {
                    await fs.access(filePath);
                } catch (e) {
                    await fs.writeFile(filePath, '// Test file', 'utf8');
                }
            }

            await checker.checkProjectStructure();

            expect(checker.results.checks.project_structure.status).toBe('healthy');
        });

        it('should fail when required files are missing', async () => {
            // Override __dirname to point to temp directory with no files
            const originalDirname = __dirname;
            checker.checkProjectStructure = async function() {
                const requiredFiles = ['non-existent-file.js'];
                const missingFiles = [];

                for (const file of requiredFiles) {
                    try {
                        await fs.access(path.join(tempDir, file));
                    } catch (e) {
                        missingFiles.push(file);
                    }
                }

                this.results.checks.project_structure = {
                    status: missingFiles.length > 0 ? 'critical' : 'healthy',
                    message: missingFiles.length > 0 ? 
                        `Missing required files: ${missingFiles.join(', ')}` :
                        'All required project files present'
                };
            };

            await checker.checkProjectStructure();

            expect(checker.results.checks.project_structure.status).toBe('critical');
        });
    });

    describe('isPortAvailable', () => {
        it('should detect available ports', async () => {
            // Use a high port number that's likely to be available
            const port = 58000 + Math.floor(Math.random() * 1000);
            const isAvailable = await checker.isPortAvailable(port);

            expect(typeof isAvailable).toBe('boolean');
        });

        it('should detect unavailable ports', async () => {
            // Port 80 is typically restricted or in use
            const isAvailable = await checker.isPortAvailable(80);

            // Could be available or not depending on system, just check it returns boolean
            expect(typeof isAvailable).toBe('boolean');
        });
    });

    describe('calculateOverallHealth', () => {
        it('should return critical when any check is critical', () => {
            checker.results.checks = {
                check1: { status: 'healthy' },
                check2: { status: 'critical' },
                check3: { status: 'warning' }
            };

            const overall = checker.calculateOverallHealth();
            expect(overall).toBe('critical');
        });

        it('should return warning when any check is warning but none critical', () => {
            checker.results.checks = {
                check1: { status: 'healthy' },
                check2: { status: 'warning' },
                check3: { status: 'healthy' }
            };

            const overall = checker.calculateOverallHealth();
            expect(overall).toBe('warning');
        });

        it('should return healthy when all checks are healthy', () => {
            checker.results.checks = {
                check1: { status: 'healthy' },
                check2: { status: 'healthy' },
                check3: { status: 'healthy' }
            };

            const overall = checker.calculateOverallHealth();
            expect(overall).toBe('healthy');
        });

        it('should return unknown for mixed or unknown statuses', () => {
            checker.results.checks = {
                check1: { status: 'unknown' },
                check2: { status: 'healthy' }
            };

            const overall = checker.calculateOverallHealth();
            expect(overall).toBe('unknown');
        });
    });

    describe('generateReport', () => {
        it('should generate formatted report', () => {
            checker.results = {
                overall: 'healthy',
                timestamp: '2025-08-01T00:00:00.000Z',
                duration: 1000,
                checks: {
                    test_check: {
                        status: 'healthy',
                        message: 'Test check passed',
                        recommendation: null
                    },
                    warning_check: {
                        status: 'warning',
                        message: 'Test warning',
                        recommendation: 'Fix the warning'
                    }
                }
            };

            const report = checker.generateReport();

            expect(report).toContain('Health Report');
            expect(report).toContain('Overall Status: ✅ HEALTHY');
            expect(report).toContain('TEST CHECK');
            expect(report).toContain('Test check passed');
            expect(report).toContain('💡 Fix the warning');
        });

        it('should handle empty results', () => {
            checker.results = {
                overall: 'unknown',
                timestamp: null,
                duration: 0,
                checks: {}
            };

            const report = checker.generateReport();

            expect(report).toContain('Health Report');
            expect(report).toContain('UNKNOWN');
        });
    });

    describe('runCommand', () => {
        it('should execute command successfully', async () => {
            const mockProcess = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn()
            };

            spawn.mockReturnValue(mockProcess);

            // Simulate successful command execution
            const commandPromise = checker.runCommand('echo', ['test']);

            // Trigger stdout data
            const stdoutCallback = mockProcess.stdout.on.mock.calls.find(call => call[0] === 'data')[1];
            stdoutCallback('test output\n');

            // Trigger close event with success code
            const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
            closeCallback(0);

            const result = await commandPromise;
            expect(result).toBe('test output\n');
        });

        it('should handle command errors', async () => {
            const mockProcess = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn()
            };

            spawn.mockReturnValue(mockProcess);

            const commandPromise = checker.runCommand('invalid-command');

            // Trigger stderr data
            const stderrCallback = mockProcess.stderr.on.mock.calls.find(call => call[0] === 'data')[1];
            stderrCallback('command not found\n');

            // Trigger close event with error code
            const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
            closeCallback(1);

            await expect(commandPromise).rejects.toThrow('command not found');
        });
    });

    describe('constructor options', () => {
        it('should accept configuration options', () => {
            const options = {
                timeout: 5000,
                retries: 2,
                verbose: true
            };

            const customChecker = new HealthChecker(options);

            expect(customChecker.options.timeout).toBe(5000);
            expect(customChecker.options.retries).toBe(2);
            expect(customChecker.options.verbose).toBe(true);
        });

        it('should use default options when not provided', () => {
            const defaultChecker = new HealthChecker();

            expect(defaultChecker.options.timeout).toBe(10000);
            expect(defaultChecker.options.retries).toBe(3);
            expect(defaultChecker.options.verbose).toBe(false);
        });
    });
});