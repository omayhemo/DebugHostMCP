#!/bin/bash
# Voice script for AP Compliance using TTS manager

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the base script
source "$SCRIPT_DIR/speakBase.sh"

# Set persona
PERSONA="compliance"

# Handle input and speak
handle_input "$PERSONA" "$@"