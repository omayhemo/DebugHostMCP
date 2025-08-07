#!/bin/bash
# None TTS Provider - Silent mode, no audio output

# Provider info
info() {
    echo "Silent mode - No audio output"
}

# Check if provider is available (always true for none)
check() {
    return 0
}

# Speak function (does nothing)
speak() {
    local persona="$1"
    local message="$2"
    local options="$3"
    
    # Silent mode - just return success
    return 0
}

# Configure (nothing to configure)
configure() {
    echo "Silent mode requires no configuration"
    return 0
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