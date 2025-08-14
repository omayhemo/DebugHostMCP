# Global APM Debug Host Setup

## Overview
This setup allows APM Debug Host to run as a single global instance that all Claude Code projects can use, avoiding port conflicts.

## Configuration Files

### 1. Global MCP Configuration
Location: `~/.config/claude/mcp.json`
- This file tells Claude Code about globally available MCP servers
- APM Debug Host is configured here to be available to all projects

### 2. Project-Specific Configuration
Location: `[project]/.mcp.json`
- Should NOT include apm-debug-host anymore
- Only contains project-specific MCP servers

## How It Works

1. **Claude Code starts**: Reads both global (`~/.config/claude/mcp.json`) and project (`.mcp.json`) configurations
2. **MCP servers launch**: Global servers (like apm-debug-host) start once, project servers start per project
3. **Dashboard access**: Always available at http://localhost:8080 regardless of which project you're in

## Usage Options

### Option 1: Let Claude Code Manage It (Recommended)
Simply restart Claude Code after setting up the global configuration:
```bash
# Close all Claude Code sessions
# Start Claude Code in any project
# The global apm-debug-host will start automatically
```

### Option 2: Manual Start (For Testing)
```bash
# Start manually
~/.apm-debug-host/start-global.sh

# Stop manually
pkill -f 'apm-debug-host/src/index.js'
```

### Option 3: System Service (Advanced)
Create a systemd service for automatic startup:
```bash
# Create service file
sudo nano /etc/systemd/system/apm-debug-host.service

# Add content:
[Unit]
Description=APM Debug Host Dashboard
After=network.target

[Service]
Type=simple
User=dougw
WorkingDirectory=/home/dougw/.apm-debug-host
ExecStart=/usr/bin/node /home/dougw/.apm-debug-host/src/index.js
Environment="PORT=8080"
Environment="CONFIG_PATH=/home/dougw/.apm-debug-host/config.json"
Restart=always

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable apm-debug-host
sudo systemctl start apm-debug-host
```

## Accessing the Dashboard

Once running, access the dashboard at: **http://localhost:8080**

The dashboard will show development servers from ALL projects using the MCP Debug Host tools.

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 8080
lsof -i :8080

# Kill existing apm-debug-host instances
pkill -f 'apm-debug-host/src/index.js'
```

### Dashboard Not Connecting
1. Check if server is running: `curl http://localhost:8080/api/health`
2. Check logs: `tail -f ~/.apm-debug-host/server.log`
3. Restart Claude Code

### Multiple Projects
- Each project will share the same dashboard
- All development servers will appear in the same interface
- Use session names to identify which server belongs to which project

## Benefits of Global Setup

1. **No Port Conflicts**: Single instance serves all projects
2. **Persistent Dashboard**: Keeps running between project switches
3. **Centralized Monitoring**: See all development servers in one place
4. **Resource Efficient**: One process instead of multiple
5. **Simplified Configuration**: Configure once, use everywhere

## Reverting to Project-Specific

If you want to go back to project-specific configurations:
1. Delete `~/.config/claude/mcp.json`
2. Add apm-debug-host back to each project's `.mcp.json`
3. Restart Claude Code