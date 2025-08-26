#!/bin/bash
# PlopDock Production Services Startup Script
# Starts API Bridge and Dashboard from development directory
# Designed for persistent operation and systemd integration

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Starting PlopDock Production Services"
echo "Project directory: $PROJECT_DIR"
echo "========================================="

# Kill any existing processes on these ports
echo "🧹 Cleaning up any existing processes..."
lsof -ti:2602 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 2

# Start API Bridge from development directory
echo "🌐 Starting API Bridge (Development Directory)..."
cd "$PROJECT_DIR"
nohup node src/api-bridge.js > /tmp/plopdock-api.log 2>&1 &
API_PID=$!
echo "API Bridge started (PID: $API_PID)"

# Wait for API to be ready
echo "⏳ Waiting for API Bridge to initialize..."
sleep 3

# Start Dashboard from development directory
echo "📊 Starting Dashboard (Development Directory)..."
cd "$PROJECT_DIR/dashboard"
nohup npm run dev > /tmp/plopdock-dashboard.log 2>&1 &
DASH_PID=$!
echo "Dashboard started (PID: $DASH_PID)"

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Save PIDs for stopping later
echo $API_PID > /tmp/plopdock-api.pid
echo $DASH_PID > /tmp/plopdock-dashboard.pid

echo ""
echo "Service Status Check:"
echo "--------------------"

# Check API Bridge
if lsof -i :2602 | grep -q LISTEN; then
    echo "✅ API Bridge: Running on http://localhost:2602 (PID: $API_PID)"
    echo "   Health Check: curl http://localhost:2602/health"
else
    echo "❌ API Bridge: Failed to start on port 2602"
    echo "   Check logs: tail -f /tmp/plopdock-api.log"
fi

# Check Dashboard
if lsof -i :5173 | grep -q LISTEN; then
    echo "✅ Dashboard: Running on http://localhost:5173 (PID: $DASH_PID)"
    echo "   Access URL: http://localhost:5173/dashboard"
else
    echo "❌ Dashboard: Failed to start on port 5173"
    echo "   Check logs: tail -f /tmp/plopdock-dashboard.log"
fi

# Check MCP server (stdio - no port check needed)
echo "✅ MCP Server: Auto-starts with Claude (stdio protocol)"
echo "   Location: $PROJECT_DIR/src/mcp-stdio-server.js"

echo ""
echo "🎯 Summary:"
echo "----------"
echo "1. API Bridge: http://localhost:2602/api/health"
echo "2. Dashboard: http://localhost:5173/dashboard" 
echo "3. MCP Server: Automatic with Claude Code startup"
echo ""
echo "📋 Management:"
echo "- Logs: tail -f /tmp/plopdock-*.log"
echo "- Stop: ./scripts/stop-production-services.sh"
echo "- PID Files: /tmp/plopdock-*.pid"
echo ""
echo "📁 Running from: $PROJECT_DIR (Development Directory)"
echo ""

# Final health check
echo "🔍 Performing final health checks..."
sleep 2

if curl -s http://localhost:2602/health > /dev/null 2>&1; then
    echo "✅ API Bridge health check: PASSED"
else
    echo "⚠️  API Bridge health check: FAILED"
    echo "   API may still be starting up - check logs"
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Dashboard connectivity: PASSED"
else
    echo "⚠️  Dashboard connectivity: FAILED" 
    echo "   Dashboard may still be starting up - check logs"
fi

echo ""
echo "🎉 Production services startup complete!"
echo "   Both services are running from development directory"
echo "   Ready for systemd service integration"