#!/bin/bash
# PlopDock Production Services Stop Script

set -e

echo "🛑 Stopping PlopDock Production Services"
echo "========================================"

# Read PIDs if they exist
API_PID=""
DASH_PID=""

if [ -f "/tmp/plopdock-api.pid" ]; then
    API_PID=$(cat /tmp/plopdock-api.pid 2>/dev/null || echo "")
fi

if [ -f "/tmp/plopdock-dashboard.pid" ]; then
    DASH_PID=$(cat /tmp/plopdock-dashboard.pid 2>/dev/null || echo "")
fi

# Stop by PID first (more graceful)
if [ -n "$API_PID" ]; then
    echo "🌐 Stopping API Bridge (PID: $API_PID)..."
    kill "$API_PID" 2>/dev/null || echo "   Process already stopped"
    rm -f /tmp/plopdock-api.pid
fi

if [ -n "$DASH_PID" ]; then
    echo "📊 Stopping Dashboard (PID: $DASH_PID)..."
    kill "$DASH_PID" 2>/dev/null || echo "   Process already stopped"
    rm -f /tmp/plopdock-dashboard.pid
fi

# Wait for graceful shutdown
sleep 2

# Force kill by port if still running
echo "🧹 Force stopping any remaining processes..."
lsof -ti:2602 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Clean up log files (optional)
echo "📝 Cleaning up log files..."
rm -f /tmp/plopdock-api.log
rm -f /tmp/plopdock-dashboard.log

echo ""
echo "✅ All PlopDock services stopped"
echo "   MCP Server will stop automatically when Claude Code exits"
echo ""