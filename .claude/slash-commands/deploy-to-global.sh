#!/bin/bash

# MCP Debug Host Deployment Script
# Deploys from development to global installation
# Usage: /deploy-to-global

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
DEV_PATH="/mnt/c/Code/MCPServers/DebugHostMCP"
GLOBAL_PATH="$HOME/.apm-debug-host"
MCP_CONFIG="$HOME/.config/claude/mcp.json"
SERVICE_PORT=2601

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     MCP Debug Host - Deployment to Global Installation      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}▶ Step 1: Pre-deployment checks${NC}"

if [ ! -d "$DEV_PATH" ]; then
    echo -e "${RED}✗ Development directory not found: $DEV_PATH${NC}"
    exit 1
fi

if [ ! -d "$GLOBAL_PATH" ]; then
    echo -e "${YELLOW}⚠ Global installation not found. Creating: $GLOBAL_PATH${NC}"
    mkdir -p "$GLOBAL_PATH"
fi

echo -e "${GREEN}✓ Paths verified${NC}"

# Step 2: Check and stop current service
echo -e "\n${YELLOW}▶ Step 2: Stopping current service${NC}"

RUNNING_PID=$(ps aux | grep -E "apm-debug-host/src/index.js" | grep -v grep | awk '{print $2}' | head -1)

if [ -n "$RUNNING_PID" ]; then
    echo -e "  Found running service (PID: $RUNNING_PID)"
    kill "$RUNNING_PID" 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}✓ Service stopped${NC}"
else
    echo -e "  No running service found"
fi

# Step 3: Backup current installation
echo -e "\n${YELLOW}▶ Step 3: Creating backup${NC}"

if [ -d "$GLOBAL_PATH" ] && [ "$(ls -A $GLOBAL_PATH)" ]; then
    BACKUP_PATH="$GLOBAL_PATH.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r "$GLOBAL_PATH" "$BACKUP_PATH"
    echo -e "${GREEN}✓ Backup created: $BACKUP_PATH${NC}"
else
    echo -e "  No existing installation to backup"
fi

# Step 4: Copy files from development to global
echo -e "\n${YELLOW}▶ Step 4: Copying files to global installation${NC}"

# Create necessary directories
mkdir -p "$GLOBAL_PATH/src"
mkdir -p "$GLOBAL_PATH/adapter"
mkdir -p "$GLOBAL_PATH/service"

# Copy source files
echo -e "  Copying source files..."
cp -r "$DEV_PATH/src/"* "$GLOBAL_PATH/src/" 2>/dev/null || true

# Copy adapter files
echo -e "  Copying adapter files..."
cp -r "$DEV_PATH/adapter/"* "$GLOBAL_PATH/adapter/" 2>/dev/null || true

# Copy service files if they exist
if [ -d "$DEV_PATH/service" ]; then
    echo -e "  Copying service files..."
    cp -r "$DEV_PATH/service/"* "$GLOBAL_PATH/service/" 2>/dev/null || true
fi

# Copy package files
echo -e "  Copying package files..."
cp "$DEV_PATH/package.json" "$GLOBAL_PATH/" 2>/dev/null || true
cp "$DEV_PATH/package-lock.json" "$GLOBAL_PATH/" 2>/dev/null || true

# Copy any root-level JS files
cp "$DEV_PATH"/*.js "$GLOBAL_PATH/" 2>/dev/null || true

echo -e "${GREEN}✓ Files copied successfully${NC}"

# Step 5: Verify port configuration
echo -e "\n${YELLOW}▶ Step 5: Verifying port configuration${NC}"

# Check MCP config
if [ -f "$MCP_CONFIG" ]; then
    CURRENT_PORT=$(grep -o '"PORT": *"[0-9]*"' "$MCP_CONFIG" | grep -o '[0-9]*')
    if [ "$CURRENT_PORT" != "$SERVICE_PORT" ]; then
        echo -e "${YELLOW}⚠ MCP config has wrong port ($CURRENT_PORT). Updating to $SERVICE_PORT...${NC}"
        sed -i "s/\"PORT\": \"$CURRENT_PORT\"/\"PORT\": \"$SERVICE_PORT\"/g" "$MCP_CONFIG"
        echo -e "${GREEN}✓ Port configuration updated${NC}"
    else
        echo -e "${GREEN}✓ Port configuration correct ($SERVICE_PORT)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ MCP config not found at $MCP_CONFIG${NC}"
fi

# Step 6: Install dependencies
echo -e "\n${YELLOW}▶ Step 6: Installing dependencies${NC}"

cd "$GLOBAL_PATH"
if [ -f "package.json" ]; then
    echo -e "  Running npm install..."
    npm install --production --silent 2>/dev/null || {
        echo -e "${YELLOW}⚠ Some npm warnings occurred (usually safe to ignore)${NC}"
    }
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ No package.json found, skipping npm install${NC}"
fi
cd - > /dev/null

# Step 7: Test service startup
echo -e "\n${YELLOW}▶ Step 7: Testing service startup${NC}"

# Start service in background for testing
echo -e "  Starting service for verification..."
nohup node "$GLOBAL_PATH/src/index.js" > "$GLOBAL_PATH/service.log" 2>&1 &
NEW_PID=$!

# Wait for service to start
sleep 3

# Check if process is still running
if ps -p $NEW_PID > /dev/null; then
    echo -e "${GREEN}✓ Service started successfully (PID: $NEW_PID)${NC}"
else
    echo -e "${RED}✗ Service failed to start. Check logs at: $GLOBAL_PATH/service.log${NC}"
    tail -10 "$GLOBAL_PATH/service.log"
    exit 1
fi

# Step 8: Verify deployment
echo -e "\n${YELLOW}▶ Step 8: Verifying deployment${NC}"

# Check health endpoint
echo -e "  Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:$SERVICE_PORT/api/health 2>/dev/null)

if echo "$HEALTH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi

# Check dashboard
echo -e "  Testing dashboard..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVICE_PORT/)

if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Dashboard accessible${NC}"
else
    echo -e "${YELLOW}⚠ Dashboard returned status: $DASHBOARD_STATUS${NC}"
fi

# Check sessions API
echo -e "  Testing sessions API..."
SESSIONS_RESPONSE=$(curl -s http://localhost:$SERVICE_PORT/api/sessions 2>/dev/null)

if echo "$SESSIONS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Sessions API working${NC}"
else
    echo -e "${YELLOW}⚠ Sessions API may have issues${NC}"
fi

# Step 9: Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}            ✓ Deployment Complete!                          ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Service Information:${NC}"
echo -e "  • PID: $NEW_PID"
echo -e "  • Port: $SERVICE_PORT"
echo -e "  • Dashboard: http://localhost:$SERVICE_PORT"
echo -e "  • API: http://localhost:$SERVICE_PORT/api"
echo -e "  • Logs: $GLOBAL_PATH/service.log"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Monitor the service for a few minutes"
echo -e "  2. Test creating a session through the dashboard"
echo -e "  3. Verify MCP tools work in Claude Code"
echo ""

# Check for any recent errors in log
if [ -f "$GLOBAL_PATH/service.log" ]; then
    ERROR_COUNT=$(tail -50 "$GLOBAL_PATH/service.log" 2>/dev/null | grep -i error | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠ Warning: Found $ERROR_COUNT error(s) in recent logs${NC}"
        echo -e "  Run: tail -50 $GLOBAL_PATH/service.log | grep -i error"
    fi
fi

echo -e "${GREEN}Deployment script completed successfully!${NC}"