#!/bin/bash
# Quick fix for dashboard service npm path issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Dashboard Service${NC}"
echo "============================="

# Get paths
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NPM_PATH=$(which npm)
CURRENT_USER=$(whoami)

echo -e "${BLUE}🔍 Using npm at: ${NPM_PATH}${NC}"

# Stop dashboard service
echo -e "${BLUE}🛑 Stopping dashboard service...${NC}"
sudo systemctl stop plopdock-dashboard.service

# Create corrected dashboard service file
sed "s|/mnt/c/Code/plopdock|$PROJECT_DIR|g; s|User=ubuntu|User=$CURRENT_USER|g; s|/usr/bin/npm|$NPM_PATH|g" \
    "$PROJECT_DIR/scripts/services/plopdock-dashboard.service" > /tmp/plopdock-dashboard.service

# Update installed service file
echo -e "${BLUE}📋 Updating dashboard service file...${NC}"
sudo cp /tmp/plopdock-dashboard.service /etc/systemd/system/

# Reload systemd and start service
sudo systemctl daemon-reload
echo -e "${BLUE}🚀 Starting dashboard service...${NC}"
sudo systemctl start plopdock-dashboard.service

echo -e "${GREEN}✅ Dashboard service fixed and restarted${NC}"

# Show status
echo -e "\n${BLUE}📊 Dashboard Service Status:${NC}"
systemctl status plopdock-dashboard.service --no-pager -l

# Clean up
rm /tmp/plopdock-dashboard.service

echo ""
echo -e "${GREEN}🎉 Dashboard should now be working!${NC}"
echo "  Dashboard: http://localhost:5173/dashboard"