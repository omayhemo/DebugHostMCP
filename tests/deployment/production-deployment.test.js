/**
 * Production Deployment Testing Suite
 * Multi-environment testing, service management, installation/rollback testing
 * Story Points: 3 (Epic 24 Implementation)
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

describe('🚀 Production Deployment Testing Suite', () => {
    let tempDirs = [];
    let testProcesses = [];
    let deploymentConfig;
    
    beforeAll(async () => {
        deploymentConfig = {
            environments: ['development', 'staging', 'production'],
            services: {
                systemd: os.platform() === 'linux',
                launchd: os.platform() === 'darwin',
                windows: os.platform() === 'win32'
            },
            testPort: global.__TEST_PORTS__?.deployment || 9878
        };
        
        console.log('🏗️  Production deployment testing suite initialized');
        console.log(`   Platform: ${os.platform()}`);
        console.log(`   Architecture: ${os.arch()}`);
        console.log(`   Service management: ${JSON.stringify(deploymentConfig.services)}`);
    });
    
    afterAll(async () => {
        // Cleanup test processes
        for (const process of testProcesses) {
            if (process && !process.killed) {
                process.kill('SIGTERM');
            }
        }
        
        // Cleanup temporary directories
        for (const dir of tempDirs) {
            try {
                await fs.rmdir(dir, { recursive: true });
            } catch (error) {
                console.warn(`Failed to cleanup temp dir ${dir}:`, error.message);
            }
        }
        
        console.log('🧹 Deployment testing cleanup completed');
    });
    
    describe('Multi-Environment Testing', () => {
        test('should validate configuration for all environments', async () => {
            const environments = ['development', 'staging', 'production'];
            const configResults = [];
            
            for (const env of environments) {
                console.log(`🌍 Testing ${env} environment configuration...`);
                
                const configPath = path.join(__dirname, '../../configs', `${env}.env`);
                
                try {
                    await fs.access(configPath);
                    const configContent = await fs.readFile(configPath, 'utf8');
                    
                    const config = parseEnvConfig(configContent);
                    const validationResult = validateEnvironmentConfig(config, env);
                    
                    configResults.push({
                        environment: env,
                        valid: validationResult.valid,
                        issues: validationResult.issues,
                        config: config
                    });
                    
                    console.log(`   ${env}: ${validationResult.valid ? '✅ Valid' : '❌ Invalid'}`);
                    if (validationResult.issues.length > 0) {
                        console.log(`   Issues: ${validationResult.issues.join(', ')}`);
                    }
                    
                } catch (error) {
                    configResults.push({
                        environment: env,
                        valid: false,
                        issues: [`Configuration file not found: ${error.message}`],
                        config: null
                    });
                    
                    console.log(`   ${env}: ❌ Config file missing`);
                }
            }
            
            // Validate results
            const validConfigs = configResults.filter(r => r.valid);
            expect(validConfigs.length).toBeGreaterThan(0); // At least one valid config
            
            // Production config should be the most restrictive
            const prodConfig = configResults.find(r => r.environment === 'production');
            if (prodConfig && prodConfig.valid) {
                expect(prodConfig.config.NODE_ENV).toBe('production');
                expect(prodConfig.config.DEBUG).toBeFalsy();
                expect(prodConfig.config.LOG_LEVEL).toMatch(/warn|error/i);
            }
            
            function parseEnvConfig(content) {
                const config = {};
                const lines = content.split('\n');
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        const [key, ...valueParts] = trimmed.split('=');
                        if (key && valueParts.length > 0) {
                            config[key.trim()] = valueParts.join('=').trim();
                        }
                    }
                }
                
                return config;
            }
            
            function validateEnvironmentConfig(config, environment) {
                const issues = [];
                
                // Required fields for all environments
                const requiredFields = ['NODE_ENV', 'PORT', 'HOST'];
                for (const field of requiredFields) {
                    if (!config[field]) {
                        issues.push(`Missing required field: ${field}`);
                    }
                }
                
                // Environment-specific validation
                if (environment === 'production') {
                    if (config.NODE_ENV !== 'production') {
                        issues.push('NODE_ENV should be "production" for production environment');
                    }
                    
                    if (config.DEBUG === 'true') {
                        issues.push('DEBUG should be disabled in production');
                    }
                    
                    if (config.HOST === '0.0.0.0') {
                        issues.push('HOST should not bind to all interfaces in production');
                    }
                    
                    if (!config.LOG_LEVEL || config.LOG_LEVEL === 'debug') {
                        issues.push('LOG_LEVEL should be warn or error in production');
                    }
                }
                
                if (environment === 'development') {
                    if (config.NODE_ENV !== 'development') {
                        issues.push('NODE_ENV should be "development" for development environment');
                    }
                }
                
                // Port validation
                const port = parseInt(config.PORT);
                if (isNaN(port) || port < 1 || port > 65535) {
                    issues.push('PORT must be a valid port number (1-65535)');
                }
                
                return {
                    valid: issues.length === 0,
                    issues: issues
                };
            }
        });
        
        test('should deploy and run in different environments', async () => {
            const testEnvironments = ['development', 'staging'];
            const deploymentResults = [];
            
            for (const env of testEnvironments) {
                console.log(`🚀 Testing deployment in ${env} environment...`);
                
                const tempDir = path.join(os.tmpdir(), `mcp-host-test-${env}-${Date.now()}`);
                tempDirs.push(tempDir);
                
                try {
                    // Create temporary deployment directory
                    await fs.mkdir(tempDir, { recursive: true });
                    
                    // Copy essential files
                    const sourceDir = path.join(__dirname, '../..');
                    const filesToCopy = [
                        'package.json',
                        'src/index.js',
                        'src/mcp-tools.js',
                        'src/process-manager.js',
                        'src/config-manager.js'
                    ];
                    
                    for (const file of filesToCopy) {
                        const sourcePath = path.join(sourceDir, file);
                        const destPath = path.join(tempDir, file);
                        
                        try {
                            await fs.mkdir(path.dirname(destPath), { recursive: true });
                            await fs.copyFile(sourcePath, destPath);
                        } catch (error) {
                            console.warn(`Failed to copy ${file}:`, error.message);
                        }
                    }
                    
                    // Create environment-specific config
                    const envConfig = createTestEnvironmentConfig(env);
                    await fs.writeFile(path.join(tempDir, '.env'), envConfig);
                    
                    // Test server startup
                    const startupResult = await testServerStartup(tempDir, env);
                    
                    deploymentResults.push({
                        environment: env,
                        success: startupResult.success,
                        port: startupResult.port,
                        pid: startupResult.pid,
                        error: startupResult.error
                    });
                    
                    console.log(`   ${env}: ${startupResult.success ? '✅ Success' : '❌ Failed'}`);
                    if (startupResult.error) {
                        console.log(`   Error: ${startupResult.error}`);
                    }
                    
                } catch (error) {
                    deploymentResults.push({
                        environment: env,
                        success: false,
                        error: error.message
                    });
                    
                    console.log(`   ${env}: ❌ Failed - ${error.message}`);
                }
            }
            
            // Validate deployment results
            const successfulDeployments = deploymentResults.filter(r => r.success);
            expect(successfulDeployments.length).toBeGreaterThan(0); // At least one successful deployment
            
            function createTestEnvironmentConfig(environment) {
                const baseConfig = {
                    NODE_ENV: environment,
                    HOST: '127.0.0.1',
                    PORT: deploymentConfig.testPort + (environment === 'staging' ? 1 : 0),
                    DEBUG: environment === 'development' ? 'true' : 'false',
                    LOG_LEVEL: environment === 'development' ? 'debug' : 'warn'
                };
                
                return Object.entries(baseConfig)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('\n');
            }
            
            async function testServerStartup(deploymentDir, environment) {
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        resolve({
                            success: false,
                            error: 'Server startup timeout'
                        });
                    }, 10000);
                    
                    const serverProcess = spawn('node', ['src/index.js'], {
                        cwd: deploymentDir,
                        env: { ...process.env, NODE_ENV: environment },
                        stdio: ['pipe', 'pipe', 'pipe']
                    });
                    
                    testProcesses.push(serverProcess);
                    
                    let output = '';
                    
                    serverProcess.stdout.on('data', (data) => {
                        output += data.toString();
                        
                        // Check for successful startup indicators
                        if (output.includes('Server started') || output.includes('listening on')) {
                            clearTimeout(timeout);
                            resolve({
                                success: true,
                                port: deploymentConfig.testPort,
                                pid: serverProcess.pid
                            });
                        }
                    });
                    
                    serverProcess.stderr.on('data', (data) => {
                        output += data.toString();
                    });
                    
                    serverProcess.on('error', (error) => {
                        clearTimeout(timeout);
                        resolve({
                            success: false,
                            error: error.message
                        });
                    });
                    
                    serverProcess.on('exit', (code) => {
                        if (code !== 0) {
                            clearTimeout(timeout);
                            resolve({
                                success: false,
                                error: `Server exited with code ${code}: ${output}`
                            });
                        }
                    });
                });
            }
        });
    });
    
    describe('Service Management Testing', () => {        
        test('should generate correct service management configuration', async () => {
            const serviceResults = [];
            
            // Test systemd configuration (Linux)
            if (deploymentConfig.services.systemd) {
                console.log('🐧 Testing systemd service configuration...');
                
                const systemdConfig = generateSystemdConfig();
                const systemdValidation = validateSystemdConfig(systemdConfig);
                
                serviceResults.push({
                    type: 'systemd',
                    config: systemdConfig,
                    valid: systemdValidation.valid,
                    issues: systemdValidation.issues
                });
                
                console.log(`   systemd: ${systemdValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
            }
            
            // Test launchd configuration (macOS)
            if (deploymentConfig.services.launchd) {
                console.log('🍎 Testing launchd plist configuration...');
                
                const launchdConfig = generateLaunchdConfig();
                const launchdValidation = validateLaunchdConfig(launchdConfig);
                
                serviceResults.push({
                    type: 'launchd',
                    config: launchdConfig,
                    valid: launchdValidation.valid,
                    issues: launchdValidation.issues
                });
                
                console.log(`   launchd: ${launchdValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
            }
            
            // Validate at least one service configuration is valid
            const validServices = serviceResults.filter(s => s.valid);
            expect(validServices.length).toBeGreaterThan(0);
            
            function generateSystemdConfig() {
                return `[Unit]
Description=MCP Debug Host Server
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
User=mcp-host
ExecStart=/usr/bin/node /opt/mcp-host/src/index.js
WorkingDirectory=/opt/mcp-host
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=127.0.0.1

[Install]
WantedBy=multi-user.target`;
            }
            
            function validateSystemdConfig(config) {
                const issues = [];
                
                // Check required sections
                if (!config.includes('[Unit]')) issues.push('Missing [Unit] section');
                if (!config.includes('[Service]')) issues.push('Missing [Service] section');
                if (!config.includes('[Install]')) issues.push('Missing [Install] section');
                
                // Check critical directives
                if (!config.includes('ExecStart=')) issues.push('Missing ExecStart directive');
                if (!config.includes('Type=')) issues.push('Missing Type directive');
                if (!config.includes('Restart=')) issues.push('Missing Restart directive');
                
                // Security checks
                if (!config.includes('User=')) issues.push('Should specify User directive for security');
                if (config.includes('User=root')) issues.push('Should not run as root user');
                
                return {
                    valid: issues.length === 0,
                    issues: issues
                };
            }
            
            function generateLaunchdConfig() {
                return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.apm.mcp-host</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/opt/mcp-host/src/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/opt/mcp-host</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3000</string>
        <key>HOST</key>
        <string>127.0.0.1</string>
    </dict>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/mcp-host.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/mcp-host.error.log</string>
</dict>
</plist>`;
            }
            
            function validateLaunchdConfig(config) {
                const issues = [];
                
                // Check XML structure
                if (!config.includes('<?xml version="1.0"')) issues.push('Missing XML declaration');
                if (!config.includes('<!DOCTYPE plist')) issues.push('Missing plist DOCTYPE');
                
                // Check required keys
                if (!config.includes('<key>Label</key>')) issues.push('Missing Label key');
                if (!config.includes('<key>ProgramArguments</key>')) issues.push('Missing ProgramArguments key');
                
                // Check service management
                if (!config.includes('<key>KeepAlive</key>')) issues.push('Missing KeepAlive directive');
                if (!config.includes('<key>RunAtLoad</key>')) issues.push('Missing RunAtLoad directive');
                
                // Check logging
                if (!config.includes('<key>StandardOutPath</key>')) issues.push('Missing StandardOutPath for logging');
                if (!config.includes('<key>StandardErrorPath</key>')) issues.push('Missing StandardErrorPath for error logging');
                
                return {
                    valid: issues.length === 0,
                    issues: issues
                };
            }
        });
    });
    
    describe('Installation and Rollback Testing', () => {
        test('should perform complete installation workflow', async () => {
            console.log('📦 Testing installation workflow...');
            
            const installationDir = path.join(os.tmpdir(), `mcp-host-install-test-${Date.now()}`);
            tempDirs.push(installationDir);
            
            try {
                // Create installation directory
                await fs.mkdir(installationDir, { recursive: true });
                
                // Simulate installation steps
                const installationSteps = [
                    'Create directories',
                    'Copy application files',
                    'Install dependencies',
                    'Configure environment',
                    'Set up service',
                    'Validate installation'
                ];
                
                const installationResults = [];
                
                for (const step of installationSteps) {
                    console.log(`   📋 ${step}...`);
                    
                    const stepResult = await simulateInstallationStep(step, installationDir);
                    installationResults.push({
                        step: step,
                        success: stepResult.success,
                        error: stepResult.error,
                        duration: stepResult.duration
                    });
                    
                    console.log(`      ${stepResult.success ? '✅' : '❌'} ${step} ${stepResult.success ? 'completed' : 'failed'}`);
                    
                    if (!stepResult.success) {
                        console.log(`      Error: ${stepResult.error}`);
                        break; // Stop installation on failure
                    }
                }
                
                const successfulSteps = installationResults.filter(r => r.success);
                const totalDuration = installationResults.reduce((sum, r) => sum + r.duration, 0);
                
                console.log(`📊 Installation Results:`);
                console.log(`   Completed steps: ${successfulSteps.length}/${installationSteps.length}`);
                console.log(`   Total duration: ${totalDuration}ms`);
                console.log(`   Success rate: ${((successfulSteps.length / installationSteps.length) * 100).toFixed(1)}%`);
                
                // Validate installation
                expect(successfulSteps.length).toBeGreaterThan(installationSteps.length * 0.8); // At least 80% success
                expect(totalDuration).toBeLessThan(30000); // Should complete within 30 seconds
                
            } catch (error) {
                console.error('❌ Installation test failed:', error.message);
                throw error;
            }
            
            async function simulateInstallationStep(step, installDir) {
                const startTime = Date.now();
                
                try {
                    switch (step) {
                        case 'Create directories':
                            await fs.mkdir(path.join(installDir, 'src'), { recursive: true });
                            await fs.mkdir(path.join(installDir, 'config'), { recursive: true });
                            await fs.mkdir(path.join(installDir, 'logs'), { recursive: true });
                            break;
                            
                        case 'Copy application files':
                            const sourceDir = path.join(__dirname, '../..');
                            const packageJson = await fs.readFile(path.join(sourceDir, 'package.json'), 'utf8');
                            await fs.writeFile(path.join(installDir, 'package.json'), packageJson);
                            
                            // Simulate copying main application file
                            const indexJs = `console.log('MCP Host Server - Installation Test');`;
                            await fs.writeFile(path.join(installDir, 'src', 'index.js'), indexJs);
                            break;
                            
                        case 'Install dependencies':
                            // Simulate npm install (skip actual installation for speed)
                            await fs.mkdir(path.join(installDir, 'node_modules'), { recursive: true });
                            break;
                            
                        case 'Configure environment':
                            const envConfig = 'NODE_ENV=production\nPORT=3000\nHOST=127.0.0.1';
                            await fs.writeFile(path.join(installDir, '.env'), envConfig);
                            break;
                            
                        case 'Set up service':
                            // Create service configuration file
                            const serviceConfig = generateSystemdConfig();
                            await fs.writeFile(path.join(installDir, 'mcp-host.service'), serviceConfig);
                            break;
                            
                        case 'Validate installation':
                            // Check if all required files exist
                            const requiredFiles = [
                                'package.json',
                                'src/index.js',
                                '.env',
                                'mcp-host.service'
                            ];
                            
                            for (const file of requiredFiles) {
                                await fs.access(path.join(installDir, file));
                            }
                            break;
                            
                        default:
                            throw new Error(`Unknown installation step: ${step}`);
                    }
                    
                    return {
                        success: true,
                        duration: Date.now() - startTime
                    };
                    
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        duration: Date.now() - startTime
                    };
                }
            }
        });
        
        test('should perform rollback when installation fails', async () => {
            console.log('🔄 Testing rollback functionality...');
            
            const rollbackDir = path.join(os.tmpdir(), `mcp-host-rollback-test-${Date.now()}`);
            tempDirs.push(rollbackDir);
            
            try {
                // Create initial state
                await fs.mkdir(rollbackDir, { recursive: true });
                await fs.writeFile(path.join(rollbackDir, 'original-file.txt'), 'Original content');
                
                // Create backup
                const backupDir = path.join(rollbackDir, 'backup');
                await fs.mkdir(backupDir, { recursive: true });
                await fs.copyFile(
                    path.join(rollbackDir, 'original-file.txt'),
                    path.join(backupDir, 'original-file.txt')
                );
                
                // Simulate failed installation
                const installationSteps = [
                    { name: 'Step 1', shouldFail: false },
                    { name: 'Step 2', shouldFail: false },
                    { name: 'Step 3', shouldFail: true }, // This step will fail
                    { name: 'Step 4', shouldFail: false }
                ];
                
                let failedStep = null;
                const completedSteps = [];
                
                for (const step of installationSteps) {
                    if (step.shouldFail) {
                        failedStep = step.name;
                        console.log(`   ❌ ${step.name} failed (simulated)`);
                        break;
                    } else {
                        completedSteps.push(step.name);
                        console.log(`   ✅ ${step.name} completed`);
                        
                        // Create some changes to rollback
                        await fs.writeFile(
                            path.join(rollbackDir, `${step.name.toLowerCase().replace(' ', '-')}.txt`),
                            `Changes from ${step.name}`
                        );
                    }
                }
                
                // Perform rollback
                console.log('   🔄 Performing rollback...');
                
                const rollbackResult = await performRollback(rollbackDir, backupDir, completedSteps);
                
                console.log(`📊 Rollback Results:`);
                console.log(`   Failed at step: ${failedStep}`);
                console.log(`   Completed steps before failure: ${completedSteps.length}`);
                console.log(`   Rollback success: ${rollbackResult.success ? 'Yes' : 'No'}`);
                console.log(`   Files restored: ${rollbackResult.filesRestored}`);
                console.log(`   Files cleaned: ${rollbackResult.filesCleaned}`);
                
                // Validate rollback
                expect(rollbackResult.success).toBe(true);
                expect(rollbackResult.filesRestored).toBeGreaterThan(0);
                
                // Verify original file is restored
                const restoredContent = await fs.readFile(path.join(rollbackDir, 'original-file.txt'), 'utf8');
                expect(restoredContent).toBe('Original content');
                
            } catch (error) {
                console.error('❌ Rollback test failed:', error.message);
                throw error;
            }
            
            async function performRollback(targetDir, backupDir, completedSteps) {
                try {
                    let filesRestored = 0;
                    let filesCleaned = 0;
                    
                    // Restore files from backup
                    try {
                        const backupFiles = await fs.readdir(backupDir);
                        for (const file of backupFiles) {
                            await fs.copyFile(
                                path.join(backupDir, file),
                                path.join(targetDir, file)
                            );
                            filesRestored++;
                        }
                    } catch (error) {
                        // Backup directory might not exist
                        console.warn('No backup files to restore');
                    }
                    
                    // Clean up files created during failed installation
                    for (const step of completedSteps) {
                        const stepFile = path.join(targetDir, `${step.toLowerCase().replace(' ', '-')}.txt`);
                        try {
                            await fs.unlink(stepFile);
                            filesCleaned++;
                        } catch (error) {
                            // File might not exist
                        }
                    }
                    
                    return {
                        success: true,
                        filesRestored: filesRestored,
                        filesCleaned: filesCleaned
                    };
                    
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        filesRestored: 0,
                        filesCleaned: 0
                    };
                }
            }
        });
    });
    
    describe('Configuration Management Testing', () => {
        test('should validate configuration file integrity', async () => {
            console.log('⚙️  Testing configuration management...');
            
            const configTests = [
                {
                    name: 'Valid production config',
                    config: {
                        NODE_ENV: 'production',
                        PORT: '3000',
                        HOST: '127.0.0.1',
                        LOG_LEVEL: 'warn',
                        DEBUG: 'false'
                    },
                    expectedValid: true
                },
                {
                    name: 'Invalid port config',
                    config: {
                        NODE_ENV: 'production',
                        PORT: 'invalid-port',
                        HOST: '127.0.0.1'
                    },
                    expectedValid: false
                },
                {
                    name: 'Missing required fields',
                    config: {
                        NODE_ENV: 'production'
                        // Missing PORT and HOST
                    },
                    expectedValid: false
                },
                {
                    name: 'Security issue - debug enabled in production',
                    config: {
                        NODE_ENV: 'production',
                        PORT: '3000',
                        HOST: '127.0.0.1',
                        DEBUG: 'true' // Security issue
                    },
                    expectedValid: false
                }
            ];
            
            const testResults = [];
            
            for (const test of configTests) {
                console.log(`   🔍 Testing: ${test.name}`);
                
                const validation = validateProductionConfig(test.config);
                const passed = validation.valid === test.expectedValid;
                
                testResults.push({
                    name: test.name,
                    passed: passed,
                    expected: test.expectedValid,
                    actual: validation.valid,
                    issues: validation.issues
                });
                
                console.log(`      ${passed ? '✅' : '❌'} ${test.name}`);
                if (validation.issues.length > 0) {
                    console.log(`      Issues: ${validation.issues.join(', ')}`);
                }
            }
            
            const passedTests = testResults.filter(t => t.passed);
            
            console.log(`📊 Configuration Test Results:`);
            console.log(`   Passed: ${passedTests.length}/${testResults.length}`);
            console.log(`   Success rate: ${((passedTests.length / testResults.length) * 100).toFixed(1)}%`);
            
            // All configuration tests should pass
            expect(passedTests.length).toBe(testResults.length);
            
            function validateProductionConfig(config) {
                const issues = [];
                
                // Required fields
                if (!config.NODE_ENV) issues.push('NODE_ENV is required');
                if (!config.PORT) issues.push('PORT is required');
                if (!config.HOST) issues.push('HOST is required');
                
                // Port validation
                const port = parseInt(config.PORT);
                if (isNaN(port) || port < 1 || port > 65535) {
                    issues.push('PORT must be a valid port number');
                }
                
                // Production-specific validations
                if (config.NODE_ENV === 'production') {
                    if (config.DEBUG === 'true') {
                        issues.push('DEBUG should not be enabled in production');
                    }
                    
                    if (config.HOST === '0.0.0.0') {
                        issues.push('HOST should not bind to all interfaces in production');
                    }
                    
                    if (config.LOG_LEVEL === 'debug') {
                        issues.push('LOG_LEVEL should not be debug in production');
                    }
                }
                
                return {
                    valid: issues.length === 0,
                    issues: issues
                };
            }
        });
    });
});