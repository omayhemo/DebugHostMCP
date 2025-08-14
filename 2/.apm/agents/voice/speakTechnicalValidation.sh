#!/bin/bash

# speakTechnicalValidation.sh - Voice notifications for Technical Validation Specialist
# Usage: bash speakTechnicalValidation.sh "MESSAGE"

MESSAGE="$1"

if [ -z "$MESSAGE" ]; then
    echo "Usage: $0 \"MESSAGE\""
    exit 1
fi

# Check if espeak is available (most common TTS on Linux)
if command -v espeak >/dev/null 2>&1; then
    espeak -v en -s 150 -p 40 "Technical Validation: $MESSAGE" 2>/dev/null &
elif command -v say >/dev/null 2>&1; then
    # macOS
    say -v Alex -r 180 "Technical Validation: $MESSAGE" &
elif command -v spd-say >/dev/null 2>&1; then
    # speech-dispatcher
    spd-say -t female2 -r -10 "Technical Validation: $MESSAGE" &
else
    # Fallback to console notification
    echo "🔊 Technical Validation: $MESSAGE"
fi

# Log the notification
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Technical Validation Voice: $MESSAGE" >> /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/voice-notifications.log