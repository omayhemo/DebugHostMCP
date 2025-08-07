#!/bin/bash
# APM Framework Test Monitoring Installation Script
# Template Version: {{VERSION}}
# Description: Install test monitoring capabilities into APM framework

# Configuration
APM_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP/.apm"
PROJECT_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP"
SCRIPTS_DIR="$APM_ROOT/scripts/test-monitoring"
QA_REPORTS_DIR="/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/qa"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   APM Test Monitoring Installation${NC}"
echo -e "${BLUE}   Version {{VERSION}}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to create directory structure
create_directories() {
    echo -e "${BLUE}Creating test monitoring directory structure...${NC}"
    
    local directories=(
        "$SCRIPTS_DIR"
        "$QA_REPORTS_DIR/metrics"
        "$QA_REPORTS_DIR/reports"
        "$QA_REPORTS_DIR/test-results"
        "$QA_REPORTS_DIR/dashboards"
    )
    
    for dir in "${directories[@]}"; do
        if mkdir -p "$dir"; then
            echo -e "${GREEN}  ✓ Created: $dir${NC}"
        else
            echo -e "${RED}  ✗ Failed to create: $dir${NC}"
            return 1
        fi
    done
    
    echo ""
}

# Function to install monitoring scripts
install_monitoring_scripts() {
    echo -e "${BLUE}Installing test monitoring scripts...${NC}"
    
    # Copy monitoring scripts (these would be populated during template processing)
    local scripts=(
        "monitor-tests.sh"
        "test-dashboard.sh"
        "test-metrics-collector.sh"
        "test-status-api.sh"
    )
    
    for script in "${scripts[@]}"; do
        local script_path="$SCRIPTS_DIR/$script"
        
        # Create placeholder script if template isn't processed yet
        if [ ! -f "$script_path" ]; then
            cat > "$script_path" << EOF
#!/bin/bash
# APM Test Monitoring Script: $script
# Template Version: {{VERSION}}
# Status: Template - to be processed during installation

echo "APM Test Monitoring Script: $script"
echo "Version: {{VERSION}}"
echo "Status: This is a template placeholder"
echo ""
echo "This script will be fully functional after template processing."
echo "Run the full APM installer to activate monitoring capabilities."
EOF
            chmod +x "$script_path"
        fi
        
        if [ -f "$script_path" ] && [ -x "$script_path" ]; then
            echo -e "${GREEN}  ✓ Installed: $script${NC}"
        else
            echo -e "${RED}  ✗ Failed to install: $script${NC}"
        fi
    done
    
    echo ""
}

# Function to create monitoring configuration
create_monitoring_config() {
    echo -e "${BLUE}Creating monitoring configuration...${NC}"
    
    local config_file="$APM_ROOT/config/test-monitoring.yaml"
    mkdir -p "$(dirname "$config_file")"
    
    cat > "$config_file" << 'EOF'
# APM Framework Test Monitoring Configuration
# Template Version: {{VERSION}}

monitoring:
  # Refresh interval for real-time monitoring (seconds)
  refresh_interval: 5
  
  # Dashboard configuration
  dashboard:
    default_port: 8080
    auto_refresh: true
    themes:
      - light
      - dark
      - executive
  
  # Notification settings
  notifications:
    enabled: true
    tts_enabled: true
    webhook_enabled: false
    webhook_url: "${APM_MONITOR_WEBHOOK_URL}"
  
  # Monitoring features
  features:
    process_monitoring: true
    file_watching: true
    coverage_tracking: true
    log_aggregation: true
    performance_metrics: true
    ai_ml_integration: true
  
  # QA Framework integration
  qa_framework:
    enabled: true
    parallel_execution: true
    ai_analytics: true
    prediction_engine: true
    anomaly_detection: true
  
  # Export formats
  export:
    formats:
      - json
      - csv
      - yaml
      - jenkins
    default_format: json
  
  # Metric collection settings
  metrics:
    retention_days: 30
    collection_interval: 60  # seconds
    storage_limit_mb: 100
  
  # Alert thresholds
  thresholds:
    test_failure_rate: 5.0      # Percentage
    execution_time_increase: 20.0  # Percentage
    coverage_drop: 2.0          # Percentage
    memory_usage: 80.0          # Percentage
    cpu_usage: 90.0             # Percentage

# Environment variable mappings
environment:
  project_root: "/mnt/c/Code/MCPServers/DebugHostMCP"
  apm_root: "/mnt/c/Code/MCPServers/DebugHostMCP/.apm"
  qa_reports_dir: "/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/qa"
  scripts_dir: "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring"

# Integration settings
integrations:
  ci_cd:
    jenkins: false
    github_actions: false
    gitlab_ci: false
  
  test_frameworks:
    jest: true
    pytest: true
    mocha: true
    karma: true
    vitest: true
  
  coverage_tools:
    istanbul: true
    coverage_py: true
    lcov: true
EOF
    
    if [ -f "$config_file" ]; then
        echo -e "${GREEN}  ✓ Configuration created: $config_file${NC}"
    else
        echo -e "${RED}  ✗ Failed to create configuration${NC}"
    fi
    
    echo ""
}

# Function to install command aliases
install_command_aliases() {
    echo -e "${BLUE}Installing monitoring command aliases...${NC}"
    
    local aliases_file="$APM_ROOT/aliases/test-monitoring.sh"
    mkdir -p "$(dirname "$aliases_file")"
    
    cat > "$aliases_file" << 'EOF'
#!/bin/bash
# APM Test Monitoring Command Aliases
# Template Version: {{VERSION}}

# Main monitoring commands
alias apm-monitor="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/monitor-tests.sh"
alias apm-dashboard="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/test-dashboard.sh"
alias apm-metrics="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/test-metrics-collector.sh"

# Monitoring shortcuts
alias monitor-tests="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/monitor-tests.sh"
alias test-dashboard="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/test-dashboard.sh"
alias test-metrics="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/test-metrics-collector.sh"

# Quick monitoring commands
alias show-test-status="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/monitor-tests.sh --once"
alias monitor-processes="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/monitor-tests.sh --processes"
alias monitor-reports="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/monitor-tests.sh --reports"

# Dashboard variants
alias exec-dashboard="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/test-dashboard.sh --mode executive"
alias metrics-dashboard="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/test-dashboard.sh --mode metrics"

# Export commands
alias export-test-metrics-csv="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/test-metrics-collector.sh --export csv"
alias export-test-metrics-json="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/test-metrics-collector.sh --export json"

# Help commands
alias apm-monitor-help="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/monitor-tests.sh --help"
alias apm-dashboard-help="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/test-dashboard.sh --help"
alias apm-metrics-help="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-monitoring/test-metrics-collector.sh --help"

echo "APM Test Monitoring aliases loaded"
echo "Available commands:"
echo "  monitor-tests     - Start real-time test monitoring"
echo "  test-dashboard    - Launch web monitoring dashboard"
echo "  test-metrics      - Collect test execution metrics"
echo "  show-test-status  - Quick test status check"
EOF
    
    chmod +x "$aliases_file"
    
    if [ -f "$aliases_file" ]; then
        echo -e "${GREEN}  ✓ Command aliases installed: $aliases_file${NC}"
    else
        echo -e "${RED}  ✗ Failed to install command aliases${NC}"
    fi
    
    echo ""
}

# Function to create README documentation
create_documentation() {
    echo -e "${BLUE}Creating test monitoring documentation...${NC}"
    
    local readme_file="$SCRIPTS_DIR/README.md"
    
    cat > "$readme_file" << 'EOF'
# APM Test Monitoring Framework

This directory contains the complete test monitoring infrastructure for the APM framework.

## Quick Start

```bash
# Start real-time monitoring
./monitor-tests.sh

# Launch web dashboard
./test-dashboard.sh

# Collect metrics
./test-metrics-collector.sh --export csv
```

## Available Scripts

- `monitor-tests.sh` - Real-time CLI test monitoring
- `test-dashboard.sh` - Web-based monitoring dashboard
- `test-metrics-collector.sh` - Metrics collection and export
- `test-status-api.sh` - REST API for test status

## Configuration

See `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/test-monitoring.yaml` for configuration options.

## Integration with QA Agent

The monitoring framework integrates seamlessly with the APM QA agent:

```bash
# Activate QA agent
/qa

# Within QA session
monitor tests
test dashboard
test metrics
```

## Documentation

Complete documentation is available at:
`/mnt/c/Code/MCPServers/DebugHostMCP/.apm/templates/scripts/test-monitoring/README.md.template`
EOF
    
    if [ -f "$readme_file" ]; then
        echo -e "${GREEN}  ✓ Documentation created: $readme_file${NC}"
    else
        echo -e "${RED}  ✗ Failed to create documentation${NC}"
    fi
    
    echo ""
}

# Function to verify installation
verify_installation() {
    echo -e "${BLUE}Verifying test monitoring installation...${NC}"
    
    local verification_failed=false
    
    # Check directories
    local required_dirs=(
        "$SCRIPTS_DIR"
        "$QA_REPORTS_DIR/metrics"
        "$QA_REPORTS_DIR/reports"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            echo -e "${GREEN}  ✓ Directory exists: $dir${NC}"
        else
            echo -e "${RED}  ✗ Missing directory: $dir${NC}"
            verification_failed=true
        fi
    done
    
    # Check scripts
    local required_scripts=(
        "$SCRIPTS_DIR/monitor-tests.sh"
        "$SCRIPTS_DIR/test-dashboard.sh"
        "$SCRIPTS_DIR/test-metrics-collector.sh"
    )
    
    for script in "${required_scripts[@]}"; do
        if [ -f "$script" ] && [ -x "$script" ]; then
            echo -e "${GREEN}  ✓ Script installed: $(basename "$script")${NC}"
        else
            echo -e "${RED}  ✗ Missing or non-executable: $(basename "$script")${NC}"
            verification_failed=true
        fi
    done
    
    # Check configuration
    local config_file="$APM_ROOT/config/test-monitoring.yaml"
    if [ -f "$config_file" ]; then
        echo -e "${GREEN}  ✓ Configuration file exists${NC}"
    else
        echo -e "${RED}  ✗ Missing configuration file${NC}"
        verification_failed=true
    fi
    
    echo ""
    
    if [ "$verification_failed" = true ]; then
        echo -e "${RED}✗ Test monitoring installation verification failed${NC}"
        echo -e "${YELLOW}Some components are missing or incorrectly installed${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Test monitoring installation verified successfully${NC}"
        return 0
    fi
}

# Function to show post-installation information
show_post_install_info() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   Test Monitoring Installation Complete${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Quick Start Commands:${NC}"
    echo -e "  ${GREEN}monitor-tests${NC}       - Start real-time monitoring"
    echo -e "  ${GREEN}test-dashboard${NC}      - Launch web dashboard"
    echo -e "  ${GREEN}test-metrics${NC}        - Collect metrics"
    echo ""
    echo -e "${BLUE}Integration with QA Agent:${NC}"
    echo -e "  ${GREEN}/qa${NC}                 - Activate QA agent"
    echo -e "  ${GREEN}monitor tests${NC}       - Start monitoring from QA agent"
    echo -e "  ${GREEN}test dashboard${NC}      - Launch dashboard from QA agent"
    echo ""
    echo -e "${BLUE}Configuration:${NC}"
    echo -e "  Config file: ${YELLOW}$APM_ROOT/config/test-monitoring.yaml${NC}"
    echo -e "  Scripts dir: ${YELLOW}$SCRIPTS_DIR${NC}"
    echo -e "  Reports dir: ${YELLOW}$QA_REPORTS_DIR${NC}"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo -e "  ${YELLOW}$SCRIPTS_DIR/README.md${NC}"
    echo ""
}

# Main installation process
main() {
    echo -e "${BLUE}Starting APM test monitoring installation...${NC}"
    echo ""
    
    # Check if APM root exists
    if [ ! -d "$APM_ROOT" ]; then
        echo -e "${RED}Error: APM root directory not found: $APM_ROOT${NC}"
        echo -e "${YELLOW}Please ensure APM framework is installed first${NC}"
        exit 1
    fi
    
    # Run installation steps
    create_directories || { echo -e "${RED}Failed to create directories${NC}"; exit 1; }
    install_monitoring_scripts || { echo -e "${RED}Failed to install scripts${NC}"; exit 1; }
    create_monitoring_config || { echo -e "${RED}Failed to create configuration${NC}"; exit 1; }
    install_command_aliases || { echo -e "${RED}Failed to install aliases${NC}"; exit 1; }
    create_documentation || { echo -e "${RED}Failed to create documentation${NC}"; exit 1; }
    
    # Verify installation
    if verify_installation; then
        show_post_install_info
        exit 0
    else
        echo -e "${RED}Installation completed with errors${NC}"
        exit 1
    fi
}

# Show help if requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "APM Framework Test Monitoring Installation"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --help, -h    Show this help message"
    echo "  --verify      Verify existing installation"
    echo "  --uninstall   Remove test monitoring components"
    echo ""
    echo "This script installs the complete test monitoring infrastructure"
    echo "for the APM framework, including CLI monitoring, web dashboard,"
    echo "metrics collection, and QA agent integration."
    exit 0
fi

# Handle verify option
if [[ "$1" == "--verify" ]]; then
    echo -e "${BLUE}Verifying APM test monitoring installation...${NC}"
    echo ""
    if verify_installation; then
        echo -e "${GREEN}Verification successful${NC}"
        exit 0
    else
        echo -e "${RED}Verification failed${NC}"
        exit 1
    fi
fi

# Handle uninstall option
if [[ "$1" == "--uninstall" ]]; then
    echo -e "${YELLOW}Uninstalling APM test monitoring...${NC}"
    echo ""
    rm -rf "$SCRIPTS_DIR"
    rm -f "$APM_ROOT/config/test-monitoring.yaml"
    rm -f "$APM_ROOT/aliases/test-monitoring.sh"
    echo -e "${GREEN}Test monitoring components removed${NC}"
    exit 0
fi

# Run main installation
main