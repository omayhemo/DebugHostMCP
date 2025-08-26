#!/usr/bin/env node
/**
 * Manual Performance Test for Multi-Tech Process Discovery Engine
 * Tests the actual functionality and performance after timeout fixes
 */

const { MultiTechProcessDiscoveryEngine } = require('./src/services/multi-tech-process-discovery-engine');

async function testDiscoveryPerformance() {
  console.log('🧪 Testing Multi-Tech Process Discovery Engine Performance');
  console.log('=' .repeat(60));
  
  const engine = new MultiTechProcessDiscoveryEngine({
    performanceMonitoring: true,
    scanTimeout: 2000, // 2 second max scan time
    parallelScanning: true
  });
  
  try {
    console.log('1️⃣ Initializing discovery engine...');
    const initStart = Date.now();
    await engine.initialize();
    const initTime = Date.now() - initStart;
    console.log(`✅ Initialization completed in ${initTime}ms`);
    
    console.log('\n2️⃣ Testing system scan performance...');
    const scanStart = Date.now();
    const results = await engine.scanSystemProcesses({
      includeCorrelation: true,
      forceRefresh: true
    });
    const scanTime = Date.now() - scanStart;
    
    console.log(`✅ System scan completed in ${scanTime}ms`);
    console.log(`📊 Found ${results.totalProcesses} processes`);
    console.log(`🎯 Performance target: < 2000ms | Actual: ${scanTime}ms | ${scanTime < 2000 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test results structure
    console.log('\n3️⃣ Validating scan results structure...');
    const requiredProperties = ['scanId', 'timestamp', 'duration', 'techStackResults', 'totalProcesses', 'processesFound'];
    const missingProperties = requiredProperties.filter(prop => !(prop in results));
    
    if (missingProperties.length === 0) {
      console.log('✅ All required result properties present');
    } else {
      console.log(`❌ Missing properties: ${missingProperties.join(', ')}`);
    }
    
    // Test tech stack results
    console.log('\n4️⃣ Testing individual tech stack results...');
    for (const [techStack, result] of Object.entries(results.techStackResults)) {
      const status = result.success ? '✅' : '❌';
      const processCount = result.processes ? result.processes.length : 0;
      console.log(`${status} ${techStack}: ${processCount} processes found ${result.success ? '' : '(' + result.error + ')'}`);
    }
    
    // Test correlation results
    if (results.correlation) {
      console.log('\n5️⃣ Testing process correlation...');
      console.log(`✅ Correlation completed`);
      console.log(`📊 Registered: ${results.correlation.registeredProcesses?.length || 0}`);
      console.log(`📊 Discovered: ${results.correlation.discoveredProcesses?.length || 0}`);
      console.log(`📊 Rogue: ${results.correlation.rogueProcesses?.length || 0}`);
      console.log(`📊 Orphaned: ${results.correlation.orphanedProcesses?.length || 0}`);
    } else {
      console.log('\n⚠️ No correlation results returned');
    }
    
    // Test engine status
    console.log('\n6️⃣ Testing engine status...');
    const status = engine.getStatus();
    console.log(`✅ Engine status: isScanning=${status.isScanning}, scanCount=${status.scanCount}`);
    console.log(`📈 Stats: fastest=${status.scanStats.fastestScan}ms, slowest=${status.scanStats.slowestScan}ms, avg=${Math.round(status.scanStats.averageScanTime)}ms`);
    
    // Performance summary
    console.log('\n🏁 Performance Summary');
    console.log('=' .repeat(40));
    console.log(`Init Time: ${initTime}ms`);
    console.log(`Scan Time: ${scanTime}ms ${scanTime < 2000 ? '✅' : '❌'}`);
    console.log(`Total Processes: ${results.totalProcesses}`);
    console.log(`Success Rate: ${results.techStackResults ? Object.values(results.techStackResults).filter(r => r.success).length : 0}/${Object.keys(results.techStackResults).length} detectors`);
    
    await engine.shutdown();
    console.log('✅ Engine shutdown complete');
    
    // Final verdict
    const overallSuccess = scanTime < 2000 && results.totalProcesses >= 0 && missingProperties.length === 0;
    console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    return overallSuccess;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    
    try {
      await engine.shutdown();
    } catch (shutdownError) {
      console.warn('Warning: Shutdown error:', shutdownError.message);
    }
    
    return false;
  }
}

// Run test
testDiscoveryPerformance()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });