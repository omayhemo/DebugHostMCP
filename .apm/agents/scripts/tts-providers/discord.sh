#!/bin/bash
# Discord TTS Provider - Send TTS notifications via Discord webhook

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

# Provider info
info() {
    echo "Discord TTS - Send text-to-speech notifications to Discord channel"
}

# Get webhook URL
get_webhook_url() {
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        local url=$(jq -r '.env.TTS_DISCORD_WEBHOOK_URL // ""' "$SETTINGS_FILE" 2>/dev/null)
        if [ -n "$url" ] && [ "$url" != "null" ]; then
            # Expand environment variables
            eval echo "$url"
        else
            echo "$DISCORD_WEBHOOK_URL"
        fi
    else
        echo "$DISCORD_WEBHOOK_URL"
    fi
}

# Check if provider is available
check() {
    local webhook_url=$(get_webhook_url)
    if [ -n "$webhook_url" ] && command -v curl >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Get emoji for persona
get_persona_emoji() {
    local persona="$1"
    
    case "$persona" in
        orchestrator) echo "🎭" ;;
        developer) echo "💻" ;;
        architect) echo "🏗️" ;;
        analyst) echo "📊" ;;
        qa) echo "🧪" ;;
        pm) echo "📋" ;;
        po) echo "👔" ;;
        sm) echo "🏃" ;;
        design_architect) echo "🎨" ;;
        *) echo "🤖" ;;
    esac
}

# Get persona display name
get_persona_name() {
    local persona="$1"
    
    case "$persona" in
        orchestrator) echo "Coherence Orchestrator" ;;
        developer) echo "Coherence Developer" ;;
        architect) echo "Coherence Architect" ;;
        analyst) echo "Coherence Analyst" ;;
        qa) echo "Coherence QA" ;;
        pm) echo "Coherence Project Manager" ;;
        po) echo "Coherence Product Owner" ;;
        sm) echo "Coherence Scrum Master" ;;
        design_architect) echo "Coherence Design Architect" ;;
        *) echo "Coherence Agent" ;;
    esac
}

# Speak function (send to Discord)
speak() {
    local persona="$1"
    local message="$2"
    local options="$3"
    
    local webhook_url=$(get_webhook_url)
    if [ -z "$webhook_url" ]; then
        return 1
    fi
    
    # Get TTS setting
    local tts_enabled="true"
    if [ -f "$SETTINGS_FILE" ] && command -v jq >/dev/null 2>&1; then
        tts_enabled=$(jq -r '.env.TTS_DISCORD_TTS_ENABLED // "true"' "$SETTINGS_FILE" 2>/dev/null)
    fi
    
    # Get persona info
    local emoji=$(get_persona_emoji "$persona")
    local name=$(get_persona_name "$persona")
    
    # Create Discord message
    local discord_message="$emoji **$name**: $message"
    
    # Prepare JSON payload
    local json_payload=$(cat <<EOF
{
    "content": "$discord_message",
    "username": "$name",
    "tts": $tts_enabled
}
EOF
    )
    
    # Send to Discord
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Content-Type: application/json" \
        -X POST \
        -d "$json_payload" \
        "$webhook_url" 2>/dev/null)
    
    if [ "$response" = "204" ]; then
        return 0
    else
        echo "Error: Discord webhook returned $response" >&2
        return 1
    fi
}

# Configure Discord
configure() {
    echo "=== Discord TTS Configuration ==="
    echo ""
    echo "Discord TTS sends notifications to a Discord channel via webhook."
    echo "The messages can use Discord's built-in TTS feature."
    echo ""
    echo "To get a webhook URL:"
    echo "1. Open Discord and go to your channel"
    echo "2. Click the gear icon (Edit Channel)"
    echo "3. Go to 'Integrations' → 'Webhooks'"
    echo "4. Click 'New Webhook' or copy existing"
    echo "5. Copy the webhook URL"
    echo ""
    
    # Check if already configured
    local existing_url=$(get_webhook_url)
    if [ -n "$existing_url" ]; then
        echo "Discord webhook is already configured."
        echo "Current webhook: ${existing_url:0:50}..."
        printf "${YELLOW}Reconfigure? (y/N): ${NC}"
        read -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    # Get webhook URL
    printf "${YELLOW}Please paste your Discord webhook URL (or press Enter to skip): ${NC}"
    read webhook_url
    
    if [ -z "$webhook_url" ]; then
        echo "Skipping Discord configuration."
        return 0
    fi
    
    # Validate URL format
    if [[ ! "$webhook_url" =~ ^https://discord(app)?\.com/api/webhooks/ ]]; then
        echo "⚠️  Warning: URL doesn't look like a Discord webhook URL"
        printf "${YELLOW}Continue anyway? (y/N): ${NC}"
        read -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    # Test webhook
    echo "Testing webhook..."
    local test_payload='{"content": "🔧 Coherence TTS Test", "username": "Coherence Setup"}'
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Content-Type: application/json" \
        -X POST \
        -d "$test_payload" \
        "$webhook_url" 2>/dev/null)
    
    if [ "$response" = "204" ]; then
        echo "✅ Webhook validated successfully!"
        echo "Check your Discord channel for the test message."
    else
        echo "❌ Webhook test failed (HTTP $response)"
        echo "Please check your webhook URL and try again."
        return 1
    fi
    
    # TTS option
    echo ""
    printf "${YELLOW}Enable Discord TTS for messages? (y/N): ${NC}"
    read -n 1 -r
    echo
    local tts_enabled="false"
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        tts_enabled="true"
        echo "Discord TTS enabled - messages will be read aloud in voice channels"
    else
        echo "Discord TTS disabled - messages will be text-only"
    fi
    
    # Storage method
    echo ""
    echo "How would you like to store the webhook URL?"
    echo "1) Environment variable (DISCORD_WEBHOOK_URL)"
    echo "2) Settings file"
    echo ""
    printf "${YELLOW}Select option (1-2) [1]: ${NC}"
    read storage_option
    storage_option=${storage_option:-1}
    
    # Store webhook URL
    local webhook_ref="$webhook_url"
    if [ "$storage_option" = "1" ]; then
        # Environment variable
        webhook_ref='${DISCORD_WEBHOOK_URL}'
        
        # Add to shell profile
        local shell_profile=""
        if [ -f "$HOME/.zshrc" ]; then
            shell_profile="$HOME/.zshrc"
        elif [ -f "$HOME/.bashrc" ]; then
            shell_profile="$HOME/.bashrc"
        else
            shell_profile="$HOME/.profile"
        fi
        
        if ! grep -q "export DISCORD_WEBHOOK_URL=" "$shell_profile" 2>/dev/null; then
            echo "" >> "$shell_profile"
            echo "# Discord webhook for Coherence notifications" >> "$shell_profile"
            echo "export DISCORD_WEBHOOK_URL='$webhook_url'" >> "$shell_profile"
        else
            sed -i.bak "s|export DISCORD_WEBHOOK_URL=.*|export DISCORD_WEBHOOK_URL='$webhook_url'|" "$shell_profile"
            rm -f "$shell_profile.bak"
        fi
        
        echo "Added to $shell_profile"
    fi
    
    # Update settings
    mkdir -p "$(dirname "$SETTINGS_FILE")"
    if [ ! -f "$SETTINGS_FILE" ]; then
        echo '{"env": {}}' > "$SETTINGS_FILE"
    fi
    
    if command -v jq >/dev/null 2>&1; then
        local tmp_file=$(mktemp)
        jq ".env.TTS_DISCORD_WEBHOOK_URL = \"$webhook_ref\" | .env.TTS_DISCORD_TTS_ENABLED = \"$tts_enabled\"" "$SETTINGS_FILE" > "$tmp_file" && mv "$tmp_file" "$SETTINGS_FILE"
        
        # Pretty print
        jq '.' "$SETTINGS_FILE" > "$tmp_file" && mv "$tmp_file" "$SETTINGS_FILE"
    fi
    
    echo ""
    echo "✅ Discord TTS configured successfully!"
    
    if [ "$storage_option" = "1" ]; then
        echo ""
        echo "To use in current session, run:"
        echo "  export DISCORD_WEBHOOK_URL='$webhook_url'"
    fi
    
    echo ""
    echo "Test with: $TTS_MANAGER_DIR/tts-manager.sh test discord"
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