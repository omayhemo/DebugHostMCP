#!/bin/bash
# Global APM Debug Host Launcher
# This script starts the apm-debug-host as a global service

echo "Starting Global APM Debug Host on port 8080..."

# Kill any existing instances
pkill -f "apm-debug-host/src/index.js" 2>/dev/null

# Set environment variables
export PORT=8080
export CONFIG_PATH=/home/dougw/.apm-debug-host/config.json
export DASHBOARD_ENABLED=true
export NODE_ENV=production

# Start the server
node /home/dougw/.apm-debug-host/src/index.js &

echo "APM Debug Host started on http://localhost:8080"
echo "Process ID: $!"
echo ""
echo "To stop: pkill -f 'apm-debug-host/src/index.js'"