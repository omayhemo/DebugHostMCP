/**
 * Quick debug test to check if refresh timer is working
 */

const { EnhancedPortRegistry } = require('./src/enhanced-port-registry');
const { MultiTechProcessDiscoveryEngine } = require('./src/services/multi-tech-process-discovery-engine');

async function testRefreshTimer() {
  console.log('Starting refresh timer test...');
  
  const discoveryEngine = new MultiTechProcessDiscoveryEngine({
    scanTimeout: 2000,
    performanceMonitoring: true,
    correlationEnabled: true
  });
  
  const registry = new EnhancedPortRegistry(null, {
    refreshInterval: 1000,  // 1 second
    refreshTimeout: 2000,   // Increased timeout to allow scans to complete
    enableRealTimeUpdates: true,
    enableErrorRecovery: false
  });
  
  try {
    console.log('Initializing discovery engine...');
    await discoveryEngine.initialize();
    
    console.log('Initializing enhanced registry...');
    await registry.initialize();
    
    console.log('Getting initial refresh count...');
    const initialState = await registry.getAllActiveProcesses();
    console.log('Initial refresh count:', initialState.refreshCount);
    
    console.log('Waiting 3 seconds for refresh cycles...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Getting final refresh count...');
    const finalState = await registry.getAllActiveProcesses();
    console.log('Final refresh count:', finalState.refreshCount);
    console.log('Refresh count increased:', finalState.refreshCount > initialState.refreshCount);
    
  } catch (error) {
    console.error('Test error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('Shutting down...');
    await registry.shutdown();
    await discoveryEngine.shutdown();
  }
}

testRefreshTimer().catch(console.error);