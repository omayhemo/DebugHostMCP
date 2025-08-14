#!/bin/bash
# ElevenLabs TTS Provider - High-quality text-to-speech only

set -e

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TTS_MANAGER_DIR="$(dirname "$SCRIPT_DIR")"
AP_ROOT="$(dirname "$TTS_MANAGER_DIR")"
APM_ROOT="$(dirname "$AP_ROOT")"
PROJECT_ROOT="$(dirname "$APM_ROOT")"

# Load settings
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"

# Cache directory
CACHE_DIR="$PROJECT_ROOT/.cache/tts/elevenlabs"
mkdir -p "$CACHE_DIR"

# Default voice mappings (using common ElevenLabs voice IDs)
# These are commonly available voices - if one doesn't work, it will fall back to George
declare -A DEFAULT_VOICE_MAP=(
    ["orchestrator"]="JBFqnCBsd6RMkjVDRZzb"  # George (British, mature)
    ["developer"]="TxGEqnHWrfWFTfGW9XjX"     # Josh (American, young adult)
    ["architect"]="pNInz6obpgDQGcFmaJgB"     # Adam (American, middle aged)
    ["analyst"]="21m00Tcm4TlvDq8ikWAM"       # Rachel (American, young adult)
    ["qa"]="ThT5KcBeYPX3keUQqHPh"           # Dorothy (British, young adult)
    ["pm"]="TxGEqnHWrfWFTfGW9XjX"           # Josh (American, young adult)
    ["po"]="JBFqnCBsd6RMkjVDRZzb"           # George (British, mature)
    ["sm"]="Zlb1dXrM653N07WRdFW3"           # Daniel (British, middle aged)
    ["design_architect"]="EXAVITQu4vr4xnSDxMaL"  # Bella (American, young adult)
)

# Provider info
info() {
    echo "ElevenLabs - Premium AI text-to-speech with natural voices"
}

# Get API key from various sources
get_api_key() {
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        local stored_value=$(jq -r '.env.TTS_ELEVENLABS_API_KEY // ""' "$SETTINGS_FILE" 2>/dev/null)
        
        case "$stored_value" in
            '${ELEVENLABS_API_KEY}')
                # Environment variable
                echo "$ELEVENLABS_API_KEY"
                ;;
            encrypted:*)
                # Decode obfuscated key
                echo "${stored_value#encrypted:}" | base64 -d 2>/dev/null || echo ""
                ;;
            keychain:*)
                # Retrieve from macOS keychain
                if command -v security >/dev/null 2>&1; then
                    security find-generic-password -a "$USER" -s "${stored_value#keychain:}" -w 2>/dev/null || echo ""
                fi
                ;;
            secret-tool:*)
                # Retrieve from Linux secret storage
                if command -v secret-tool >/dev/null 2>&1; then
                    secret-tool lookup application ap-method service elevenlabs 2>/dev/null || echo ""
                fi
                ;;
            ""|null)
                # Try environment variable as fallback
                echo "$ELEVENLABS_API_KEY"
                ;;
            *)
                # Direct value (not recommended but supported)
                echo "$stored_value"
                ;;
        esac
    else
        # Fallback to environment variable
        echo "$ELEVENLABS_API_KEY"
    fi
}

# Check if ElevenLabs is available
check() {
    local api_key=$(get_api_key)
    
    # Simply check if API key exists
    if [ -n "$api_key" ]; then
        return 0
    else
        return 1
    fi
}

# Get voice for persona
get_voice() {
    local persona="$1"
    
    # First check settings for custom mapping
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        local custom_voice=$(jq -r ".ap.tts.voices.$persona.elevenlabs // \"\"" "$SETTINGS_FILE" 2>/dev/null)
        if [ -n "$custom_voice" ] && [ "$custom_voice" != "null" ]; then
            echo "$custom_voice"
            return
        fi
    fi
    
    # Use default mapping
    echo "${DEFAULT_VOICE_MAP[$persona]:-JBFqnCBsd6RMkjVDRZzb}"
}

# Play audio file cross-platform
play_audio() {
    local file="$1"
    
    # Prioritize MP3-capable players for ElevenLabs MP3 output
    if command -v mpg123 >/dev/null 2>&1; then
        # mpg123 - best for MP3 files
        mpg123 -q "$file" 2>/dev/null
    elif command -v ffplay >/dev/null 2>&1; then
        # ffplay - handles MP3 well
        ffplay -nodisp -autoexit -loglevel quiet "$file" 2>/dev/null
    elif command -v afplay >/dev/null 2>&1; then
        # macOS - handles MP3 natively
        afplay "$file" 2>/dev/null
    elif command -v play >/dev/null 2>&1; then
        # SoX - can handle MP3 if compiled with support
        play -q "$file" 2>/dev/null
    elif command -v aplay >/dev/null 2>&1; then
        # ALSA - NOT good for MP3, will produce static
        # Convert MP3 to WAV first if this is the only option
        echo "Warning: Using aplay which doesn't handle MP3 well" >&2
        local wav_file="${file%.mp3}.wav"
        if command -v ffmpeg >/dev/null 2>&1; then
            ffmpeg -i "$file" -acodec pcm_s16le -ar 44100 "$wav_file" -y -loglevel quiet 2>/dev/null
            aplay -q "$wav_file" 2>/dev/null
            rm -f "$wav_file"
        else
            # Last resort - will likely produce static
            aplay -q "$file" 2>/dev/null
        fi
    else
        echo "Warning: No audio player found. Install mpg123 for best results:" >&2
        echo "  sudo apt-get install mpg123" >&2
        return 1
    fi
}

# Speak function
speak() {
    local persona="$1"
    local message="$2"
    local options="$3"
    
    local api_key=$(get_api_key)
    if [ -z "$api_key" ]; then
        return 1
    fi
    
    # Get voice for persona
    local voice=$(get_voice "$persona")
    
    # Create cache key (simple hash)
    local cache_key=$(echo -n "${voice}-${message}" | md5sum | cut -d' ' -f1)
    local cache_file="$CACHE_DIR/${cache_key}.mp3"
    
    # Check cache
    if [ -f "$cache_file" ] && [ -s "$cache_file" ]; then
        play_audio "$cache_file"
        return $?
    fi
    
    # Get model from settings or use default
    local model="eleven_monolingual_v1"
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        local custom_model=$(jq -r '.env.TTS_ELEVENLABS_MODEL // ""' "$SETTINGS_FILE" 2>/dev/null)
        if [ -n "$custom_model" ] && [ "$custom_model" != "null" ]; then
            model="$custom_model"
        fi
    fi
    
    # Make API request
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST "https://api.elevenlabs.io/v1/text-to-speech/$voice" \
        -H "xi-api-key: $api_key" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"$message\", \"model_id\": \"$model\"}" \
        --output "$cache_file.tmp" 2>/dev/null)
    
    local http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "200" ] && [ -s "$cache_file.tmp" ]; then
        mv "$cache_file.tmp" "$cache_file"
        play_audio "$cache_file"
        return $?
    elif [ "$http_code" = "404" ] && [ "$voice" != "JBFqnCBsd6RMkjVDRZzb" ]; then
        # Voice not found, try fallback to George
        rm -f "$cache_file.tmp"
        echo "Voice not available, trying George voice..." >&2
        
        # Retry with George voice
        local george_voice="JBFqnCBsd6RMkjVDRZzb"
        local cache_key_fallback=$(echo -n "${george_voice}-${message}" | md5sum | cut -d' ' -f1)
        local cache_file_fallback="$CACHE_DIR/${cache_key_fallback}.mp3"
        
        # Check cache for George voice
        if [ -f "$cache_file_fallback" ] && [ -s "$cache_file_fallback" ]; then
            play_audio "$cache_file_fallback"
            return $?
        fi
        
        # Make request with George voice
        local response_fallback=$(curl -s -w "\n%{http_code}" \
            -X POST "https://api.elevenlabs.io/v1/text-to-speech/$george_voice" \
            -H "xi-api-key: $api_key" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"$message\", \"model_id\": \"$model\"}" \
            --output "$cache_file_fallback.tmp" 2>/dev/null)
        
        local http_code_fallback=$(echo "$response_fallback" | tail -n 1)
        
        if [ "$http_code_fallback" = "200" ] && [ -s "$cache_file_fallback.tmp" ]; then
            mv "$cache_file_fallback.tmp" "$cache_file_fallback"
            play_audio "$cache_file_fallback"
            return $?
        else
            rm -f "$cache_file_fallback.tmp"
            echo "Error: ElevenLabs API returned $http_code_fallback" >&2
            return 1
        fi
    else
        rm -f "$cache_file.tmp"
        echo "Error: ElevenLabs API returned $http_code" >&2
        return 1
    fi
}

# Store API key securely
store_api_key() {
    local api_key="$1"
    local storage_method="$2"
    
    case "$storage_method" in
        1|env|environment)
            # Add to shell profile
            local shell_profile=""
            if [ -f "$HOME/.zshrc" ]; then
                shell_profile="$HOME/.zshrc"
            elif [ -f "$HOME/.bashrc" ]; then
                shell_profile="$HOME/.bashrc"
            else
                shell_profile="$HOME/.profile"
            fi
            
            # Check if already exists
            if ! grep -q "export ELEVENLABS_API_KEY=" "$shell_profile" 2>/dev/null; then
                echo "" >> "$shell_profile"
                echo "# ElevenLabs API key for AP Mapping TTS" >> "$shell_profile"
                echo "export ELEVENLABS_API_KEY='$api_key'" >> "$shell_profile"
            else
                # Update existing
                sed -i.bak "s/export ELEVENLABS_API_KEY=.*/export ELEVENLABS_API_KEY='$api_key'/" "$shell_profile"
                rm -f "$shell_profile.bak"
            fi
            
            echo '${ELEVENLABS_API_KEY}'
            ;;
            
        2|encrypted|obfuscated)
            # Simple obfuscation with base64
            echo "encrypted:$(echo -n "$api_key" | base64)"
            ;;
            
        3|keychain)
            # System keychain
            if command -v security >/dev/null 2>&1; then
                # macOS keychain
                security add-generic-password -U -a "$USER" -s "ap-method-elevenlabs" -w "$api_key" 2>/dev/null
                echo "keychain:ap-method-elevenlabs"
            elif command -v secret-tool >/dev/null 2>&1; then
                # Linux secret storage
                echo -n "$api_key" | secret-tool store --label="AP Mapping ElevenLabs" \
                    application ap-method service elevenlabs 2>/dev/null
                echo "secret-tool:ap-method-elevenlabs"
            else
                # Fallback to obfuscated
                echo "encrypted:$(echo -n "$api_key" | base64)"
            fi
            ;;
            
        4|manual|later)
            # User will set up manually
            echo '${ELEVENLABS_API_KEY}'
            ;;
            
        *)
            # Default to environment variable
            echo '${ELEVENLABS_API_KEY}'
            ;;
    esac
}

# Update settings file with configuration
update_settings() {
    local api_key_ref="$1"
    
    # Ensure settings directory exists
    mkdir -p "$(dirname "$SETTINGS_FILE")"
    
    # Create minimal settings if doesn't exist
    if [ ! -f "$SETTINGS_FILE" ]; then
        echo '{"env": {}}' > "$SETTINGS_FILE"
    fi
    
    # Update settings using jq if available
    if command -v jq >/dev/null 2>&1; then
        # Update API key
        local tmp_file=$(mktemp)
        jq ".env.TTS_ELEVENLABS_API_KEY = \"$api_key_ref\"" "$SETTINGS_FILE" > "$tmp_file" && mv "$tmp_file" "$SETTINGS_FILE"
        
        # Set provider to elevenlabs
        jq '.env.TTS_PROVIDER = "elevenlabs"' "$SETTINGS_FILE" > "$tmp_file" && mv "$tmp_file" "$SETTINGS_FILE"
        
        # Pretty print
        jq '.' "$SETTINGS_FILE" > "$tmp_file" && mv "$tmp_file" "$SETTINGS_FILE"
    else
        echo "Warning: jq not found. Please manually update $SETTINGS_FILE"
    fi
}

# Configure ElevenLabs
configure() {
    echo "=== ElevenLabs TTS Configuration ==="
    echo ""
    echo "ElevenLabs provides high-quality text-to-speech voices."
    echo "You'll need a TTS API key from https://elevenlabs.io"
    echo ""
    
    # Check if already configured
    local existing_key=$(get_api_key)
    if [ -n "$existing_key" ]; then
        echo "ElevenLabs is already configured."
        printf "${YELLOW}Reconfigure? (y/N): ${NC}"
        read -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    # Get API key
    printf "${YELLOW}Please paste your ElevenLabs TTS API key (or press Enter to skip): ${NC}"
    read ELEVENLABS_API_KEY
    
    if [ -z "$ELEVENLABS_API_KEY" ]; then
        echo "Skipping ElevenLabs configuration."
        return 0
    fi
    
    # Test API key with a simple TTS request
    echo "Testing TTS API key..."
    local test_voice="JBFqnCBsd6RMkjVDRZzb"  # George voice
    local test_response=$(curl -s -w "\n%{http_code}" \
        -X POST "https://api.elevenlabs.io/v1/text-to-speech/$test_voice" \
        -H "xi-api-key: $ELEVENLABS_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"text": "test", "model_id": "eleven_monolingual_v1"}' \
        -o /tmp/elevenlabs_test.mp3 2>/dev/null)
    
    local http_code=$(echo "$test_response" | tail -n 1)
    
    if [ "$http_code" = "200" ] && [ -s "/tmp/elevenlabs_test.mp3" ]; then
        echo "✅ TTS API key validated successfully!"
        rm -f /tmp/elevenlabs_test.mp3
    else
        echo "❌ TTS API key validation failed (HTTP $http_code)"
        echo "Please check your API key and try again."
        rm -f /tmp/elevenlabs_test.mp3
        return 1
    fi
    
    # Storage method
    echo ""
    echo "=== API Key Storage ==="
    echo "How would you like to store your API key?"
    echo ""
    echo "1) Environment variable (add to .bashrc/.zshrc)"
    echo "2) Project settings file (obfuscated)"
    echo "3) System keychain (if available)"
    echo "4) Manual setup later"
    echo ""
    printf "${YELLOW}Select option (1-4) [1]: ${NC}"
    read storage_option
    storage_option=${storage_option:-1}
    
    # Store API key
    local api_key_ref=$(store_api_key "$ELEVENLABS_API_KEY" "$storage_option")
    
    # Update settings
    update_settings "$api_key_ref"
    
    # Show default voice mappings
    echo ""
    echo "Default voice assignments:"
    echo "- Orchestrator/PO: George (British, mature)"
    echo "- Developer/PM: Josh (American, young adult)"
    echo "- Architect: Adam (American, middle aged)"
    echo "- Analyst: Rachel (American, young adult)"
    echo "- QA: Dorothy (British, young adult)"
    echo "- SM: Daniel (British, middle aged)"
    echo "- Design Architect: Bella (American, young adult)"
    echo ""
    echo "Note: If a voice isn't available on your plan, it will automatically fall back to George."
    echo "You can customize voices later in settings.json"
    
    # Final instructions
    echo ""
    echo "✅ ElevenLabs TTS configured successfully!"
    
    case "$storage_option" in
        1)
            echo ""
            echo "To use in current session, run:"
            echo "  export ELEVENLABS_API_KEY='$ELEVENLABS_API_KEY'"
            ;;
        4)
            echo ""
            echo "To complete setup, set your API key:"
            echo "  export ELEVENLABS_API_KEY='your-api-key-here'"
            ;;
    esac
    
    echo ""
    echo "Test with: $TTS_MANAGER_DIR/tts-manager.sh test elevenlabs"
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