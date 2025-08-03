/**
 * Global Test Teardown
 * Runs once after all test suites
 */

const path = require('path');
const fs = require('fs').promises;

module.exports = async () => {
    console.log('🧹 Starting global test teardown...');
    
    // Calculate total test duration
    const totalDuration = Date.now() - global.__TEST_START_TIME__;
    console.log(`⏱️  Total test duration: ${totalDuration}ms`);
    
    // Report performance metrics
    if (global.__PERFORMANCE_METRICS__) {
        const metrics = global.__PERFORMANCE_METRICS__;
        console.log('📊 Performance Summary:');
        
        for (const [testName, duration] of metrics.tests) {
            if (duration > 1000) {
                console.log(`  ⚠️  Slow test: ${testName} (${duration}ms)`);
            }
        }
    }
    
    // Clean up temporary files and directories
    const cleanupPaths = [
        path.join(__dirname, '../temp'),
        path.join(__dirname, '../logs/test'),
        path.join(__dirname, 'test-config.json')
    ];
    
    for (const cleanupPath of cleanupPaths) {
        try {
            const stat = await fs.stat(cleanupPath);
            
            if (stat.isDirectory()) {
                // Clean directory contents
                const files = await fs.readdir(cleanupPath);
                for (const file of files) {
                    const filePath = path.join(cleanupPath, file);
                    try {
                        await fs.unlink(filePath);
                    } catch (error) {
                        // File might be in use or already deleted
                    }
                }
            } else {
                // Delete file
                await fs.unlink(cleanupPath);
            }
        } catch (error) {
            // Path might not exist
        }
    }
    
    // Clean up global test artifacts
    delete global.__TEST_PORTS__;
    delete global.__TEST_STORAGE__;
    delete global.__PERFORMANCE_METRICS__;
    delete global.__tempFiles__;
    delete global.__tempDirs__;
    
    // Force cleanup of any remaining handles
    if (global.advancedCleanup) {
        await global.advancedCleanup();
    }
    
    // Final garbage collection
    if (global.gc) {
        global.gc();
    }
    
    console.log('✅ Global test teardown complete');
};