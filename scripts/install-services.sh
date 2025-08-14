#!/bin/bash

# Install MCP Debug Host services

echo "Installing MCP Debug Host services..."

# Create service files
cat > /tmp/mcp-backend.service << 'EOF'
[Unit]
Description=MCP Debug Host Backend Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=dougw
Group=dougw
WorkingDirectory=/mnt/c/Code/MCPServers/DebugHostMCP
Environment="NODE_ENV=production"
Environment="PORT=2601"
ExecStart=/usr/bin/node /mnt/c/Code/MCPServers/DebugHostMCP/src/mcp-server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

cat > /tmp/mcp-dashboard.service << 'EOF'
[Unit]
Description=MCP Debug Host Dashboard
After=network.target mcp-backend.service
Wants=mcp-backend.service

[Service]
Type=simple
User=dougw
Group=dougw
WorkingDirectory=/mnt/c/Code/MCPServers/DebugHostMCP/dashboard
Environment="NODE_ENV=production"
Environment="PORT=2602"
ExecStartPre=/usr/bin/npm install --production
ExecStart=/usr/bin/npm run preview -- --port 2602 --host 127.0.0.1
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Copy service files to systemd directory
sudo cp /tmp/mcp-backend.service /etc/systemd/system/
sudo cp /tmp/mcp-dashboard.service /etc/systemd/system/

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable mcp-backend.service
sudo systemctl enable mcp-dashboard.service

# Start services
sudo systemctl start mcp-backend.service
sudo systemctl start mcp-dashboard.service

# Check status
echo ""
echo "Service status:"
sudo systemctl status mcp-backend.service --no-pager
echo ""
sudo systemctl status mcp-dashboard.service --no-pager

echo ""
echo "Services installed and started successfully!"
echo "Backend running on: http://localhost:2601"
echo "Dashboard running on: http://localhost:2602"