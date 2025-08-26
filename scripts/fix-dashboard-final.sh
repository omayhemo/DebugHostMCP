#!/bin/bash
# Final fix for dashboard service PATH issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Final Dashboard Service Fix${NC}"
echo "=============================="

# Get paths
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_PATH=$(which node)
NPM_PATH=$(which npm)
NODE_BIN_DIR=$(dirname "$NODE_PATH")
CURRENT_USER=$(whoami)

echo -e "${BLUE}🔍 Using Node.js at: ${NODE_PATH}${NC}"
echo -e "${BLUE}🔍 Using npm at: ${NPM_PATH}${NC}"
echo -e "${BLUE}🔍 Node bin directory: ${NODE_BIN_DIR}${NC}"

# Stop dashboard service
echo -e "${BLUE}🛑 Stopping dashboard service...${NC}"
sudo systemctl stop plopdock-dashboard.service

# Create corrected dashboard service file with proper PATH
sed "s|/mnt/c/Code/plopdock|$PROJECT_DIR|g; s|User=ubuntu|User=$CURRENT_USER|g; s|/usr/bin/npm|$NPM_PATH|g; s|/home/dougw/.nvm/versions/node/v22.16.0/bin|$NODE_BIN_DIR|g" \
    "$PROJECT_DIR/scripts/services/plopdock-dashboard.service" > /tmp/plopdock-dashboard.service

echo -e "${BLUE}📋 Service file created with PATH: ${NODE_BIN_DIR}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin${NC}"

# Update installed service file
echo -e "${BLUE}📋 Updating dashboard service file...${NC}"
sudo cp /tmp/plopdock-dashboard.service /etc/systemd/system/

# Reload systemd and start service
sudo systemctl daemon-reload
echo -e "${BLUE}🚀 Starting dashboard service...${NC}"
sudo systemctl start plopdock-dashboard.service

# Wait a moment for startup
sleep 3

echo -e "${GREEN}✅ Dashboard service fixed and restarted${NC}"

# Show status
echo -e "\n${BLUE}📊 Service Status:${NC}"
systemctl status plopdock-dashboard.service --no-pager -l

# Clean up
rm /tmp/plopdock-dashboard.service

echo ""
if systemctl is-active --quiet plopdock-dashboard.service; then
    echo -e "${GREEN}🎉 SUCCESS! Dashboard service is now active!${NC}"
    echo "  Dashboard: http://localhost:5173/dashboard"
else
    echo -e "${RED}❌ Dashboard service still having issues${NC}"
    echo "Check logs with: journalctl -u plopdock-dashboard.service -f"
fi