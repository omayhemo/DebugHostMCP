#!/bin/bash

# THIS SCRIPT MUST BE RUN FROM A TERMINAL OUTSIDE CLAUDE
# DO NOT RUN THIS FROM CLAUDE - RUN IT FROM A SEPARATE TERMINAL

echo "=========================================="
echo "MCP DEBUG HOST - PRODUCTION STARTUP"
echo "=========================================="
echo ""
echo "IMPORTANT: This script must be run from a terminal OUTSIDE Claude"
echo ""

# Check if running from Claude
if [ -n "$CLAUDE_SESSION" ] || [ -n "$CLAUDE_SHELL" ]; then
    echo "ERROR: This script is being run from within Claude!"
    echo "Please open a NEW terminal window (outside Claude) and run this script there."
    exit 1
fi

# Kill any existing services
echo "Stopping any existing services..."
pkill -f "mcp-server.js" 2>/dev/null
pkill -f "preview.*2602" 2>/dev/null
pkill -f "simple-backend" 2>/dev/null
sleep 2

# Navigate to project directory
cd /mnt/c/Code/MCPServers/DebugHostMCP

# Start the MCP HTTP server on port 2601
echo "Starting MCP HTTP Server on port 2601..."
nohup node src/mcp-server.js > /tmp/mcp-server.log 2>&1 &
MCP_PID=$!
echo "  MCP Server PID: $MCP_PID"

# Start the dashboard on port 2602
echo "Starting Dashboard on port 2602..."
cd dashboard
nohup npm run preview -- --port 2602 --host 127.0.0.1 > /tmp/mcp-dashboard.log 2>&1 &
DASH_PID=$!
echo "  Dashboard PID: $DASH_PID"

# Wait for services to start
echo ""
echo "Waiting for services to start..."
sleep 8

# Verify services
echo ""
echo "Service Verification:"
echo "====================="

# Check MCP server
if curl -s http://localhost:2601/health > /dev/null 2>&1; then
    echo "✅ MCP Server: Running on http://localhost:2601"
else
    echo "❌ MCP Server: NOT RUNNING - Check /tmp/mcp-server.log"
fi

# Check dashboard
if curl -s http://localhost:2602 > /dev/null 2>&1; then
    echo "✅ Dashboard: Running on http://localhost:2602"
else
    echo "❌ Dashboard: NOT RUNNING - Check /tmp/mcp-dashboard.log"
fi

echo ""
echo "=========================================="
echo "Services are now running persistently!"
echo ""
echo "MCP Server: http://localhost:2601"
echo "Dashboard: http://localhost:2602"
echo ""
echo "To stop services later, run:"
echo "  pkill -f 'mcp-server.js' && pkill -f 'preview.*2602'"
echo ""
echo "Log files:"
echo "  /tmp/mcp-server.log"
echo "  /tmp/mcp-dashboard.log"
echo "=========================================="