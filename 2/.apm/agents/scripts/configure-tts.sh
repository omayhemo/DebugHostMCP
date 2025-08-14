#!/bin/bash
# TTS Configuration Utility - Configure TTS providers after installation

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AP_ROOT="$(dirname "$SCRIPT_DIR")"
APM_ROOT="$(dirname "$AP_ROOT")"
PROJECT_ROOT="$(dirname "$APM_ROOT")"

# TTS Manager location
TTS_MANAGER="$SCRIPT_DIR/tts-manager.sh"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Show current configuration
show_current_config() {
    echo -e "${BLUE}=== Current TTS Configuration ===${NC}"
    echo ""
    
    if [ -f "$TTS_MANAGER" ]; then
        # List available providers
        "$TTS_MANAGER" list
        
        echo ""
        echo "Current settings:"
        if [ -f "$PROJECT_ROOT/.claude/settings.json" ] && command -v jq >/dev/null 2>&1; then
            echo "- TTS Enabled: $(jq -r '.env.TTS_ENABLED // "true"' "$PROJECT_ROOT/.claude/settings.json")"
            echo "- Provider: $(jq -r '.env.TTS_PROVIDER // "auto"' "$PROJECT_ROOT/.claude/settings.json")"
            echo "- Fallback: $(jq -r '.env.TTS_FALLBACK_PROVIDER // "none"' "$PROJECT_ROOT/.claude/settings.json")"
        fi
    else
        echo -e "${RED}TTS Manager not found!${NC}"
        echo "Please ensure AP Mapping is properly installed."
        exit 1
    fi
}

# Main menu
main_menu() {
    while true; do
        echo ""
        echo -e "${BLUE}=== TTS Configuration Menu ===${NC}"
        echo ""
        echo "1) Show current configuration"
        echo "2) Configure TTS provider"
        echo "3) Test TTS"
        echo "4) Enable/Disable TTS"
        echo "5) Clear TTS cache"
        echo "6) Exit"
        echo ""
        read -p "Select option (1-6): " choice
        
        case "$choice" in
            1)
                show_current_config
                ;;
            2)
                configure_provider_menu
                ;;
            3)
                test_tts_menu
                ;;
            4)
                toggle_tts
                ;;
            5)
                "$TTS_MANAGER" clear-cache
                ;;
            6)
                echo "Exiting..."
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice${NC}"
                ;;
        esac
    done
}

# Configure provider menu
configure_provider_menu() {
    echo ""
    echo -e "${BLUE}=== Configure TTS Provider ===${NC}"
    echo ""
    echo "Available providers:"
    echo "1) Piper (local, offline)"
    echo "2) ElevenLabs (cloud, high quality)"
    echo "3) System TTS (OS built-in)"
    echo "4) Discord (notifications)"
    echo "5) None (silent mode)"
    echo "6) Back to main menu"
    echo ""
    read -p "Select provider to configure (1-6): " provider_choice
    
    case "$provider_choice" in
        1)
            "$TTS_MANAGER" configure piper
            update_provider_setting "piper"
            ;;
        2)
            "$TTS_MANAGER" configure elevenlabs
            update_provider_setting "elevenlabs"
            ;;
        3)
            "$TTS_MANAGER" configure system
            update_provider_setting "system"
            ;;
        4)
            "$TTS_MANAGER" configure discord
            update_provider_setting "discord"
            ;;
        5)
            update_provider_setting "none"
            echo "Silent mode configured"
            ;;
        6)
            return
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
}

# Update provider setting
update_provider_setting() {
    local provider="$1"
    
    if [ -f "$PROJECT_ROOT/.claude/settings.json" ] && command -v jq >/dev/null 2>&1; then
        echo ""
        read -p "Set $provider as default TTS provider? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            local tmp_file=$(mktemp)
            jq ".env.TTS_PROVIDER = \"$provider\"" "$PROJECT_ROOT/.claude/settings.json" > "$tmp_file" && \
                mv "$tmp_file" "$PROJECT_ROOT/.claude/settings.json"
            echo -e "${GREEN}✓ Default provider set to: $provider${NC}"
        fi
    fi
}

# Test TTS menu
test_tts_menu() {
    echo ""
    echo -e "${BLUE}=== Test TTS ===${NC}"
    echo ""
    echo "1) Test current provider"
    echo "2) Test specific provider"
    echo "3) Test all available providers"
    echo "4) Back"
    echo ""
    read -p "Select option (1-4): " test_choice
    
    case "$test_choice" in
        1)
            echo "Testing current provider..."
            "$TTS_MANAGER" test
            ;;
        2)
            echo "Available providers:"
            local providers=($("$TTS_MANAGER" detect))
            local i=1
            for p in "${providers[@]}"; do
                echo "$i) $p"
                ((i++))
            done
            echo ""
            read -p "Select provider to test: " provider_num
            
            if [ "$provider_num" -gt 0 ] && [ "$provider_num" -le "${#providers[@]}" ]; then
                local selected_provider="${providers[$((provider_num-1))]}"
                echo "Testing $selected_provider..."
                "$TTS_MANAGER" test "$selected_provider"
            else
                echo -e "${RED}Invalid selection${NC}"
            fi
            ;;
        3)
            echo "Testing all available providers..."
            local providers=($("$TTS_MANAGER" detect))
            for p in "${providers[@]}"; do
                echo ""
                echo "Testing $p..."
                "$TTS_MANAGER" test "$p" || echo "Failed to test $p"
                sleep 1
            done
            ;;
        4)
            return
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
}

# Toggle TTS on/off
toggle_tts() {
    if [ -f "$PROJECT_ROOT/.claude/settings.json" ] && command -v jq >/dev/null 2>&1; then
        local current=$(jq -r '.env.TTS_ENABLED // "true"' "$PROJECT_ROOT/.claude/settings.json")
        local new_value="false"
        
        if [ "$current" = "false" ]; then
            new_value="true"
        fi
        
        local tmp_file=$(mktemp)
        jq ".env.TTS_ENABLED = \"$new_value\"" "$PROJECT_ROOT/.claude/settings.json" > "$tmp_file" && \
            mv "$tmp_file" "$PROJECT_ROOT/.claude/settings.json"
        
        if [ "$new_value" = "true" ]; then
            echo -e "${GREEN}✓ TTS enabled${NC}"
        else
            echo -e "${YELLOW}✓ TTS disabled${NC}"
        fi
    else
        echo -e "${RED}Unable to toggle TTS - settings file not found${NC}"
    fi
}

# Check if running directly
if [ "$0" = "${BASH_SOURCE[0]}" ]; then
    echo -e "${BLUE}AP Mapping TTS Configuration Utility${NC}"
    echo "===================================="
    
    # Check for direct command
    case "${1:-}" in
        show)
            show_current_config
            ;;
        configure)
            if [ -n "${2:-}" ]; then
                "$TTS_MANAGER" configure "$2"
            else
                configure_provider_menu
            fi
            ;;
        test)
            if [ -n "${2:-}" ]; then
                "$TTS_MANAGER" test "$2"
            else
                "$TTS_MANAGER" test
            fi
            ;;
        enable)
            toggle_tts
            ;;
        disable)
            toggle_tts
            ;;
        *)
            main_menu
            ;;
    esac
fi