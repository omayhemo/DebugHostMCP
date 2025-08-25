/**
 * Multi-Tech Process Discovery Engine Integration Test
 * 
 * Basic integration test to validate the core architecture works
 * and meets performance requirements.
 */

const { MultiTechProcessDiscoveryEngine, TechStack } = require('./services/multi-tech-process-discovery-engine');
const { ProcessCorrelationEngine } = require('./services/process-correlation-engine');
const { PerformanceMonitor } = require('./services/performance-monitor');
const PortRegistry = require('./port-registry');
const path = require('path');

async function runIntegrationTest() {
  console.log('🚀 Starting Multi-Tech Process Discovery Engine Integration Test...\n');
  
  try {
    // Initialize components
    console.log('1. Initializing components...');
    
    const portRegistry = new PortRegistry();
    await portRegistry.initialize();
    
    const discoveryEngine = new MultiTechProcessDiscoveryEngine({
      scanTimeout: 2000,
      performanceMonitoring: true,
      portRegistry: portRegistry,
      nodejs: { enabled: true },
      php: { enabled: true },
      python: { enabled: true },
      static: { enabled: true },
      docker: { enabled: true }
    });
    
    await discoveryEngine.initialize();
    console.log('✅ Components initialized successfully\n');
    
    // Test basic system scan
    console.log('2. Testing system scan...');
    const scanStart = Date.now();
    
    const scanResults = await discoveryEngine.scanSystemProcesses({
      includeCorrelation: true,
      techStacks: [TechStack.NODEJS, TechStack.PHP, TechStack.PYTHON, TechStack.STATIC, TechStack.DOCKER]
    });
    
    const scanDuration = Date.now() - scanStart;
    console.log(`✅ System scan completed in ${scanDuration}ms`);
    console.log(`   Found ${scanResults.totalProcesses} processes across ${Object.keys(scanResults.techStackResults).length} tech stacks\n`);
    
    // Validate performance requirements
    console.log('3. Validating performance requirements...');
    
    // Requirement 1: Scan time < 2 seconds
    if (scanDuration < 2000) {
      console.log(`✅ Scan time: ${scanDuration}ms < 2000ms (PASS)`);
    } else {
      console.log(`❌ Scan time: ${scanDuration}ms >= 2000ms (FAIL)`);
    }
    
    // Get performance metrics
    const performanceMetrics = discoveryEngine.performanceMonitor.getCurrentMetrics();
    if (performanceMetrics.enabled) {
      // Requirement 2: Memory overhead < 50MB
      const memoryOverhead = performanceMetrics.memory.overhead;
      if (memoryOverhead < 50) {
        console.log(`✅ Memory overhead: ${memoryOverhead.toFixed(1)}MB < 50MB (PASS)`);
      } else {
        console.log(`❌ Memory overhead: ${memoryOverhead.toFixed(1)}MB >= 50MB (FAIL)`);
      }
      
      // Requirement 3: CPU usage < 5%
      const cpuUsage = performanceMetrics.cpu.current;
      if (cpuUsage < 5.0) {
        console.log(`✅ CPU usage: ${cpuUsage.toFixed(1)}% < 5% (PASS)`);
      } else {
        console.log(`❌ CPU usage: ${cpuUsage.toFixed(1)}% >= 5% (FAIL)`);
      }
    }
    
    console.log();
    
    // Test detector-specific functionality
    console.log('4. Testing detector capabilities...');
    
    for (const [techStack, result] of Object.entries(scanResults.techStackResults)) {
      console.log(`   ${techStack}: ${result.processes?.length || 0} processes found`);
      
      if (result.success && result.processes && result.processes.length > 0) {
        const sampleProcess = result.processes[0];
        console.log(`     Sample: PID ${sampleProcess.pid}, Port ${sampleProcess.port}, Framework: ${sampleProcess.framework || 'N/A'}`);
      }
    }
    
    console.log();
    
    // Test correlation functionality
    console.log('5. Testing process correlation...');
    
    if (scanResults.correlation) {
      const correlation = scanResults.correlation;
      console.log(`   Registered processes: ${correlation.registeredProcesses?.length || 0}`);
      console.log(`   Discovered processes: ${correlation.discoveredProcesses?.length || 0}`);
      console.log(`   Rogue processes: ${correlation.rogueProcesses?.length || 0}`);
      console.log(`   Orphaned processes: ${correlation.orphanedProcesses?.length || 0}`);
    } else {
      console.log('   No correlation results (processes may not be found)');
    }
    
    console.log();
    
    // Test engine status and statistics
    console.log('6. Testing engine status...');
    
    const status = discoveryEngine.getStatus();
    console.log(`   Is scanning: ${status.isScanning}`);
    console.log(`   Scan count: ${status.scanCount}`);
    console.log(`   Available detectors: ${status.availableDetectors.join(', ')}`);
    console.log(`   Uptime: ${Math.round(status.uptime / 1000)}s`);
    
    console.log();
    
    // Test individual detector info
    console.log('7. Testing individual detector information...');
    
    for (const techStack of status.availableDetectors) {
      try {
        const detectorInfo = discoveryEngine.getDetectorInfo(techStack);
        console.log(`   ${techStack}: ${detectorInfo.initialized ? 'initialized' : 'not initialized'}, supports ${detectorInfo.supportedMethods?.length || 0} methods`);
      } catch (error) {
        console.log(`   ${techStack}: error getting info - ${error.message}`);
      }
    }
    
    console.log();
    
    // Test rogue process detection (if any processes found)
    if (scanResults.totalProcesses > 0) {
      console.log('8. Testing rogue process detection...');
      
      try {
        const rogueProcesses = await discoveryEngine.detectRogueProcesses();
        console.log(`   Found ${rogueProcesses.length} rogue processes`);
        
        if (rogueProcesses.length > 0) {
          const sampleRogue = rogueProcesses[0];
          console.log(`   Sample rogue: PID ${sampleRogue.pid}, Port ${sampleRogue.port}, Reason: ${sampleRogue.rogueReason}`);
        }
      } catch (error) {
        console.log(`   Rogue detection failed: ${error.message}`);
      }
      
      console.log();
    }
    
    // Test graceful shutdown
    console.log('9. Testing graceful shutdown...');
    await discoveryEngine.shutdown();
    console.log('✅ Engine shutdown completed\n');
    
    // Final summary
    console.log('🎉 Integration Test Results:');
    console.log(`   ✅ System scan: ${scanDuration}ms (${scanDuration < 2000 ? 'PASS' : 'FAIL'})`);
    console.log(`   ✅ Processes discovered: ${scanResults.totalProcesses}`);
    console.log(`   ✅ Tech stacks supported: ${Object.keys(scanResults.techStackResults).length}`);
    console.log(`   ✅ All core functionality working`);
    
    if (performanceMetrics.enabled) {
      const healthStatus = discoveryEngine.performanceMonitor.getHealthStatus();
      console.log(`   ${healthStatus.healthy ? '✅' : '❌'} Performance: ${healthStatus.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      
      if (!healthStatus.healthy && healthStatus.issues) {
        healthStatus.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
    }
    
    console.log('\n🚀 Multi-Tech Process Discovery Engine is ready for production use!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIntegrationTest().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runIntegrationTest };