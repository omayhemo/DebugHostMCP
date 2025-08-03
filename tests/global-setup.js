/**
 * Global Test Setup
 * Runs once before all test suites
 */

const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const portfinder = require('portfinder');

module.exports = async () => {
    console.log('🚀 Starting global test setup...');
    
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error';
    process.env.TEST_MODE = 'true';
    
    // Find available ports for testing
    const dashboardPort = await portfinder.getPortPromise({ port: 3000 });
    const websocketPort = await portfinder.getPortPromise({ port: 8080 });
    const mcpPort = await portfinder.getPortPromise({ port: 9000 });
    
    global.__TEST_PORTS__ = {
        dashboard: dashboardPort,
        websocket: websocketPort,
        mcp: mcpPort
    };
    
    // Create test directories
    const testDirs = [
        path.join(__dirname, '../coverage'),
        path.join(__dirname, '../temp'),
        path.join(__dirname, '../logs/test')
    ];
    
    for (const dir of testDirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }
    
    // Clean previous test artifacts
    try {
        const tempDir = path.join(__dirname, '../temp');
        const files = await fs.readdir(tempDir);
        
        for (const file of files) {
            if (file.startsWith('test-')) {
                await fs.unlink(path.join(tempDir, file));
            }
        }
    } catch (error) {
        // Ignore cleanup errors
    }
    
    // Initialize test database/storage
    global.__TEST_STORAGE__ = new Map();
    
    // Set up performance monitoring
    global.__PERFORMANCE_METRICS__ = {
        startTime: Date.now(),
        tests: new Map()
    };
    
    // Create test configuration
    const testConfig = {
        ports: global.__TEST_PORTS__,
        paths: {
            temp: path.join(__dirname, '../temp'),
            logs: path.join(__dirname, '../logs/test'),
            fixtures: path.join(__dirname, 'fixtures')
        },
        timeouts: {
            short: 5000,
            medium: 10000,
            long: 30000,
            load: 60000
        }
    };
    
    // Write test configuration
    await fs.writeFile(
        path.join(__dirname, 'test-config.json'),
        JSON.stringify(testConfig, null, 2)
    );
    
    console.log(`✅ Global test setup complete`);
    console.log(`📊 Test ports: Dashboard=${dashboardPort}, WebSocket=${websocketPort}, MCP=${mcpPort}`);
};