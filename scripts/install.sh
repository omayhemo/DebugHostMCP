#!/bin/bash

# Installation script for Debug Host MCP (Client-Server Architecture)

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Installation directory
INSTALL_DIR="$HOME/.apm-debug-host"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}=== Debug Host MCP Installation ===${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Create installation directory
echo "Creating installation directory..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/data/logs"
mkdir -p "$INSTALL_DIR/config"

# Copy files
echo "Copying files..."
cp -r "$PROJECT_DIR/service" "$INSTALL_DIR/"
cp -r "$PROJECT_DIR/adapter" "$INSTALL_DIR/"
cp -r "$PROJECT_DIR/src/dashboard" "$INSTALL_DIR/src/" 2>/dev/null || mkdir -p "$INSTALL_DIR/src/dashboard"
cp "$PROJECT_DIR/package.json" "$INSTALL_DIR/"
cp "$PROJECT_DIR/package-lock.json" "$INSTALL_DIR/" 2>/dev/null || true

# Install dependencies
echo "Installing dependencies..."
cd "$INSTALL_DIR"
npm install --production

# Create configuration
echo "Creating configuration..."
cat > "$INSTALL_DIR/config/service.env" << EOF
# Debug Host Service Configuration
API_PORT=8081
DASHBOARD_PORT=8080
HEALTH_PORT=8082
DATA_DIR=$INSTALL_DIR/data
LOG_DIR=$INSTALL_DIR/data/logs
MAX_SESSIONS=50
SESSION_TIMEOUT=24h
LOG_LEVEL=info
CORS_ORIGINS=*
EOF

# Create systemd service (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v systemctl &> /dev/null; then
    echo "Creating systemd service..."
    
    cat > /tmp/debug-host-mcp.service << EOF
[Unit]
Description=Debug Host MCP Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which node) $INSTALL_DIR/service/global-service.js
Restart=always
RestartSec=10
EnvironmentFile=$INSTALL_DIR/config/service.env

[Install]
WantedBy=multi-user.target
EOF

    sudo mv /tmp/debug-host-mcp.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable debug-host-mcp
    
    echo -e "${GREEN}✓ Systemd service installed${NC}"
fi

# Create launchd service (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Creating launchd service..."
    
    PLIST_PATH="$HOME/Library/LaunchAgents/com.debug-host-mcp.plist"
    mkdir -p "$HOME/Library/LaunchAgents"
    
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.debug-host-mcp</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which node)</string>
        <string>$INSTALL_DIR/service/global-service.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
EOF
    
    launchctl load "$PLIST_PATH" 2>/dev/null || true
    echo -e "${GREEN}✓ LaunchAgent installed${NC}"
fi

# Update Claude configuration
echo "Updating Claude configuration..."

CLAUDE_CONFIG="$HOME/.claude/claude_config.json"
if [ ! -f "$CLAUDE_CONFIG" ]; then
    mkdir -p "$HOME/.claude"
    echo '{"mcpServers":{}}' > "$CLAUDE_CONFIG"
fi

# Add MCP adapter to Claude config (using Node.js for JSON manipulation)
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CLAUDE_CONFIG', 'utf8'));
config.mcpServers = config.mcpServers || {};
config.mcpServers['debug-host'] = {
  command: 'node',
  args: ['$INSTALL_DIR/adapter/mcp-adapter.js'],
  env: {
    DEBUG_HOST_API_URL: 'http://localhost:8081/api/v1',
    DEBUG_HOST_DASHBOARD_URL: 'http://localhost:8080'
  }
};
fs.writeFileSync('$CLAUDE_CONFIG', JSON.stringify(config, null, 2));
console.log('Claude configuration updated');
"

# Start the service
echo ""
echo "Starting service..."

if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v systemctl &> /dev/null; then
    sudo systemctl start debug-host-mcp
    sleep 2
    if systemctl is-active --quiet debug-host-mcp; then
        echo -e "${GREEN}✓ Service started successfully${NC}"
    else
        echo -e "${YELLOW}Service failed to start. Check logs: sudo journalctl -u debug-host-mcp${NC}"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2
    echo -e "${GREEN}✓ Service started${NC}"
else
    # Manual start
    nohup node "$INSTALL_DIR/service/global-service.js" > "$INSTALL_DIR/data/logs/service.log" 2>&1 &
    echo $! > "$INSTALL_DIR/service.pid"
    echo -e "${GREEN}✓ Service started (PID: $(cat $INSTALL_DIR/service.pid))${NC}"
fi

# Test the service
echo ""
echo "Testing service..."
sleep 3

if curl -s http://localhost:8081/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API server is responding${NC}"
else
    echo -e "${YELLOW}API server not responding yet${NC}"
fi

if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dashboard is accessible${NC}"
else
    echo -e "${YELLOW}Dashboard not accessible yet${NC}"
fi

echo ""
echo -e "${GREEN}=== Installation Complete ===${NC}"
echo ""
echo "Dashboard: ${BLUE}http://localhost:8080${NC}"
echo "API: ${BLUE}http://localhost:8081/api/v1${NC}"
echo ""
echo "Service commands:"
if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v systemctl &> /dev/null; then
    echo "  Start:   sudo systemctl start debug-host-mcp"
    echo "  Stop:    sudo systemctl stop debug-host-mcp"
    echo "  Status:  sudo systemctl status debug-host-mcp"
    echo "  Logs:    sudo journalctl -u debug-host-mcp -f"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  Start:   launchctl load ~/Library/LaunchAgents/com.debug-host-mcp.plist"
    echo "  Stop:    launchctl unload ~/Library/LaunchAgents/com.debug-host-mcp.plist"
else
    echo "  Start:   nohup node $INSTALL_DIR/service/global-service.js &"
    echo "  Stop:    kill \$(cat $INSTALL_DIR/service.pid)"
fi
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Restart Claude Code to load the MCP adapter"
echo "2. Test with: server_start command=\"echo test\""
echo "3. Visit dashboard at http://localhost:8080"
echo ""