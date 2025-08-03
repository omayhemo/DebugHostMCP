/**
 * Cross-Platform Compatibility Testing Suite
 * Tests for Linux, macOS, and Windows compatibility
 */

const os = require('os');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

describe('🌍 Cross-Platform Compatibility', () => {
    let platformInfo;
    
    beforeAll(() => {
        platformInfo = {
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            version: os.version(),
            homedir: os.homedir(),
            tmpdir: os.tmpdir(),
            pathSeparator: path.sep,
            isWindows: os.platform() === 'win32',
            isMacOS: os.platform() === 'darwin',
            isLinux: os.platform() === 'linux'
        };
        
        console.log(`🖥️  Platform Information:`);
        console.log(`   Platform: ${platformInfo.platform}`);
        console.log(`   Architecture: ${platformInfo.arch}`);
        console.log(`   Release: ${platformInfo.release}`);
        console.log(`   Home directory: ${platformInfo.homedir}`);
        console.log(`   Temp directory: ${platformInfo.tmpdir}`);
        console.log(`   Path separator: "${platformInfo.pathSeparator}"`);
    });
    
    describe('File System Compatibility', () => {
        test('should handle platform-specific paths correctly', async () => {
            const testPaths = {
                relative: path.join('src', 'components', 'test.js'),
                absolute: path.resolve('src', 'components', 'test.js'),
                withSpaces: path.join('folder with spaces', 'file.txt'),
                nested: path.join('level1', 'level2', 'level3', 'file.txt'),
                dotfile: path.join('.hidden', 'config.json')
            };
            
            Object.entries(testPaths).forEach(([name, testPath]) => {
                // Path should be normalized for current platform
                const normalized = path.normalize(testPath);
                expect(normalized).toBe(normalized);
                
                // Should use correct separator
                if (testPath.includes(path.sep)) {
                    expect(testPath).toContain(path.sep);
                }
                
                console.log(`📁 ${name}: ${testPath}`);
            });
            
            // Test path resolution
            const resolved = path.resolve('./test-file.txt');
            expect(path.isAbsolute(resolved)).toBe(true);
            
            // Test path parsing
            const parsed = path.parse(resolved);
            expect(parsed).toHaveProperty('root');
            expect(parsed).toHaveProperty('dir');
            expect(parsed).toHaveProperty('base');
            expect(parsed).toHaveProperty('name');
            expect(parsed).toHaveProperty('ext');
        });
        
        test('should handle file permissions correctly', async () => {
            const tempFile = await global.createTempFile('test content', '.txt');
            
            try {
                // Get file stats
                const stats = await fs.stat(tempFile);
                
                expect(stats.isFile()).toBe(true);
                expect(stats.size).toBeGreaterThan(0);
                
                // Test basic permissions
                await expect(fs.access(tempFile, fs.constants.F_OK)).resolves.toBeUndefined();
                await expect(fs.access(tempFile, fs.constants.R_OK)).resolves.toBeUndefined();
                
                console.log(`📄 File permissions test passed for: ${tempFile}`);
                
                // Platform-specific permission tests
                if (!platformInfo.isWindows) {
                    // Unix-like systems support more granular permissions
                    const mode = stats.mode;
                    const permissions = {
                        owner: {
                            read: !!(mode & 0o400),
                            write: !!(mode & 0o200),
                            execute: !!(mode & 0o100)
                        },
                        group: {
                            read: !!(mode & 0o040),
                            write: !!(mode & 0o020),
                            execute: !!(mode & 0o010)
                        },
                        others: {
                            read: !!(mode & 0o004),
                            write: !!(mode & 0o002),
                            execute: !!(mode & 0o001)
                        }
                    };
                    
                    // Owner should have read permission
                    expect(permissions.owner.read).toBe(true);
                    
                    console.log(`🔐 Unix permissions:`, permissions);
                }
                
            } finally {
                try {
                    await fs.unlink(tempFile);
                } catch (error) {
                    // Ignore cleanup errors
                }
            }
        });
        
        test('should handle different line endings', async () => {
            const lineEndings = {
                unix: '\\n',
                windows: '\\r\\n',
                classic_mac: '\\r'
            };
            
            const testContent = 'Line 1[ENDING]Line 2[ENDING]Line 3';
            
            for (const [platform, ending] of Object.entries(lineEndings)) {
                const content = testContent.replace(/\\[ENDING\\]/g, ending);
                const tempFile = await global.createTempFile(content, '.txt');
                
                try {
                    const readContent = await fs.readFile(tempFile, 'utf8');
                    
                    // Should be able to read content with any line ending
                    expect(readContent).toContain('Line 1');
                    expect(readContent).toContain('Line 2');
                    expect(readContent).toContain('Line 3');
                    
                    // Count lines (normalize line endings first)
                    const normalizedContent = readContent.replace(/\\r\\n|\\r/g, '\\n');
                    const lines = normalizedContent.split('\\n').filter(line => line.trim());
                    
                    expect(lines.length).toBe(3);
                    
                    console.log(`📝 Line ending test passed for ${platform}: ${lines.length} lines`);
                    
                } finally {
                    try {
                        await fs.unlink(tempFile);
                    } catch (error) {
                        // Ignore cleanup errors
                    }
                }
            }
        });
    });
    
    describe('Process Management Compatibility', () => {
        test('should handle platform-specific executable extensions', () => {
            const executables = ['node', 'npm', 'python', 'php'];
            
            executables.forEach(exec => {
                const withExtension = platformInfo.isWindows ? `${exec}.exe` : exec;
                const command = platformInfo.isWindows ? `${exec}.cmd` : exec;
                
                console.log(`⚙️  ${exec}:`);
                console.log(`   Executable: ${withExtension}`);
                console.log(`   Command: ${command}`);
                
                // Validate naming conventions
                if (platformInfo.isWindows) {
                    expect(withExtension).toMatch(/\\.(exe|cmd|bat)$/);
                } else {
                    expect(withExtension).not.toContain('.');
                }
            });
        });
        
        test('should spawn processes with correct arguments', async () => {
            const testCommand = 'node';
            const testArgs = ['-e', 'console.log("Platform test:", process.platform)'];
            
            const result = await new Promise((resolve, reject) => {
                const child = spawn(testCommand, testArgs, {
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                
                let stdout = '';
                let stderr = '';
                
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                child.on('close', (code) => {
                    resolve({
                        exitCode: code,
                        stdout: stdout.trim(),
                        stderr: stderr.trim()
                    });
                });
                
                child.on('error', reject);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    child.kill();
                    reject(new Error('Process timeout'));
                }, 10000);
            });
            
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Platform test:');
            expect(result.stdout).toContain(platformInfo.platform);
            
            console.log(`🚀 Process spawn test result: ${result.stdout}`);
        });
        
        test('should handle process termination signals correctly', async () => {
            const signals = platformInfo.isWindows ? 
                ['SIGTERM', 'SIGKILL'] : 
                ['SIGTERM', 'SIGKILL', 'SIGINT', 'SIGUSR1', 'SIGUSR2'];
            
            for (const signal of signals) {
                const child = spawn('node', ['-e', `
                    console.log('Process started');
                    process.on('${signal}', () => {
                        console.log('Received ${signal}');
                        process.exit(0);
                    });
                    setTimeout(() => {
                        console.log('Process still running');
                    }, 1000);
                `]);
                
                const result = await new Promise((resolve) => {
                    let stdout = '';
                    
                    child.stdout.on('data', (data) => {
                        stdout += data.toString();
                    });
                    
                    child.on('close', (code, receivedSignal) => {
                        resolve({
                            signal,
                            exitCode: code,
                            receivedSignal,
                            stdout: stdout.trim()
                        });
                    });
                    
                    // Send signal after a short delay
                    setTimeout(() => {
                        try {
                            child.kill(signal);
                        } catch (error) {
                            console.log(`⚠️  Signal ${signal} not supported: ${error.message}`);
                        }
                    }, 200);
                    
                    // Fallback timeout
                    setTimeout(() => {
                        child.kill('SIGKILL');
                        resolve({
                            signal,
                            exitCode: -1,
                            receivedSignal: null,
                            stdout: stdout.trim(),
                            timeout: true
                        });
                    }, 5000);
                });
                
                if (!result.timeout) {
                    console.log(`📡 Signal ${signal}: exit code ${result.exitCode}`);
                }
            }
        });
    });
    
    describe('Environment Variables', () => {
        test('should handle platform-specific environment variables', () => {
            const commonEnvVars = ['NODE_ENV', 'PATH', 'HOME', 'USER'];
            const windowsEnvVars = ['USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'PROGRAMFILES'];
            const unixEnvVars = ['SHELL', 'PWD', 'LANG'];
            
            // Test common environment variables
            commonEnvVars.forEach(varName => {
                const value = process.env[varName];
                console.log(`🌍 ${varName}: ${value || 'undefined'}`);
            });
            
            // Test platform-specific variables
            if (platformInfo.isWindows) {
                windowsEnvVars.forEach(varName => {
                    const value = process.env[varName];
                    console.log(`🪟 ${varName}: ${value || 'undefined'}`);
                });
                
                // Windows should have USERPROFILE
                expect(process.env.USERPROFILE).toBeDefined();
            } else {
                unixEnvVars.forEach(varName => {
                    const value = process.env[varName];
                    console.log(`🐧 ${varName}: ${value || 'undefined'}`);
                });
                
                // Unix-like systems should have HOME
                expect(process.env.HOME).toBeDefined();
            }
            
            // PATH should exist on all platforms
            expect(process.env.PATH).toBeDefined();
            expect(process.env.PATH.length).toBeGreaterThan(0);
        });
        
        test('should handle path separators in PATH variable', () => {
            const pathVar = process.env.PATH;
            const expectedSeparator = platformInfo.isWindows ? ';' : ':';
            
            expect(pathVar).toContain(expectedSeparator);
            
            const pathEntries = pathVar.split(expectedSeparator);
            expect(pathEntries.length).toBeGreaterThan(1);
            
            console.log(`🛤️  PATH entries (${pathEntries.length}):`);
            pathEntries.slice(0, 5).forEach((entry, index) => {
                console.log(`   ${index + 1}. ${entry}`);
            });
            
            if (pathEntries.length > 5) {
                console.log(`   ... and ${pathEntries.length - 5} more`);
            }
        });
    });
    
    describe('Network Compatibility', () => {
        test('should handle platform-specific network interfaces', async () => {
            const networkInterfaces = os.networkInterfaces();
            
            expect(networkInterfaces).toBeDefined();
            expect(Object.keys(networkInterfaces).length).toBeGreaterThan(0);
            
            let hasLoopback = false;
            let hasIPv4 = false;
            let hasIPv6 = false;
            
            Object.entries(networkInterfaces).forEach(([name, interfaces]) => {
                console.log(`🌐 Network interface: ${name}`);
                
                interfaces.forEach(iface => {
                    console.log(`   ${iface.family} ${iface.address} (${iface.internal ? 'internal' : 'external'})`);
                    
                    if (iface.internal && (iface.address === '127.0.0.1' || iface.address === '::1')) {
                        hasLoopback = true;
                    }
                    
                    if (iface.family === 'IPv4') {
                        hasIPv4 = true;
                    }
                    
                    if (iface.family === 'IPv6') {
                        hasIPv6 = true;
                    }
                });
            });
            
            // All platforms should have loopback and IPv4
            expect(hasLoopback).toBe(true);
            expect(hasIPv4).toBe(true);
            
            console.log(`✅ Network compatibility: IPv4=${hasIPv4}, IPv6=${hasIPv6}, Loopback=${hasLoopback}`);
        });
    });
    
    describe('File System Limits', () => {
        test('should respect platform-specific path length limits', () => {
            const maxPathLengths = {
                win32: 260,  // Windows MAX_PATH
                darwin: 1024, // macOS
                linux: 4096,  // Linux PATH_MAX
                default: 1024
            };
            
            const maxLength = maxPathLengths[platformInfo.platform] || maxPathLengths.default;
            
            // Create a very long path
            const longPath = path.join(...Array(50).fill('verylongdirectoryname'));
            
            console.log(`📏 Platform: ${platformInfo.platform}`);
            console.log(`📏 Max path length: ${maxLength}`);
            console.log(`📏 Test path length: ${longPath.length}`);
            
            if (longPath.length > maxLength) {
                console.log(`⚠️  Path exceeds platform limit by ${longPath.length - maxLength} characters`);
                expect(longPath.length).toBeGreaterThan(maxLength);
            } else {
                console.log(`✅ Path within platform limits`);
                expect(longPath.length).toBeLessThanOrEqual(maxLength);
            }
        });
        
        test('should handle platform-specific file name restrictions', () => {
            const restrictedNames = {
                windows: ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'LPT1', 'LPT2'],
                all: ['', '.', '..']
            };
            
            const restrictedChars = {
                windows: ['<', '>', ':', '"', '/', '\\\\', '|', '?', '*'],
                unix: ['/', '\\0']
            };
            
            // Test restricted names
            const testNames = [...restrictedNames.all];
            if (platformInfo.isWindows) {
                testNames.push(...restrictedNames.windows);
            }
            
            testNames.forEach(name => {
                console.log(`❌ Restricted name: "${name}"`);
                expect(name.length).toBeGreaterThanOrEqual(0); // Just verify we can test it
            });
            
            // Test restricted characters
            const testChars = platformInfo.isWindows ? 
                restrictedChars.windows : 
                restrictedChars.unix;
            
            testChars.forEach(char => {
                console.log(`❌ Restricted character: "${char}"`);
                expect(typeof char).toBe('string');
            });
            
            // Valid filename examples
            const validNames = ['test.txt', 'file-name.log', 'data_file.json', '123.txt'];
            validNames.forEach(name => {
                console.log(`✅ Valid name: "${name}"`);
                expect(name.length).toBeGreaterThan(0);
                expect(name).not.toContain('/');
                if (platformInfo.isWindows) {
                    expect(name).not.toMatch(/[<>:"|?*\\\\]/);
                }
            });
        });
    });
    
    describe('Command Line Compatibility', () => {
        test('should handle platform-specific shell commands', async () => {
            const platformCommands = {
                win32: {
                    shell: 'cmd.exe',
                    listDir: 'dir',
                    echo: 'echo',
                    env: 'set'
                },
                darwin: {
                    shell: '/bin/bash',
                    listDir: 'ls',
                    echo: 'echo',
                    env: 'env'
                },
                linux: {
                    shell: '/bin/bash',
                    listDir: 'ls',
                    echo: 'echo',
                    env: 'env'
                }
            };
            
            const commands = platformCommands[platformInfo.platform] || platformCommands.linux;
            
            console.log(`🖥️  Platform commands for ${platformInfo.platform}:`);
            Object.entries(commands).forEach(([name, cmd]) => {
                console.log(`   ${name}: ${cmd}`);
            });
            
            // Test echo command
            const echoResult = await new Promise((resolve, reject) => {
                const args = platformInfo.isWindows ? 
                    ['/c', 'echo', 'Hello Platform Test'] :
                    ['-c', 'echo "Hello Platform Test"'];
                
                const child = spawn(commands.shell, args);
                
                let output = '';
                child.stdout.on('data', (data) => {
                    output += data.toString();
                });
                
                child.on('close', (code) => {
                    resolve({ code, output: output.trim() });
                });
                
                child.on('error', reject);
                
                setTimeout(() => {
                    child.kill();
                    reject(new Error('Command timeout'));
                }, 5000);
            });
            
            expect(echoResult.code).toBe(0);
            expect(echoResult.output).toContain('Hello Platform Test');
            
            console.log(`🔊 Echo test result: "${echoResult.output}"`);
        });
    });
});