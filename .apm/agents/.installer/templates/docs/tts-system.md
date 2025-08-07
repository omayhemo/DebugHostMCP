# AP Mapping Text-to-Speech (TTS) System

## Overview

The AP Mapping includes a flexible, modular Text-to-Speech system that allows agents to provide audio feedback. The system supports multiple TTS providers, from local offline solutions to high-quality cloud services.

## Architecture

### Core Components

1. **TTS Manager** (`scripts/tts-manager.sh`)
   - Central hub for all TTS operations
   - Provider detection and routing
   - Configuration management
   - Cache management

2. **Provider Interface** (`scripts/tts-providers/`)
   - Standardized interface for all providers
   - Each provider implements: `info`, `check`, `speak`, `configure`
   - Easy to add new providers

3. **Voice Scripts** (`voice/`)
   - Per-persona voice scripts
   - Thin wrappers around TTS manager
   - Backwards compatible with existing agents

4. **Configuration Utility** (`scripts/configure-tts.sh`)
   - Interactive TTS configuration
   - Provider testing
   - Settings management

## Available Providers

### 1. Piper (Default)

**Type**: Local, offline  
**Size**: ~100MB download  
**Quality**: Good, neural TTS  

Features:
- No internet required
- Fast response time
- 9 US English voices
- Privacy-focused (all processing local)

Installation:
```bash
# Automatic during AP Mapping setup, or:
/tts-setup/setup-piper-chat.sh
```

### 2. ElevenLabs

**Type**: Cloud-based  
**Cost**: Free tier available  
**Quality**: Excellent, most natural  

Features:
- Industry-leading voice quality
- Multiple voice options
- Automatic caching
- API key required

Setup:
```bash
# Configure with API key
/tts-manager.sh configure elevenlabs
```

API Key Storage Options:
- Environment variable: `ELEVENLABS_API_KEY`
- Obfuscated in settings.json
- System keychain (macOS/Linux)

### 3. System TTS

**Type**: OS built-in  
**Cost**: Free  
**Quality**: Basic to good  

Supported Systems:
- **macOS**: `say` command (good quality)
- **Linux**: `espeak`, `festival`, `spd-say`
- **Windows**: Not currently supported

Features:
- No downloads required
- Multiple voice options (OS-dependent)
- Instant availability

### 4. Discord

**Type**: Webhook notifications  
**Cost**: Free  
**Quality**: N/A (text display)  

Features:
- Send agent messages to Discord channel
- Optional Discord TTS for voice channels
- Team collaboration
- Persistent message history

Setup:
```bash
# Configure with webhook URL
/tts-manager.sh configure discord
```

### 5. None (Silent Mode)

**Type**: No audio output  
**Use Case**: Servers, CI/CD, quiet environments  

Features:
- Complete silence
- No dependencies
- Fastest performance

## Configuration

### During Installation

The installer will prompt you to select a TTS provider:

```
Select a Text-to-Speech (TTS) provider:

1) Piper (local, offline, ~100MB download)
2) ElevenLabs (cloud, high quality, requires API key)
3) System TTS (uses OS built-in TTS)
4) Discord (send notifications to Discord channel)
5) None (silent mode, no audio)

Select TTS provider (1-5) [1]:
```

### Post-Installation Configuration

#### Using AP Manager:
```bash
/ap-manager.sh configure-tts
```

#### Direct Configuration:
```bash
# Configure specific provider
/tts-manager.sh configure elevenlabs

# Test configuration
/tts-manager.sh test

# List available providers
/tts-manager.sh list
```

### Settings Structure

TTS configuration is stored in `.claude/settings.json`:

```json
{
  "ap": {
    "tts": {
      "enabled": true,
      "provider": "piper",
      "fallback_provider": "none",
      "providers": {
        "piper": {
          "install_path": "${PROJECT_ROOT}/.piper"
        },
        "elevenlabs": {
          "api_key": "${ELEVENLABS_API_KEY}",
          "model": "eleven_monolingual_v1"
        },
        "discord": {
          "webhook_url": "${DISCORD_WEBHOOK_URL}",
          "tts_enabled": false
        }
      },
      "voices": {
        "orchestrator": {
          "piper": "ryan",
          "elevenlabs": "adam",
          "system": "Alex"
        }
        // ... other persona mappings
      }
    }
  }
}
```

## Usage

### For Agents

Agents use voice scripts automatically:

```bash
# In agent configuration
bash $SPEAK_ORCHESTRATOR "Message to speak"

# Or directly
bash  "Message"
```

### Direct TTS Manager Usage

```bash
# Speak as specific persona
/tts-manager.sh speak orchestrator "Hello, I am the orchestrator"

# Test specific provider
/tts-manager.sh test elevenlabs

# Clear audio cache
/tts-manager.sh clear-cache
```

## Customization

### Adding a New Provider

1. Create provider script: `scripts/tts-providers/myprovider.sh`
2. Implement required functions:
   - `info()` - Provider description
   - `check()` - Availability check
   - `speak()` - TTS implementation
   - `configure()` - Setup wizard

3. Provider automatically detected by TTS manager

### Custom Voice Mappings

Edit voice mappings in settings.json:

```json
{
  "ap": {
    "tts": {
      "voices": {
        "developer": {
          "piper": "joe",
          "elevenlabs": "josh",
          "system": "Daniel"
        }
      }
    }
  }
}
```

## Troubleshooting

### No Audio Output

1. Check TTS is enabled:
   ```bash
   /configure-tts.sh show
   ```

2. Test providers:
   ```bash
   /tts-manager.sh test
   ```

3. Check system audio:
   - Volume not muted
   - Audio device connected
   - Permissions for audio playback

### Provider Not Available

1. Piper not found:
   ```bash
   /tts-setup/setup-piper-chat.sh
   ```

2. ElevenLabs API errors:
   - Verify API key is correct
   - Check API quota/limits
   - Test network connectivity

3. System TTS missing:
   ```bash
   # Linux
   sudo apt-get install espeak-ng
   
   # macOS - built-in
   ```

### Performance Issues

1. Clear cache if too large:
   ```bash
   /tts-manager.sh clear-cache
   ```

2. Switch to faster provider:
   - Piper: Fast local processing
   - System: Minimal overhead
   - None: No processing time

## Best Practices

1. **Provider Selection**:
   - Development: System TTS or Piper
   - Production demos: ElevenLabs
   - Team collaboration: Discord
   - Servers/CI: None

2. **API Key Security**:
   - Use environment variables
   - Never commit keys to git
   - Rotate keys regularly

3. **Cache Management**:
   - ElevenLabs responses are cached
   - Clear cache periodically
   - Cache location: `.cache/tts/`

4. **Fallback Strategy**:
   - Configure fallback provider
   - Test fallback scenarios
   - Consider silent fallback for critical systems

## Future Enhancements

Planned features:
- Additional providers (Amazon Polly, Google TTS)
- Voice cloning support
- Multi-language support
- Audio file export
- Volume/speed controls
- SSML support for advanced speech control