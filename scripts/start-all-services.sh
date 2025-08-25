#!/bin/bash

# Start all MCP Debug Host services
# This script ensures all three components are running

echo "Starting MCP Debug Host Services..."
echo "=================================="

# Kill any existing instances
echo "Stopping any existing services..."
pkill -f "backend-server.js" 2>/dev/null
pkill -f "port 2602" 2>/dev/null
sleep 2

# Start backend server on port 2601
echo "Starting backend server on port 2601..."
cd /mnt/c/Code/MCPServers/DebugHostMCP
nohup node src/backend-server.js > /tmp/mcp-backend.log 2>&1 &
BACKEND_PID=$!

# Start dashboard on port 2602
echo "Starting dashboard on port 2602..."
cd /mnt/c/Code/MCPServers/DebugHostMCP/dashboard
nohup npm run preview -- --port 2602 --host 127.0.0.1 > /tmp/mcp-dashboard.log 2>&1 &
DASHBOARD_PID=$!

# Wait for services to start
sleep 3

# Check status
echo ""
echo "Service Status:"
echo "---------------"

# Check backend
if lsof -i :2601 | grep -q LISTEN; then
    echo "✅ Backend server: Running on http://localhost:2601 (PID: $BACKEND_PID)"
else
    echo "❌ Backend server: Failed to start"
    echo "   Check logs: tail -f /tmp/mcp-backend.log"
fi

# Check dashboard
if lsof -i :2602 | grep -q LISTEN; then
    echo "✅ Dashboard: Running on http://localhost:2602 (PID: $DASHBOARD_PID)"
else
    echo "❌ Dashboard: Failed to start"
    echo "   Check logs: tail -f /tmp/mcp-dashboard.log"
fi

# Check MCP server (stdio - no port)
echo "✅ MCP server: Auto-starts with Claude (stdio protocol)"

echo ""
echo "Summary:"
echo "--------"
echo "1. MCP Server: Automatically starts with each Claude instance (stdio)"
echo "2. Backend API: http://localhost:2601/health"
echo "3. Dashboard UI: http://localhost:2602"
echo ""
echo "Log files:"
echo "- Backend: /tmp/mcp-backend.log"
echo "- Dashboard: /tmp/mcp-dashboard.log"
echo ""
echo "To stop services: pkill -f 'backend-server.js' && pkill -f 'port 2602'"