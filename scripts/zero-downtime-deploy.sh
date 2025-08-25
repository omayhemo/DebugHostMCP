#!/bin/bash

# Zero-Downtime Production Deployment Script
# PlopDock v2.0 → v2.1 Multi-Tech Stack Process Discovery
#
# Features:
# - Blue-green deployment with instant rollback
# - Feature flag controlled phased rollout 
# - Comprehensive validation at each step
# - < 5 minute rollback guarantee
# - Performance monitoring and automated triggers
# - Data preservation and migration
#
# Usage: ./zero-downtime-deploy.sh [options]
# Options:
#   --dry-run           Execute deployment simulation without changes
#   --skip-validation   Skip pre-deployment validation (not recommended)
#   --rollback-only     Execute rollback procedure only
#   --phase <1-3>       Deploy only specific phase (1=engine, 2=tools, 3=dashboard)
#   --force             Force deployment even with warnings
#   --monitoring-duration <seconds>  Duration for continuous monitoring (default: 300)

set -euo pipefail

# =============================================================================
# CONFIGURATION AND ENVIRONMENT SETUP
# =============================================================================

# Script metadata
SCRIPT_VERSION="2.1.0"
DEPLOYMENT_ID="deploy_$(date +%s)_$(openssl rand -hex 4 2>/dev/null || echo "fallback")"
START_TIME=$(date +%s)

# Paths and directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEV_PATH="$PROJECT_ROOT"
PROD_PATH="$HOME/.plopdock"
BACKUP_PATH="$HOME/.plopdock-backups"
DATA_DIR="$PROD_PATH/data"

# Logging
LOG_DIR="$PROD_PATH/logs"
DEPLOY_LOG="$LOG_DIR/deployment.log"
VALIDATION_LOG="$LOG_DIR/validation.log"
MONITORING_LOG="$LOG_DIR/monitoring.log"

# Performance targets
MAX_DISCOVERY_TIME=2000    # 2 seconds
MAX_MCP_RESPONSE_TIME=500  # 500ms
MAX_MEMORY_OVERHEAD=50     # 50MB
MAX_CPU_USAGE=5.0          # 5%

# Deployment options (set defaults)
DRY_RUN=false
SKIP_VALIDATION=false
ROLLBACK_ONLY=false
FORCE_DEPLOY=false
DEPLOY_PHASE=""
MONITORING_DURATION=300    # 5 minutes

# Service configuration
BACKEND_PORT=2601
DASHBOARD_PORT=2602
BACKEND_PID_FILE="$PROD_PATH/backend.pid"
DASHBOARD_PID_FILE="$PROD_PATH/dashboard.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Enhanced logging with timestamps and log levels
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local color_code=""
    
    case "$level" in
        INFO)  color_code="$GREEN" ;;
        WARN)  color_code="$YELLOW" ;;
        ERROR) color_code="$RED" ;;
        DEBUG) color_code="$BLUE" ;;
        *)     color_code="$NC" ;;
    esac
    
    # Console output with color
    echo -e "${color_code}[$timestamp] [$level] $message${NC}"
    
    # File logging without color codes
    echo "[$timestamp] [$level] $message" >> "$DEPLOY_LOG" 2>/dev/null || true
}

# Create announcement banners
announce() {
    local title="$1"
    local width=80
    local padding=$((($width - ${#title} - 4) / 2))
    
    echo
    printf '%*s' "$width" | tr ' ' '='
    echo
    printf "%*s🚀 %s %s%*s\n" "$padding" "" "$title" "$((padding % 2 ? " " : ""))" "$padding" ""
    printf '%*s' "$width" | tr ' ' '='
    echo
}

# Progress indicator
show_progress() {
    local current=$1
    local total=$2
    local description="${3:-Processing}"
    local percent=$((current * 100 / total))
    local progress_bar_length=40
    local filled_length=$((percent * progress_bar_length / 100))
    
    printf "\r%s [" "$description"
    printf "%*s" "$filled_length" | tr ' ' '█'
    printf "%*s" "$((progress_bar_length - filled_length))" | tr ' ' '░'
    printf "] %d%% (%d/%d)" "$percent" "$current" "$total"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Ensure required directories exist
ensure_directories() {
    local dirs=(
        "$PROD_PATH"
        "$BACKUP_PATH"
        "$DATA_DIR"
        "$LOG_DIR"
        "$BACKUP_PATH/v2.0"
        "$BACKUP_PATH/deployment-states"
    )
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir" || {
                log ERROR "Failed to create directory: $dir"
                return 1
            }
        fi
    done
}

# Get current system metrics
get_system_metrics() {
    local cpu_usage=""
    local memory_mb=""
    local disk_usage=""
    
    # CPU usage (simplified)
    if command_exists top; then
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 2>/dev/null || echo "0")
    else
        cpu_usage="0"
    fi
    
    # Memory usage
    if command_exists free; then
        memory_mb=$(free -m | awk 'NR==2{print $3}')
    else
        memory_mb="0"
    fi
    
    # Disk usage for PROD_PATH
    if command_exists df; then
        disk_usage=$(df -h "$PROD_PATH" 2>/dev/null | awk 'NR==2{print $5}' | cut -d'%' -f1 || echo "0")
    else
        disk_usage="0"
    fi
    
    echo "{\"cpu\": $cpu_usage, \"memory_mb\": $memory_mb, \"disk_percent\": $disk_usage}"
}

# Wait for service to be ready
wait_for_service() {
    local port="$1"
    local service_name="$2"
    local max_attempts="${3:-30}"
    local attempt=1
    
    log INFO "Waiting for $service_name on port $port..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -f "http://127.0.0.1:$port/health" >/dev/null 2>&1; then
            log INFO "$service_name is ready (attempt $attempt)"
            return 0
        fi
        
        sleep 1
        ((attempt++))
    done
    
    log ERROR "$service_name failed to start on port $port after $max_attempts attempts"
    return 1
}

# Stop service gracefully
stop_service() {
    local service_name="$1"
    local pid_file="$2"
    local timeout="${3:-10}"
    
    if [[ -f "$pid_file" ]]; then
        local pid
        pid=$(cat "$pid_file")
        
        if kill -0 "$pid" 2>/dev/null; then
            log INFO "Stopping $service_name (PID: $pid)..."
            kill -TERM "$pid" 2>/dev/null || true
            
            # Wait for graceful shutdown
            local elapsed=0
            while kill -0 "$pid" 2>/dev/null && [[ $elapsed -lt $timeout ]]; do
                sleep 1
                ((elapsed++))
            done
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                log WARN "Force killing $service_name"
                kill -KILL "$pid" 2>/dev/null || true
            fi
        fi
        
        rm -f "$pid_file"
    fi
    
    # Also kill by pattern (fallback)
    pkill -f "$service_name" 2>/dev/null || true
}

# =============================================================================
# VALIDATION FRAMEWORK INTEGRATION
# =============================================================================

run_validation_suite() {
    local suite_type="$1"
    local validation_cmd="node $PROJECT_ROOT/src/validation/run-validation.js"
    
    log INFO "Running $suite_type validation suite..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "[DRY RUN] Would run $suite_type validation"
        return 0
    fi
    
    # Create validation runner script if it doesn't exist
    if [[ ! -f "$PROJECT_ROOT/src/validation/run-validation.js" ]]; then
        create_validation_runner
    fi
    
    if ! $validation_cmd "$suite_type" >> "$VALIDATION_LOG" 2>&1; then
        log ERROR "$suite_type validation failed - check $VALIDATION_LOG"
        return 1
    fi
    
    log INFO "$suite_type validation passed"
    return 0
}

create_validation_runner() {
    cat > "$PROJECT_ROOT/src/validation/run-validation.js" << 'EOF'
#!/usr/bin/env node

const { DeploymentValidator } = require('./deployment-validator');

async function main() {
    const suiteType = process.argv[2] || 'pre-deployment';
    
    const validator = new DeploymentValidator({
        dataDir: process.env.PROD_PATH + '/data',
        prodPath: process.env.PROD_PATH
    });
    
    try {
        let results;
        switch (suiteType) {
            case 'pre-deployment':
                results = await validator.validatePreDeployment();
                break;
            case 'post-deployment':
                results = await validator.validatePostDeployment();
                break;
            case 'performance':
                results = await validator.validatePerformance();
                break;
            case 'continuous':
                results = await validator.validateContinuous(parseInt(process.env.MONITORING_DURATION) * 1000);
                break;
            default:
                throw new Error(`Unknown validation suite: ${suiteType}`);
        }
        
        console.log(`Validation suite '${suiteType}' completed`);
        console.log(`Results: ${results.passed}/${results.total} tests passed`);
        
        if (results.criticalFailures > 0) {
            console.error(`Critical failures: ${results.criticalFailures}`);
            process.exit(1);
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error(`Validation failed: ${error.message}`);
        process.exit(1);
    }
}

main().catch(error => {
    console.error(`Validation runner error: ${error.message}`);
    process.exit(1);
});
EOF
    chmod +x "$PROJECT_ROOT/src/validation/run-validation.js"
}

# =============================================================================
# BACKUP AND ROLLBACK SYSTEM
# =============================================================================

create_deployment_backup() {
    local backup_id="$1"
    local backup_dir="$BACKUP_PATH/deployment-states/$backup_id"
    
    log INFO "Creating deployment backup: $backup_id"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "[DRY RUN] Would create backup in $backup_dir"
        return 0
    fi
    
    mkdir -p "$backup_dir"
    
    # Backup critical production files
    if [[ -d "$PROD_PATH" ]]; then
        tar -czf "$backup_dir/production-state.tar.gz" -C "$PROD_PATH" . 2>/dev/null || {
            log ERROR "Failed to create production backup"
            return 1
        }
    fi
    
    # Backup data directory separately
    if [[ -d "$DATA_DIR" ]]; then
        tar -czf "$backup_dir/data-state.tar.gz" -C "$DATA_DIR" . 2>/dev/null || {
            log WARN "Failed to backup data directory"
        }
    fi
    
    # Create backup manifest
    cat > "$backup_dir/backup-manifest.json" << EOF
{
    "backupId": "$backup_id",
    "deploymentId": "$DEPLOYMENT_ID",
    "version": "2.0.0",
    "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "scriptVersion": "$SCRIPT_VERSION",
    "files": [
        "production-state.tar.gz",
        "data-state.tar.gz"
    ],
    "systemMetrics": $(get_system_metrics)
}
EOF
    
    log INFO "Backup created successfully: $backup_dir"
    echo "$backup_dir" > "$BACKUP_PATH/latest-backup.txt"
}

execute_rollback() {
    local backup_id="${1:-$(cat "$BACKUP_PATH/latest-backup.txt" 2>/dev/null | basename || "")}"
    local backup_dir="$BACKUP_PATH/deployment-states/$backup_id"
    local rollback_start_time=$(date +%s)
    
    announce "EXECUTING EMERGENCY ROLLBACK"
    log WARN "Starting rollback to backup: $backup_id"
    
    if [[ ! -d "$backup_dir" ]]; then
        log ERROR "Backup directory not found: $backup_dir"
        return 1
    fi
    
    # Step 1: Stop current services
    log INFO "Stopping current services..."
    stop_service "backend" "$BACKEND_PID_FILE" 5
    stop_service "dashboard" "$DASHBOARD_PID_FILE" 5
    
    # Step 2: Disable all feature flags
    log INFO "Disabling all feature flags..."
    if command_exists node && [[ -f "$PROD_PATH/src/config/feature-flags.js" ]]; then
        node -e "
            const { getFeatureFlagManager } = require('$PROD_PATH/src/config/feature-flags.js');
            const fm = getFeatureFlagManager();
            const status = fm.getRolloutStatus();
            Object.keys(status.phases).forEach(phase => {
                fm.rollbackPhase(parseInt(phase), 'emergency_rollback').catch(console.error);
            });
        " 2>/dev/null || log WARN "Failed to disable feature flags"
    fi
    
    # Step 3: Restore production state
    log INFO "Restoring production state from backup..."
    if [[ -f "$backup_dir/production-state.tar.gz" ]]; then
        rm -rf "$PROD_PATH"/* 2>/dev/null || true
        tar -xzf "$backup_dir/production-state.tar.gz" -C "$PROD_PATH" || {
            log ERROR "Failed to restore production state"
            return 1
        }
    fi
    
    # Step 4: Restore data state
    log INFO "Restoring data state..."
    if [[ -f "$backup_dir/data-state.tar.gz" ]]; then
        rm -rf "$DATA_DIR"/* 2>/dev/null || true
        mkdir -p "$DATA_DIR"
        tar -xzf "$backup_dir/data-state.tar.gz" -C "$DATA_DIR" || {
            log WARN "Failed to restore data state"
        }
    fi
    
    # Step 5: Start v2.0 services
    log INFO "Starting v2.0 services..."
    start_services "2.0"
    
    # Step 6: Verify rollback
    log INFO "Verifying rollback..."
    if wait_for_service "$BACKEND_PORT" "backend" 15; then
        local rollback_duration=$(($(date +%s) - rollback_start_time))
        log INFO "Rollback completed successfully in ${rollback_duration}s"
        
        # Create rollback record
        cat > "$BACKUP_PATH/rollback-record.json" << EOF
{
    "rollbackId": "rollback_$(date +%s)",
    "originalDeploymentId": "$DEPLOYMENT_ID",
    "backupId": "$backup_id",
    "executedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "duration": $rollback_duration,
    "success": true
}
EOF
        
        announce "ROLLBACK SUCCESSFUL - SYSTEM RESTORED"
        return 0
    else
        log ERROR "Rollback verification failed"
        return 1
    fi
}

# =============================================================================
# SERVICE MANAGEMENT
# =============================================================================

start_services() {
    local version="${1:-2.1}"
    
    log INFO "Starting services for version $version..."
    
    # Stop existing services first
    stop_service "backend" "$BACKEND_PID_FILE" 10
    stop_service "dashboard" "$DASHBOARD_PID_FILE" 10
    
    # Start backend
    log INFO "Starting backend service..."
    cd "$PROD_PATH"
    
    if [[ "$version" == "2.1" ]]; then
        # v2.1 with feature flag support
        NODE_ENV=production \
        ENABLE_FEATURE_FLAGS=true \
        nohup node src/mcp-server.js > "$LOG_DIR/backend.log" 2>&1 &
        echo $! > "$BACKEND_PID_FILE"
    else
        # v2.0 compatibility mode
        NODE_ENV=production \
        nohup node src/mcp-server.js > "$LOG_DIR/backend.log" 2>&1 &
        echo $! > "$BACKEND_PID_FILE"
    fi
    
    # Start dashboard
    log INFO "Starting dashboard service..."
    cd "$PROD_PATH/dashboard"
    
    if [[ -f "package.json" ]]; then
        npm run build --silent
        nohup npm run preview -- --port "$DASHBOARD_PORT" --host 127.0.0.1 > "$LOG_DIR/dashboard.log" 2>&1 &
        echo $! > "$DASHBOARD_PID_FILE"
    fi
    
    # Wait for services to be ready
    if wait_for_service "$BACKEND_PORT" "backend" 30; then
        log INFO "Backend service started successfully"
    else
        log ERROR "Backend service failed to start"
        return 1
    fi
    
    if wait_for_service "$DASHBOARD_PORT" "dashboard" 15; then
        log INFO "Dashboard service started successfully"
    else
        log WARN "Dashboard service failed to start (non-critical)"
    fi
    
    log INFO "Services started for version $version"
}

# =============================================================================
# FEATURE FLAG MANAGEMENT
# =============================================================================

manage_feature_flags() {
    local action="$1"
    local phase="${2:-}"
    
    log INFO "Managing feature flags: $action phase=$phase"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "[DRY RUN] Would $action feature flags for phase $phase"
        return 0
    fi
    
    if ! command_exists node; then
        log ERROR "Node.js not available for feature flag management"
        return 1
    fi
    
    local flag_script="$PROD_PATH/src/config/feature-flags.js"
    if [[ ! -f "$flag_script" ]]; then
        log ERROR "Feature flag system not available"
        return 1
    fi
    
    case "$action" in
        "enable-phase")
            node -e "
                const { getFeatureFlagManager } = require('$flag_script');
                const fm = getFeatureFlagManager();
                fm.enablePhase($phase, 'deployment_script')
                    .then(result => {
                        console.log('Phase $phase enabled:', result.successCount + '/' + result.totalFeatures + ' features');
                        process.exit(result.allSuccessful ? 0 : 1);
                    })
                    .catch(error => {
                        console.error('Failed to enable phase $phase:', error.message);
                        process.exit(1);
                    });
            " || return 1
            ;;
            
        "disable-all")
            node -e "
                const { getFeatureFlagManager } = require('$flag_script');
                const fm = getFeatureFlagManager();
                const status = fm.getRolloutStatus();
                Promise.all(Object.keys(status.phases).map(p => 
                    fm.rollbackPhase(parseInt(p), 'deployment_rollback')
                )).then(() => {
                    console.log('All feature flags disabled');
                    process.exit(0);
                }).catch(error => {
                    console.error('Failed to disable feature flags:', error.message);
                    process.exit(1);
                });
            " || return 1
            ;;
            
        "status")
            node -e "
                const { getFeatureFlagManager } = require('$flag_script');
                const fm = getFeatureFlagManager();
                const status = fm.getRolloutStatus();
                console.log('Overall progress:', status.overall.progress.toFixed(1) + '%');
                console.log('Enabled features:', status.overall.enabledFeatures + '/' + status.overall.totalFeatures);
                process.exit(0);
            " || return 1
            ;;
    esac
}

# =============================================================================
# MONITORING AND HEALTH CHECKS
# =============================================================================

continuous_monitoring() {
    local duration="$1"
    local check_interval=5
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    local check_count=0
    local failure_count=0
    local performance_violations=0
    
    log INFO "Starting continuous monitoring for ${duration}s..."
    
    while [[ $(date +%s) -lt $end_time ]]; do
        ((check_count++))
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        # System health check
        local health_status="OK"
        local metrics
        metrics=$(get_system_metrics)
        
        # Check service availability
        if ! curl -s -f "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null 2>&1; then
            ((failure_count++))
            health_status="BACKEND_DOWN"
            log WARN "Backend service unavailable (check $failure_count)"
        fi
        
        # Check performance metrics
        local memory_mb
        memory_mb=$(echo "$metrics" | grep -o '"memory_mb": [0-9]*' | cut -d' ' -f2 2>/dev/null || echo "0")
        if [[ $memory_mb -gt $MAX_MEMORY_OVERHEAD ]]; then
            ((performance_violations++))
            log WARN "Memory usage violation: ${memory_mb}MB > ${MAX_MEMORY_OVERHEAD}MB"
        fi
        
        # Progress indicator
        local progress_percent=$((elapsed * 100 / duration))
        printf "\r[%3d%%] Monitoring: %d checks, %d failures, %d violations" \
               "$progress_percent" "$check_count" "$failure_count" "$performance_violations"
        
        # Log to monitoring file
        echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] CHECK $check_count: $health_status, metrics: $metrics" >> "$MONITORING_LOG"
        
        # Emergency rollback trigger
        if [[ $failure_count -gt 3 ]]; then
            echo
            log ERROR "Emergency rollback triggered: $failure_count consecutive failures"
            return 2  # Special code for emergency rollback
        fi
        
        sleep "$check_interval"
    done
    
    echo
    log INFO "Continuous monitoring completed: $check_count checks, $failure_count failures, $performance_violations violations"
    
    # Return failure if too many violations
    if [[ $failure_count -gt 1 || $performance_violations -gt 5 ]]; then
        return 1
    fi
    
    return 0
}

# =============================================================================
# MIGRATION EXECUTION
# =============================================================================

execute_migration() {
    log INFO "Executing v2.0 → v2.1 migration..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "[DRY RUN] Would execute migration"
        return 0
    fi
    
    local migration_script="$PROJECT_ROOT/src/migration/run-migration.js"
    
    # Create migration runner if it doesn't exist
    if [[ ! -f "$migration_script" ]]; then
        create_migration_runner
    fi
    
    if ! node "$migration_script"; then
        log ERROR "Migration failed - check logs"
        return 1
    fi
    
    log INFO "Migration completed successfully"
    return 0
}

create_migration_runner() {
    cat > "$PROJECT_ROOT/src/migration/run-migration.js" << 'EOF'
#!/usr/bin/env node

const { MigrationManager } = require('./migration-manager');

async function main() {
    const migrationManager = new MigrationManager({
        dataDir: process.env.PROD_PATH + '/data',
        dryRun: process.env.DRY_RUN === 'true'
    });
    
    try {
        const result = await migrationManager.executeMigration();
        
        if (result.success) {
            console.log('Migration completed successfully');
            process.exit(0);
        } else {
            console.error(`Migration failed: ${result.error}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`Migration error: ${error.message}`);
        process.exit(1);
    }
}

main().catch(error => {
    console.error(`Migration runner error: ${error.message}`);
    process.exit(1);
});
EOF
    chmod +x "$PROJECT_ROOT/src/migration/run-migration.js"
}

# =============================================================================
# MAIN DEPLOYMENT ORCHESTRATION
# =============================================================================

main() {
    announce "ZERO-DOWNTIME PRODUCTION DEPLOYMENT"
    log INFO "PlopDock v2.0 → v2.1 Multi-Tech Stack Process Discovery"
    log INFO "Deployment ID: $DEPLOYMENT_ID"
    log INFO "Script Version: $SCRIPT_VERSION"
    log INFO "Dry Run: $DRY_RUN"
    
    # Export environment variables for child processes
    export PROD_PATH DEPLOYMENT_ID DRY_RUN MONITORING_DURATION
    
    # Handle rollback-only mode
    if [[ "$ROLLBACK_ONLY" == "true" ]]; then
        execute_rollback
        return $?
    fi
    
    # Ensure directories exist
    ensure_directories || {
        log ERROR "Failed to create required directories"
        return 1
    }
    
    # Pre-deployment validation
    if [[ "$SKIP_VALIDATION" != "true" ]]; then
        log INFO "Step 1: Pre-deployment validation"
        if ! run_validation_suite "pre-deployment"; then
            if [[ "$FORCE_DEPLOY" == "true" ]]; then
                log WARN "Pre-deployment validation failed but continuing due to --force flag"
            else
                log ERROR "Pre-deployment validation failed - use --force to override"
                return 1
            fi
        fi
    fi
    
    # Create comprehensive backup
    log INFO "Step 2: Creating deployment backup"
    local backup_id="pre-deploy-$DEPLOYMENT_ID"
    create_deployment_backup "$backup_id" || {
        log ERROR "Backup creation failed"
        return 1
    }
    
    # Copy new version alongside existing (blue-green setup)
    log INFO "Step 3: Installing v2.1 system"
    if [[ "$DRY_RUN" != "true" ]]; then
        # Use enhanced production script copy logic
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
            "$DEV_PATH/" "$PROD_PATH.new/" || {
            log ERROR "Failed to copy new version"
            execute_rollback "$backup_id"
            return 1
        }
        
        # Install dependencies
        cd "$PROD_PATH.new"
        npm ci --production --silent || {
            log ERROR "Failed to install dependencies"
            execute_rollback "$backup_id"
            return 1
        }
        
        # Build dashboard
        cd "$PROD_PATH.new/dashboard"
        npm ci --silent && npm run build --silent || {
            log ERROR "Failed to build dashboard"
            execute_rollback "$backup_id"
            return 1
        }
    fi
    
    # Execute migration
    log INFO "Step 4: Executing data migration"
    if ! execute_migration; then
        log ERROR "Migration failed"
        execute_rollback "$backup_id"
        return 1
    fi
    
    # Atomic switch to new version
    log INFO "Step 5: Atomic version switch"
    if [[ "$DRY_RUN" != "true" ]]; then
        stop_service "backend" "$BACKEND_PID_FILE" 10
        stop_service "dashboard" "$DASHBOARD_PID_FILE" 10
        
        mv "$PROD_PATH" "$PROD_PATH.old" 2>/dev/null || true
        mv "$PROD_PATH.new" "$PROD_PATH" || {
            log ERROR "Atomic switch failed"
            mv "$PROD_PATH.old" "$PROD_PATH" 2>/dev/null || true
            return 1
        }
        
        # Start services in compatibility mode (features disabled)
        start_services "2.1" || {
            log ERROR "Failed to start new services"
            execute_rollback "$backup_id"
            return 1
        }
    fi
    
    # Post-deployment validation
    log INFO "Step 6: Post-deployment validation"
    if ! run_validation_suite "post-deployment"; then
        log ERROR "Post-deployment validation failed"
        execute_rollback "$backup_id"
        return 1
    fi
    
    # Phased feature activation
    if [[ -z "$DEPLOY_PHASE" ]]; then
        log INFO "Step 7: Phased feature activation"
        
        # Phase 1: Discovery Engine
        log INFO "Activating Phase 1: Multi-Tech Discovery Engine"
        if manage_feature_flags "enable-phase" "1"; then
            log INFO "Phase 1 activated successfully"
            
            # Performance validation after Phase 1
            if ! run_validation_suite "performance"; then
                log WARN "Performance validation failed after Phase 1"
                if [[ "$FORCE_DEPLOY" != "true" ]]; then
                    execute_rollback "$backup_id"
                    return 1
                fi
            fi
        else
            log ERROR "Phase 1 activation failed"
            execute_rollback "$backup_id"
            return 1
        fi
        
        # Phase 2: MCP Tools
        log INFO "Activating Phase 2: Enhanced MCP Tools"
        if manage_feature_flags "enable-phase" "2"; then
            log INFO "Phase 2 activated successfully"
        else
            log ERROR "Phase 2 activation failed"
            execute_rollback "$backup_id"
            return 1
        fi
        
        # Phase 3: Dashboard Enhancement
        log INFO "Activating Phase 3: Multi-Tech Dashboard"
        if manage_feature_flags "enable-phase" "3"; then
            log INFO "Phase 3 activated successfully"
        else
            log ERROR "Phase 3 activation failed"
            execute_rollback "$backup_id"
            return 1
        fi
    elif [[ -n "$DEPLOY_PHASE" ]]; then
        log INFO "Step 7: Single phase activation - Phase $DEPLOY_PHASE"
        if ! manage_feature_flags "enable-phase" "$DEPLOY_PHASE"; then
            log ERROR "Phase $DEPLOY_PHASE activation failed"
            execute_rollback "$backup_id"
            return 1
        fi
    fi
    
    # Continuous monitoring
    log INFO "Step 8: Continuous monitoring and stability validation"
    case $(continuous_monitoring "$MONITORING_DURATION") in
        0)
            log INFO "Continuous monitoring completed successfully"
            ;;
        1)
            log WARN "Monitoring detected performance issues but within tolerance"
            ;;
        2)
            log ERROR "Emergency rollback triggered during monitoring"
            execute_rollback "$backup_id"
            return 1
            ;;
    esac
    
    # Final validation
    log INFO "Step 9: Final deployment validation"
    if ! run_validation_suite "post-deployment"; then
        log ERROR "Final validation failed"
        execute_rollback "$backup_id"
        return 1
    fi
    
    # Cleanup old version
    if [[ "$DRY_RUN" != "true" && -d "$PROD_PATH.old" ]]; then
        log INFO "Step 10: Cleanup old version"
        rm -rf "$PROD_PATH.old"
    fi
    
    # Deployment completion
    local deployment_duration=$(($(date +%s) - START_TIME))
    
    announce "DEPLOYMENT SUCCESSFUL"
    log INFO "Zero-downtime deployment completed successfully"
    log INFO "Duration: ${deployment_duration}s"
    log INFO "Services: http://localhost:$BACKEND_PORT (backend), http://localhost:$DASHBOARD_PORT (dashboard)"
    
    # Create deployment record
    cat > "$PROD_PATH/deployment-record.json" << EOF
{
    "deploymentId": "$DEPLOYMENT_ID",
    "version": "2.1.0",
    "deployedFrom": "2.0.0",
    "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "duration": $deployment_duration,
    "success": true,
    "features": {
        "discoveryEngine": true,
        "mcpToolsEnhanced": true,
        "dashboardEnhanced": true
    },
    "backupId": "$backup_id"
}
EOF
    
    manage_feature_flags "status"
    
    log INFO "🎉 PlopDock v2.1 Multi-Tech Stack Process Discovery is now active!"
    return 0
}

# =============================================================================
# ARGUMENT PARSING AND SCRIPT ENTRY POINT
# =============================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --rollback-only)
            ROLLBACK_ONLY=true
            shift
            ;;
        --phase)
            DEPLOY_PHASE="$2"
            shift 2
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --monitoring-duration)
            MONITORING_DURATION="$2"
            shift 2
            ;;
        -h|--help)
            cat << EOF
Zero-Downtime Production Deployment Script
PlopDock v2.0 → v2.1 Multi-Tech Stack Process Discovery

Usage: $0 [options]

Options:
    --dry-run                    Execute deployment simulation without changes
    --skip-validation            Skip pre-deployment validation (not recommended)
    --rollback-only             Execute rollback procedure only
    --phase <1-3>               Deploy only specific phase (1=engine, 2=tools, 3=dashboard)
    --force                     Force deployment even with warnings
    --monitoring-duration <sec>  Duration for continuous monitoring (default: 300)
    -h, --help                  Show this help message

Examples:
    $0                          # Full deployment with all phases
    $0 --dry-run               # Simulate deployment
    $0 --phase 1               # Deploy only discovery engine
    $0 --rollback-only         # Emergency rollback
    $0 --force --skip-validation  # Force deployment (not recommended)

Deployment Phases:
    Phase 1: Multi-Tech Discovery Engine (backend enhancement)
    Phase 2: Enhanced MCP Tools (agent productivity)
    Phase 3: Multi-Tech Dashboard (UI transformation)

EOF
            exit 0
            ;;
        *)
            log ERROR "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate arguments
if [[ -n "$DEPLOY_PHASE" && ! "$DEPLOY_PHASE" =~ ^[1-3]$ ]]; then
    log ERROR "Invalid phase: $DEPLOY_PHASE (must be 1, 2, or 3)"
    exit 1
fi

if [[ ! "$MONITORING_DURATION" =~ ^[0-9]+$ || $MONITORING_DURATION -lt 30 ]]; then
    log ERROR "Invalid monitoring duration: $MONITORING_DURATION (must be >= 30 seconds)"
    exit 1
fi

# Trap signals for cleanup
trap 'log ERROR "Deployment interrupted"; exit 130' INT TERM

# Execute main deployment
main
exit $?