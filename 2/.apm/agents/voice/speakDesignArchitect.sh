#\!/bin/bash
# Voice script for AP Design Architect using TTS manager

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the base script
source "$SCRIPT_DIR/speakBase.sh"

# Set persona
PERSONA="design_architect"

# Handle input and speak
handle_input "$PERSONA" "$@"
