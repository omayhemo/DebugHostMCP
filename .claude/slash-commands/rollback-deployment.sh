#!/bin/bash

# MCP Debug Host Rollback Script
# Restores the previous version from backup
# Usage: /rollback-deployment

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

GLOBAL_PATH="$HOME/.apm-debug-host"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        MCP Debug Host - Rollback Deployment                 ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Find most recent backup
echo -e "${YELLOW}▶ Finding most recent backup...${NC}"

LATEST_BACKUP=$(ls -t ~/.apm-debug-host.backup.* 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}✗ No backup found! Cannot rollback.${NC}"
    echo -e "${YELLOW}Available options:${NC}"
    echo -e "  1. Re-deploy from development: /deploy-to-global"
    echo -e "  2. Manually restore from a different source"
    exit 1
fi

echo -e "${GREEN}✓ Found backup: $LATEST_BACKUP${NC}"

# Show backup info
BACKUP_DATE=$(echo "$LATEST_BACKUP" | grep -o '[0-9]\{8\}_[0-9]\{6\}')
echo -e "  Backup date: ${BACKUP_DATE}"

# Step 2: Stop current service
echo -e "\n${YELLOW}▶ Stopping current service...${NC}"

RUNNING_PID=$(ps aux | grep -E "apm-debug-host/src/index.js" | grep -v grep | awk '{print $2}' | head -1)

if [ -n "$RUNNING_PID" ]; then
    echo -e "  Found running service (PID: $RUNNING_PID)"
    kill "$RUNNING_PID" 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}✓ Service stopped${NC}"
else
    echo -e "  No running service found"
fi

# Step 3: Backup current (broken) version
echo -e "\n${YELLOW}▶ Backing up current version (for analysis)...${NC}"

if [ -d "$GLOBAL_PATH" ]; then
    FAILED_BACKUP="$GLOBAL_PATH.failed.$(date +%Y%m%d_%H%M%S)"
    mv "$GLOBAL_PATH" "$FAILED_BACKUP"
    echo -e "${GREEN}✓ Current version moved to: $FAILED_BACKUP${NC}"
    echo -e "  You can analyze it later if needed"
fi

# Step 4: Restore from backup
echo -e "\n${YELLOW}▶ Restoring from backup...${NC}"

cp -r "$LATEST_BACKUP" "$GLOBAL_PATH"
echo -e "${GREEN}✓ Restored from backup${NC}"

# Step 5: Start restored service
echo -e "\n${YELLOW}▶ Starting restored service...${NC}"

nohup node "$GLOBAL_PATH/src/index.js" > "$GLOBAL_PATH/service.log" 2>&1 &
NEW_PID=$!

sleep 3

# Check if process is running
if ps -p $NEW_PID > /dev/null; then
    echo -e "${GREEN}✓ Service started successfully (PID: $NEW_PID)${NC}"
else
    echo -e "${RED}✗ Service failed to start${NC}"
    echo -e "Checking logs..."
    tail -10 "$GLOBAL_PATH/service.log"
    exit 1
fi

# Step 6: Verify rollback
echo -e "\n${YELLOW}▶ Verifying rollback...${NC}"

# Check health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:2601/api/health 2>/dev/null)

if echo "$HEALTH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Health check may have issues${NC}"
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}            ✓ Rollback Complete!                            ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Rollback Information:${NC}"
echo -e "  • Restored from: $LATEST_BACKUP"
echo -e "  • Service PID: $NEW_PID"
echo -e "  • Failed version saved to: $FAILED_BACKUP"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Verify the service is working correctly"
echo -e "  2. Investigate what went wrong in: $FAILED_BACKUP"
echo -e "  3. Fix the issues in development before re-deploying"
echo ""

echo -e "${GREEN}Rollback completed successfully!${NC}"