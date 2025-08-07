#\!/bin/bash
# Voice script for AP Pm using TTS manager

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the base script
source "$SCRIPT_DIR/speakBase.sh"

# Set persona
PERSONA="pm"

# Handle input and speak
handle_input "$PERSONA" "$@"
