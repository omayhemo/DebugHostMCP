#!/bin/bash

# MCP Debug Host - Pre-installation Configuration Hook
# This script runs before the main installation to prepare the system

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
    echo -e "${BLUE}[PRE-INSTALL]${NC} $1"
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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+ first"
        exit 1
    fi
    
    local node_version=$(node --version | sed 's/v//')
    local required_version="18.0.0"
    
    if ! node -e "process.exit(process.version.replace('v','').split('.').map(Number).reduce((r,v,i)=>r+v*Math.pow(10,4-i*2),0) >= '$required_version'.split('.').map(Number).reduce((r,v,i)=>r+v*Math.pow(10,4-i*2),0) ? 0 : 1)"; then
        error "Node.js version $node_version is not supported. Please upgrade to Node.js 18+"
        exit 1
    fi
    
    success "Node.js version $node_version is supported"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not available. Please install npm"
        exit 1
    fi
    
    # Check disk space (require at least 500MB)
    local available_space=$(df "$HOME" | awk 'NR==2 {print $4}')
    local required_space=512000  # 500MB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        error "Insufficient disk space. At least 500MB required in home directory"
        exit 1
    fi
    
    success "System requirements check passed"
}

# Backup existing configuration
backup_existing_config() {
    if [[ -d "$MCP_HOME" ]]; then
        log "Existing MCP Debug Host installation detected"
        
        local backup_dir="${MCP_HOME}/backups"
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        local backup_name="pre-install-backup-${timestamp}"
        
        mkdir -p "$backup_dir"
        
        if [[ -f "$MCP_HOME/config.json" ]]; then
            cp "$MCP_HOME/config.json" "$backup_dir/${backup_name}.json"
            log "Configuration backed up to: $backup_dir/${backup_name}.json"
        fi
        
        if [[ -f "$MCP_HOME/.env" ]]; then
            cp "$MCP_HOME/.env" "$backup_dir/${backup_name}.env"
            log "Environment file backed up to: $backup_dir/${backup_name}.env"
        fi
        
        success "Existing configuration backed up"
    fi
}

# Create directory structure
create_directories() {
    log "Creating directory structure..."
    
    # Create MCP home directory with secure permissions
    mkdir -p "$MCP_HOME"
    chmod 700 "$MCP_HOME"
    
    # Create subdirectories
    mkdir -p "$MCP_HOME"/{logs,sessions,cache,backups,temp}
    chmod 700 "$MCP_HOME"/{logs,sessions,cache,backups,temp}
    
    success "Directory structure created"
}

# Detect environment
detect_environment() {
    log "Detecting environment..."
    
    # Auto-detect environment if not specified
    if [[ -z "${ENVIRONMENT:-}" ]]; then
        if [[ -n "${CI:-}" ]] || [[ -n "${GITHUB_ACTIONS:-}" ]] || [[ -n "${GITLAB_CI:-}" ]]; then
            ENVIRONMENT="staging"
        elif [[ "$PWD" == *"/dev"* ]] || [[ "$PWD" == *"/development"* ]]; then
            ENVIRONMENT="development"
        elif [[ -n "${PROD:-}" ]] || [[ -n "${PRODUCTION:-}" ]]; then
            ENVIRONMENT="production"
        else
            # Default to production for safety
            ENVIRONMENT="production"
        fi
    fi
    
    log "Target environment: $ENVIRONMENT"
    export ENVIRONMENT
}

# Validate installation directory
validate_install_dir() {
    log "Validating installation directory..."
    
    if [[ ! -d "$INSTALL_DIR" ]]; then
        error "Installation directory not found: $INSTALL_DIR"
        exit 1
    fi
    
    # Check for required files
    local required_files=(
        "package.json"
        "config.json.template"
        ".env.template"
        "src/config-manager.js"
        "scripts/config-setup.js"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$INSTALL_DIR/$file" ]]; then
            error "Required file missing: $file"
            exit 1
        fi
    done
    
    success "Installation directory validated"
}

# Check for configuration conflicts
check_conflicts() {
    log "Checking for configuration conflicts..."
    
    # Check if port is available
    local port="${PORT:-8080}"
    if command -v netstat &> /dev/null; then
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            warn "Port $port appears to be in use. You may need to configure a different port"
        fi
    elif command -v ss &> /dev/null; then
        if ss -tlnp 2>/dev/null | grep -q ":$port "; then
            warn "Port $port appears to be in use. You may need to configure a different port"
        fi
    fi
    
    # Check for conflicting processes
    if pgrep -f "apm-debug-host" > /dev/null; then
        warn "MCP Debug Host process is already running. It will be stopped during installation"
    fi
    
    success "Conflict check completed"
}

# Generate pre-configuration
generate_pre_config() {
    log "Generating pre-installation configuration..."
    
    # Set environment variables for configuration generation
    export MCP_HOME
    export ENVIRONMENT
    
    # Generate configuration using the setup script
    cd "$INSTALL_DIR"
    
    if [[ -f "scripts/config-setup.js" ]]; then
        log "Running configuration setup script..."
        
        # Install dependencies if needed
        if [[ ! -d "node_modules" ]]; then
            log "Installing dependencies..."
            npm install --production --silent
        fi
        
        # Generate configuration
        node scripts/config-setup.js generate "$ENVIRONMENT" --output "$MCP_HOME" --force
        
        success "Pre-configuration generated"
    else
        warn "Configuration setup script not found. Manual configuration will be required"
    fi
}

# Set file permissions
set_permissions() {
    log "Setting secure file permissions..."
    
    # Secure configuration files
    if [[ -f "$MCP_HOME/config.json" ]]; then
        chmod 600 "$MCP_HOME/config.json"
    fi
    
    if [[ -f "$MCP_HOME/.env" ]]; then
        chmod 600 "$MCP_HOME/.env"
    fi
    
    # Set directory permissions
    find "$MCP_HOME" -type d -exec chmod 700 {} \;
    find "$MCP_HOME" -type f -exec chmod 600 {} \;
    
    success "File permissions configured"
}

# Display summary
display_summary() {
    log "Pre-installation summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  MCP Home: $MCP_HOME"
    echo "  Install Dir: $INSTALL_DIR"
    
    if [[ -f "$MCP_HOME/config.json" ]]; then
        echo "  Configuration: Ready"
    else
        echo "  Configuration: Manual setup required"
    fi
    
    success "Pre-installation completed successfully"
}

# Main execution
main() {
    log "Starting MCP Debug Host pre-installation..."
    
    check_root
    check_requirements
    detect_environment
    validate_install_dir
    backup_existing_config
    create_directories
    check_conflicts
    generate_pre_config
    set_permissions
    display_summary
    
    success "Pre-installation hook completed"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi