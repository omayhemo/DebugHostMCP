# Installation Guide

This comprehensive installation guide covers all installation methods, system requirements, and post-installation configuration for the MCP Debug Host Server.

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Linux (Ubuntu 18+), macOS (10.15+), Windows (WSL2)
- **Node.js**: v18.0.0 or higher
- **RAM**: 512MB available memory
- **Disk Space**: 100MB for installation + logs
- **Network**: Port 8080 available (configurable)

### Recommended Requirements
- **Node.js**: v20.0.0 or higher
- **RAM**: 1GB+ available memory
- **CPU**: 2+ cores for optimal performance
- **Disk Space**: 1GB for logs and sessions

### Environment Dependencies
```bash
# Check Node.js version
node --version  # v18.0.0+

# Check npm version  
npm --version   # 8.0.0+

# Verify system architecture
uname -m        # x64, arm64 supported
```

## 🚀 Installation Methods

### Method 1: APM Framework Installer (Recommended)

The easiest and most reliable installation method:

```bash
# Step 1: Clone or navigate to APM Framework
cd /path/to/agentic-persona-mapping

# Step 2: Run the complete installer
./installer/install.sh

# Step 3: Choose MCP Debug Host when prompted
# Install MCP Debug Host Server? [Y/n]: Y
# Configure as system service? [Y/n]: Y  
# Start dashboard automatically? [Y/n]: Y
```

**Installation Process:**
1. 📦 Downloads Node.js dependencies
2. ⚙️ Configures MCP integration
3. 🏗️ Sets up directory structure
4. 🚀 Installs system service
5. 🌐 Starts web dashboard
6. ✅ Validates installation

### Method 2: Standalone Installation

For installing just the MCP Debug Host:

```bash
# Step 1: Navigate to MCP host directory
cd installer/mcp-host

# Step 2: Make installer executable
chmod +x install-mcp-host.sh

# Step 3: Run installation
./install-mcp-host.sh

# Step 4: Follow interactive prompts
```

### Method 3: Manual Installation

For developers who want full control:

```bash
# Step 1: Create installation directory
mkdir ~/.apm-debug-host
cd ~/.apm-debug-host

# Step 2: Copy source files
cp -r /path/to/agentic-persona-mapping/installer/mcp-host/* .

# Step 3: Install dependencies
npm install

# Step 4: Configure environment
cp .env.example .env
nano .env  # Edit configuration

# Step 5: Set up MCP integration
echo '{
  "mcpServers": {
    "apm-debug-host": {
      "command": "node",
      "args": ["'$HOME'/.apm-debug-host/src/index.js"],
      "env": {}
    }
  }
}' > ~/.mcp.json

# Step 6: Start server
npm start
```

### Method 4: Development Installation

For contributors and developers:

```bash
# Step 1: Clone repository
git clone https://github.com/your-org/agentic-persona-mapping.git
cd agentic-persona-mapping/installer/mcp-host

# Step 2: Install development dependencies
npm install --dev

# Step 3: Set up development environment
cp .env.example .env.development
npm run setup:dev

# Step 4: Start in development mode
npm run dev
```

## ⚙️ Configuration

### Environment Configuration

Edit `~/.apm-debug-host/.env`:

```env
# =============================================================================
# MCP Debug Host Server Configuration
# =============================================================================

# Server Configuration
PORT=8080                           # Dashboard web server port
HOST=0.0.0.0                       # Bind address (0.0.0.0 for all interfaces)
NODE_ENV=production                 # Environment (development, production)

# Logging Configuration  
LOG_LEVEL=info                      # Logging level (debug, info, warn, error)
LOG_MAX_FILES=10                    # Maximum log files to keep
LOG_MAX_SIZE=10mb                   # Maximum size per log file

# Process Management
MAX_CONCURRENT_PROCESSES=10         # Maximum simultaneous processes
PROCESS_TIMEOUT=30000              # Process startup timeout (ms)
RESTART_DELAY=2000                 # Delay between restart attempts (ms)

# Dashboard Configuration
DASHBOARD_REFRESH_RATE=1000        # Real-time update interval (ms)
MAX_LOG_LINES=1000                 # Maximum log lines to display
ENABLE_LOG_SEARCH=true             # Enable log search functionality

# Security Configuration
ENABLE_CORS=true                   # Enable CORS for dashboard
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
API_RATE_LIMIT=100                 # API requests per minute per IP

# Framework Detection
AUTO_DETECT_FRAMEWORKS=true        # Enable automatic framework detection
DETECTION_TIMEOUT=5000             # Framework detection timeout (ms)
CUSTOM_ADAPTERS_DIR=./adapters     # Directory for custom adapters

# Performance Optimization
ENABLE_PROCESS_MONITORING=true     # Monitor process performance
MEMORY_LIMIT=1024                  # Memory limit per process (MB)
CPU_LIMIT=80                       # CPU usage limit per process (%)
```

### MCP Integration Setup

The installer automatically configures MCP integration. Manual setup:

```json
// ~/.mcp.json
{
  "mcpServers": {
    "apm-debug-host": {
      "command": "node",
      "args": ["/home/user/.apm-debug-host/src/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### System Service Configuration

#### Linux (systemd)

Service file: `/etc/systemd/system/apm-debug-host.service`

```ini
[Unit]
Description=APM Debug Host MCP Server
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
User=apm-user
ExecStart=/usr/bin/node /home/apm-user/.apm-debug-host/src/index.js
WorkingDirectory=/home/apm-user/.apm-debug-host
Environment=NODE_ENV=production
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
```

**Service Management:**
```bash
# Enable and start service
sudo systemctl enable apm-debug-host
sudo systemctl start apm-debug-host

# Check status
sudo systemctl status apm-debug-host

# View logs
sudo journalctl -u apm-debug-host -f

# Restart service
sudo systemctl restart apm-debug-host
```

#### macOS (launchd)

Service file: `~/Library/LaunchAgents/com.apm.debug-host.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.apm.debug-host</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/username/.apm-debug-host/src/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/username/.apm-debug-host</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>8080</string>
    </dict>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/username/.apm-debug-host/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/username/.apm-debug-host/logs/stderr.log</string>
</dict>
</plist>
```

**Service Management:**
```bash
# Load and start service
launchctl load ~/Library/LaunchAgents/com.apm.debug-host.plist

# Check status
launchctl list | grep apm-debug-host

# View logs
tail -f ~/.apm-debug-host/logs/stdout.log

# Restart service
launchctl unload ~/Library/LaunchAgents/com.apm.debug-host.plist
launchctl load ~/Library/LaunchAgents/com.apm.debug-host.plist
```

## 🔒 Security Configuration

### Firewall Settings

**Linux (ufw):**
```bash
# Allow dashboard access
sudo ufw allow 8080/tcp

# Restrict to local network only
sudo ufw allow from 192.168.0.0/16 to any port 8080
```

**macOS:**
```bash
# Add firewall rule (System Preferences > Security & Privacy > Firewall)
# Or use pfctl for advanced configuration
```

### Access Control

Configure access restrictions in `.env`:

```env
# Bind to localhost only (more secure)
HOST=127.0.0.1

# Disable CORS (for local use only)
ENABLE_CORS=false

# Set allowed origins
ALLOWED_ORIGINS=http://localhost:3000

# Enable API rate limiting
API_RATE_LIMIT=50
```

## ✅ Installation Verification

### 1. Service Status Check

```bash
# Linux
sudo systemctl status apm-debug-host
# Should show: Active: active (running)

# macOS  
launchctl list | grep apm-debug-host
# Should show the service entry

# Manual check
ps aux | grep apm-debug-host
# Should show running process
```

### 2. Network Connectivity

```bash
# Test local connection
curl http://localhost:8080
# Should return HTML response

# Test API endpoint
curl http://localhost:8080/api/health
# Should return: {"status": "ok", "uptime": "..."}

# Check if port is listening
netstat -tlnp | grep 8080
# Should show listening socket
```

### 3. MCP Integration Test

```bash
# Test MCP server directly
echo '{}' | node ~/.apm-debug-host/src/index.js
# Should show MCP handshake response

# Verify MCP configuration
cat ~/.mcp.json | jq .mcpServers
# Should include apm-debug-host entry

# Test with Claude Code (if available)
claude mcp list
# Should show apm-debug-host server
```

### 4. Dashboard Functionality

Open http://localhost:8080 and verify:
- ✅ Dashboard loads without errors
- ✅ "No active sessions" message appears
- ✅ Status indicator shows green
- ✅ Console shows no JavaScript errors
- ✅ WebSocket connection establishes

### 5. Log File Verification

```bash
# Check log directory exists
ls -la ~/.apm-debug-host/logs/

# Verify server logs
tail ~/.apm-debug-host/logs/server.log
# Should show startup messages

# Check permissions
ls -la ~/.apm-debug-host/
# All files should be readable/writable by user
```

## 🔧 Post-Installation Steps

### 1. Configure Framework Adapters

Add custom framework support:

```bash
# Create custom adapter
mkdir ~/.apm-debug-host/src/adapters/custom
```

Edit `~/.apm-debug-host/src/adapters/custom/my-framework.js`:

```javascript
const BaseAdapter = require('../base-adapter');

class MyFrameworkAdapter extends BaseAdapter {
  canHandle(projectPath) {
    return this.fileExists(projectPath, 'my-framework.config.js');
  }

  detect(projectPath) {
    return {
      framework: 'My Framework',
      version: this.getPackageVersion(projectPath, 'my-framework'),
      startCommand: 'my-framework dev',
      defaultPort: 4000
    };
  }
}

module.exports = MyFrameworkAdapter;
```

### 2. Set Up Log Rotation

Configure automatic log cleanup:

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/apm-debug-host
```

```bash
/home/*/.apm-debug-host/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    copytruncate
    create 644 user user
}
```

### 3. Configure Monitoring

Set up health monitoring:

```bash
# Create health check script
cat > ~/.apm-debug-host/health-check.sh << 'EOF'
#!/bin/bash
HEALTH=$(curl -s http://localhost:8080/api/health | jq -r '.status')
if [ "$HEALTH" != "ok" ]; then
    echo "MCP Debug Host is unhealthy"
    exit 1
fi
echo "MCP Debug Host is healthy"
EOF

chmod +x ~/.apm-debug-host/health-check.sh

# Add to crontab for regular checks
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/.apm-debug-host/health-check.sh") | crontab -
```

## 🚨 Troubleshooting Common Issues

### Installation Fails

**Permission denied errors:**
```bash
# Fix permissions
sudo chown -R $USER:$USER ~/.apm-debug-host
chmod -R 755 ~/.apm-debug-host
```

**Node.js version too old:**
```bash
# Update Node.js using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Port already in use:**
```bash
# Find process using port
lsof -i :8080

# Kill conflicting process
sudo kill -9 <PID>

# Or change port in .env
echo "PORT=8081" >> ~/.apm-debug-host/.env
```

### Service Won't Start

**Check service logs:**
```bash
# Linux
sudo journalctl -u apm-debug-host -f

# macOS
tail -f ~/.apm-debug-host/logs/stderr.log
```

**Common fixes:**
```bash
# Restart Node.js service
sudo systemctl restart apm-debug-host

# Check file permissions
ls -la ~/.apm-debug-host/src/index.js

# Verify dependencies
cd ~/.apm-debug-host && npm install
```

### Dashboard Not Accessible

**Network troubleshooting:**
```bash
# Test local access
curl http://localhost:8080

# Check firewall
sudo ufw status

# Verify process is running
ps aux | grep node
```

### MCP Integration Issues

**Verify MCP configuration:**
```bash
# Check MCP config syntax
cat ~/.mcp.json | jq .

# Test MCP server manually
echo '{}' | node ~/.apm-debug-host/src/index.js

# Check Claude Code integration
claude mcp status
```

## 🔄 Upgrading

### Automatic Upgrade

```bash
# Run installer again
cd /path/to/agentic-persona-mapping
./installer/install.sh

# Choose upgrade when prompted
# Upgrade existing installation? [Y/n]: Y
```

### Manual Upgrade

```bash
# Backup current installation
cp -r ~/.apm-debug-host ~/.apm-debug-host.backup

# Pull latest changes
cd /path/to/agentic-persona-mapping
git pull origin main

# Copy new files
cp -r installer/mcp-host/* ~/.apm-debug-host/

# Update dependencies
cd ~/.apm-debug-host
npm install

# Restart service
sudo systemctl restart apm-debug-host
```

## 🗑️ Uninstallation

### Complete Removal

```bash
# Stop service
sudo systemctl stop apm-debug-host
sudo systemctl disable apm-debug-host

# Remove service file
sudo rm /etc/systemd/system/apm-debug-host.service

# Remove installation directory
rm -rf ~/.apm-debug-host

# Remove MCP configuration
jq 'del(.mcpServers["apm-debug-host"])' ~/.mcp.json > ~/.mcp.json.tmp
mv ~/.mcp.json.tmp ~/.mcp.json

# Remove logs
rm -rf ~/.apm-debug-host-logs
```

### Partial Removal (Keep Data)

```bash
# Stop service only
sudo systemctl stop apm-debug-host
sudo systemctl disable apm-debug-host

# Keep ~/.apm-debug-host directory for later use
```

---

**🎉 Installation Complete!** Your MCP Debug Host Server is now ready to revolutionize your AI development workflow.

**Next Steps:**
- 📖 [Getting Started Guide](README.md) - Learn the basics
- 🎮 [Dashboard Tour](dashboard-tour.md) - Explore the web interface
- 🔧 [API Reference](../api/README.md) - Advanced usage