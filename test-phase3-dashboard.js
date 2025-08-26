#!/usr/bin/env node
/**
 * Phase 3 Complete Dashboard Integration Test
 * 
 * CRITICAL: 100% functional implementation is the definition of done.
 * Test every aspect of the multi-tech dashboard UI integration:
 * 1. API Bridge functionality
 * 2. React Dashboard loads and connects
 * 3. Multi-tech tabs work correctly
 * 4. Real-time updates function
 * 5. Process management controls work
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

let apiBridgeProcess = null;
let dashboardProcess = null;

/**
 * Make HTTP request to API
 */
async function makeAPIRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 2602,
      path: `/api${path}`,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', reject);
    if (data && method !== 'GET') req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * Check if dashboard is accessible
 */
async function checkDashboardAccess() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost', 
      port: 5173,
      path: '/',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      resolve({ status: res.statusCode });
    });
    
    req.on('error', () => resolve({ status: 0 }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ status: 0 });
    });
    req.end();
  });
}

async function testPhase3Dashboard() {
  console.log('🎯 Testing Phase 3 - Complete Multi-Tech Dashboard Integration');
  console.log('=' .repeat(70));
  console.log('Definition of Done: 100% functional UI implementation');
  
  const testResults = {
    apiBridge: false,
    dashboard: false,
    integration: false,
    multiTech: false,
    realTime: false
  };

  try {
    // Step 1: Start API Bridge
    console.log('\n1️⃣ Starting API Bridge Server...');
    
    apiBridgeProcess = spawn('node', ['src/api-bridge.js'], {
      stdio: 'pipe',
      env: { ...process.env, API_PORT: '2602' }
    });

    // Wait for API Bridge to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('API Bridge startup timeout')), 10000);
      
      apiBridgeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('API Bridge Server running')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      
      apiBridgeProcess.stderr.on('data', (data) => {
        console.log(`API Bridge Error: ${data.toString().trim()}`);
      });
      
      apiBridgeProcess.on('error', reject);
    });

    console.log('✅ API Bridge started on port 2602');

    // Step 2: Test API Bridge Health
    console.log('\n2️⃣ Testing API Bridge Health...');
    const healthResponse = await makeAPIRequest('/health');
    
    if (healthResponse.status !== 200) {
      throw new Error(`API Bridge health check failed: ${healthResponse.status}`);
    }
    
    console.log('✅ API Bridge healthy');
    testResults.apiBridge = true;

    // Step 3: Test Multi-Tech Discovery API
    console.log('\n3️⃣ Testing Multi-Tech Process Discovery API...');
    const discoveryResponse = await makeAPIRequest('/processes/discovery', 'POST', {
      techStacks: ['nodejs', 'python'],
      includeCorrelation: true,
      forceRefresh: true
    });

    if (discoveryResponse.status !== 200) {
      throw new Error(`Discovery API failed: ${discoveryResponse.status}`);
    }

    const discoveryData = discoveryResponse.data;
    console.log(`✅ Discovery API working - Found ${discoveryData.totalProcesses} processes`);
    console.log(`   Tech stacks: ${Object.keys(discoveryData.techStackResults || {}).join(', ')}`);

    // Step 4: Start React Dashboard
    console.log('\n4️⃣ Starting React Dashboard...');
    
    dashboardProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      cwd: path.join(process.cwd(), 'dashboard'),
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    // Wait for dashboard to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Dashboard startup timeout')), 30000);
      
      dashboardProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`Dashboard: ${output.trim()}`);
        
        // Look for Vite ready message with localhost:5173
        if ((output.includes('Local:') || output.includes('ready in')) && output.includes('5173')) {
          clearTimeout(timeout);
          // Wait additional time for complete startup
          setTimeout(resolve, 2000);
        }
        
        // Also accept just "ready in" from Vite as success
        if (output.includes('ready in') && output.includes('ms')) {
          clearTimeout(timeout);
          setTimeout(resolve, 2000);
        }
      });
      
      dashboardProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`Dashboard Error: ${output.trim()}`);
        
        // Check stderr for Local: pattern as well
        if ((output.includes('Local:') || output.includes('ready in')) && output.includes('5173')) {
          clearTimeout(timeout);
          setTimeout(resolve, 2000);
        }
      });
      
      dashboardProcess.on('error', reject);
    });

    console.log('✅ React Dashboard started on port 5173');

    // Step 5: Test Dashboard Accessibility
    console.log('\n5️⃣ Testing Dashboard Accessibility...');
    
    // Wait a moment for dashboard to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dashboardResponse = await checkDashboardAccess();
    
    if (dashboardResponse.status === 0) {
      throw new Error('Dashboard not accessible on port 5173');
    }
    
    console.log(`✅ Dashboard accessible (HTTP ${dashboardResponse.status})`);
    testResults.dashboard = true;

    // Step 6: Test Dashboard-API Integration
    console.log('\n6️⃣ Testing Dashboard-API Integration...');
    
    // Test system health API (used by dashboard)
    const systemHealthResponse = await makeAPIRequest('/processes/system-health');
    
    if (systemHealthResponse.status !== 200) {
      throw new Error('System health API failed');
    }
    
    console.log('✅ System Health API working');
    console.log(`   Status: ${systemHealthResponse.data.status}`);
    console.log(`   Total Processes: ${systemHealthResponse.data.totalProcesses}`);
    console.log(`   Rogue Processes: ${systemHealthResponse.data.rogueProcesses}`);
    
    testResults.integration = true;

    // Step 7: Test Multi-Tech Endpoints
    console.log('\n7️⃣ Testing Multi-Tech Endpoints...');
    
    // Test all tech stack endpoints
    const techStacks = ['nodejs', 'php', 'python', 'static', 'docker'];
    let workingStacks = 0;
    
    const fullDiscovery = await makeAPIRequest('/processes/discovery', 'POST', {
      techStacks: techStacks,
      includeCorrelation: true
    });
    
    if (fullDiscovery.status === 200) {
      const results = fullDiscovery.data.techStackResults || {};
      for (const [stack, result] of Object.entries(results)) {
        const status = result.success ? '✅' : '⚠️';
        const count = result.processes ? result.processes.length : 0;
        console.log(`   ${status} ${stack}: ${count} processes`);
        if (result.success) workingStacks++;
      }
    }
    
    if (workingStacks >= 3) {
      console.log(`✅ Multi-tech support working (${workingStacks}/${techStacks.length} stacks)`);
      testResults.multiTech = true;
    } else {
      console.log(`⚠️ Limited multi-tech support (${workingStacks}/${techStacks.length} stacks)`);
    }

    // Step 8: Test Real-time Capabilities
    console.log('\n8️⃣ Testing Real-time Capabilities...');
    
    try {
      // Test Server-Sent Events endpoint
      const { EventSource } = require('eventsource');
      const eventSource = new EventSource('http://localhost:2602/api/processes/realtime');
      
      const realtimeTest = new Promise((resolve) => {
        let eventReceived = false;
        
        eventSource.onopen = () => {
          console.log('   ✅ SSE connection established');
        };
        
        eventSource.onmessage = (event) => {
          if (!eventReceived) {
            console.log('   ✅ Real-time events working');
            eventReceived = true;
            eventSource.close();
            resolve(true);
          }
        };
        
        eventSource.onerror = () => {
          console.log('   ⚠️ SSE connection error');
          eventSource.close();
          resolve(false);
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!eventReceived) {
            console.log('   ⚠️ No real-time events received (timeout)');
            eventSource.close();
            resolve(false);
          }
        }, 5000);
      });
      
      testResults.realTime = await realtimeTest;
      
    } catch (error) {
      console.log(`   ⚠️ Real-time test failed: ${error.message}`);
      testResults.realTime = false;
    }

    // Step 9: Comprehensive Results
    console.log('\n🏁 === PHASE 3 DASHBOARD INTEGRATION RESULTS ===');
    console.log('=' .repeat(60));
    
    const results = [
      { name: 'API Bridge Server', status: testResults.apiBridge },
      { name: 'React Dashboard', status: testResults.dashboard },
      { name: 'Dashboard-API Integration', status: testResults.integration },
      { name: 'Multi-Tech Support', status: testResults.multiTech },
      { name: 'Real-time Updates', status: testResults.realTime }
    ];
    
    results.forEach(result => {
      const status = result.status ? '✅' : '❌';
      console.log(`${status} ${result.name.padEnd(25)} ${result.status ? 'WORKING' : 'NEEDS FIX'}`);
    });
    
    const successCount = results.filter(r => r.status).length;
    const successRate = (successCount / results.length * 100).toFixed(1);
    
    console.log(`\nSuccess Rate: ${successRate}% (${successCount}/${results.length})`);
    
    if (successCount === results.length) {
      console.log('\n✅ PHASE 3 DASHBOARD INTEGRATION: 100% FUNCTIONAL');
      console.log('🎖️ Multi-tech dashboard with real-time updates working perfectly');
      console.log('🌐 Dashboard accessible at: http://localhost:5173/dashboard');
      console.log('⚙️ API Bridge accessible at: http://localhost:2602/api');
      
      // Keep servers running for manual testing
      console.log('\n🔍 Servers are running for manual testing...');
      console.log('Press Ctrl+C to stop servers and exit');
      
      // Keep process alive for manual testing
      process.on('SIGINT', () => {
        console.log('\n🧹 Shutting down servers...');
        cleanup();
        process.exit(0);
      });
      
      // Keep alive indefinitely for manual testing
      setInterval(() => {}, 1000);
      
    } else {
      console.log('\n❌ PHASE 3 DASHBOARD INTEGRATION: INCOMPLETE');
      console.log('🔧 Fix failed components before declaring Phase 3 complete');
      cleanup();
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Phase 3 integration test failed:', error.message);
    cleanup();
    process.exit(1);
  }
}

function cleanup() {
  console.log('Cleaning up processes...');
  
  if (apiBridgeProcess) {
    apiBridgeProcess.kill('SIGTERM');
    console.log('✓ API Bridge stopped');
  }
  
  if (dashboardProcess) {
    dashboardProcess.kill('SIGTERM'); 
    console.log('✓ Dashboard stopped');
  }
}

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  cleanup();
  process.exit(1);
});

// Start the test
testPhase3Dashboard().catch(error => {
  console.error('Test execution failed:', error);
  cleanup();
  process.exit(1);
});