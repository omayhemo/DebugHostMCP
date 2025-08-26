#!/usr/bin/env node
/**
 * Phase 3 Manual Dashboard Test
 * 
 * Starts the servers and provides manual testing instructions
 * 100% functional implementation validation
 */

const { spawn } = require('child_process');
const path = require('path');

let apiBridgeProcess = null;
let dashboardProcess = null;

async function startServers() {
  console.log('🚀 Phase 3 - Multi-Tech Dashboard Manual Test');
  console.log('=' .repeat(60));
  console.log('Starting servers for manual UI functionality testing...\n');

  try {
    // Start API Bridge
    console.log('1️⃣ Starting API Bridge Server...');
    apiBridgeProcess = spawn('node', ['src/api-bridge.js'], {
      stdio: 'pipe',
      env: { ...process.env, API_PORT: '2602' }
    });

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
        console.log(`API Bridge: ${data.toString().trim()}`);
      });
      
      apiBridgeProcess.on('error', reject);
    });

    console.log('✅ API Bridge started on http://localhost:2602');

    // Start React Dashboard
    console.log('\n2️⃣ Starting React Dashboard...');
    dashboardProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      cwd: path.join(process.cwd(), 'dashboard'),
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Dashboard startup timeout')), 30000);
      
      dashboardProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`Dashboard: ${output.trim()}`);
        
        if (output.includes('ready in') && output.includes('ms')) {
          clearTimeout(timeout);
          setTimeout(resolve, 2000);
        }
      });
      
      dashboardProcess.stderr.on('data', (data) => {
        console.log(`Dashboard: ${data.toString().trim()}`);
      });
      
      dashboardProcess.on('error', reject);
    });

    console.log('✅ React Dashboard started on http://localhost:5173\n');

    // Manual Testing Instructions
    console.log('🧪 === MANUAL TESTING INSTRUCTIONS ===');
    console.log('=' .repeat(50));
    console.log('');
    console.log('📋 Phase 3 Requirements to Validate:');
    console.log('');
    console.log('✅ Story 3.7: Multi-Tech Dashboard Core (15 points)');
    console.log('   → Open: http://localhost:5173/dashboard');
    console.log('   → Verify technology stack tabs: All, Node.js, PHP, Python, Static, Docker');
    console.log('   → Check process categorization: Registered (green), Discovered (blue), Rogue (orange), Orphaned (red)');
    console.log('   → Test real-time updates: Watch for process changes within 5 seconds');
    console.log('   → Try process management: Click terminate button and verify safety dialog');
    console.log('   → Verify performance: UI should remain responsive with 50+ processes');
    console.log('');
    console.log('✅ Story 3.8: Real-time Process Monitoring UI (10 points)');
    console.log('   → Check activity feed updates automatically');  
    console.log('   → Verify 5-second refresh cycle with change detection');
    console.log('   → Watch for process start/stop notifications');
    console.log('');
    console.log('✅ Story 3.9: Bulk Operations & Safety Controls (5 points)');
    console.log('   → Select multiple processes with checkboxes');
    console.log('   → Test bulk operations panel with safety confirmations');
    console.log('   → Verify agent safety framework integration');
    console.log('');
    console.log('🔗 Test Endpoints:');
    console.log('   • Dashboard UI: http://localhost:5173/dashboard');
    console.log('   • API Health: http://localhost:2602/api/health');
    console.log('   • Process Discovery: http://localhost:2602/api/processes/discovery');
    console.log('   • System Health: http://localhost:2602/api/processes/system-health');
    console.log('');
    console.log('⚠️  Validation Criteria:');
    console.log('   • All technology tabs must be functional');
    console.log('   • Real-time updates must work within 5 seconds');
    console.log('   • Process management controls must show safety dialogs');
    console.log('   • UI must remain responsive during operations');
    console.log('   • Multi-process selection and bulk operations must work');
    console.log('');
    console.log('🎯 SUCCESS CRITERIA: 100% functional implementation');
    console.log('   - No broken UI components');
    console.log('   - All interactive elements working');
    console.log('   - Real-time data updates flowing correctly');
    console.log('   - Safety framework integrated properly');
    console.log('');
    console.log('Press Ctrl+C when testing is complete...');

    // Keep servers running
    process.on('SIGINT', () => {
      console.log('\n🧹 Shutting down servers...');
      cleanup();
      console.log('✅ Manual testing session complete');
      process.exit(0);
    });

    // Keep alive
    setInterval(() => {}, 1000);

  } catch (error) {
    console.error('💥 Server startup failed:', error.message);
    cleanup();
    process.exit(1);
  }
}

function cleanup() {
  if (apiBridgeProcess) {
    apiBridgeProcess.kill('SIGTERM');
    console.log('✓ API Bridge stopped');
  }
  
  if (dashboardProcess) {
    dashboardProcess.kill('SIGTERM'); 
    console.log('✓ Dashboard stopped');
  }
}

// Handle cleanup
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  cleanup();
  process.exit(1);
});

// Start servers
startServers().catch(error => {
  console.error('Failed to start servers:', error);
  cleanup();
  process.exit(1);
});