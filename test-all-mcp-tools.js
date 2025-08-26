#!/usr/bin/env node
/**
 * Comprehensive Manual Test for ALL 15 MCP Tools
 * 
 * CRITICAL: 100% functional implementation is the definition of done.
 * No automated test manipulation - actual working functionality only.
 * 
 * This test will validate all 15 MCP tools work exactly as specified:
 * 1. Process Discovery Tools (1-4)
 * 2. Process Management Tools (5-9)  
 * 3. Monitoring & Analysis Tools (10-13)
 * 4. Automated Maintenance Tools (14-15)
 */

const { 
  PROCESS_MANAGEMENT_TOOL_DEFINITIONS,
  PROCESS_MANAGEMENT_TOOL_HANDLERS,
  initializeProcessManagementServices
} = require('./src/mcp-process-management-tools');

const { AgentSafetyFramework } = require('./src/agent-safety-framework');

// Track test results
const testResults = {
  passed: 0,
  failed: 0,
  tools: {},
  startTime: Date.now()
};

/**
 * Test a single MCP tool
 */
async function testMCPTool(toolName, testParams, expectedBehavior) {
  console.log(`\n🔧 Testing ${toolName}...`);
  
  try {
    const handler = PROCESS_MANAGEMENT_TOOL_HANDLERS[toolName];
    if (!handler) {
      throw new Error(`No handler found for ${toolName}`);
    }
    
    const startTime = Date.now();
    const result = await handler(testParams);
    const duration = Date.now() - startTime;
    
    // Validate response structure
    if (typeof result !== 'object' || result === null) {
      throw new Error('Tool must return an object');
    }
    
    // Validate performance requirement: < 500ms
    if (duration >= 500) {
      throw new Error(`Performance requirement failed: ${duration}ms >= 500ms`);
    }
    
    // Validate success field
    if (result.success === undefined) {
      throw new Error('Tool result must include success field');
    }
    
    // Tool-specific validation
    if (expectedBehavior) {
      await expectedBehavior(result);
    }
    
    console.log(`✅ ${toolName} PASSED (${duration}ms)`);
    console.log(`   Success: ${result.success}`);
    if (result.data) {
      const dataType = Array.isArray(result.data) ? `Array[${result.data.length}]` : typeof result.data;
      console.log(`   Data: ${dataType}`);
    }
    
    testResults.passed++;
    testResults.tools[toolName] = { status: 'PASSED', duration, result };
    
  } catch (error) {
    console.log(`❌ ${toolName} FAILED: ${error.message}`);
    testResults.failed++;
    testResults.tools[toolName] = { status: 'FAILED', error: error.message };
    
    // Print stack trace for debugging
    console.log(`   Stack: ${error.stack}`);
  }
}

/**
 * Test all 15 MCP tools with realistic scenarios
 */
async function testAllMCPTools() {
  console.log('🚀 Starting Comprehensive MCP Tools Test');
  console.log('=' .repeat(60));
  console.log('Testing ALL 15 tools for 100% functional implementation');
  console.log('Definition of Done: Every tool must work exactly as specified\n');
  
  try {
    // Initialize services
    console.log('📋 Initializing MCP Process Management Services...');
    await initializeProcessManagementServices();
    console.log('✅ Services initialized\n');
    
    // Test 1: Process Discovery Tools (1-4)
    console.log('🔍 === TESTING PROCESS DISCOVERY TOOLS (1-4) ===');
    
    await testMCPTool('host.discover_processes', {
      techStacks: ['nodejs', 'python', 'docker'],
      includeCorrelation: true,
      forceRefresh: true
    }, (result) => {
      if (!result.discoveryResults) {
        throw new Error('Expected discoveryResults in response');
      }
      if (!result.processCategories) {
        throw new Error('Expected processCategories in response');
      }
    });
    
    await testMCPTool('host.scan_tech_stack', {
      techStack: 'nodejs',
      includeFrameworks: true
    }, (result) => {
      if (!result.summary || typeof result.summary.totalProcesses !== 'number') {
        throw new Error('Expected summary.totalProcesses in response');
      }
      if (!Array.isArray(result.processes)) {
        throw new Error('Expected processes array in response');
      }
    });
    
    await testMCPTool('host.container_discovery', {
      includeInactive: false,
      networkMode: 'all'
    }, (result) => {
      if (!result.data || !Array.isArray(result.data.containers)) {
        throw new Error('Expected containers array in response');
      }
    });
    
    await testMCPTool('host.process_tree_analysis', {
      maxDepth: 3,
      includeResources: true
    }, (result) => {
      if (!result.data || !result.data.processTree) {
        throw new Error('Expected processTree in response');
      }
    });
    
    // Test 2: Process Management Tools (5-9)
    console.log('\n⚙️ === TESTING PROCESS MANAGEMENT TOOLS (5-9) ===');
    
    await testMCPTool('host.kill_process', {
      pid: 99999, // Non-existent PID for safe testing
      signal: 'SIGTERM',
      validateWorkspace: true,
      reason: 'Test termination'
    }, (result) => {
      // Should fail gracefully for non-existent PID
      if (result.success && !result.data.processNotFound) {
        throw new Error('Expected process not found handling');
      }
    });
    
    await testMCPTool('host.kill_by_tech_stack', {
      techStack: 'nodejs',
      processCategory: 'rogue',
      maxProcesses: 1,
      reason: 'Test tech stack cleanup'
    }, (result) => {
      if (!result.data || typeof result.data.processesFound !== 'number') {
        throw new Error('Expected processesFound count');
      }
    });
    
    await testMCPTool('host.cleanup_rogue', {
      maxProcesses: 5,
      dryRun: true, // Safe testing mode
      reason: 'Test rogue cleanup'
    }, (result) => {
      if (!result.data || !Array.isArray(result.data.candidateProcesses)) {
        throw new Error('Expected candidateProcesses array');
      }
    });
    
    await testMCPTool('host.cleanup_by_project_type', {
      projectType: 'nodejs',
      workspacePath: '/tmp/nonexistent',
      dryRun: true,
      reason: 'Test project cleanup'
    }, (result) => {
      if (!result.data || typeof result.data.processesFound !== 'number') {
        throw new Error('Expected processesFound count');
      }
    });
    
    await testMCPTool('host.bulk_process_management', {
      operation: 'terminate',
      processIds: [],
      safetyCheck: true,
      reason: 'Test bulk operation'
    }, (result) => {
      if (!result.data || typeof result.data.operationsPlanned !== 'number') {
        throw new Error('Expected operationsPlanned count');
      }
    });
    
    // Test 3: Monitoring & Analysis Tools (10-13)
    console.log('\n📊 === TESTING MONITORING & ANALYSIS TOOLS (10-13) ===');
    
    await testMCPTool('host.monitor_port_ranges', {
      techStacks: ['nodejs', 'python'],
      includeSystemPorts: false
    }, (result) => {
      if (!result.data || !result.data.portRanges) {
        throw new Error('Expected portRanges in response');
      }
    });
    
    await testMCPTool('host.correlate_workspace', {
      workspacePath: process.cwd(),
      includeSubdirectories: true
    }, (result) => {
      if (!result.data || typeof result.data.correlatedProcesses !== 'number') {
        throw new Error('Expected correlatedProcesses count');
      }
    });
    
    await testMCPTool('host.workspace_health_check', {
      workspacePath: process.cwd()
    }, (result) => {
      if (!result.data || !result.data.healthStatus) {
        throw new Error('Expected healthStatus in response');
      }
    });
    
    await testMCPTool('host.system_process_report', {
      includeSystemProcesses: false,
      includePerformanceMetrics: true
    }, (result) => {
      if (!result.data || !result.data.processReport) {
        throw new Error('Expected processReport in response');
      }
    });
    
    // Test 4: Automated Maintenance Tools (14-15)
    console.log('\n🤖 === TESTING AUTOMATED MAINTENANCE TOOLS (14-15) ===');
    
    await testMCPTool('host.auto_cleanup_orphaned', {
      maxAge: 3600, // 1 hour
      dryRun: true,
      reason: 'Automated cleanup test'
    }, (result) => {
      if (!result.data || typeof result.data.orphanedFound !== 'number') {
        throw new Error('Expected orphanedFound count');
      }
    });
    
    await testMCPTool('host.process_safety_check', {
      pid: 1, // System init process - should be protected
      operation: 'terminate'
    }, (result) => {
      if (!result.data || !result.data.safetyAssessment) {
        throw new Error('Expected safetyAssessment in response');
      }
      if (result.data.safetyAssessment.recommendedAction === 'allow') {
        throw new Error('Safety check should block termination of init process');
      }
    });
    
  } catch (error) {
    console.error('❌ Critical test setup error:', error);
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
  
  console.log('\n🏁 === COMPREHENSIVE MCP TOOLS TEST RESULTS ===');
  console.log('=' .repeat(60));
  console.log(`Total Duration: ${duration}ms`);
  console.log(`Tests Passed: ${testResults.passed}`);
  console.log(`Tests Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Expected: 15 tools, Got: ${totalTests} tests`);
  
  console.log('\n📋 Individual Tool Results:');
  Object.entries(testResults.tools).forEach(([toolName, result]) => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    const duration = result.duration ? `${result.duration}ms` : 'N/A';
    console.log(`${status} ${toolName.padEnd(35)} ${duration}`);
    if (result.status === 'FAILED') {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  console.log('\n🎯 === FINAL VERDICT ===');
  if (testResults.failed === 0 && testResults.passed === 15) {
    console.log('✅ ALL 15 MCP TOOLS WORKING PERFECTLY - PHASE 2 READY');
    console.log('🎖️  100% FUNCTIONAL IMPLEMENTATION ACHIEVED');
    return true;
  } else {
    console.log('❌ MCP TOOLS HAVE FUNCTIONAL ISSUES - PHASE 2 NOT READY');
    console.log(`📊 Success Rate: ${successRate}% (Required: 100%)`);
    console.log('🔧 Fix all failed tools before declaring Phase 2 complete');
    return false;
  }
}

// Run the comprehensive test
async function main() {
  try {
    await testAllMCPTools();
    const success = printTestResults();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}