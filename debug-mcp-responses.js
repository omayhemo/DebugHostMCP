#!/usr/bin/env node
/**
 * Debug MCP Tool Response Formats
 * Quick test to see what each tool actually returns
 */

const { 
  PROCESS_MANAGEMENT_TOOL_HANDLERS,
  initializeProcessManagementServices
} = require('./src/mcp-process-management-tools');

async function debugToolResponses() {
  console.log('🔍 Debugging MCP Tool Response Formats');
  
  await initializeProcessManagementServices();
  
  const toolsToTest = [
    'host.discover_processes',
    'host.scan_tech_stack', 
    'host.container_discovery',
    'host.system_process_report'
  ];
  
  for (const toolName of toolsToTest) {
    console.log(`\n🔧 Testing ${toolName}:`);
    try {
      const handler = PROCESS_MANAGEMENT_TOOL_HANDLERS[toolName];
      const result = await handler({
        techStack: 'nodejs',
        techStacks: ['nodejs'],
        includeInactive: false,
        networkMode: 'all'
      });
      
      console.log('✅ Response Keys:', Object.keys(result));
      console.log('   Type:', typeof result);
      if (result.data) {
        console.log('   Data Keys:', Object.keys(result.data));
      }
      if (result.summary) {
        console.log('   Summary Keys:', Object.keys(result.summary));
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

debugToolResponses().catch(console.error);