#!/bin/bash
# Simple startup script that actually works
# Run this script on boot to start both servers

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Starting PlopDock Production Servers"
echo "Project directory: $PROJECT_DIR"

# Kill any existing processes on these ports
echo "🧹 Cleaning up any existing processes..."
lsof -ti:2602 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start API Bridge
echo "🌐 Starting API Bridge..."
cd "$PROJECT_DIR"
nohup node src/api-bridge.js > /tmp/plopdock-api.log 2>&1 &
API_PID=$!
echo "API Bridge started (PID: $API_PID)"

# Wait for API to be ready
sleep 2

# Start Dashboard
echo "📊 Starting Dashboard..."
cd "$PROJECT_DIR/dashboard"
nohup npm run dev > /tmp/plopdock-dashboard.log 2>&1 &
DASH_PID=$!
echo "Dashboard started (PID: $DASH_PID)"

# Save PIDs for stopping later
echo $API_PID > /tmp/plopdock-api.pid
echo $DASH_PID > /tmp/plopdock-dashboard.pid

echo ""
echo "✅ Both servers started!"
echo "   API Bridge: http://localhost:2602/api/health"
echo "   Dashboard: http://localhost:5173/dashboard"
echo ""
echo "Logs:"
echo "   API: tail -f /tmp/plopdock-api.log"
echo "   Dashboard: tail -f /tmp/plopdock-dashboard.log"
echo ""
echo "To stop: ./scripts/stop-production-servers.sh"