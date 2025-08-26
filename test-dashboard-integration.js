#!/usr/bin/env node
/**
 * Test Dashboard Integration with Multi-Tech Process Discovery Engine
 * Tests the full stack: React Dashboard -> API Bridge -> Multi-Tech Engine
 */

const http = require('http');
const { spawn } = require('child_process');

let apiBridgeProcess = null;

async function makeAPIRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 2602,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testDashboardIntegration() {
  console.log('🔗 Testing Dashboard Integration with Multi-Tech Engine');
  console.log('=' .repeat(60));
  
  try {
    // 1. Start API Bridge Server
    console.log('1️⃣ Starting API Bridge Server...');
    apiBridgeProcess = spawn('node', ['src/api-bridge.js'], {
      stdio: 'pipe',
      env: { ...process.env, API_PORT: '2602' }
    });
    
    // Wait for server to start
    await new Promise(resolve => {
      apiBridgeProcess.stdout.on('data', (data) => {
        console.log(`API Bridge: ${data.toString().trim()}`);
        if (data.toString().includes('API Bridge Server running')) {
          resolve();
        }
      });
      
      apiBridgeProcess.stderr.on('data', (data) => {
        console.error(`API Bridge Error: ${data.toString().trim()}`);
      });
    });
    
    console.log('✅ API Bridge started on port 2602');
    
    // 2. Test Health Check
    console.log('\n2️⃣ Testing API Bridge Health...');
    const healthResponse = await makeAPIRequest('/health');
    console.log(`Health Status: ${healthResponse.status} - ${healthResponse.data.status}`);
    
    if (healthResponse.status !== 200) {
      throw new Error('API Bridge health check failed');
    }
    
    // 3. Test Process Discovery Endpoint
    console.log('\n3️⃣ Testing Multi-Tech Process Discovery API...');
    const discoveryRequest = {
      techStacks: ['nodejs', 'php', 'python', 'static', 'docker'],
      forceRefresh: true,
      includeCorrelation: true,
      timeout: 3000
    };
    
    const startTime = Date.now();
    const discoveryResponse = await makeAPIRequest('/processes/discovery', 'POST', discoveryRequest);
    const endTime = Date.now();
    
    console.log(`Discovery Status: ${discoveryResponse.status}`);
    console.log(`Response Time: ${endTime - startTime}ms`);
    
    if (discoveryResponse.status === 200) {
      const data = discoveryResponse.data;
      console.log(`✅ Discovery Success:`);
      console.log(`   - Scan ID: ${data.scanId}`);
      console.log(`   - Duration: ${data.duration}ms`);
      console.log(`   - Total Processes: ${data.totalProcesses}`);
      console.log(`   - Tech Stack Results:`);
      
      Object.entries(data.techStackResults || {}).forEach(([techStack, result]) => {
        const status = result.success ? '✅' : '❌';
        const count = result.processes ? result.processes.length : 0;
        console.log(`     ${status} ${techStack}: ${count} processes`);
      });
      
      if (data.correlation) {
        console.log(`   - Correlation Results:`);
        console.log(`     📊 Registered: ${data.correlation.registeredProcesses?.length || 0}`);
        console.log(`     📊 Discovered: ${data.correlation.discoveredProcesses?.length || 0}`);
        console.log(`     📊 Rogue: ${data.correlation.rogueProcesses?.length || 0}`);
        console.log(`     📊 Orphaned: ${data.correlation.orphanedProcesses?.length || 0}`);
      }
    } else {
      console.log(`❌ Discovery failed: ${JSON.stringify(discoveryResponse.data)}`);
    }
    
    // 4. Test System Health Endpoint
    console.log('\n4️⃣ Testing System Health API...');
    const healthAPIResponse = await makeAPIRequest('/processes/system-health');
    
    console.log(`Health API Status: ${healthAPIResponse.status}`);
    
    if (healthAPIResponse.status === 200) {
      const health = healthAPIResponse.data;
      console.log(`✅ System Health:`);
      console.log(`   - Status: ${health.status}`);
      console.log(`   - Total Processes: ${health.totalProcesses}`);
      console.log(`   - Rogue Processes: ${health.rogueProcesses}`);
      console.log(`   - Port Utilization: ${health.portUtilization}%`);
      console.log(`   - Last Update: ${health.lastUpdate}`);
    } else {
      console.log(`❌ Health API failed: ${JSON.stringify(healthAPIResponse.data)}`);
    }
    
    // 5. Test Bulk Action Endpoint
    console.log('\n5️⃣ Testing Bulk Action API...');
    const bulkRequest = {
      action: 'terminate',
      processIds: ['1234', '5678'],
      options: { force: false, reason: 'Test cleanup' }
    };
    
    const bulkResponse = await makeAPIRequest('/processes/bulk-action', 'POST', bulkRequest);
    console.log(`Bulk Action Status: ${bulkResponse.status}`);
    
    if (bulkResponse.status === 200) {
      const result = bulkResponse.data;
      console.log(`✅ Bulk Action Success:`);
      console.log(`   - Processed: ${result.processedCount}`);
      console.log(`   - Failed: ${result.failedCount}`);
      console.log(`   - Summary: ${result.summary}`);
    } else {
      console.log(`❌ Bulk action failed: ${JSON.stringify(bulkResponse.data)}`);
    }
    
    // 6. Summary
    console.log('\n🏁 Integration Test Summary');
    console.log('=' .repeat(40));
    
    const allTestsPassed = 
      healthResponse.status === 200 &&
      discoveryResponse.status === 200 &&
      healthAPIResponse.status === 200 &&
      bulkResponse.status === 200;
    
    console.log(`Overall Result: ${allTestsPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('Dashboard can now connect to Multi-Tech Process Discovery Engine!');
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return false;
  } finally {
    // Clean up
    if (apiBridgeProcess) {
      console.log('\n🧹 Shutting down API Bridge...');
      apiBridgeProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Run integration test
testDashboardIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });