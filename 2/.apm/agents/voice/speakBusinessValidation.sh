#!/bin/bash

# Business Validation Specialist Voice Script
# Provides audio feedback for business validation activities

# Check if message is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 'message to speak'"
    exit 1
fi

MESSAGE="$1"

# Voice configuration for Business Validation Specialist
VOICE_RATE="180"        # Slightly slower for analytical content
VOICE_PITCH="0"         # Professional neutral pitch
VOICE_VOLUME="0.8"      # Clear but not overwhelming

# Add Business Validation context prefix
CONTEXT_MESSAGE="[Business Validation Specialist] $MESSAGE"

# Check available TTS systems and use the best one
if command -v espeak-ng >/dev/null 2>&1; then
    # espeak-ng with business professional voice settings
    echo "$CONTEXT_MESSAGE" | espeak-ng -s $VOICE_RATE -p 40 -a 80 -v en+f3
elif command -v espeak >/dev/null 2>&1; then
    # espeak fallback
    echo "$CONTEXT_MESSAGE" | espeak -s $VOICE_RATE -p 40 -a 80 -v en+f3
elif command -v say >/dev/null 2>&1; then
    # macOS say command with professional voice
    say -r $VOICE_RATE -v Samantha "$CONTEXT_MESSAGE"
elif command -v festival >/dev/null 2>&1; then
    # Festival TTS
    echo "$CONTEXT_MESSAGE" | festival --tts
else
    # Fallback to text output if no TTS available
    echo "🔊 $CONTEXT_MESSAGE"
fi

# Log the voice notification
echo "$(date '+%Y-%m-%d %H:%M:%S') - Business Validation Voice: $MESSAGE" >> /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/voice-notifications.log

exit 0