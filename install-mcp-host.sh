#!/bin/bash

# MCP Debug Host Installation Script
# This script installs and configures the MCP Debug Host Server

set -e

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_HOME="$HOME/.apm-debug-host"

echo -e "${GREEN}Installing MCP Debug Host Server...${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js installation
check_nodejs() {
    if ! command_exists node; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        echo "Please install Node.js 18 or later from https://nodejs.org"
        return 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${YELLOW}Warning: Node.js 18+ recommended (found v$NODE_VERSION)${NC}"
    else
        echo -e "${GREEN}✓ Node.js v$NODE_VERSION detected${NC}"
    fi
    
    return 0
}

# Check npm installation
check_npm() {
    if ! command_exists npm; then
        echo -e "${RED}Error: npm is not installed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
    return 0
}

# Install MCP server files
install_mcp_server() {
    echo "Creating MCP home directory..."
    mkdir -p "$MCP_HOME"
    mkdir -p "$MCP_HOME/logs"
    
    echo "Copying server files..."
    
    # Copy all source files
    cp -r "$SCRIPT_DIR/src" "$MCP_HOME/"
    cp "$SCRIPT_DIR/package.json" "$MCP_HOME/"
    cp "$SCRIPT_DIR/cli.js" "$MCP_HOME/"
    
    # Copy templates
    if [ -f "$SCRIPT_DIR/.env.template" ]; then
        cp "$SCRIPT_DIR/.env.template" "$MCP_HOME/"
    fi
    if [ -f "$SCRIPT_DIR/config.json.template" ]; then
        cp "$SCRIPT_DIR/config.json.template" "$MCP_HOME/"
    fi
    
    echo "Installing dependencies..."
    cd "$MCP_HOME"
    
    # Install with specific registry and show progress
    npm install --production --registry https://registry.npmjs.org/ 2>&1 | tee npm-install.log
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}Error: Failed to install npm dependencies${NC}"
        echo "Check npm-install.log for details"
        return 1
    fi
}

# Generate configuration
generate_config() {
    echo "Generating configuration..."
    
    # Generate API key
    if command_exists openssl; then
        API_KEY=$(openssl rand -hex 32)
    elif command_exists python3; then
        API_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    else
        API_KEY=$(date +%s | sha256sum | base64 | head -c 32)
    fi
    
    # Process .env template
    if [ -f "$MCP_HOME/.env.template" ]; then
        sed "s/{{API_KEY}}/$API_KEY/g; s|{{MCP_HOME}}|$MCP_HOME|g" \
            "$MCP_HOME/.env.template" > "$MCP_HOME/.env"
        rm "$MCP_HOME/.env.template"
    else
        # Create .env file directly
        cat > "$MCP_HOME/.env" << EOF
# MCP Debug Host Configuration
MCP_API_KEY=$API_KEY
PORT=8080
LOG_LEVEL=info
NODE_ENV=production
LOG_DIR=$MCP_HOME/logs
MAX_LOG_SIZE=104857600
MAX_LOG_FILES=10
MAX_CONCURRENT_PROCESSES=10
PROCESS_TIMEOUT=86400000
DASHBOARD_TITLE=APM Debug Host Dashboard
DASHBOARD_THEME=dark
EOF
    fi
    
    chmod 600 "$MCP_HOME/.env"
    
    # Process config.json template
    if [ -f "$MCP_HOME/config.json.template" ]; then
        sed "s/{{API_KEY}}/$API_KEY/g; s|{{MCP_HOME}}|$MCP_HOME|g" \
            "$MCP_HOME/config.json.template" > "$MCP_HOME/config.json"
        rm "$MCP_HOME/config.json.template"
    else
        # Create config.json directly
        cat > "$MCP_HOME/config.json" << EOF
{
  "version": "1.0.0",
  "port": 8080,
  "apiKey": "$API_KEY",
  "storage": {
    "logs": {
      "path": "$MCP_HOME/logs",
      "maxSize": "100MB",
      "rotation": "daily"
    }
  },
  "processes": {
    "maxConcurrent": 10,
    "defaultTimeout": 86400
  }
}
EOF
    fi
    
    echo -e "${GREEN}✓ Configuration generated${NC}"
    echo -e "${BLUE}API Key: $API_KEY${NC}"
}

# Update MCP configuration
update_mcp_config() {
    echo "Updating MCP configuration..."
    
    # Find or create .mcp.json
    local MCP_CONFIG=""
    
    if [ -f "$TARGET_DIR/.mcp.json" ]; then
        MCP_CONFIG="$TARGET_DIR/.mcp.json"
    elif [ -f "$HOME/.mcp.json" ]; then
        MCP_CONFIG="$HOME/.mcp.json"
    else
        MCP_CONFIG="$TARGET_DIR/.mcp.json"
        echo '{"mcpServers":{}}' > "$MCP_CONFIG"
    fi
    
    # Check if jq is available
    if command_exists jq; then
        # Update configuration with jq
        local TEMP_FILE=$(mktemp)
        jq --arg home "$MCP_HOME" \
           --arg project "$TARGET_DIR" \
           '.mcpServers["apm-debug-host"] = {
              "command": "node",
              "args": [($home + "/src/index.js")],
              "env": {
                "CONFIG_PATH": ($home + "/config.json"),
                "PROJECT_ROOT": $project
              }
            }' "$MCP_CONFIG" > "$TEMP_FILE" && mv "$TEMP_FILE" "$MCP_CONFIG"
        
        echo -e "${GREEN}✓ MCP configuration updated in: $MCP_CONFIG${NC}"
    else
        echo -e "${YELLOW}Warning: jq not found. Please manually add MCP server to $MCP_CONFIG${NC}"
        echo "Add this configuration:"
        cat << EOF
{
  "mcpServers": {
    "apm-debug-host": {
      "command": "node",
      "args": ["$MCP_HOME/src/index.js"],
      "env": {
        "CONFIG_PATH": "$MCP_HOME/config.json",
        "PROJECT_ROOT": "$TARGET_DIR"
      }
    }
  }
}
EOF
    fi
}

# Setup system service
setup_service() {
    echo "Setting up system service..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Create systemd service
        cat > /tmp/apm-debug-host.service << EOF
[Unit]
Description=APM Debug Host MCP Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$MCP_HOME
ExecStart=$(which node) $MCP_HOME/src/index.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=$MCP_HOME/logs

[Install]
WantedBy=multi-user.target
EOF
        
        # Install service
        if command_exists systemctl && sudo -n true 2>/dev/null; then
            sudo mv /tmp/apm-debug-host.service /etc/systemd/system/
            sudo systemctl daemon-reload
            sudo systemctl enable apm-debug-host
            
            # Try to start the service
            if sudo systemctl start apm-debug-host; then
                echo -e "${GREEN}✓ Systemd service installed and started${NC}"
            else
                echo -e "${YELLOW}Service installed but failed to start. Check logs with: sudo journalctl -u apm-debug-host${NC}"
            fi
        else
            echo -e "${YELLOW}Systemd available but cannot use sudo. Service file created but not installed.${NC}"
            echo "To install manually: sudo mv /tmp/apm-debug-host.service /etc/systemd/system/"
        fi
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # Create LaunchAgent for macOS
        PLIST_PATH="$HOME/Library/LaunchAgents/com.apm.debug-host.plist"
        mkdir -p "$HOME/Library/LaunchAgents"
        
        cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.apm.debug-host</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which node)</string>
        <string>$MCP_HOME/src/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$MCP_HOME</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$MCP_HOME/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>$MCP_HOME/logs/stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF
        
        # Load the service
        if launchctl load "$PLIST_PATH" 2>/dev/null; then
            echo -e "${GREEN}✓ LaunchAgent installed and loaded${NC}"
        else
            echo -e "${YELLOW}LaunchAgent installed but failed to load. Try manually: launchctl load \"$PLIST_PATH\"${NC}"
        fi
    else
        echo -e "${YELLOW}System service not supported on this platform. You can start manually with:${NC}"
        echo "cd $MCP_HOME && npm start"
    fi
}

# Test the installation
test_installation() {
    echo "Testing installation..."
    
    # Wait a moment for service to start
    sleep 3
    
    # Test if server is responding
    if command_exists curl; then
        if curl -s -f http://localhost:8080/api/health > /dev/null; then
            echo -e "${GREEN}✓ Server is responding${NC}"
        else
            echo -e "${YELLOW}Server not responding yet (may take a moment to start)${NC}"
        fi
    fi
    
    # Test MCP configuration
    if [ -f "$TARGET_DIR/.mcp.json" ] || [ -f "$HOME/.mcp.json" ]; then
        echo -e "${GREEN}✓ MCP configuration found${NC}"
    else
        echo -e "${YELLOW}Warning: MCP configuration not found${NC}"
    fi
}

# Main installation flow
main() {
    echo -e "${BLUE}=== MCP Debug Host Installation ===${NC}"
    echo ""
    
    # Check prerequisites
    if ! check_nodejs; then
        exit 1
    fi
    
    if ! check_npm; then
        exit 1
    fi
    
    # Install components
    if ! install_mcp_server; then
        echo -e "${RED}Failed to install MCP server${NC}"
        exit 1
    fi
    
    generate_config
    
    if [ -n "$TARGET_DIR" ]; then
        update_mcp_config
    else
        echo -e "${YELLOW}TARGET_DIR not set, skipping MCP config update${NC}"
    fi
    
    setup_service
    test_installation
    
    echo ""
    echo -e "${GREEN}=== Installation Complete ===${NC}"
    echo ""
    echo "MCP Debug Host Dashboard: ${BLUE}http://localhost:8080${NC}"
    echo "Configuration: $MCP_HOME/config.json"
    echo "Logs: $MCP_HOME/logs/"
    echo "Service status: Check with your system's service manager"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Restart Claude Code to connect to MCP server"
    echo "2. Visit the dashboard at http://localhost:8080"
    echo "3. Start any dev server - it will appear automatically!"
    echo ""
    
    if [[ "$OSTYPE" == "linux-gnu"* ]] && command_exists systemctl; then
        echo "Service commands:"
        echo "  Start:   sudo systemctl start apm-debug-host"
        echo "  Stop:    sudo systemctl stop apm-debug-host"
        echo "  Status:  sudo systemctl status apm-debug-host"
        echo "  Logs:    sudo journalctl -u apm-debug-host -f"
        echo ""
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Service commands:"
        echo "  Start:   launchctl load ~/Library/LaunchAgents/com.amp.debug-host.plist"
        echo "  Stop:    launchctl unload ~/Library/LaunchAgents/com.apm.debug-host.plist"
        echo "  Logs:    tail -f $MCP_HOME/logs/stdout.log"
        echo ""
    fi
    
    echo -e "${GREEN}Happy debugging! 🚀${NC}"
}

# Run main installation
main "$@"