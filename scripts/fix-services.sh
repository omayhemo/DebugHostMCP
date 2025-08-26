#!/bin/bash
# Quick fix for current service installation
# Fixes the Node.js path issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing PlopDock Services${NC}"
echo "=============================="

# Stop current services
echo -e "${BLUE}🛑 Stopping current services...${NC}"
sudo systemctl stop plopdock-dashboard.service 2>/dev/null || echo "Dashboard service not running"  
sudo systemctl stop plopdock-api-bridge.service 2>/dev/null || echo "API Bridge service not running"

# Get project directory and node path
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_PATH=$(which node)
CURRENT_USER=$(whoami)

echo -e "${BLUE}🔍 Using Node.js at: ${NODE_PATH}${NC}"
echo -e "${BLUE}📂 Project directory: ${PROJECT_DIR}${NC}"

# Create corrected service files
sed "s|/mnt/c/Code/plopdock|$PROJECT_DIR|g; s|User=ubuntu|User=$CURRENT_USER|g; s|/usr/bin/node|$NODE_PATH|g" \
    "$PROJECT_DIR/scripts/services/plopdock-api-bridge.service" > /tmp/plopdock-api-bridge.service

sed "s|/mnt/c/Code/plopdock|$PROJECT_DIR|g; s|User=ubuntu|User=$CURRENT_USER|g" \
    "$PROJECT_DIR/scripts/services/plopdock-dashboard.service" > /tmp/plopdock-dashboard.service

# Update installed service files
echo -e "${BLUE}📋 Updating service files...${NC}"
sudo cp /tmp/plopdock-api-bridge.service /etc/systemd/system/
sudo cp /tmp/plopdock-dashboard.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Start services
echo -e "${BLUE}🚀 Starting fixed services...${NC}"
sudo systemctl start plopdock-api-bridge.service
sleep 2
sudo systemctl start plopdock-dashboard.service

echo -e "${GREEN}✅ Services fixed and restarted${NC}"

# Show status
echo -e "\n${BLUE}📊 Service Status:${NC}"
systemctl status plopdock-api-bridge.service --no-pager -l || true
echo ""
systemctl status plopdock-dashboard.service --no-pager -l || true

# Clean up
rm /tmp/plopdock-api-bridge.service /tmp/plopdock-dashboard.service

echo ""
echo -e "${GREEN}🎉 Services should now be working correctly!${NC}"
echo ""
echo "URLs:"
echo "  Dashboard: http://localhost:5173/dashboard"  
echo "  API:       http://localhost:2602/api/health"