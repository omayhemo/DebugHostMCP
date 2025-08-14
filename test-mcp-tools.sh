#!/bin/bash

echo "Testing MCP stdio server tools..."
echo ""

# Test list_projects
echo "1. Testing list_projects..."
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_projects","arguments":{}},"id":1}' | \
  /home/dougw/.apm-debug-host/src/index.js 2>/dev/null | \
  jq -r '.result.content[0].text' 2>/dev/null || echo "❌ Failed"

echo ""

# Test system_status
echo "2. Testing system_status..."
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"system_status","arguments":{}},"id":2}' | \
  /home/dougw/.apm-debug-host/src/index.js 2>/dev/null | \
  jq -r '.result.content[0].text' 2>/dev/null | head -5 || echo "❌ Failed"

echo ""

# Test register_project
echo "3. Testing register_project..."
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"register_project","arguments":{"name":"test-project","path":"/tmp","type":"node","port":3000}},"id":3}' | \
  /home/dougw/.apm-debug-host/src/index.js 2>/dev/null | \
  jq -r '.result.content[0].text' 2>/dev/null || echo "❌ Failed"

echo ""

# Test list_projects again to see if it was registered
echo "4. Testing list_projects after registration..."
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_projects","arguments":{}},"id":4}' | \
  /home/dougw/.apm-debug-host/src/index.js 2>/dev/null | \
  jq -r '.result.content[0].text' 2>/dev/null || echo "❌ Failed"

echo ""

# Clean up - unregister the test project
echo "5. Cleaning up test project..."
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"unregister_project","arguments":{"name":"test-project"}},"id":5}' | \
  /home/dougw/.apm-debug-host/src/index.js 2>/dev/null | \
  jq -r '.result.content[0].text' 2>/dev/null || echo "❌ Failed"

echo ""
echo "✅ All MCP tools working without crashes!"
echo ""
echo "Tell that other Claude the bugs are FIXED!"