#!/bin/bash

# MCP Debug Host - Post-installation Configuration Hook
# This script runs after the main installation to finalize configuration

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MCP_HOME="${HOME}/.apm-debug-host"
INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Logging function
log() {
    echo -e "${BLUE}[POST-INSTALL]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Validate installation
validate_installation() {
    log "Validating installation..."
    
    # Check if configuration files exist
    if [[ ! -f "$MCP_HOME/config.json" ]]; then
        error "Configuration file not found: $MCP_HOME/config.json"
        exit 1
    fi
    
    if [[ ! -f "$MCP_HOME/.env" ]]; then
        error "Environment file not found: $MCP_HOME/.env"
        exit 1
    fi
    
    # Validate configuration
    cd "$INSTALL_DIR"
    if [[ -f "scripts/config-setup.js" ]]; then
        log "Validating configuration..."
        if ! node scripts/config-setup.js validate "$MCP_HOME/config.json"; then
            error "Configuration validation failed"
            exit 1
        fi
        success "Configuration validation passed"
    fi
    
    success "Installation validation completed"
}

# Configure system service
configure_service() {
    log "Configuring system service..."
    
    local service_name="apm-debug-host"
    
    # Detect init system
    if command -v systemctl &> /dev/null && [[ -d /etc/systemd/system ]]; then
        configure_systemd_service "$service_name"
    elif [[ "$OSTYPE" == "darwin"* ]] && [[ -d ~/Library/LaunchAgents ]]; then
        configure_launchd_service "$service_name"
    else
        warn "No supported init system detected. Manual service configuration required"
        return 0
    fi
}

# Configure systemd service (Linux)
configure_systemd_service() {
    local service_name="$1"
    local service_file="/etc/systemd/system/${service_name}.service"
    local user_service_file="$HOME/.config/systemd/user/${service_name}.service"
    
    log "Configuring systemd service..."
    
    # Create user service directory
    mkdir -p "$HOME/.config/systemd/user"
    
    # Generate service file from template
    if [[ -f "$INSTALL_DIR/templates/systemd.service.template" ]]; then
        log "Creating systemd service file..."
        
        # Replace placeholders in template
        sed -e "s|{{USER}}|$USER|g" \
            -e "s|{{HOME}}|$HOME|g" \
            -e "s|{{MCP_HOME}}|$MCP_HOME|g" \
            -e "s|{{INSTALL_DIR}}|$INSTALL_DIR|g" \
            -e "s|{{ENVIRONMENT}}|$ENVIRONMENT|g" \
            "$INSTALL_DIR/templates/systemd.service.template" > "$user_service_file"
        
        # Set permissions
        chmod 644 "$user_service_file"
        
        # Enable and start service
        systemctl --user daemon-reload
        systemctl --user enable "$service_name"
        
        success "Systemd service configured: $service_name"
        log "Use 'systemctl --user start $service_name' to start the service"
    else
        warn "Systemd service template not found"
    fi
}

# Configure launchd service (macOS)
configure_launchd_service() {
    local service_name="$1"
    local plist_file="$HOME/Library/LaunchAgents/com.apm.debug-host.plist"
    
    log "Configuring launchd service..."
    
    # Create LaunchAgents directory
    mkdir -p "$HOME/Library/LaunchAgents"
    
    # Generate plist file from template
    if [[ -f "$INSTALL_DIR/templates/launchd.plist.template" ]]; then
        log "Creating launchd plist file..."
        
        # Replace placeholders in template
        sed -e "s|{{USER}}|$USER|g" \
            -e "s|{{HOME}}|$HOME|g" \
            -e "s|{{MCP_HOME}}|$MCP_HOME|g" \
            -e "s|{{INSTALL_DIR}}|$INSTALL_DIR|g" \
            -e "s|{{ENVIRONMENT}}|$ENVIRONMENT|g" \
            "$INSTALL_DIR/templates/launchd.plist.template" > "$plist_file"
        
        # Set permissions
        chmod 644 "$plist_file"
        
        # Load service
        launchctl load "$plist_file"
        
        success "Launchd service configured: com.apm.debug-host"
        log "Use 'launchctl start com.apm.debug-host' to start the service"
    else
        warn "Launchd plist template not found"
    fi
}

# Configure environment
configure_environment() {
    log "Configuring environment..."
    
    # Add MCP Debug Host to PATH
    local shell_rc=""
    if [[ "$SHELL" == *"zsh"* ]]; then
        shell_rc="$HOME/.zshrc"
    elif [[ "$SHELL" == *"bash"* ]]; then
        shell_rc="$HOME/.bashrc"
    fi
    
    if [[ -n "$shell_rc" ]] && [[ -f "$shell_rc" ]]; then
        # Check if already configured
        if ! grep -q "apm-debug-host" "$shell_rc"; then
            log "Adding MCP Debug Host to shell configuration..."
            cat >> "$shell_rc" << EOF

# APM Debug Host Configuration
export MCP_HOME="$MCP_HOME"
alias mcp-debug="cd '$INSTALL_DIR' && npm start"
alias mcp-config="cd '$INSTALL_DIR' && node scripts/config-setup.js"
alias mcp-logs="tail -f '$MCP_HOME/logs/server.log'"

EOF
            success "Shell configuration updated: $shell_rc"
        fi
    fi
    
    # Create convenience scripts
    create_convenience_scripts
}

# Create convenience scripts
create_convenience_scripts() {
    log "Creating convenience scripts..."
    
    local bin_dir="$MCP_HOME/bin"
    mkdir -p "$bin_dir"
    
    # Create start script
    cat > "$bin_dir/start" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/.." || exit 1
npm start
EOF
    
    # Create stop script
    cat > "$bin_dir/stop" << 'EOF'
#!/bin/bash
pkill -f "apm-debug-host" || echo "No MCP Debug Host process found"
EOF
    
    # Create status script
    cat > "$bin_dir/status" << 'EOF'
#!/bin/bash
if pgrep -f "apm-debug-host" > /dev/null; then
    echo "MCP Debug Host is running"
    exit 0
else
    echo "MCP Debug Host is not running"
    exit 1
fi
EOF
    
    # Create logs script
    cat > "$bin_dir/logs" << EOF
#!/bin/bash
tail -f "$MCP_HOME/logs/server.log"
EOF
    
    # Create config script
    cat > "$bin_dir/config" << EOF
#!/bin/bash
cd "$INSTALL_DIR" || exit 1
node scripts/config-setup.js "\$@"
EOF
    
    # Make scripts executable
    chmod +x "$bin_dir"/*
    
    success "Convenience scripts created in: $bin_dir"
}

# Test configuration
test_configuration() {
    log "Testing configuration..."
    
    # Test Node.js execution
    cd "$INSTALL_DIR"
    
    if [[ -f "src/index.js" ]]; then
        log "Testing server startup..."
        
        # Set test environment
        export NODE_ENV="test"
        export PORT="0"  # Use random port
        
        # Test server can start (timeout after 10 seconds)
        timeout 10s node -e "
            const server = require('./src/index.js');
            console.log('Server test passed');
            process.exit(0);
        " 2>/dev/null && success "Server startup test passed" || warn "Server startup test failed"
    fi
    
    # Test configuration loading
    if [[ -f "scripts/config-setup.js" ]]; then
        log "Testing configuration loading..."
        if node -e "
            const ConfigManager = require('./src/config-manager.js');
            const manager = new ConfigManager();
            const config = require('$MCP_HOME/config.json');
            const validation = manager.validateConfig(config);
            if (validation.valid) {
                console.log('Configuration loading test passed');
                process.exit(0);
            } else {
                console.error('Configuration validation failed');
                process.exit(1);
            }
        "; then
            success "Configuration loading test passed"
        else
            warn "Configuration loading test failed"
        fi
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create log rotation configuration
    if command -v logrotate &> /dev/null; then
        local logrotate_config="/etc/logrotate.d/apm-debug-host"
        
        # Create logrotate configuration (requires sudo)
        if [[ -w /etc/logrotate.d ]]; then
            cat > "$logrotate_config" << EOF
$MCP_HOME/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 640 $USER $USER
}
EOF
            success "Log rotation configured"
        else
            warn "Cannot configure system log rotation (requires sudo)"
        fi
    fi
    
    # Setup basic monitoring cron job
    if command -v crontab &> /dev/null && [[ "$ENVIRONMENT" == "production" ]]; then
        log "Setting up monitoring cron job..."
        
        # Add health check cron job (every 5 minutes)
        (crontab -l 2>/dev/null; echo "*/5 * * * * $bin_dir/status > /dev/null || $bin_dir/start") | crontab -
        
        success "Monitoring cron job configured"
    fi
}

# Generate security report
generate_security_report() {
    log "Generating security report..."
    
    local report_file="$MCP_HOME/security-report.txt"
    
    cat > "$report_file" << EOF
MCP Debug Host Security Report
Generated: $(date)
Environment: $ENVIRONMENT

Configuration Files:
- Config: $MCP_HOME/config.json ($(stat -c %a "$MCP_HOME/config.json" 2>/dev/null || echo "unknown"))
- Environment: $MCP_HOME/.env ($(stat -c %a "$MCP_HOME/.env" 2>/dev/null || echo "unknown"))

Directory Permissions:
- MCP Home: $MCP_HOME ($(stat -c %a "$MCP_HOME" 2>/dev/null || echo "unknown"))
- Logs: $MCP_HOME/logs ($(stat -c %a "$MCP_HOME/logs" 2>/dev/null || echo "unknown"))
- Sessions: $MCP_HOME/sessions ($(stat -c %a "$MCP_HOME/sessions" 2>/dev/null || echo "unknown"))

Security Features:
- API Key: $(grep -q "API_KEY=" "$MCP_HOME/.env" && echo "Configured" || echo "Missing")
- Dashboard Auth: $(grep -q "DASHBOARD_AUTH_ENABLED=true" "$MCP_HOME/.env" && echo "Enabled" || echo "Disabled")
- Rate Limiting: $(grep -q "RATE_LIMIT_ENABLED=true" "$MCP_HOME/.env" && echo "Enabled" || echo "Disabled")
- CORS: $(grep -q "ENABLE_CORS=true" "$MCP_HOME/.env" && echo "Enabled" || echo "Disabled")

Recommendations:
$(if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "- ✓ Production environment detected"
    echo "- Ensure API key is strong and secure"
    echo "- Review allowed CORS origins"
    echo "- Enable all security features"
else
    echo "- Consider using production environment for deployment"
    echo "- Review security settings for your environment"
fi)

EOF
    
    success "Security report generated: $report_file"
}

# Display installation summary
display_summary() {
    log "Installation Summary:"
    echo ""
    echo "  🎯 Environment: $ENVIRONMENT"
    echo "  📁 MCP Home: $MCP_HOME"
    echo "  ⚙️  Configuration: $MCP_HOME/config.json"
    echo "  🔐 Environment: $MCP_HOME/.env"
    echo ""
    
    # Display generated credentials
    if [[ -f "$MCP_HOME/.env" ]]; then
        local api_key=$(grep "^API_KEY=" "$MCP_HOME/.env" | cut -d'=' -f2)
        local dashboard_pass=$(grep "^DASHBOARD_PASSWORD=" "$MCP_HOME/.env" | cut -d'=' -f2)
        
        if [[ -n "$api_key" ]]; then
            echo "  🔑 API Key: ${api_key:0:8}...${api_key: -8}"
        fi
        
        if [[ -n "$dashboard_pass" ]]; then
            echo "  🔒 Dashboard Password: ${dashboard_pass:0:4}...${dashboard_pass: -4}"
        fi
        echo ""
    fi
    
    # Display next steps
    echo "  📋 Next Steps:"
    echo "     1. Review configuration: $MCP_HOME/config.json"
    echo "     2. Start the service: $MCP_HOME/bin/start"
    echo "     3. Check logs: $MCP_HOME/bin/logs"
    echo "     4. Access dashboard: http://localhost:$(grep "^PORT=" "$MCP_HOME/.env" | cut -d'=' -f2 || echo "8080")"
    echo ""
    
    # Display useful commands
    echo "  🛠️  Useful Commands:"
    echo "     Status: $MCP_HOME/bin/status"
    echo "     Config: $MCP_HOME/bin/config --help"
    echo "     Logs: $MCP_HOME/bin/logs"
    echo ""
    
    success "Post-installation completed successfully!"
}

# Main execution
main() {
    log "Starting MCP Debug Host post-installation..."
    
    validate_installation
    configure_service
    configure_environment
    test_configuration
    setup_monitoring
    generate_security_report
    display_summary
    
    success "Post-installation hook completed"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi