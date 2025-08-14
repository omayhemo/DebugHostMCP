#!/bin/bash

# Publish PlopDock to Production
# This script copies the development version to the global installation

echo "🚢 Publishing PlopDock to Production"
echo "========================================"
echo ""

# Define paths
DEV_PATH="/mnt/c/Code/MCPServers/DebugHostMCP"
PROD_PATH="$HOME/.plopdock"
OLD_PROD_PATH="$HOME/.apm-debug-host"

# Stop any running production services
echo "⏸️  Stopping existing production services..."
pkill -f "plopdock/src/index.js" 2>/dev/null
pkill -f "apm-debug-host/src/index.js" 2>/dev/null
pkill -f "src/mcp-server.js" 2>/dev/null
pkill -f "preview.*2602" 2>/dev/null
sleep 2

# Backup existing production if it exists
if [ -d "$PROD_PATH" ]; then
    echo "📦 Backing up existing production to ${PROD_PATH}.backup..."
    rm -rf "${PROD_PATH}.backup"
    mv "$PROD_PATH" "${PROD_PATH}.backup"
fi

# Remove old installation path if it exists
if [ -d "$OLD_PROD_PATH" ]; then
    echo "🗑️  Removing old installation at ${OLD_PROD_PATH}..."
    rm -rf "$OLD_PROD_PATH"
fi

# Create production directory
echo "📁 Creating production directory at ${PROD_PATH}..."
mkdir -p "$PROD_PATH"

# Copy all files except node_modules and unnecessary directories
echo "📋 Copying files to production..."
rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'coverage' \
    --exclude 'dist' \
    --exclude 'tmp' \
    --exclude 'data/logs/*' \
    --exclude '*.log' \
    --exclude '.env.local' \
    --exclude '.env.*.local' \
    "$DEV_PATH/" "$PROD_PATH/"

# Install production dependencies for main project
echo "📦 Installing production dependencies..."
cd "$PROD_PATH"
npm ci --production --silent

# Build dashboard for production
echo "🎨 Building dashboard for production..."
cd "$PROD_PATH/dashboard"
npm ci --silent
npm run build --silent

# Create global command symlink
echo "🔗 Creating global command symlink..."
mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/plopdock" << 'EOF'
#!/bin/bash
node ~/.plopdock/src/mcp-stdio-server.js "$@"
EOF
chmod +x "$HOME/.local/bin/plopdock"

# Update MCP configuration for Claude
echo "⚙️  Updating MCP configuration for Claude..."
MCP_CONFIG="$HOME/.config/claude/mcp.json"
if [ -f "$MCP_CONFIG" ]; then
    # Backup existing config
    cp "$MCP_CONFIG" "${MCP_CONFIG}.backup"
    
    # Update configuration to use new path
    # This is a simplified update - in production you'd use jq or similar
    echo "   Note: Please manually update $MCP_CONFIG to point to $PROD_PATH"
fi

# Create systemd service file (optional)
echo "🔧 Creating systemd service file..."
cat > "$HOME/.config/systemd/user/plopdock.service" << EOF
[Unit]
Description=PlopDock Platform
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROD_PATH
ExecStart=/usr/bin/node $PROD_PATH/src/mcp-server.js
Restart=always
RestartSec=10
StandardOutput=append:$HOME/.plopdock/logs/service.log
StandardError=append:$HOME/.plopdock/logs/service.log

[Install]
WantedBy=default.target
EOF

# Verify installation
echo ""
echo "✅ Verifying installation..."
if [ -f "$PROD_PATH/package.json" ]; then
    VERSION=$(grep '"version"' "$PROD_PATH/package.json" | cut -d'"' -f4)
    NAME=$(grep '"name"' "$PROD_PATH/package.json" | cut -d'"' -f4)
    echo "   Package: $NAME v$VERSION"
fi

if [ -d "$PROD_PATH/src" ]; then
    echo "   ✓ Source files installed"
fi

if [ -d "$PROD_PATH/dashboard/dist" ]; then
    echo "   ✓ Dashboard built successfully"
fi

if [ -f "$HOME/.local/bin/plopdock" ]; then
    echo "   ✓ Global command installed"
fi

# Start production services
echo ""
echo "🚀 Starting production services..."
cd "$PROD_PATH"
bash start-persistent.sh

echo ""
echo "🎉 PlopDock Published to Production!"
echo "========================================="
echo ""
echo "Production Path: $PROD_PATH"
echo "Global Command: plopdock"
echo ""
echo "Services:"
echo "  Backend: http://localhost:2601"
echo "  Dashboard: http://localhost:2602"
echo ""
echo "To manage the service:"
echo "  Start: systemctl --user start plopdock"
echo "  Stop: systemctl --user stop plopdock"
echo "  Status: systemctl --user status plopdock"
echo ""
echo "🚢 Just plop it down and dock it!"