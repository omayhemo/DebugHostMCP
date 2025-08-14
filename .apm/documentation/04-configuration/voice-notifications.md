# APM Voice Notifications Configuration Guide

This guide covers the configuration and customization of the voice notification system in the Agentic Persona Mapping (APM) framework.

## Voice System Overview

APM's voice notification system provides:

- **Persona-Specific Voices**: Different audio characteristics for each persona
- **Context-Aware Notifications**: Intelligent audio feedback based on actions
- **Multi-Platform Support**: Works across Windows, macOS, and Linux
- **Customizable Settings**: Adjustable speed, volume, and voice selection
- **Integration Points**: Seamless integration with all APM personas

## Voice System Architecture

```
Voice Trigger → Voice Script → TTS Engine → Audio Output
     ↓              ↓            ↓           ↓
APM Command    speakPersona.sh  System TTS  Speakers/Headphones
```

### Components

1. **Voice Scripts**: Shell scripts for each persona (`speakPersona.sh`)
2. **Voice Engine**: Text-to-speech system (system, espeak, festival)
3. **Configuration**: Settings for voice characteristics and behavior
4. **Integration**: Hooks into APM persona activation and responses

## Voice Script Locations

All voice scripts are located in: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/`

### Default Voice Scripts

- `speakOrchestrator.sh` - AP Orchestrator voice
- `speakDeveloper.sh` - Developer persona voice
- `speakArchitect.sh` - System Architect voice
- `speakDesignArchitect.sh` - Design Architect voice
- `speakAnalyst.sh` - Business Analyst voice
- `speakQa.sh` - Quality Assurance voice
- `speakPm.sh` - Project Manager voice
- `speakPo.sh` - Product Owner voice
- `speakSm.sh` - Scrum Master voice

## Basic Voice Configuration

### Environment Variables

Configure voice behavior through environment variables:

```bash
# Enable/disable voice notifications
export VOICE_NOTIFICATIONS_ENABLED="true"

# Select TTS engine
export VOICE_ENGINE="system"

# Control speech characteristics
export VOICE_SPEED="1.2"
export VOICE_VOLUME="0.8"

# Enable persona-specific voices
export VOICE_PERSONA_DIFFERENTIATION="true"
```

### Voice Configuration File

Create `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice-config.json`:

```json
{
  "global_settings": {
    "enabled": true,
    "default_engine": "system",
    "fallback_engine": "espeak",
    "notification_types": {
      "activation": true,
      "completion": true,
      "error": true,
      "handoff": true,
      "progress": false,
      "debug": false
    }
  },
  "engine_settings": {
    "system": {
      "default_voice": "default",
      "rate_multiplier": 1.0,
      "volume_level": 0.8
    },
    "espeak": {
      "voice": "en",
      "speed": 150,
      "amplitude": 80,
      "pitch": 50
    },
    "festival": {
      "voice": "default",
      "rate": 1.0
    }
  },
  "persona_voices": {
    "orchestrator": {
      "voice": "Alex",
      "rate": 1.0,
      "pitch": 0,
      "volume": 0.8,
      "characteristics": "authoritative, clear"
    },
    "developer": {
      "voice": "Samantha",
      "rate": 1.1,
      "pitch": 5,
      "volume": 0.7,
      "characteristics": "technical, precise"
    },
    "architect": {
      "voice": "Tom",
      "rate": 0.9,
      "pitch": -5,
      "volume": 0.8,
      "characteristics": "thoughtful, strategic"
    },
    "analyst": {
      "voice": "Karen",
      "rate": 1.0,
      "pitch": 10,
      "volume": 0.7,
      "characteristics": "analytical, detailed"
    },
    "qa": {
      "voice": "Daniel",
      "rate": 1.0,
      "pitch": 0,
      "volume": 0.8,
      "characteristics": "methodical, thorough"
    },
    "pm": {
      "voice": "Victoria",
      "rate": 1.0,
      "pitch": 8,
      "volume": 0.8,
      "characteristics": "organized, directive"
    },
    "po": {
      "voice": "Oliver",
      "rate": 1.0,
      "pitch": 3,
      "volume": 0.8,
      "characteristics": "business-focused, strategic"
    },
    "sm": {
      "voice": "Fiona",
      "rate": 1.0,
      "pitch": 7,
      "volume": 0.7,
      "characteristics": "supportive, facilitative"
    }
  }
}
```

## Platform-Specific Configuration

### macOS Configuration

macOS uses the built-in `say` command:

```bash
# Test system voices
say -v "?" | head -20

# Configure for APM
export VOICE_ENGINE="system"
export VOICE_SPEED="1.2"

# Advanced macOS voice settings
export MACOS_VOICE_RATE="200"  # Words per minute (default: 175)
export MACOS_DEFAULT_VOICE="Alex"
```

#### Available macOS Voices

```bash
# List all available voices
say -v "?"

# Test specific voices
say -v "Alex" "AP Orchestrator activated"
say -v "Samantha" "Developer ready for coding tasks"
say -v "Tom" "System architecture review complete"
```

### Linux Configuration

Linux supports multiple TTS engines:

#### espeak Configuration

```bash
# Install espeak
sudo apt-get install espeak espeak-data

# Configure for APM
export VOICE_ENGINE="espeak"
export ESPEAK_VOICE="en"
export ESPEAK_SPEED="150"
export ESPEAK_AMPLITUDE="80"

# Test espeak
espeak "AP Framework voice test"
```

#### festival Configuration

```bash
# Install festival
sudo apt-get install festival festvox-kallpc16k

# Configure for APM
export VOICE_ENGINE="festival"
export FESTIVAL_VOICE="kal_diphone"

# Test festival
echo "APM voice test" | festival --tts
```

### Windows/WSL Configuration

For Windows Subsystem for Linux:

```bash
# Option 1: Use Windows SAPI through PowerShell
export VOICE_ENGINE="powershell"

# Option 2: Install espeak in WSL
sudo apt-get install espeak
export VOICE_ENGINE="espeak"
```

Create Windows-specific voice script:

```bash
#!/bin/bash
# Windows SAPI voice script

if [ "${VOICE_ENGINE}" = "powershell" ]; then
    powershell.exe -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('$1')"
else
    espeak "$1"
fi
```

## Advanced Voice Configuration

### Custom Voice Scripts

Create advanced voice scripts with persona-specific characteristics:

```bash
#!/bin/bash
# Enhanced voice script template

PERSONA="{{PERSONA_NAME}}"
MESSAGE="$1"
CONFIG_FILE="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice-config.json"

# Load persona-specific settings
if [ -f "$CONFIG_FILE" ]; then
    VOICE=$(jq -r ".persona_voices.$PERSONA.voice // \"default\"" "$CONFIG_FILE")
    RATE=$(jq -r ".persona_voices.$PERSONA.rate // 1.0" "$CONFIG_FILE")
    PITCH=$(jq -r ".persona_voices.$PERSONA.pitch // 0" "$CONFIG_FILE")
    VOLUME=$(jq -r ".persona_voices.$PERSONA.volume // 0.8" "$CONFIG_FILE")
else
    # Fallback to environment variables
    VOICE="${VOICE_PERSONA_${PERSONA^^}:-default}"
    RATE="${VOICE_SPEED:-1.0}"
    PITCH="${VOICE_PITCH:-0}"
    VOLUME="${VOICE_VOLUME:-0.8}"
fi

# Voice notification with persona characteristics
speak_with_characteristics() {
    local message="$1"
    
    case "${VOICE_ENGINE:-system}" in
        "system")
            if command -v say >/dev/null 2>&1; then
                # macOS with persona-specific voice
                say -v "$VOICE" -r $(echo "$RATE * 175" | bc) "$message"
            elif command -v espeak >/dev/null 2>&1; then
                # Linux espeak with persona characteristics
                espeak -v "$VOICE" -s $(echo "$RATE * 150" | bc) \
                       -a $(echo "$VOLUME * 100" | bc) \
                       -p $(echo "$PITCH + 50" | bc) "$message"
            fi
            ;;
        "espeak")
            espeak -v "${VOICE:-en}" -s $(echo "$RATE * 150" | bc) \
                   -a $(echo "$VOLUME * 100" | bc) \
                   -p $(echo "$PITCH + 50" | bc) "$message"
            ;;
        "festival")
            echo "$message" | festival --tts
            ;;
        "powershell")
            powershell.exe -Command "
                Add-Type -AssemblyName System.Speech
                \$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
                \$synth.Rate = $([int]($RATE * 0))
                \$synth.Volume = $([int]($VOLUME * 100))
                \$synth.Speak('$message')
            "
            ;;
    esac
}

# Context-aware messaging
add_context() {
    local base_message="$1"
    local timestamp=$(date "+%H:%M")
    
    # Add persona prefix and context
    echo "[$timestamp] [AP $PERSONA] $base_message"
}

# Main execution
if [ "${VOICE_NOTIFICATIONS_ENABLED:-true}" = "true" ]; then
    CONTEXTUAL_MESSAGE=$(add_context "$MESSAGE")
    speak_with_characteristics "$CONTEXTUAL_MESSAGE"
fi

# Always log the message
echo "[AP $PERSONA] $MESSAGE" >> /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/voice-notifications.log
```

### Dynamic Voice Selection

Implement dynamic voice selection based on context:

```bash
#!/bin/bash
# Dynamic voice selection based on context

select_voice_for_context() {
    local context="$1"
    local persona="$2"
    
    case "$context" in
        "activation")
            # Use authoritative voice for activation
            echo "Alex"
            ;;
        "error")
            # Use clear, distinct voice for errors
            echo "Daniel"
            ;;
        "completion")
            # Use pleasant voice for completion
            echo "Samantha"
            ;;
        "handoff")
            # Use professional voice for handoffs
            echo "Victoria"
            ;;
        *)
            # Use persona-specific default
            jq -r ".persona_voices.$persona.voice // \"default\"" "$CONFIG_FILE"
            ;;
    esac
}

# Usage in voice scripts
CONTEXT="${2:-normal}"
SELECTED_VOICE=$(select_voice_for_context "$CONTEXT" "$PERSONA")
```

## Notification Types and Triggers

### Activation Notifications

Triggered when personas are activated:

```bash
# Example activation messages
"AP Orchestrator activated. Loading configuration and persona network."
"Developer ready. Current project: . Sprint: {{SPRINT_NAME}}."
"System Architect online. Architecture review mode active."
```

### Progress Notifications

Triggered during task execution:

```bash
# Example progress messages
"Task 1 of 4 completed. Proceeding with implementation."
"Code review in progress. 3 files reviewed, 2 remaining."
"Deployment pipeline initiated. Monitoring progress."
```

### Completion Notifications

Triggered when tasks or sessions complete:

```bash
# Example completion messages
"Sprint planning complete. 12 stories groomed and prioritized."
"Code implementation finished. All tests passing."
"Architecture review complete. Documentation updated."
```

### Error Notifications

Triggered when errors occur:

```bash
# Example error messages
"Build failed. Compilation errors detected in user authentication module."
"Test suite failed. 3 unit tests require attention."
"Deployment blocked. Infrastructure health check failed."
```

### Handoff Notifications

Triggered during persona transitions:

```bash
# Example handoff messages
"Handoff to Developer initiated. Context preserved. Session transferred."
"Transitioning to QA Agent. Test requirements documented."
"Project Manager taking over. Sprint metrics updated."
```

## Voice Customization Examples

### Creating Persona-Specific Voice Profiles

#### Orchestrator Voice Profile

```json
{
  "orchestrator": {
    "voice": "Alex",
    "rate": 1.0,
    "pitch": 0,
    "volume": 0.9,
    "characteristics": "authoritative, clear",
    "message_templates": {
      "activation": "AP Orchestrator online. Coordinating {{ACTIVE_AGENTS}} agents. System ready.",
      "delegation": "Delegating {{TASK_TYPE}} to {{TARGET_PERSONA}}. Context transferred.",
      "completion": "Coordination complete. {{TASKS_COMPLETED}} tasks finished successfully.",
      "error": "System issue detected. {{ERROR_TYPE}}. Initiating recovery procedures."
    }
  }
}
```

#### Developer Voice Profile

```json
{
  "developer": {
    "voice": "Samantha",
    "rate": 1.1,
    "pitch": 5,
    "volume": 0.7,
    "characteristics": "technical, precise",
    "message_templates": {
      "activation": "Developer active. Loading  codebase. Ready for development tasks.",
      "progress": "{{FEATURE_NAME}} implementation {{PROGRESS_PERCENT}} complete. {{TESTS_STATUS}}.",
      "completion": "Feature implementation complete. {{LINES_OF_CODE}} lines added. All tests passing.",
      "error": "Development issue encountered. {{ERROR_DESCRIPTION}}. Debugging initiated."
    }
  }
}
```

### Context-Aware Voice Messages

Create dynamic messages based on current context:

```bash
#!/bin/bash
# Context-aware voice messaging

generate_contextual_message() {
    local persona="$1"
    local action="$2"
    local context="$3"
    
    # Load project context
    local project_name=$(jq -r '.project.name // "Unknown"' /mnt/c/Code/MCPServers/DebugHostMCP/.apm/project-context.json)
    local sprint_name=$(jq -r '.sprint.current // "Unknown"' /mnt/c/Code/MCPServers/DebugHostMCP/.apm/project-context.json)
    local team_size=$(jq -r '.team.size // 0' /mnt/c/Code/MCPServers/DebugHostMCP/.apm/project-context.json)
    
    # Generate contextual message
    case "$action" in
        "activation")
            echo "AP $persona activated for $project_name. Sprint: $sprint_name. Team size: $team_size."
            ;;
        "handoff")
            echo "Handoff from $persona to $context. Project context preserved."
            ;;
        "completion")
            echo "$persona task complete. $context. Updating project status."
            ;;
    esac
}
```

## Voice Testing and Validation

### Testing Framework

Create comprehensive voice testing:

```bash
#!/bin/bash
# Voice system testing framework

test_voice_system() {
    echo "=== APM Voice System Testing ==="
    
    # Test 1: Basic voice functionality
    echo "Testing basic voice functionality..."
    if /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh "Voice system test" >/dev/null 2>&1; then
        echo "✅ Basic voice functionality working"
    else
        echo "❌ Basic voice functionality failed"
        return 1
    fi
    
    # Test 2: All persona voices
    echo "Testing all persona voices..."
    local personas=("Orchestrator" "Developer" "Architect" "Analyst" "Qa" "Pm" "Po" "Sm")
    for persona in "${personas[@]}"; do
        if /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speak${persona}.sh "Testing $persona voice" >/dev/null 2>&1; then
            echo "✅ $persona voice working"
        else
            echo "❌ $persona voice failed"
        fi
    done
    
    # Test 3: Voice configuration
    echo "Testing voice configuration..."
    local config_file="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice-config.json"
    if [ -f "$config_file" ] && jq empty "$config_file" 2>/dev/null; then
        echo "✅ Voice configuration valid"
    else
        echo "❌ Voice configuration invalid or missing"
    fi
    
    # Test 4: Platform TTS engines
    echo "Testing platform TTS engines..."
    if command -v say >/dev/null 2>&1; then
        echo "✅ macOS say command available"
    elif command -v espeak >/dev/null 2>&1; then
        echo "✅ Linux espeak available"
    elif command -v festival >/dev/null 2>&1; then
        echo "✅ Linux festival available"
    else
        echo "❌ No TTS engine detected"
    fi
    
    echo "Voice system testing complete."
}

# Performance testing
test_voice_performance() {
    echo "=== Voice Performance Testing ==="
    
    local start_time=$(date +%s.%N)
    /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh "Performance test message"
    local end_time=$(date +%s.%N)
    
    local duration=$(echo "$end_time - $start_time" | bc)
    echo "Voice notification latency: ${duration}s"
    
    if (( $(echo "$duration < 2.0" | bc -l) )); then
        echo "✅ Voice performance acceptable"
    else
        echo "⚠️ Voice performance may be slow"
    fi
}

# Run tests
test_voice_system
test_voice_performance
```

### Voice Quality Assessment

```bash
#!/bin/bash
# Voice quality assessment

assess_voice_quality() {
    local persona="$1"
    local test_messages=(
        "Simple test message"
        "Complex technical terminology: authentication, containerization, orchestration"
        "Numbers and metrics: 42 tests passed, 3.7 seconds execution time, 97% success rate"
        "Mixed content: The API returned HTTP 200 with JSON payload containing user data"
    )
    
    echo "Assessing voice quality for $persona..."
    
    for i in "${!test_messages[@]}"; do
        echo "Test $((i+1)): ${test_messages[$i]}"
        /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speak${persona^}.sh "${test_messages[$i]}"
        echo "Rate clarity (1-5): "
        read -r clarity_rating
        echo "Rate naturalness (1-5): "
        read -r naturalness_rating
        
        echo "Test $((i+1)) - Clarity: $clarity_rating, Naturalness: $naturalness_rating"
    done
}

# Usage
assess_voice_quality "Orchestrator"
```

## Troubleshooting Voice Issues

### Common Problems and Solutions

#### Issue: No audio output
**Symptoms**: Voice scripts execute but no sound
**Solutions**:
```bash
# Check audio system
pulseaudio --check  # Linux
system_profiler SPAudioDataType  # macOS

# Test system TTS directly
say "test"  # macOS
espeak "test"  # Linux

# Check volume levels
amixer get Master  # Linux
osascript -e "output volume of (get volume settings)"  # macOS

# Verify voice notifications enabled
echo $VOICE_NOTIFICATIONS_ENABLED
```

#### Issue: Wrong voice or characteristics
**Symptoms**: Voice doesn't match persona configuration
**Solutions**:
```bash
# Check voice configuration
cat /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice-config.json

# Validate JSON configuration
jq empty /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice-config.json

# Test voice selection
say -v "Alex" "Test message"  # macOS
espeak -v "en" "Test message"  # Linux

# Check environment variables
env | grep VOICE
```

#### Issue: Voice script permissions
**Symptoms**: "Permission denied" errors
**Solutions**:
```bash
# Fix script permissions
chmod +x /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/*.sh

# Check file ownership
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/

# Verify script syntax
bash -n /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh
```

#### Issue: Voice notifications too slow
**Symptoms**: Long delays before audio output
**Solutions**:
```bash
# Optimize voice speed
export VOICE_SPEED="1.5"

# Use faster TTS engine
export VOICE_ENGINE="espeak"

# Disable complex message processing
export VOICE_SIMPLE_MESSAGES="true"

# Check system resources
top
ps aux | grep -E "(say|espeak|festival)"
```

### Diagnostic Tools

#### Voice System Diagnostics

```bash
#!/bin/bash
# Voice system diagnostic tool

diagnose_voice_system() {
    echo "=== APM Voice System Diagnostics ==="
    
    echo "1. Environment Configuration:"
    echo "   VOICE_NOTIFICATIONS_ENABLED: ${VOICE_NOTIFICATIONS_ENABLED:-not set}"
    echo "   VOICE_ENGINE: ${VOICE_ENGINE:-not set}"
    echo "   VOICE_SPEED: ${VOICE_SPEED:-not set}"
    echo "   VOICE_VOLUME: ${VOICE_VOLUME:-not set}"
    
    echo -e "\n2. Platform Detection:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   Platform: macOS"
        echo "   Available voices: $(say -v "?" | wc -l) voices detected"
        echo "   Default voice: $(defaults read com.apple.speech.voice.prefs SelectedVoiceName 2>/dev/null || echo "System default")"
    elif [[ "$OSTYPE" == "linux"* ]]; then
        echo "   Platform: Linux"
        if command -v espeak >/dev/null 2>&1; then
            echo "   espeak: Available"
        fi
        if command -v festival >/dev/null 2>&1; then
            echo "   festival: Available"
        fi
    fi
    
    echo -e "\n3. Voice Scripts Status:"
    local voice_dir="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice"
    if [ -d "$voice_dir" ]; then
        for script in "$voice_dir"/speak*.sh; do
            if [ -x "$script" ]; then
                echo "   ✅ $(basename "$script"): Executable"
            else
                echo "   ❌ $(basename "$script"): Not executable"
            fi
        done
    else
        echo "   ❌ Voice scripts directory not found"
    fi
    
    echo -e "\n4. Configuration Files:"
    local config_file="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice-config.json"
    if [ -f "$config_file" ]; then
        if jq empty "$config_file" 2>/dev/null; then
            echo "   ✅ voice-config.json: Valid"
        else
            echo "   ❌ voice-config.json: Invalid JSON"
        fi
    else
        echo "   ⚠️ voice-config.json: Not found (using defaults)"
    fi
    
    echo -e "\n5. Audio System Status:"
    if command -v pactl >/dev/null 2>&1; then
        if pactl info >/dev/null 2>&1; then
            echo "   ✅ PulseAudio: Active"
        else
            echo "   ❌ PulseAudio: Not responding"
        fi
    elif command -v osascript >/dev/null 2>&1; then
        local volume=$(osascript -e "output volume of (get volume settings)" 2>/dev/null)
        echo "   ✅ macOS Audio: Volume at $volume%"
    fi
    
    echo -e "\nDiagnostics complete."
}

diagnose_voice_system
```

## Integration with APM Workflows

### Session-Aware Voice Notifications

Integrate voice notifications with session management:

```bash
# Session-aware voice script
session_aware_speak() {
    local message="$1"
    local persona="$2"
    local session_file="/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/current_session.md"
    
    # Add session context to message
    if [ -f "$session_file" ]; then
        local session_title=$(grep "^# Session:" "$session_file" | cut -d' ' -f3-)
        message="[$session_title] $message"
    fi
    
    # Speak with session context
    speak_with_characteristics "$message"
    
    # Log to session notes
    if [ -f "$session_file" ]; then
        echo "[$(date '+%H:%M')] 🔊 $message" >> "$session_file"
    fi
}
```

### Parallel Execution Voice Coordination

Coordinate voice notifications during parallel execution:

```bash
# Parallel execution voice coordinator
coordinate_parallel_voices() {
    local agents=("$@")
    local coordination_file="/tmp/apm_voice_coordination"
    
    # Create coordination file
    echo "parallel_execution_active" > "$coordination_file"
    
    # Stagger voice notifications to avoid overlap
    for i in "${!agents[@]}"; do
        sleep $(echo "scale=1; $i * 0.5" | bc)
        /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speak${agents[$i]^}.sh "Agent $((i+1)) of ${#agents[@]} active"
    done
    
    # Cleanup
    rm -f "$coordination_file"
}
```

---

**Next Steps**: After configuring voice notifications, review [Path Configuration](./path-configuration.md) to complete your APM setup, or return to the [Configuration Overview](./README.md) for other configuration options.