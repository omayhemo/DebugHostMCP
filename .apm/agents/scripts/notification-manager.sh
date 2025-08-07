#!/bin/bash
# Notification Manager - Handles audio notifications and TTS

set -e

# Get directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AP_ROOT="$(dirname "$SCRIPT_DIR")"
APM_ROOT="$(dirname "$AP_ROOT")"
PROJECT_ROOT="$(dirname "$APM_ROOT")"

# Settings and TTS Manager
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"
TTS_MANAGER="$SCRIPT_DIR/tts-manager.sh"
SOUNDS_DIR="$AP_ROOT/sounds"

# Get audio player configuration from settings
get_audio_config() {
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        AUDIO_PLAYER=$(jq -r ".env.AUDIO_PLAYER // \"none\"" "$SETTINGS_FILE")
        AUDIO_PLAYER_ARGS=$(jq -r ".env.AUDIO_PLAYER_ARGS // \"\"" "$SETTINGS_FILE")
        WAV_PLAYER=$(jq -r ".env.WAV_PLAYER // \"none\"" "$SETTINGS_FILE")
        WAV_PLAYER_ARGS=$(jq -r ".env.WAV_PLAYER_ARGS // \"\"" "$SETTINGS_FILE")
        FFMPEG_AVAILABLE=$(jq -r ".env.FFMPEG_AVAILABLE // \"false\"" "$SETTINGS_FILE")
    else
        # Fallback to runtime detection if settings not available
        detect_audio_player
    fi
}

# Runtime audio player detection (fallback)
detect_audio_player() {
    if command -v mpg123 >/dev/null 2>&1; then
        AUDIO_PLAYER="mpg123"
        AUDIO_PLAYER_ARGS="-q"
    elif command -v play >/dev/null 2>&1; then
        AUDIO_PLAYER="play"
        AUDIO_PLAYER_ARGS="-q"
    elif command -v afplay >/dev/null 2>&1; then
        AUDIO_PLAYER="afplay"
        AUDIO_PLAYER_ARGS=""
    elif command -v ffplay >/dev/null 2>&1; then
        AUDIO_PLAYER="ffplay"
        AUDIO_PLAYER_ARGS="-nodisp -autoexit -loglevel quiet"
    else
        AUDIO_PLAYER="none"
        AUDIO_PLAYER_ARGS=""
    fi
    
    if [ "$AUDIO_PLAYER" = "none" ] && command -v aplay >/dev/null 2>&1; then
        WAV_PLAYER="aplay"
        WAV_PLAYER_ARGS="-q"
    else
        WAV_PLAYER="none"
        WAV_PLAYER_ARGS=""
    fi
    
    if command -v ffmpeg >/dev/null 2>&1; then
        FFMPEG_AVAILABLE="true"
    else
        FFMPEG_AVAILABLE="false"
    fi
}

# Initialize audio configuration
get_audio_config

# Play notification sound
play_sound() {
    local sound_name="$1"
    local sound_file="$SOUNDS_DIR/${sound_name}.mp3"
    
    if [ ! -f "$sound_file" ]; then
        return 1
    fi
    
    # Use configured player
    if [ "$AUDIO_PLAYER" != "none" ]; then
        "$AUDIO_PLAYER" $AUDIO_PLAYER_ARGS "$sound_file" 2>/dev/null &
    elif [ "$WAV_PLAYER" != "none" ] && [ "$FFMPEG_AVAILABLE" = "true" ]; then
        # Convert mp3 to wav for wav-only players
        local temp_wav="/tmp/notification_$$.wav"
        ffmpeg -i "$sound_file" -ar 44100 "$temp_wav" -y >/dev/null 2>&1
        "$WAV_PLAYER" $WAV_PLAYER_ARGS "$temp_wav" 2>/dev/null &
        ( sleep 5; rm -f "$temp_wav" ) &
    else
        # No audio player available
        return 1
    fi
    
    return 0
}

# Handle notification for a specific hook
handle_notification() {
    local hook_name="$1"
    local persona="${2:-orchestrator}"
    local message="$3"
    
    # Get configuration for this hook
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        # Convert hook name to uppercase environment variable format
        # Handle both underscore and camelcase formats
        local env_name=""
        case "$hook_name" in
            user_prompt_submit) env_name="HOOK_USER_PROMPT_SUBMIT_ENABLED" ;;
            pre_compact) env_name="HOOK_PRE_COMPACT_ENABLED" ;;
            pre_tool) env_name="HOOK_PRE_TOOL_ENABLED" ;;
            post_tool) env_name="HOOK_POST_TOOL_ENABLED" ;;
            notification) env_name="HOOK_NOTIFICATION_ENABLED" ;;
            stop) env_name="HOOK_STOP_ENABLED" ;;
            subagent_stop) env_name="HOOK_SUBAGENT_STOP_ENABLED" ;;
            *) env_name="HOOK_${hook_name^^}_ENABLED" ;;
        esac
        
        local enabled=$(jq -r ".env.$env_name // \"false\"" "$SETTINGS_FILE")
        
        if [ "$enabled" != "true" ]; then
            return 0
        fi
        
        # Play the sound file that matches the hook name
        play_sound "$hook_name"
    fi
}

# Main command
case "${1:-help}" in
    notify)
        handle_notification "$2" "$3" "$4"
        ;;
    test)
        echo "Testing notification for hook: ${2:-notification}"
        handle_notification "${2:-notification}" "orchestrator" "This is a test notification"
        ;;
    install-audio-player)
        echo "Installing audio player for notification sounds..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if command -v apt-get >/dev/null 2>&1; then
                sudo apt-get update && sudo apt-get install -y mpg123
            elif command -v yum >/dev/null 2>&1; then
                sudo yum install -y mpg123
            elif command -v pacman >/dev/null 2>&1; then
                sudo pacman -S mpg123
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew >/dev/null 2>&1; then
                brew install mpg123
            fi
        fi
        ;;
    *)
        echo "Usage: $0 notify <hook_name> [persona] [message]"
        echo "       $0 test [hook_name]"
        echo "       $0 install-audio-player"
        echo ""
        echo "Hooks: notification, pre_tool, post_tool, stop, subagent_stop, user_prompt_submit, pre_compact"
        ;;
esac