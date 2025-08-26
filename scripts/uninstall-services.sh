#!/bin/bash
# PlopDock Service Uninstallation Script
# Removes systemd services and stops automatic startup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗑️  PlopDock Service Uninstallation${NC}"
echo "=================================="

# Stop services if running
echo -e "${BLUE}🛑 Stopping services...${NC}"
sudo systemctl stop plopdock-dashboard.service 2>/dev/null || echo "Dashboard service not running"
sudo systemctl stop plopdock-api-bridge.service 2>/dev/null || echo "API Bridge service not running"

# Disable services from automatic startup
echo -e "${BLUE}🔧 Disabling services...${NC}"
sudo systemctl disable plopdock-dashboard.service 2>/dev/null || echo "Dashboard service not enabled"
sudo systemctl disable plopdock-api-bridge.service 2>/dev/null || echo "API Bridge service not enabled"

# Remove service files
echo -e "${BLUE}🗂️  Removing service files...${NC}"
sudo rm -f /etc/systemd/system/plopdock-api-bridge.service
sudo rm -f /etc/systemd/system/plopdock-dashboard.service

# Reload systemd daemon
sudo systemctl daemon-reload

echo -e "${GREEN}✅ Services uninstalled successfully${NC}"
echo ""
echo "The servers are now removed from automatic startup."
echo "You can still run them manually using:"
echo "  node test-phase3-manual.js"
echo ""