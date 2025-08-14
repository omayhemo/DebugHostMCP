#!/bin/bash
# AP Mapping Manager - Update, uninstall, and manage AP Mapping installation

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get AP_ROOT from environment or find it
if [ -z "$AP_ROOT" ]; then
    # Try to find AP_ROOT by looking for this script
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$SCRIPT_DIR/../personas/ap_orchestrator.md" ]; then
        AP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
    else
        echo -e "${RED}Error: Cannot determine AP_ROOT. Please set AP_ROOT environment variable.${NC}"
        exit 1
    fi
fi

# Configuration
REPO_OWNER="omayhemo"
REPO_NAME="agentic-persona-mapping"
VERSION_FILE="$AP_ROOT/../VERSION"
TEMPLATES_DIR="$AP_ROOT/.templates"
BACKUP_DIR="$AP_ROOT/.backups"
APM_ROOT="$(dirname "$AP_ROOT")"  # Get .apm directory from AP_ROOT
PROJECT_ROOT="$(dirname "$APM_ROOT")"  # Get project root from .apm directory

# Show usage
usage() {
    cat << EOF
AP Mapping Manager v1.0.0

Usage: $(basename "$0") <command> [options]

Commands:
    update                    Check for and install updates
    uninstall                 Remove AP Mapping from project
    verify                    Verify installation integrity
    repair                    Repair corrupted installation
    rollback                  Rollback to previous version
    version                   Show current version
    configure-tts             Configure Text-to-Speech settings
    configure-notifications   Configure notification sounds and alerts
    help                      Show this help message

Examples:
    $(basename "$0") update
    $(basename "$0") verify
    $(basename "$0") uninstall --keep-settings

EOF
}

# Get current version
get_current_version() {
    if [ -f "$VERSION_FILE" ]; then
        cat "$VERSION_FILE"
    else
        echo "unknown"
    fi
}

# Check for updates using GitHub API
check_for_updates() {
    local current_version=$(get_current_version)
    echo -e "${BLUE}Checking for updates...${NC}"
    echo "Current version: $current_version"
    
    # Get latest release from GitHub
    local api_url="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/latest"
    local release_info=$(curl -s "$api_url")
    
    # Check if curl succeeded
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to check for updates${NC}"
        return 1
    fi
    
    # Extract version and download URL
    local latest_version=$(echo "$release_info" | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^v//')
    local download_url=$(echo "$release_info" | grep '"browser_download_url"' | grep '.tar.gz' | cut -d'"' -f4)
    
    if [ -z "$latest_version" ]; then
        echo -e "${RED}Error: Could not determine latest version${NC}"
        return 1
    fi
    
    echo "Latest version: $latest_version"
    
    # Compare versions
    if [ "$latest_version" == "$current_version" ]; then
        echo -e "${GREEN}You are already running the latest version${NC}"
        return 0
    else
        echo -e "${YELLOW}Update available: $current_version → $latest_version${NC}"
        echo "Download URL: $download_url"
        
        # Ask user if they want to update
        read -p "Would you like to update now? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            perform_update "$latest_version" "$download_url"
        else
            echo "Update cancelled"
        fi
    fi
}

# Perform update
perform_update() {
    local new_version="$1"
    local download_url="$2"
    local temp_dir=$(mktemp -d)
    
    echo -e "${BLUE}Downloading update...${NC}"
    
    # Download new version
    if ! curl -L -o "$temp_dir/ap-method-v$new_version.tar.gz" "$download_url"; then
        echo -e "${RED}Error: Failed to download update${NC}"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Create backup
    echo -e "${BLUE}Creating backup...${NC}"
    create_backup "pre-update-$new_version"
    
    # Extract new version
    echo -e "${BLUE}Extracting update...${NC}"
    cd "$temp_dir"
    if ! tar -xzf "ap-method-v$new_version.tar.gz"; then
        echo -e "${RED}Error: Failed to extract update${NC}"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Run integrity check on current installation
    if [ -f "$TEMPLATES_DIR/integrity-checker.sh" ]; then
        echo -e "${BLUE}Running pre-update integrity check...${NC}"
        "$TEMPLATES_DIR/integrity-checker.sh" --quiet || true
    fi
    
    # Update templates files
    echo -e "${BLUE}Updating templates files...${NC}"
    if [ -d "$TEMPLATES_DIR" ]; then
        rm -rf "$TEMPLATES_DIR.old"
        mv "$TEMPLATES_DIR" "$TEMPLATES_DIR.old"
    fi
    mkdir -p "$TEMPLATES_DIR"
    cp -r templates/* "$TEMPLATES_DIR/"
    
    # Remove .apm directory for fresh install
    echo -e "${BLUE}Removing existing .apm directory for fresh update...${NC}"
    if [ -d "$APM_ROOT" ]; then
        rm -rf "$APM_ROOT"
        echo "✓ Removed existing .apm directory"
    fi
    
    # Create fresh agents directory
    echo -e "${BLUE}Installing fresh agents directory...${NC}"
    mkdir -p "$AP_ROOT"
    cp -r agents/* "$AP_ROOT/"
    
    # Update version file
    echo "$new_version" > "$VERSION_FILE"
    
    # Clean up
    rm -rf "$temp_dir"
    
    echo -e "${GREEN}Update completed successfully!${NC}"
    echo "New version: $new_version"
    
    # Run post-update integrity check
    if [ -f "$TEMPLATES_DIR/integrity-checker.sh" ]; then
        echo -e "${BLUE}Running post-update integrity check...${NC}"
        "$TEMPLATES_DIR/integrity-checker.sh" --quiet
    fi
}

# Create backup
create_backup() {
    local backup_name="${1:-backup-$(date +%Y%m%d-%H%M%S)}"
    mkdir -p "$BACKUP_DIR"
    
    local backup_path="$BACKUP_DIR/$backup_name.tar.gz"
    
    echo "Creating backup: $backup_path"
    tar -czf "$backup_path" -C "$AP_ROOT/.." "$(basename "$AP_ROOT")" 2>/dev/null
    
    # Keep only last 5 backups
    ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
}

# Verify installation
verify_installation() {
    echo -e "${BLUE}Verifying AP Mapping installation...${NC}"
    
    if [ -f "$TEMPLATES_DIR/integrity-checker.sh" ]; then
        "$TEMPLATES_DIR/integrity-checker.sh"
    else
        # Basic verification if integrity checker not available
        local issues=0
        
        # Check critical files
        for file in "personas/ap_orchestrator.md" "scripts/agentic-setup"; do
            if [ ! -f "$AP_ROOT/$file" ]; then
                echo -e "${RED}Missing: $file${NC}"
                ((issues++))
            fi
        done
        
        # Check VERSION file in APM root
        if [ ! -f "$VERSION_FILE" ]; then
            echo -e "${RED}Missing: VERSION file${NC}"
            ((issues++))
        fi
        
        # Check critical directories
        for dir in "personas" "tasks" "templates" "scripts"; do
            if [ ! -d "$AP_ROOT/$dir" ]; then
                echo -e "${RED}Missing directory: $dir${NC}"
                ((issues++))
            fi
        done
        
        if [ $issues -eq 0 ]; then
            echo -e "${GREEN}Installation verified successfully${NC}"
        else
            echo -e "${RED}Found $issues issues${NC}"
            return 1
        fi
    fi
}

# Uninstall AP Mapping
uninstall_ap_method() {
    echo -e "${YELLOW}Warning: This will remove AP Mapping from your project${NC}"
    
    # Check for --keep-settings flag
    local keep_settings=false
    if [[ "$1" == "--keep-settings" ]]; then
        keep_settings=true
        echo "Settings and session notes will be preserved"
    fi
    
    read -p "Are you sure you want to uninstall AP Mapping? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Uninstall cancelled"
        return 0
    fi
    
    # Create final backup
    echo -e "${BLUE}Creating final backup...${NC}"
    create_backup "pre-uninstall-$(date +%Y%m%d-%H%M%S)"
    
    # Get project root
    local project_root="$(dirname "$AP_ROOT")"
    
    echo -e "${BLUE}Removing AP Mapping files...${NC}"
    
    # Remove agents directory
    if [ -d "$AP_ROOT" ]; then
        rm -rf "$AP_ROOT"
        echo "- Removed agents directory"
    fi
    
    # Remove Claude files (unless keeping settings)
    if [ "$keep_settings" != "true" ]; then
        if [ -d "$project_root/.claude" ]; then
            rm -rf "$project_root/.claude"
            echo "- Removed .claude directory"
        fi
        
        # Remove session notes
        if [ -d "$project_root/session-notes" ]; then
            rm -rf "$project_root/session-notes"
            echo "- Removed session notes"
        fi
    else
        # Just remove commands, keep settings
        if [ -d "$project_root/.claude/commands" ]; then
            rm -rf "$project_root/.claude/commands"
            echo "- Removed Claude commands"
        fi
    fi
    
    # Remove project documentation
    if [ -d "$project_root/project_documentation" ]; then
        read -p "Remove project documentation? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$project_root/project_documentation"
            echo "- Removed project documentation"
        fi
    fi
    
    # Update .gitignore
    if [ -f "$project_root/.gitignore" ]; then
        # Remove AP Mapping entries (cross-platform sed)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' '/# AP Mapping/,/^$/d' "$project_root/.gitignore" 2>/dev/null || true
        else
            sed -i '/# AP Mapping/,/^$/d' "$project_root/.gitignore" 2>/dev/null || true
        fi
        echo "- Updated .gitignore"
    fi
    
    echo ""
    echo -e "${GREEN}AP Mapping has been uninstalled${NC}"
    if [ "$keep_settings" == "true" ]; then
        echo "Settings have been preserved in .claude/settings.json"
    fi
    echo "Backups are available in: $BACKUP_DIR"
}

# Show version
show_version() {
    local version=$(get_current_version)
    echo "AP Mapping version: $version"
    
    if [ -f "$AP_ROOT/.templates/manifest.txt" ]; then
        local install_date=$(stat -c %y "$AP_ROOT/.templates/manifest.txt" 2>/dev/null | cut -d' ' -f1)
        if [ -n "$install_date" ]; then
            echo "Installed: $install_date"
        fi
    fi
}

# Uninstall AP Mapping
uninstall_ap_method() {
    local force_mode="$1"
    
    echo -e "${YELLOW}=========================================="
    echo "AP Mapping Uninstall"
    echo "==========================================${NC}"
    echo ""
    
    # Confirm uninstallation
    if [ "$force_mode" != "--force" ]; then
        echo -e "${RED}WARNING: This will remove all AP Mapping files and configurations!${NC}"
        echo ""
        echo "This includes:"
        echo "  - All APM infrastructure (.apm/)"
        echo "  - Claude commands and hooks (.claude/commands/, .claude/hooks/)"
        echo "  - APM sections from CLAUDE.md"
        echo "  - TTS installation (.piper/)"
        echo "  - APM environment variables"
        echo ""
        echo -e "${YELLOW}NOTE: Your project documentation in project_docs/ will be preserved.${NC}"
        echo ""
        printf "${RED}Are you sure you want to uninstall AP Mapping? (yes/no): ${NC}"
        read confirmation
        
        if [ "$confirmation" != "yes" ]; then
            echo "Uninstall cancelled."
            exit 0
        fi
    fi
    
    echo ""
    echo -e "${BLUE}Starting uninstallation...${NC}"
    echo ""
    
    # Create uninstall log
    local uninstall_log="$PROJECT_ROOT/apm-uninstall.log"
    echo "AP Mapping Uninstall Log - $(date)" > "$uninstall_log"
    echo "Version: $(cat "$VERSION_FILE" 2>/dev/null || echo 'unknown')" >> "$uninstall_log"
    echo "" >> "$uninstall_log"
    
    # 1. Remove Claude commands
    echo "Removing Claude commands..."
    if [ -d "$PROJECT_ROOT/.claude/commands" ]; then
        local apm_commands=(
            "ap_orchestrator.md" "ap.md" "handoff.md" "wrap.md" "switch.md"
            "session-note-setup.md" "analyst.md" "architect.md" "design-architect.md"
            "dev.md" "developer.md" "personas.md" "pm.md" "po.md" "qa.md" "sm.md"
            "parallel-sprint.md" "subtask.md"
        )
        
        for cmd in "${apm_commands[@]}"; do
            if [ -f "$PROJECT_ROOT/.claude/commands/$cmd" ]; then
                rm -f "$PROJECT_ROOT/.claude/commands/$cmd"
                echo "  - Removed $cmd" | tee -a "$uninstall_log"
            fi
        done
        
        # Remove QA Framework commands directory
        if [ -d "$PROJECT_ROOT/.claude/commands/qa-framework" ]; then
            rm -rf "$PROJECT_ROOT/.claude/commands/qa-framework"
            echo "  - Removed qa-framework/ directory" | tee -a "$uninstall_log"
        fi
    fi
    
    # 2. Remove Claude hooks
    echo ""
    echo "Removing Claude hooks..."
    if [ -d "$PROJECT_ROOT/.claude/hooks" ]; then
        local apm_hooks=(
            "hook_utils.py" "notification.py" "post_tool_use.py" "pre_compact.py"
            "pre_tool_use.py" "stop.py" "subagent_stop.py" "test_hook.py"
            "user_prompt_submit.py"
        )
        
        for hook in "${apm_hooks[@]}"; do
            if [ -f "$PROJECT_ROOT/.claude/hooks/$hook" ]; then
                rm -f "$PROJECT_ROOT/.claude/hooks/$hook"
                echo "  - Removed $hook" | tee -a "$uninstall_log"
            fi
        done
        
        # Remove logs directory if empty
        if [ -d "$PROJECT_ROOT/.claude/hooks/logs" ]; then
            rmdir "$PROJECT_ROOT/.claude/hooks/logs" 2>/dev/null && echo "  - Removed logs/ directory" | tee -a "$uninstall_log"
        fi
    fi
    
    # 3. Clean Claude settings.json
    echo ""
    echo "Cleaning Claude settings..."
    if [ -f "$PROJECT_ROOT/.claude/settings.json" ]; then
        # Create backup
        cp "$PROJECT_ROOT/.claude/settings.json" "$PROJECT_ROOT/.claude/settings.json.pre-uninstall"
        
        # Remove APM-related environment variables
        local tmp_file=$(mktemp)
        jq 'del(.env.AP_ROOT) | 
            del(.env.AP_MAPPING_ROOT) | 
            del(.env.PROJECT_ROOT) | 
            del(.env.PROJECT_DOCS) | 
            del(.env.TTS_PROVIDER) | 
            del(.env.WAV_PLAYER) | 
            del(.env.WAV_PLAYER_ARGS) | 
            del(.env.QA_FRAMEWORK_PATH) |
            del(.env.AP_TEST_MODE) |
            del(.env.SPEAK_PM) |
            del(.env.SPEAK_QA) |
            del(.env.SPEAK_ORCHESTRATOR) |
            del(.env.SPEAK_DEVELOPER) |
            del(.env.SPEAK_ARCHITECT) |
            del(.env.SPEAK_ANALYST) |
            del(.env.SPEAK_PO) |
            del(.env.SPEAK_SM) |
            del(.env.SPEAK_DESIGN_ARCHITECT) |
            del(.hooks) |
            del(.claude_chats_to_save)' "$PROJECT_ROOT/.claude/settings.json" > "$tmp_file" && mv "$tmp_file" "$PROJECT_ROOT/.claude/settings.json"
        
        echo "  - Cleaned APM settings from settings.json" | tee -a "$uninstall_log"
        echo "  - Backup saved as settings.json.pre-uninstall" | tee -a "$uninstall_log"
    fi
    
    # 4. Unmerge CLAUDE.md
    echo ""
    echo "Cleaning CLAUDE.md..."
    if [ -f "$PROJECT_ROOT/CLAUDE.md" ]; then
        # Create backup
        cp "$PROJECT_ROOT/CLAUDE.md" "$PROJECT_ROOT/CLAUDE.md.pre-uninstall"
        
        # Remove APM sections between markers
        local tmp_file=$(mktemp)
        awk '
            /<BEGIN-APM-CLAUDE-MERGE>/ { skip = 1; next }
            /<END-APM-CLAUDE-MERGE>/ { skip = 0; next }
            !skip { print }
        ' "$PROJECT_ROOT/CLAUDE.md" > "$tmp_file" && mv "$tmp_file" "$PROJECT_ROOT/CLAUDE.md"
        
        echo "  - Removed APM sections from CLAUDE.md" | tee -a "$uninstall_log"
        echo "  - Backup saved as CLAUDE.md.pre-uninstall" | tee -a "$uninstall_log"
    fi
    
    # 5. Clean .gitignore
    echo ""
    echo "Cleaning .gitignore..."
    if [ -f "$PROJECT_ROOT/.gitignore" ]; then
        # Create backup
        cp "$PROJECT_ROOT/.gitignore" "$PROJECT_ROOT/.gitignore.pre-uninstall"
        
        # Remove APM entries
        local tmp_file=$(mktemp)
        grep -v -E '^(\.apm/|\.piper/|apm-.*\.log|\.claude/hooks/logs/)' "$PROJECT_ROOT/.gitignore" > "$tmp_file" || true
        mv "$tmp_file" "$PROJECT_ROOT/.gitignore"
        
        echo "  - Cleaned APM entries from .gitignore" | tee -a "$uninstall_log"
        echo "  - Backup saved as .gitignore.pre-uninstall" | tee -a "$uninstall_log"
    fi
    
    # 6. Remove TTS installation
    echo ""
    echo "Removing TTS installation..."
    if [ -d "$PROJECT_ROOT/.piper" ]; then
        rm -rf "$PROJECT_ROOT/.piper"
        echo "  - Removed .piper/ directory" | tee -a "$uninstall_log"
    fi
    
    # 7. Remove .apm directory (last step)
    echo ""
    echo "Removing APM infrastructure..."
    if [ -d "$APM_ROOT" ]; then
        # Save version for log
        local version=$(cat "$VERSION_FILE" 2>/dev/null || echo "unknown")
        
        rm -rf "$APM_ROOT"
        echo "  - Removed .apm/ directory" | tee -a "$uninstall_log"
    fi
    
    # 8. Final cleanup
    echo ""
    echo "Final cleanup..."
    
    # Remove any stray APM files in project root
    local root_files=("VERSION" "LICENSE" "install.sh" "apm-*.tar.gz")
    for file_pattern in "${root_files[@]}"; do
        for file in $PROJECT_ROOT/$file_pattern; do
            if [ -f "$file" ]; then
                rm -f "$file"
                echo "  - Removed $(basename "$file")" | tee -a "$uninstall_log"
            fi
        done
    done
    
    echo "" | tee -a "$uninstall_log"
    echo "=========================================="
    echo "Uninstall Summary:" | tee -a "$uninstall_log"
    echo "==========================================" | tee -a "$uninstall_log"
    echo "" | tee -a "$uninstall_log"
    echo "✓ Removed APM infrastructure (.apm/)" | tee -a "$uninstall_log"
    echo "✓ Removed Claude commands and hooks" | tee -a "$uninstall_log"
    echo "✓ Cleaned configuration files" | tee -a "$uninstall_log"
    echo "✓ Removed TTS installation" | tee -a "$uninstall_log"
    echo "✓ Preserved project documentation" | tee -a "$uninstall_log"
    echo "" | tee -a "$uninstall_log"
    echo -e "${GREEN}AP Mapping has been successfully uninstalled.${NC}"
    echo ""
    echo "Backups created:"
    echo "  - .claude/settings.json.pre-uninstall"
    echo "  - CLAUDE.md.pre-uninstall"
    echo "  - .gitignore.pre-uninstall"
    echo ""
    echo "Uninstall log saved to: $uninstall_log"
    echo ""
    echo -e "${YELLOW}Thank you for using AP Mapping!${NC}"
}

# Main command dispatcher
case "${1:-help}" in
    update)
        check_for_updates
        ;;
    uninstall)
        uninstall_ap_method "$2"
        ;;
    verify)
        verify_installation
        ;;
    repair)
        echo -e "${BLUE}Repairing AP Mapping installation...${NC}"
        echo "This will replace any modified files in .apm with fresh versions"
        echo "Only session_notes will be preserved"
        
        # Create backup first
        create_backup "pre-repair-$(date +%Y%m%d-%H%M%S)"
        
        # Save session notes if they exist
        local temp_session_notes=""
        if [ -d "$APM_ROOT/session_notes" ]; then
            echo -e "${BLUE}Preserving session notes...${NC}"
            temp_session_notes=$(mktemp -d)
            cp -r "$APM_ROOT/session_notes" "$temp_session_notes/"
        fi
        
        # Remove entire .apm directory
        echo -e "${BLUE}Removing .apm directory for fresh repair...${NC}"
        rm -rf "$APM_ROOT"
        
        # Run installer for fresh install
        if [ -f "$TEMPLATES_DIR/install.sh" ]; then
            echo -e "${BLUE}Installing fresh files...${NC}"
            bash "$TEMPLATES_DIR/install.sh" "$(dirname "$APM_ROOT")"
        else
            echo -e "${RED}Error: Installer not found in templates directory${NC}"
            echo "Please run update instead"
            exit 1
        fi
        
        # Restore session notes
        if [ -n "$temp_session_notes" ] && [ -d "$temp_session_notes/session_notes" ]; then
            echo -e "${BLUE}Restoring session notes...${NC}"
            mkdir -p "$APM_ROOT"
            cp -r "$temp_session_notes/session_notes" "$APM_ROOT/"
            rm -rf "$temp_session_notes"
        fi
        
        echo -e "${GREEN}Repair completed successfully!${NC}"
        echo "All files have been restored to their original state"
        echo "Session notes have been preserved"
        
        # Verify after repair
        verify_installation
        ;;
    rollback)
        echo -e "${BLUE}Rollback functionality coming soon...${NC}"
        echo "Manual rollback: restore from $BACKUP_DIR"
        ls -la "$BACKUP_DIR" 2>/dev/null || echo "No backups found"
        ;;
    version)
        show_version
        ;;
    configure-tts)
        # Run TTS configuration utility
        if [ -f "$SCRIPT_DIR/configure-tts.sh" ]; then
            bash "$SCRIPT_DIR/configure-tts.sh" "$2"
        else
            echo -e "${RED}TTS configuration utility not found${NC}"
            exit 1
        fi
        ;;
    configure-notifications)
        echo -e "${BLUE}Configuring notification settings...${NC}"
        # Run notification configuration wizard
        if [ -f "$SCRIPT_DIR/notification-manager.sh" ]; then
            # First check if audio player is available
            bash "$SCRIPT_DIR/notification-manager.sh" install-audio-player
            echo ""
            echo "You can test notifications with:"
            echo "  $SCRIPT_DIR/notification-manager.sh test [hook_name]"
            echo ""
            echo "To manually update notification settings, edit:"
            echo "  $PROJECT_ROOT/.claude/settings.json"
            echo ""
            echo "Available hooks: notification, pre_tool, post_tool, stop, subagent_stop"
        else
            echo -e "${RED}Notification manager not found${NC}"
            exit 1
        fi
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        usage
        exit 1
        ;;
esac