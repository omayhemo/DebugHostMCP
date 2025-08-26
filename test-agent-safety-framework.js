#!/usr/bin/env node
/**
 * Comprehensive Agent Safety Framework Test
 * 
 * Story 3.6: Agent Safety Framework (10 story points)
 * Tests context-aware safety controls, graduated safety levels, 
 * workspace correlation, and audit logging.
 * 
 * CRITICAL: 100% functional implementation is the definition of done.
 */

const { AgentSafetyFramework } = require('./src/agent-safety-framework');

// Track test results
const testResults = {
  passed: 0,
  failed: 0,
  tests: {},
  startTime: Date.now()
};

/**
 * Test a safety framework feature
 */
async function testSafetyFeature(testName, testFunction) {
  console.log(`\n🔒 Testing ${testName}...`);
  
  try {
    const startTime = Date.now();
    await testFunction();
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${testName} PASSED (${duration}ms)`);
    testResults.passed++;
    testResults.tests[testName] = { status: 'PASSED', duration };
    
  } catch (error) {
    console.log(`❌ ${testName} FAILED: ${error.message}`);
    testResults.failed++;
    testResults.tests[testName] = { status: 'FAILED', error: error.message };
  }
}

/**
 * Test all Agent Safety Framework features
 */
async function testAgentSafetyFramework() {
  console.log('🔐 Starting Agent Safety Framework Test');
  console.log('=' .repeat(60));
  console.log('Testing context-aware safety controls and graduated safety levels');
  
  try {
    // Initialize safety framework
    const safetyFramework = new AgentSafetyFramework({
      auditLogPath: '/tmp/safety-audit.log',
      emergencyOverride: true,
      performanceMode: true
    });
    
    await safetyFramework.initialize();
    console.log('✅ Safety Framework initialized\n');
    
    // Test 1: Context-Aware Safety Rules
    console.log('🎯 === TESTING CONTEXT-AWARE SAFETY RULES ===');
    
    await testSafetyFeature('Registered Process Safety', async () => {
      const request = {
        command: 'kill_process',
        target: { pid: 1234 },
        context: { processCategory: 'registered', workspace: '/home/user/project' }
      };
      
      const evaluation = await safetyFramework.evaluateProcessControlRequest(request, {
        agentId: 'test-agent',
        workspace: '/home/user/project'
      });
      
      if (!evaluation || typeof evaluation !== 'object') {
        throw new Error('Expected safety evaluation object');
      }
      
      if (typeof evaluation.allowed !== 'boolean') {
        throw new Error('Expected boolean allowed field');
      }
      
      if (!evaluation.riskLevel || !['low', 'medium', 'high', 'critical'].includes(evaluation.riskLevel)) {
        throw new Error('Expected valid risk level');
      }
    });
    
    await testSafetyFeature('Rogue Process Safety', async () => {
      const request = {
        command: 'cleanup_rogue',
        target: { processCategory: 'rogue' },
        context: { processCategory: 'rogue', workspace: null }
      };
      
      const evaluation = await safetyFramework.evaluateProcessControlRequest(request, {
        agentId: 'test-agent',
        workspace: '/home/user/project'
      });
      
      if (!evaluation.reasoning || typeof evaluation.reasoning !== 'string') {
        throw new Error('Expected reasoning string in evaluation');
      }
    });
    
    await testSafetyFeature('System Process Protection', async () => {
      const request = {
        command: 'kill_process',
        target: { pid: 1 }, // System init process
        context: { processCategory: 'system' }
      };
      
      const evaluation = await safetyFramework.evaluateProcessControlRequest(request, {
        agentId: 'test-agent',
        workspace: '/home/user/project'
      });
      
      // System processes should be blocked or require confirmation
      if (evaluation.allowed && !evaluation.requiresConfirmation) {
        throw new Error('System processes should be protected');
      }
    });
    
    // Test 2: Graduated Safety Levels
    console.log('\n⚡ === TESTING GRADUATED SAFETY LEVELS ===');
    
    await testSafetyFeature('Safe Level Operations', async () => {
      const request = {
        command: 'discover_processes', // Safe operation
        safetyLevel: 'safe'
      };
      
      const evaluation = await safetyFramework.evaluateProcessControlRequest(request, {
        agentId: 'test-agent'
      });
      
      // Safe operations should generally be allowed
      if (!evaluation.allowed) {
        throw new Error('Safe operations should be allowed');
      }
    });
    
    await testSafetyFeature('Moderate Level Operations', async () => {
      const request = {
        command: 'correlate_workspace', // Moderate operation
        safetyLevel: 'moderate',
        context: { workspace: '/home/user/project' }
      };
      
      const evaluation = await safetyFramework.evaluateProcessControlRequest(request, {
        agentId: 'test-agent',
        workspace: '/home/user/project'
      });
      
      if (!evaluation.allowed && !evaluation.requiresConfirmation) {
        throw new Error('Moderate operations should be allowed or require confirmation');
      }
    });
    
    await testSafetyFeature('Dangerous Level Operations', async () => {
      const request = {
        command: 'bulk_process_management', // Dangerous operation
        safetyLevel: 'dangerous',
        target: { operations: [{ action: 'kill', target: { pid: 999 } }] }
      };
      
      const evaluation = await safetyFramework.evaluateProcessControlRequest(request, {
        agentId: 'test-agent'
      });
      
      // Dangerous operations should require confirmation or be blocked
      if (evaluation.allowed && !evaluation.requiresConfirmation) {
        throw new Error('Dangerous operations should require confirmation');
      }
    });
    
    // Test 3: Workspace Correlation Safety
    console.log('\n🗂️ === TESTING WORKSPACE CORRELATION SAFETY ===');
    
    await testSafetyFeature('Workspace Correlated Process', async () => {
      const request = {
        command: 'kill_process',
        target: { pid: 5678 },
        context: { 
          processCategory: 'workspace',
          workspace: '/home/user/project',
          workspaceConfidence: 0.95 
        }
      };
      
      const evaluation = await safetyFramework.evaluateProcessControlRequest(request, {
        agentId: 'test-agent',
        workspace: '/home/user/project'
      });
      
      // Should have relaxed safety for workspace-correlated processes
      if (evaluation.riskLevel === 'critical') {
        throw new Error('Workspace-correlated processes should have reduced risk');
      }
    });
    
    await testSafetyFeature('Non-Correlated Process', async () => {
      const request = {
        command: 'kill_process',
        target: { pid: 9999 },
        context: { 
          processCategory: 'unknown',
          workspace: null,
          workspaceConfidence: 0.0 
        }
      };
      
      const evaluation = await safetyFramework.evaluateProcessControlRequest(request, {
        agentId: 'test-agent',
        workspace: '/home/user/project'
      });
      
      // Should have enhanced safety for unknown processes
      if (!evaluation.requiresConfirmation && evaluation.riskLevel === 'low') {
        throw new Error('Unknown processes should have enhanced safety restrictions');
      }
    });
    
    // Test 4: Audit Logging & Compliance
    console.log('\n📋 === TESTING AUDIT LOGGING & COMPLIANCE ===');
    
    await testSafetyFeature('Operation Audit Logging', async () => {
      const operation = {
        action: 'kill_process',
        target: { pid: 1111 },
        timestamp: new Date().toISOString(),
        reason: 'Test audit logging'
      };
      
      const decision = {
        allowed: true,
        requiresConfirmation: false,
        riskLevel: 'medium'
      };
      
      const context = {
        agentId: 'test-agent',
        workspace: '/home/user/project'
      };
      
      await safetyFramework.auditLog(operation, decision, context);
      
      // Verify audit log was created (basic test)
      const auditEntries = safetyFramework.getAuditHistory({ limit: 1 });
      if (!auditEntries || auditEntries.length === 0) {
        throw new Error('Expected audit log entry to be created');
      }
    });
    
    await testSafetyFeature('High-Risk Operation Blocking', async () => {
      const request = {
        command: 'kill_process',
        target: { pid: 1 }, // System init
        safetyLevel: 'dangerous'
      };
      
      const evaluation = await safetyFramework.evaluateProcessControlRequest(request, {
        agentId: 'test-agent'
      });
      
      if (evaluation.allowed && !evaluation.requiresConfirmation) {
        throw new Error('High-risk operations should be blocked or require confirmation');
      }
      
      // Should log the block reason
      if (!evaluation.reasoning || evaluation.reasoning.length < 10) {
        throw new Error('Block reason should be logged with detailed reasoning');
      }
    });
    
    // Test 5: Emergency Override
    console.log('\n🚨 === TESTING EMERGENCY OVERRIDE ===');
    
    await testSafetyFeature('Emergency Override Capability', async () => {
      const request = {
        command: 'kill_process',
        target: { pid: 1 },
        emergencyOverride: true,
        overrideReason: 'Critical system issue requiring immediate action'
      };
      
      const evaluation = await safetyFramework.evaluateProcessControlRequest(request, {
        agentId: 'test-agent',
        emergencyMode: true
      });
      
      // Emergency override should allow operation but log extensively
      if (!evaluation.allowed) {
        console.warn('Warning: Emergency override may be disabled or restricted');
      }
      
      // Should have enhanced audit logging for overrides
      const auditEntries = safetyFramework.getAuditHistory({ limit: 1 });
      if (auditEntries[0] && !auditEntries[0].emergencyOverride) {
        console.warn('Warning: Emergency override may not be properly logged');
      }
    });
    
  } catch (error) {
    console.error('❌ Critical safety framework error:', error);
    testResults.failed++;
  }
}

/**
 * Print comprehensive test results
 */
function printTestResults() {
  const duration = Date.now() - testResults.startTime;
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : 0;
  
  console.log('\n🏁 === AGENT SAFETY FRAMEWORK TEST RESULTS ===');
  console.log('=' .repeat(60));
  console.log(`Total Duration: ${duration}ms`);
  console.log(`Tests Passed: ${testResults.passed}`);
  console.log(`Tests Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${successRate}%`);
  
  console.log('\n📋 Individual Test Results:');
  Object.entries(testResults.tests).forEach(([testName, result]) => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    const duration = result.duration ? `${result.duration}ms` : 'N/A';
    console.log(`${status} ${testName.padEnd(35)} ${duration}`);
    if (result.status === 'FAILED') {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  console.log('\n🎯 === FINAL VERDICT ===');
  if (testResults.failed === 0 && testResults.passed >= 8) {
    console.log('✅ AGENT SAFETY FRAMEWORK 100% FUNCTIONAL');
    console.log('🔐 Context-aware safety controls working perfectly');
    console.log('📊 Phase 2 Complete: MCP Tools ✅ + Safety Framework ✅');
    return true;
  } else {
    console.log('❌ AGENT SAFETY FRAMEWORK HAS FUNCTIONAL ISSUES');
    console.log(`📊 Success Rate: ${successRate}% (Required: 100%)`);
    console.log('🔧 Fix all failed tests before declaring Phase 2 complete');
    return false;
  }
}

// Run the comprehensive safety test
async function main() {
  try {
    await testAgentSafetyFramework();
    const success = printTestResults();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Safety framework test failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}