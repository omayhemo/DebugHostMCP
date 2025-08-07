#!/bin/bash
# Base script for voice synthesis using TTS manager
# This script provides common functionality for all voice scripts

# Get the script directory
VOICE_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AP_ROOT="$(dirname "$VOICE_SCRIPT_DIR")"
APM_ROOT="$(dirname "$AP_ROOT")"
PROJECT_ROOT="$(dirname "$APM_ROOT")"

# TTS Manager location
TTS_MANAGER="$AP_ROOT/scripts/tts-manager.sh"

# Function to check if TTS manager is available
check_tts_manager() {
    if [ ! -f "$TTS_MANAGER" ] || [ ! -x "$TTS_MANAGER" ]; then
        # Silent fail - no audio but don't break execution
        return 1
    fi
    return 0
}

# Function to synthesize speech using TTS manager
synthesize_speech() {
    local persona="$1"
    local text="$2"
    
    # Check TTS manager availability
    if ! check_tts_manager; then
        # Silent fail
        return 0
    fi
    
    # Use TTS manager to speak
    "$TTS_MANAGER" speak "$persona" "$text" 2>/dev/null || true
}

# Function to handle input (from arguments or stdin)
handle_input() {
    local persona="$1"
    local text=""
    
    # Check if text is provided as arguments
    if [ $# -gt 1 ]; then
        # Shift to remove persona from arguments
        shift
        text="$*"
    else
        # Read from stdin
        if [ -t 0 ]; then
            # No stdin and no arguments - just exit silently
            exit 0
        fi
        text=$(cat)
    fi
    
    # Check if we have text
    if [ -z "$text" ]; then
        # No text - exit silently
        exit 0
    fi
    
    # Synthesize and play speech
    synthesize_speech "$persona" "$text"
}

# Export functions for use in other scripts
export -f check_tts_manager
export -f synthesize_speech