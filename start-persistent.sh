#!/bin/bash

# Start persistent services that run OUTSIDE Claude
# Run this from a separate terminal, NOT from Claude

echo "Starting PlopDock Persistent Services"
echo "========================================="
echo "🚢 Just plop it down and dock it!"
echo ""

# Kill any existing services
echo "Stopping existing services..."
pkill -f "src/mcp-server.js" 2>/dev/null
pkill -f "preview.*2602" 2>/dev/null
sleep 2

# Start backend server on port 2601
echo "Starting backend server on port 2601..."
cd /mnt/c/Code/MCPServers/DebugHostMCP
nohup node src/mcp-server.js > /tmp/mcp-backend.log 2>&1 &
BACKEND_PID=$!
echo "  Started with PID: $BACKEND_PID"

# Start dashboard on port 2602
echo "Starting dashboard on port 2602..."
cd /mnt/c/Code/MCPServers/DebugHostMCP/dashboard
nohup npm run preview -- --port 2602 --host 127.0.0.1 > /tmp/mcp-dashboard.log 2>&1 &
DASHBOARD_PID=$!
echo "  Started with PID: $DASHBOARD_PID"

# Wait for services to start
sleep 5

# Check status
echo ""
echo "Service Status:"
echo "==============="

# Check backend
if curl -s http://localhost:2601/health > /dev/null; then
    echo "✅ Backend server: Running on http://localhost:2601"
    echo "   Health: $(curl -s http://localhost:2601/health | jq -r .status)"
else
    echo "❌ Backend server: Failed to start"
    echo "   Check logs: tail -f /tmp/mcp-backend.log"
fi

# Check dashboard
if curl -s http://localhost:2602 > /dev/null; then
    echo "✅ Dashboard: Running on http://localhost:2602"
else
    echo "❌ Dashboard: Failed to start"
    echo "   Check logs: tail -f /tmp/mcp-dashboard.log"
fi

echo ""
echo "✅ MCP Server: Auto-starts with each Claude instance (stdio protocol)"
echo ""
echo "Summary:"
echo "========"
echo "1. MCP Server (stdio): Auto-starts with Claude - no action needed"
echo "2. Backend API: http://localhost:2601"
echo "3. Dashboard UI: http://localhost:2602"
echo ""
echo "These services are now running OUTSIDE Claude and will persist."
echo ""
echo "To stop services later:"
echo "  pkill -f 'src/mcp-server.js' && pkill -f 'preview.*2602'"
echo ""
echo "Log files:"
echo "  Backend: tail -f /tmp/mcp-backend.log"
echo "  Dashboard: tail -f /tmp/mcp-dashboard.log"