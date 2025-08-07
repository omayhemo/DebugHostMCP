#!/bin/bash
# Piper TTS Provider - Local, offline text-to-speech

# Don't use set -e as audio players often return non-zero even when working
# This allows us to try multiple fallback options

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TTS_MANAGER_DIR="$(dirname "$SCRIPT_DIR")"
AP_ROOT="$(dirname "$TTS_MANAGER_DIR")"
APM_ROOT="$(dirname "$AP_ROOT")"
PROJECT_ROOT="$(dirname "$APM_ROOT")"

# Load settings
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"

# Get Piper directory from settings or default
get_piper_dir() {
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        local dir=$(jq -r '.env.TTS_PIPER_INSTALL_PATH // ""' "$SETTINGS_FILE" 2>/dev/null)
        if [ -n "$dir" ] && [ "$dir" != "null" ]; then
            # Expand variables - replace ${PROJECT_ROOT} with actual value
            dir=$(echo "$dir" | sed "s|\${PROJECT_ROOT}|$PROJECT_ROOT|g")
            echo "$dir"
            return
        fi
    fi
    echo "$PROJECT_ROOT/.piper"
}

PIPER_DIR=$(get_piper_dir)
PIPER_BIN="$PIPER_DIR/piper"

# Voice mappings
declare -A VOICE_MAP=(
    ["orchestrator"]="ryan"
    ["developer"]="joe"
    ["architect"]="ryan"
    ["analyst"]="amy"        # Changed from kathy (not available)
    ["qa"]="hfc_female"      # Changed from kathleen (not available)
    ["pm"]="joe"
    ["po"]="ryan"
    ["sm"]="joe"
    ["design_architect"]="kusal"  # Changed to use different female voice
)

# Provider info
info() {
    echo "Piper TTS - Fast, offline neural text-to-speech"
}

# Check if Piper is available
check() {
    # Check if binary exists and is executable
    if [ ! -f "$PIPER_BIN" ] || [ ! -x "$PIPER_BIN" ]; then
        return 1
    fi
    
    # Check if models directory exists
    if [ ! -d "$PIPER_DIR/models" ]; then
        echo "Warning: Models directory not found at $PIPER_DIR/models" >&2
        return 1
    fi
    
    # Check if at least one model exists
    if ! ls "$PIPER_DIR/models"/*.onnx >/dev/null 2>&1; then
        echo "Warning: No voice models found in $PIPER_DIR/models" >&2
        return 1
    fi
    
    return 0
}

# Get voice for persona
get_voice() {
    local persona="$1"
    
    # First check settings for custom mapping
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        # Convert persona to uppercase for env variable lookup
        local persona_upper=$(echo "$persona" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        local custom_voice=$(jq -r ".env.TTS_VOICE_${persona_upper}_PIPER // \"\"" "$SETTINGS_FILE" 2>/dev/null)
        if [ -n "$custom_voice" ] && [ "$custom_voice" != "null" ]; then
            echo "$custom_voice"
            return
        fi
    fi
    
    # Use default mapping
    echo "${VOICE_MAP[$persona]:-ryan}"
}

# Speak function
speak() {
    local persona="$1"
    local message="$2"
    local options="$3"
    
    if ! check; then
        return 1
    fi
    
    # Get voice for persona
    local voice=$(get_voice "$persona")
    local model_path="$PIPER_DIR/models/${voice}.onnx"
    
    # Check if model exists
    if [ ! -f "$model_path" ]; then
        # Try with en_US prefix
        model_path="$PIPER_DIR/models/en_US-${voice}.onnx"
        if [ ! -f "$model_path" ]; then
            # Try medium quality
            model_path="$PIPER_DIR/models/en_US-${voice}-medium.onnx"
            if [ ! -f "$model_path" ]; then
                # Fallback to ryan
                model_path="$PIPER_DIR/models/en_US-ryan-medium.onnx"
            fi
        fi
    fi
    
    # Ensure model exists
    if [ ! -f "$model_path" ]; then
        echo "Error: Voice model not found: $model_path" >&2
        return 1
    fi
    
    # Detect WSL2 for audio player preference
    local is_wsl2=false
    if grep -qi microsoft /proc/version 2>/dev/null; then
        is_wsl2=true
    fi
    
    # Generate speech to temporary file for multiple playback attempts
    local temp_audio=$(mktemp --suffix=.raw)
    
    # Generate audio
    echo "$message" | "$PIPER_BIN" \
        --model "$model_path" \
        --output-raw 2>/dev/null > "$temp_audio"
    
    if [ ! -s "$temp_audio" ]; then
        rm -f "$temp_audio"
        echo "Error: Failed to generate audio" >&2
        return 1
    fi
    
    # Try different audio players
    local played=false
    
    if [ "$is_wsl2" = true ]; then
        # WSL2: Try paplay first (PulseAudio)
        if command -v paplay >/dev/null 2>&1; then
            paplay --raw --rate=22050 --format=s16le --channels=1 "$temp_audio" 2>/dev/null && played=true
        fi
        
        # Try aplay if paplay failed
        if [ "$played" = false ] && command -v aplay >/dev/null 2>&1; then
            aplay -q -r 22050 -f S16_LE -t raw -c 1 "$temp_audio" 2>/dev/null && played=true
        fi
    else
        # Non-WSL2: Try aplay first
        if command -v aplay >/dev/null 2>&1; then
            aplay -q -r 22050 -f S16_LE -t raw -c 1 "$temp_audio" 2>/dev/null && played=true
        fi
        
        # Try paplay as fallback
        if [ "$played" = false ] && command -v paplay >/dev/null 2>&1; then
            paplay --raw --rate=22050 --format=s16le --channels=1 "$temp_audio" 2>/dev/null && played=true
        fi
    fi
    
    # Try other players if still not played
    if [ "$played" = false ]; then
        if command -v play >/dev/null 2>&1; then
            play -q -t raw -r 22050 -e signed -b 16 -c 1 "$temp_audio" 2>/dev/null && played=true
        elif command -v afplay >/dev/null 2>&1; then
            afplay -q -f LEI16 -r 22050 "$temp_audio" 2>/dev/null && played=true
        fi
    fi
    
    # Clean up
    rm -f "$temp_audio"
    
    # Return success even if playback failed (TTS generation succeeded)
    # This prevents the entire pipeline from failing due to audio issues
    if [ "$played" = false ]; then
        echo "Warning: Audio playback failed but TTS generation succeeded" >&2
    fi
    
    return 0
}

# Configure Piper
configure() {
    echo "=== Configure Piper TTS ==="
    echo ""
    
    if check; then
        echo "Piper is already installed at: $PIPER_DIR"
        read -p "Reinstall? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    # Run Piper setup script
    local setup_script="$AP_ROOT/scripts/tts-setup/setup-piper-chat.sh"
    if [ -f "$setup_script" ]; then
        bash "$setup_script" "$PIPER_DIR"
    else
        echo "Error: Piper setup script not found at: $setup_script"
        return 1
    fi
}

# Main command handler
case "${1:-info}" in
    info)
        info
        ;;
    check)
        check
        ;;
    speak)
        speak "$2" "$3" "$4"
        ;;
    configure)
        configure
        ;;
    *)
        echo "Usage: $0 {info|check|speak|configure}"
        exit 1
        ;;
esac