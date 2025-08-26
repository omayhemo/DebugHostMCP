#!/bin/bash
# PlopDock Service Installation Script
# Installs systemd services for automatic startup on boot

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 PlopDock Service Installation${NC}"
echo "=================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   echo "Run as your regular user - sudo will be used when needed"
   exit 1
fi

# Get the absolute path of the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "${BLUE}📂 Project directory: ${PROJECT_DIR}${NC}"

# Check if we're in WSL and adjust paths if needed
if grep -qi microsoft /proc/version; then
    echo -e "${YELLOW}⚠️  WSL detected - you may need to adjust service files for your specific setup${NC}"
fi

# Verify required files exist
if [[ ! -f "$PROJECT_DIR/src/api-bridge.js" ]]; then
    echo -e "${RED}❌ API Bridge not found: $PROJECT_DIR/src/api-bridge.js${NC}"
    exit 1
fi

if [[ ! -f "$PROJECT_DIR/dashboard/package.json" ]]; then
    echo -e "${RED}❌ Dashboard not found: $PROJECT_DIR/dashboard/package.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project files verified${NC}"

# Detect Node.js and npm paths
NODE_PATH=$(which node)
NPM_PATH=$(which npm)

if [[ ! -x "$NODE_PATH" ]]; then
    echo -e "${RED}❌ Node.js not found in PATH${NC}"
    echo "Please install Node.js or ensure it's in your PATH"
    exit 1
fi

if [[ ! -x "$NPM_PATH" ]]; then
    echo -e "${RED}❌ npm not found in PATH${NC}"
    echo "Please install npm or ensure it's in your PATH"
    exit 1
fi

echo -e "${BLUE}🔍 Detected Node.js at: ${NODE_PATH}${NC}"
echo -e "${BLUE}🔍 Detected npm at: ${NPM_PATH}${NC}"

# Update service files with correct paths and user
CURRENT_USER=$(whoami)
sed "s|/mnt/c/Code/plopdock|$PROJECT_DIR|g; s|User=ubuntu|User=$CURRENT_USER|g; s|/usr/bin/node|$NODE_PATH|g" \
    "$PROJECT_DIR/scripts/services/plopdock-api-bridge.service" > /tmp/plopdock-api-bridge.service

# Create PATH with nvm bin directory
NODE_BIN_DIR=$(dirname "$NODE_PATH")
SERVICE_PATH="$NODE_BIN_DIR:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

sed "s|/mnt/c/Code/plopdock|$PROJECT_DIR|g; s|User=ubuntu|User=$CURRENT_USER|g; s|/usr/bin/npm|$NPM_PATH|g; s|/home/dougw/.nvm/versions/node/v22.16.0/bin|$NODE_BIN_DIR|g" \
    "$PROJECT_DIR/scripts/services/plopdock-dashboard.service" > /tmp/plopdock-dashboard.service

echo -e "${BLUE}📋 Installing systemd services...${NC}"

# Copy service files to systemd directory
sudo cp /tmp/plopdock-api-bridge.service /etc/systemd/system/
sudo cp /tmp/plopdock-dashboard.service /etc/systemd/system/

# Set proper permissions
sudo chmod 644 /etc/systemd/system/plopdock-api-bridge.service
sudo chmod 644 /etc/systemd/system/plopdock-dashboard.service

# Reload systemd
sudo systemctl daemon-reload

echo -e "${GREEN}✅ Service files installed${NC}"

# Enable services for automatic startup
echo -e "${BLUE}🔧 Enabling services for automatic startup...${NC}"
sudo systemctl enable plopdock-api-bridge.service
sudo systemctl enable plopdock-dashboard.service

echo -e "${GREEN}✅ Services enabled for automatic startup${NC}"

# Ask if user wants to start services now
echo ""
read -p "Start services now? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚀 Starting services...${NC}"
    
    sudo systemctl start plopdock-api-bridge.service
    sleep 2
    sudo systemctl start plopdock-dashboard.service
    
    echo -e "${GREEN}✅ Services started${NC}"
    
    # Show service status
    echo -e "\n${BLUE}📊 Service Status:${NC}"
    systemctl status plopdock-api-bridge.service --no-pager -l
    echo ""
    systemctl status plopdock-dashboard.service --no-pager -l
fi

echo ""
echo -e "${GREEN}🎉 Installation Complete!${NC}"
echo ""
echo "Service Management Commands:"
echo "  Start:   sudo systemctl start plopdock-api-bridge plopdock-dashboard"  
echo "  Stop:    sudo systemctl stop plopdock-dashboard plopdock-api-bridge"
echo "  Restart: sudo systemctl restart plopdock-api-bridge plopdock-dashboard"
echo "  Status:  systemctl status plopdock-api-bridge plopdock-dashboard"
echo "  Logs:    journalctl -u plopdock-api-bridge -u plopdock-dashboard -f"
echo ""
echo "URLs:"
echo "  Dashboard: http://localhost:5173/dashboard"
echo "  API:       http://localhost:2602/api/health"
echo ""
echo -e "${YELLOW}Note: Services will now start automatically on system boot${NC}"

# Clean up temp files
rm /tmp/plopdock-api-bridge.service /tmp/plopdock-dashboard.service