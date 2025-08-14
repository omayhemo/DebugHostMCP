#!/bin/bash
# Start APM Debug Host Dashboard as a standalone service (not MCP)
# This runs the dashboard separately from the MCP interface

echo "Starting APM Debug Host Dashboard (standalone)..."

# Kill any existing dashboard instances
pkill -f "apm-debug-dashboard-standalone" 2>/dev/null
sleep 1

# Change to the correct directory
cd /home/dougw/.apm-debug-host

# Start the dashboard server directly
PORT=8080 node -e "
process.title = 'apm-debug-dashboard-standalone';

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
      filename: path.join(process.env.HOME, '.apm-debug-host', 'dashboard-standalone.log') 
    }),
    new winston.transports.Console()
  ]
});

const processManager = new ProcessManager(logger);
const logStore = new LogStore(logger);
const dashboardServer = new DashboardServer(processManager, logStore, logger);

dashboardServer.start(8080).then(() => {
  console.log('✅ Dashboard running at http://localhost:8080');
  console.log('This dashboard will monitor all MCP server activity');
}).catch(console.error);

// Keep running
setInterval(() => {}, 1000);
" &

echo "Dashboard PID: $!"
echo ""
echo "Dashboard is now running at: http://localhost:8080"
echo "To stop: pkill -f 'apm-debug-dashboard-standalone'"