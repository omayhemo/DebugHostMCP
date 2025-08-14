/**
 * Health Check System
 * Comprehensive health monitoring and validation for APM Debug Host MCP Server
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { URL } = require('url');

class HealthChecker {
    constructor(options = {}) {
        this.options = {
            timeout: options.timeout || 10000,
            retries: options.retries || 3,
            retryDelay: options.retryDelay || 1000,
            verbose: options.verbose || false,
            configPath: options.configPath || null,
            ...options
        };
        
        this.results = {
            overall: 'unknown',
            checks: {},
            timestamp: null,
            duration: 0
        };
    }

    /**
     * Run complete health check suite
     * @returns {Promise<Object>} Health check results
     */
    async runHealthCheck() {
        const startTime = Date.now();
        this.log('Starting APM Debug Host MCP Server health check...');

        try {
            // Reset results
            this.results = {
                overall: 'unknown',
                checks: {},
                timestamp: new Date().toISOString(),
                duration: 0
            };

            // Run all health checks
            await Promise.all([
                this.checkNodeEnvironment(),
                this.checkProjectStructure(),
                this.checkDependencies(),
                this.checkConfiguration(),
                this.checkPorts(),
                this.checkPermissions(),
                this.checkMCPIntegration(),
                this.checkSystemResources()
            ]);

            // Determine overall health
            this.results.overall = this.calculateOverallHealth();
            this.results.duration = Date.now() - startTime;

            return this.results;

        } catch (error) {
            this.results.overall = 'critical';
            this.results.error = error.message;
            this.results.duration = Date.now() - startTime;
            return this.results;
        }
    }

    /**
     * Check Node.js environment
     */
    async checkNodeEnvironment() {
        const checkName = 'node_environment';
        try {
            const nodeVersion = process.version;
            const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

            if (majorVersion < 18) {
                this.results.checks[checkName] = {
                    status: 'critical',
                    message: `Node.js version ${nodeVersion} is not supported. Requires Node.js 18+`,
                    recommendation: 'Upgrade to Node.js 18 or higher'
                };
                return;
            }

            // Check npm availability
            const npmVersion = await this.runCommand('npm', ['--version']);
            
            this.results.checks[checkName] = {
                status: 'healthy',
                message: `Node.js ${nodeVersion}, npm ${npmVersion.trim()}`,
                details: {
                    nodeVersion,
                    npmVersion: npmVersion.trim(),
                    platform: process.platform,
                    arch: process.arch
                }
            };

        } catch (error) {
            this.results.checks[checkName] = {
                status: 'critical',
                message: `Node.js environment check failed: ${error.message}`,
                recommendation: 'Ensure Node.js 18+ and npm are properly installed'
            };
        }
    }

    /**
     * Check project structure
     */
    async checkProjectStructure() {
        const checkName = 'project_structure';
        try {
            const requiredFiles = [
                'package.json',
                'src/index.js',
                'src/mcp-tools.js',
                'src/process-manager.js',
                'src/dashboard/server.js'
            ];

            const missingFiles = [];
            const existingFiles = [];

            for (const file of requiredFiles) {
                try {
                    await fs.access(path.join(__dirname, '..', file));
                    existingFiles.push(file);
                } catch (e) {
                    missingFiles.push(file);
                }
            }

            if (missingFiles.length > 0) {
                this.results.checks[checkName] = {
                    status: 'critical',
                    message: `Missing required files: ${missingFiles.join(', ')}`,
                    recommendation: 'Reinstall or repair APM Debug Host installation',
                    details: { missingFiles, existingFiles }
                };
                return;
            }

            this.results.checks[checkName] = {
                status: 'healthy',
                message: 'All required project files present',
                details: { files: existingFiles }
            };

        } catch (error) {
            this.results.checks[checkName] = {
                status: 'critical',
                message: `Project structure check failed: ${error.message}`,
                recommendation: 'Verify installation directory and permissions'
            };
        }
    }

    /**
     * Check dependencies
     */
    async checkDependencies() {
        const checkName = 'dependencies';
        try {
            const packageJsonPath = path.join(__dirname, '..', 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            
            const requiredDeps = [
                '@modelcontextprotocol/sdk',
                'express',
                'winston',
                'ws',
                'uuid'
            ];

            const installedDeps = [];
            const missingDeps = [];

            for (const dep of requiredDeps) {
                try {
                    require.resolve(dep);
                    installedDeps.push(dep);
                } catch (e) {
                    missingDeps.push(dep);
                }
            }

            if (missingDeps.length > 0) {
                this.results.checks[checkName] = {
                    status: 'critical',
                    message: `Missing dependencies: ${missingDeps.join(', ')}`,
                    recommendation: 'Run: npm install',
                    details: { missingDeps, installedDeps }
                };
                return;
            }

            this.results.checks[checkName] = {
                status: 'healthy',
                message: 'All required dependencies installed',
                details: { dependencies: installedDeps }
            };

        } catch (error) {
            this.results.checks[checkName] = {
                status: 'critical',
                message: `Dependency check failed: ${error.message}`,
                recommendation: 'Verify package.json and run npm install'
            };
        }
    }

    /**
     * Check configuration files
     */
    async checkConfiguration() {
        const checkName = 'configuration';
        try {
            const configPaths = [
                path.join(__dirname, '..', 'config.json'),
                path.join(__dirname, '..', '.env')
            ];

            const configStatus = {};
            
            for (const configPath of configPaths) {
                const fileName = path.basename(configPath);
                try {
                    await fs.access(configPath);
                    
                    if (fileName === 'config.json') {
                        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
                        configStatus[fileName] = {
                            exists: true,
                            valid: true,
                            environment: config.environment || 'unknown'
                        };
                    } else {
                        configStatus[fileName] = { exists: true, valid: true };
                    }
                } catch (e) {
                    configStatus[fileName] = { 
                        exists: false, 
                        error: e.message 
                    };
                }
            }

            const hasValidConfig = Object.values(configStatus).some(status => status.exists && status.valid);

            this.results.checks[checkName] = {
                status: hasValidConfig ? 'healthy' : 'warning',
                message: hasValidConfig ? 'Configuration files found' : 'No valid configuration found',
                recommendation: hasValidConfig ? null : 'Create configuration files or run setup',
                details: configStatus
            };

        } catch (error) {
            this.results.checks[checkName] = {
                status: 'warning',
                message: `Configuration check failed: ${error.message}`,
                recommendation: 'Verify configuration files exist and are valid'
            };
        }
    }

    /**
     * Check port availability
     */
    async checkPorts() {
        const checkName = 'ports';
        try {
            const portsToCheck = [8080, 3000]; // Default HTTP and MCP ports
            const portStatus = {};

            for (const port of portsToCheck) {
                const isAvailable = await this.isPortAvailable(port);
                portStatus[port] = {
                    available: isAvailable,
                    status: isAvailable ? 'available' : 'in_use'
                };
            }

            const availablePorts = Object.entries(portStatus).filter(([, status]) => status.available);
            const usedPorts = Object.entries(portStatus).filter(([, status]) => !status.available);

            this.results.checks[checkName] = {
                status: usedPorts.length > 0 ? 'warning' : 'healthy',
                message: usedPorts.length > 0 ? 
                    `Ports in use: ${usedPorts.map(([port]) => port).join(', ')}` :
                    'All default ports available',
                recommendation: usedPorts.length > 0 ? 
                    'Configure alternative ports or stop conflicting services' : null,
                details: portStatus
            };

        } catch (error) {
            this.results.checks[checkName] = {
                status: 'warning',
                message: `Port check failed: ${error.message}`,
                recommendation: 'Manual port configuration may be required'
            };
        }
    }

    /**
     * Check file system permissions
     */
    async checkPermissions() {
        const checkName = 'permissions';
        try {
            const pathsToCheck = [
                { path: __dirname, permission: 'read', required: true },
                { path: path.join(__dirname, '..'), permission: 'write', required: true },
                { path: path.join(__dirname, '..', 'logs'), permission: 'write', required: false }
            ];

            const permissionResults = {};

            for (const { path: checkPath, permission, required } of pathsToCheck) {
                try {
                    if (permission === 'read') {
                        await fs.access(checkPath, fs.constants.R_OK);
                    } else if (permission === 'write') {
                        await fs.access(checkPath, fs.constants.W_OK);
                    }
                    
                    permissionResults[checkPath] = { 
                        granted: true, 
                        permission, 
                        required 
                    };
                } catch (e) {
                    permissionResults[checkPath] = { 
                        granted: false, 
                        permission, 
                        required,
                        error: e.message 
                    };
                }
            }

            const requiredPermissionIssues = Object.entries(permissionResults)
                .filter(([, result]) => result.required && !result.granted);

            this.results.checks[checkName] = {
                status: requiredPermissionIssues.length > 0 ? 'critical' : 'healthy',
                message: requiredPermissionIssues.length > 0 ?
                    'Required permissions missing' : 'All permissions OK',
                recommendation: requiredPermissionIssues.length > 0 ?
                    'Check file/directory permissions and ownership' : null,
                details: permissionResults
            };

        } catch (error) {
            this.results.checks[checkName] = {
                status: 'warning',
                message: `Permission check failed: ${error.message}`,
                recommendation: 'Manually verify file permissions'
            };
        }
    }

    /**
     * Check MCP integration
     */
    async checkMCPIntegration() {
        const checkName = 'mcp_integration';
        try {
            // Check if MCP SDK is available and working
            const mcpModule = require('@modelcontextprotocol/sdk');
            
            // Check for .mcp.json configuration
            const possibleConfigPaths = [
                path.join(require('os').homedir(), '.claude', '.mcp.json'),
                path.join(process.cwd(), '.mcp.json')
            ];

            let mcpConfigFound = false;
            let mcpConfigPath = null;

            for (const configPath of possibleConfigPaths) {
                try {
                    await fs.access(configPath);
                    mcpConfigFound = true;
                    mcpConfigPath = configPath;
                    break;
                } catch (e) {
                    // Continue checking
                }
            }

            this.results.checks[checkName] = {
                status: mcpConfigFound ? 'healthy' : 'warning',
                message: mcpConfigFound ? 
                    'MCP configuration found' : 
                    'No MCP configuration found',
                recommendation: mcpConfigFound ? null : 
                    'Run MCP configuration setup',
                details: {
                    sdkAvailable: true,
                    configPath: mcpConfigPath,
                    configFound: mcpConfigFound
                }
            };

        } catch (error) {
            this.results.checks[checkName] = {
                status: 'critical',
                message: `MCP integration check failed: ${error.message}`,
                recommendation: 'Verify MCP SDK installation and configuration'
            };
        }
    }

    /**
     * Check system resources
     */
    async checkSystemResources() {
        const checkName = 'system_resources';
        try {
            const memoryUsage = process.memoryUsage();
            const freeMemory = require('os').freemem();
            const totalMemory = require('os').totalmem();
            const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

            const cpuUsage = process.cpuUsage();
            const loadAverage = require('os').loadavg();

            // Check disk space (simplified)
            let diskSpace = null;
            try {
                const stats = await fs.stat(__dirname);
                diskSpace = { available: true };
            } catch (e) {
                diskSpace = { available: false, error: e.message };
            }

            const resourceWarnings = [];
            
            if (memoryUsagePercent > 90) {
                resourceWarnings.push('High memory usage');
            }
            
            if (loadAverage[0] > require('os').cpus().length * 2) {
                resourceWarnings.push('High CPU load');
            }

            this.results.checks[checkName] = {
                status: resourceWarnings.length > 0 ? 'warning' : 'healthy',
                message: resourceWarnings.length > 0 ? 
                    `Resource warnings: ${resourceWarnings.join(', ')}` :
                    'System resources OK',
                recommendation: resourceWarnings.length > 0 ?
                    'Monitor system performance and consider resource optimization' : null,
                details: {
                    memory: {
                        usage: memoryUsage,
                        free: freeMemory,
                        total: totalMemory,
                        usagePercent: Math.round(memoryUsagePercent * 100) / 100
                    },
                    cpu: {
                        usage: cpuUsage,
                        loadAverage: loadAverage,
                        cores: require('os').cpus().length
                    },
                    disk: diskSpace
                }
            };

        } catch (error) {
            this.results.checks[checkName] = {
                status: 'warning',
                message: `System resource check failed: ${error.message}`,
                recommendation: 'Manual system monitoring recommended'
            };
        }
    }

    /**
     * Check if port is available
     * @param {number} port - Port to check
     * @returns {Promise<boolean>} True if port is available
     */
    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = http.createServer();
            
            server.listen(port, (err) => {
                if (err) {
                    resolve(false);
                } else {
                    server.close(() => resolve(true));
                }
            });
            
            server.on('error', () => resolve(false));
        });
    }

    /**
     * Run command and get output
     * @param {string} command - Command to run
     * @param {Array} args - Command arguments
     * @returns {Promise<string>} Command output
     */
    async runCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, args);
            let output = '';
            let error = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                error += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(error || `Command failed with code ${code}`));
                }
            });
        });
    }

    /**
     * Calculate overall health status
     * @returns {string} Overall health status
     */
    calculateOverallHealth() {
        const statuses = Object.values(this.results.checks).map(check => check.status);
        
        if (statuses.includes('critical')) {
            return 'critical';
        } else if (statuses.includes('warning')) {
            return 'warning';
        } else if (statuses.every(status => status === 'healthy')) {
            return 'healthy';
        } else {
            return 'unknown';
        }
    }

    /**
     * Generate health report
     * @returns {string} Formatted health report
     */
    generateReport() {
        const statusSymbols = {
            healthy: '✅',
            warning: '⚠️',
            critical: '❌',
            unknown: '❓'
        };

        let report = `\n=== APM Debug Host MCP Server Health Report ===\n`;
        report += `Overall Status: ${statusSymbols[this.results.overall]} ${this.results.overall.toUpperCase()}\n`;
        report += `Timestamp: ${this.results.timestamp}\n`;
        report += `Duration: ${this.results.duration}ms\n\n`;

        for (const [checkName, result] of Object.entries(this.results.checks)) {
            const symbol = statusSymbols[result.status] || '❓';
            report += `${symbol} ${checkName.replace(/_/g, ' ').toUpperCase()}\n`;
            report += `   ${result.message}\n`;
            
            if (result.recommendation) {
                report += `   💡 ${result.recommendation}\n`;
            }
            
            report += '\n';
        }

        return report;
    }

    /**
     * Log message if verbose mode is enabled
     * @param {string} message - Message to log
     */
    log(message) {
        if (this.options.verbose) {
            console.log(`[HealthChecker] ${message}`);
        }
    }
}

module.exports = HealthChecker;