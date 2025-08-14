#!/bin/bash
# Run APM Debug Host as a standalone service (not through Claude Code)

echo "Starting APM Debug Host as standalone service..."

# Kill any existing instances
pkill -f "apm-debug-host/src/index.js" 2>/dev/null
sleep 1

# Start the dashboard server directly (not as MCP)
cd /home/dougw/.apm-debug-host

# Run the dashboard server only (not the MCP interface)
PORT=8080 node -e "
const DashboardServer = require('./src/dashboard/server');
const ProcessManager = require('./src/process-manager');
const LogStore = require('./src/log-store');
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: path.join(process.env.HOME, '.apm-debug-host', 'dashboard.log') 
    }),
    new winston.transports.Console()
  ]
});

const processManager = new ProcessManager(logger);
const logStore = new LogStore(logger);
const dashboardServer = new DashboardServer(processManager, logStore, logger);

dashboardServer.start(8080).then(() => {
  console.log('Dashboard running at http://localhost:8080');
  console.log('This dashboard will receive data from all Claude Code MCP instances');
}).catch(console.error);

// Keep running
process.stdin.resume();
" &

echo "Dashboard started at http://localhost:8080"
echo "PID: $!"
echo ""
echo "To stop: pkill -f 'apm-debug-host'"