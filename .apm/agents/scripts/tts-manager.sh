#!/bin/bash
# TTS Manager - Central hub for all text-to-speech operations
# Supports multiple providers: piper, elevenlabs, system, discord, none

# Don't use strict mode to allow graceful failures
# set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AP_ROOT="$(dirname "$SCRIPT_DIR")"
APM_ROOT="$(dirname "$AP_ROOT")"
PROJECT_ROOT="$(dirname "$APM_ROOT")"

# Load settings
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"

# Cache directory for audio files
CACHE_DIR="$PROJECT_ROOT/.cache/tts"
mkdir -p "$CACHE_DIR" 2>/dev/null || true

# Provider directory
PROVIDER_DIR="$SCRIPT_DIR/tts-providers"

# Get TTS configuration from settings
get_tts_setting() {
    local key="$1"
    local default="$2"
    
    # Map old keys to new env variable names
    case "$key" in
        "enabled") env_key="TTS_ENABLED" ;;
        "provider") env_key="TTS_PROVIDER" ;;
        "fallback_provider") env_key="TTS_FALLBACK_PROVIDER" ;;
        *) env_key="TTS_$(echo "$key" | tr '[:lower:]' '[:upper:]')" ;;
    esac
    
    if [ -f "$SETTINGS_FILE" ]; then
        # First try jq, fall back to grep
        if command -v jq >/dev/null 2>&1; then
            local value=$(jq -r ".env.$env_key // \"$default\"" "$SETTINGS_FILE" 2>/dev/null)
            if [ "$value" != "null" ] && [ -n "$value" ]; then
                echo "$value"
            else
                echo "$default"
            fi
        else
            echo "$default"
        fi
    else
        echo "$default"
    fi
}

# Get provider-specific setting
get_provider_setting() {
    local provider="$1"
    local key="$2"
    local default="$3"
    
    # Map provider and key to env variable name
    local env_key="TTS_$(echo "$provider" | tr '[:lower:]' '[:upper:]')_$(echo "$key" | tr '[:lower:]' '[:upper:]')"
    
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        local value=$(jq -r ".env.$env_key // \"$default\"" "$SETTINGS_FILE" 2>/dev/null)
        if [ "$value" != "null" ] && [ -n "$value" ]; then
            echo "$value"
        else
            echo "$default"
        fi
    else
        echo "$default"
    fi
}

# Get voice mapping for persona and provider
get_voice_mapping() {
    local persona="$1"
    local provider="$2"
    local default="$3"
    
    # Map to env variable name: TTS_VOICE_<PERSONA>_<PROVIDER>
    local env_key="TTS_VOICE_$(echo "$persona" | tr '[:lower:]' '[:upper:]')_$(echo "$provider" | tr '[:lower:]' '[:upper:]')"
    
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        local value=$(jq -r ".env.$env_key // \"$default\"" "$SETTINGS_FILE" 2>/dev/null)
        if [ "$value" != "null" ] && [ -n "$value" ]; then
            echo "$value"
        else
            echo "$default"
        fi
    else
        echo "$default"
    fi
}

# Detect available TTS providers
detect_providers() {
    local providers=()
    
    # Check for provider scripts
    if [ -d "$PROVIDER_DIR" ]; then
        for provider_script in "$PROVIDER_DIR"/*.sh; do
            if [ -f "$provider_script" ] && [ -x "$provider_script" ]; then
                local provider_name=$(basename "$provider_script" .sh)
                
                # Check if provider is available
                if "$provider_script" check >/dev/null 2>&1; then
                    providers+=("$provider_name")
                fi
            fi
        done
    fi
    
    # Always add 'none' as fallback
    if [[ ! " ${providers[@]} " =~ " none " ]]; then
        providers+=("none")
    fi
    
    echo "${providers[@]}"
}

# Get configured provider
get_provider() {
    local configured_provider=$(get_tts_setting "provider" "auto")
    
    if [ "$configured_provider" = "auto" ]; then
        # Auto-detect best available provider
        local available_providers=($(detect_providers))
        
        # Preference order: piper, elevenlabs, system, discord, none
        local preferred_order=("piper" "elevenlabs" "system" "discord" "none")
        
        for pref in "${preferred_order[@]}"; do
            if [[ " ${available_providers[@]} " =~ " $pref " ]]; then
                echo "$pref"
                return 0
            fi
        done
        
        # Fallback to first available
        echo "${available_providers[0]:-none}"
    else
        echo "$configured_provider"
    fi
}

# Main speak function
speak() {
    local persona="$1"
    local message="$2"
    local options="$3"
    
    # Check if TTS is enabled
    local tts_enabled=$(get_tts_setting "enabled" "true")
    if [ "$tts_enabled" != "true" ]; then
        return 0
    fi
    
    # Get provider
    local provider=$(get_provider)
    local provider_script="$PROVIDER_DIR/$provider.sh"
    
    # Check if provider script exists and is executable
    if [ ! -f "$provider_script" ] || [ ! -x "$provider_script" ]; then
        # Try fallback provider
        local fallback=$(get_tts_setting "fallback_provider" "none")
        provider_script="$PROVIDER_DIR/$fallback.sh"
        
        if [ ! -f "$provider_script" ] || [ ! -x "$provider_script" ]; then
            # Silent fallback
            return 0
        fi
    fi
    
    # Execute provider speak command
    "$provider_script" speak "$persona" "$message" "$options" 2>/dev/null || true
    return 0
}

# Test TTS functionality
test_tts() {
    local provider="${1:-$(get_provider)}"
    
    echo "Testing TTS with provider: $provider"
    echo "Settings file: $SETTINGS_FILE"
    echo "Provider directory: $PROVIDER_DIR"
    
    # Check if settings file exists
    if [ ! -f "$SETTINGS_FILE" ]; then
        echo "Warning: Settings file not found"
    else
        echo "TTS enabled: $(get_tts_setting "enabled" "true")"
        echo "Configured provider: $(get_tts_setting "provider" "auto")"
    fi
    
    local test_message="Hello, this is a test of the $provider text-to-speech system."
    local provider_script="$PROVIDER_DIR/$provider.sh"
    
    echo "Provider script: $provider_script"
    
    if [ -f "$provider_script" ]; then
        if [ -x "$provider_script" ]; then
            echo "Provider script is executable"
            
            if "$provider_script" check; then
                echo "Provider $provider is available"
                echo "Speaking test message..."
                "$provider_script" speak "orchestrator" "$test_message"
                echo "Test complete"
            else
                echo "Provider $provider check failed"
                return 1
            fi
        else
            echo "Provider script is not executable"
            echo "Fix with: chmod +x $provider_script"
            return 1
        fi
    else
        echo "Provider script not found"
        return 1
    fi
}

# Configure TTS provider
configure_provider() {
    local provider="${1:-$(get_provider)}"
    local provider_script="$PROVIDER_DIR/$provider.sh"
    
    if [ -f "$provider_script" ] && [ -x "$provider_script" ]; then
        "$provider_script" configure
    else
        echo "Provider $provider not found or not executable"
        return 1
    fi
}

# List available providers
list_providers() {
    echo "Available TTS providers:"
    echo ""
    
    local current_provider=$(get_provider)
    local providers=($(detect_providers))
    
    for provider in "${providers[@]}"; do
        if [ "$provider" = "$current_provider" ]; then
            echo "* $provider (current)"
        else
            echo "  $provider"
        fi
        
        # Show provider info
        local provider_script="$PROVIDER_DIR/$provider.sh"
        if [ -f "$provider_script" ]; then
            local info=$("$provider_script" info 2>/dev/null || echo "No description available")
            echo "    $info"
        fi
    done
}

# Clear cache
clear_cache() {
    echo "Clearing TTS cache..."
    rm -rf "$CACHE_DIR"/*
    echo "Cache cleared"
}

# Diagnose audio issues
diagnose_audio() {
    echo "=== Audio System Diagnostics ==="
    echo ""
    
    # Check OS
    echo "Operating System:"
    if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "- WSL2 detected"
        echo "- WSLg PulseServer: ${PULSE_SERVER:-not set}"
    else
        echo "- Native Linux/macOS"
    fi
    echo ""
    
    # Check audio players
    echo "Audio Players:"
    for player in paplay aplay play afplay mpg123 ffplay; do
        if command -v $player >/dev/null 2>&1; then
            echo "- $player: ✓ installed"
        else
            echo "- $player: ✗ not found"
        fi
    done
    echo ""
    
    # Check PulseAudio
    if command -v pactl >/dev/null 2>&1; then
        echo "PulseAudio Status:"
        pactl info 2>/dev/null | grep -E "Server Name|Default Sink" || echo "- Unable to connect to PulseAudio"
        echo ""
    fi
    
    # Test audio playback
    echo "Audio Playback Test:"
    if [ -f /usr/share/sounds/alsa/Front_Center.wav ]; then
        echo "- Testing system sound..."
        paplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null && echo "  ✓ paplay works" || echo "  ✗ paplay failed"
        aplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null && echo "  ✓ aplay works" || echo "  ✗ aplay failed"
    else
        echo "- No system test sound available"
    fi
    echo ""
    
    # Check TTS configuration
    echo "TTS Configuration:"
    echo "- TTS enabled: $(get_tts_setting "enabled" "true")"
    echo "- TTS provider: $(get_tts_setting "provider" "none")"
    echo "- Fallback provider: $(get_tts_setting "fallback_provider" "none")"
    echo ""
    
    # WSL2 specific checks
    if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "WSL2 Audio Tips:"
        echo "- Ensure Windows audio is not muted"
        echo "- Try: pulseaudio --start --log-target=syslog"
        echo "- Check: ps aux | grep -E 'wslg|pulse'"
        echo "- Test: speaker-test -t wav -c 2"
    fi
}

# Show help
show_help() {
    echo "TTS Manager - Text-to-Speech Management Tool"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  speak <persona> <message>  - Speak a message as a persona"
    echo "  test [provider]           - Test TTS functionality"
    echo "  configure [provider]      - Configure a TTS provider"
    echo "  list                      - List available providers"
    echo "  clear-cache              - Clear audio cache"
    echo "  diagnose                 - Diagnose audio system issues"
    echo "  help                     - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 speak orchestrator \"Hello world\""
    echo "  $0 test elevenlabs"
    echo "  $0 configure"
}

# Main command handler
case "${1:-help}" in
    speak)
        speak "$2" "$3" "$4"
        ;;
    test)
        test_tts "$2"
        ;;
    configure)
        configure_provider "$2"
        ;;
    list)
        list_providers
        ;;
    clear-cache)
        clear_cache
        ;;
    diagnose)
        diagnose_audio
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac