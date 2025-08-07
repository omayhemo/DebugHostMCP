# Notification Sound Files

This directory contains notification sound files for the AP Mapping notification system.

## Sound Files

- **notification.mp3** - General notification and alert sound
- **pre_tool.mp3** - Sound played before Claude uses a tool
- **post_tool.mp3** - Sound played after Claude completes a tool
- **stop.mp3** - Sound played when Claude stops/exits
- **subagent_stop.mp3** - Sound played when a subagent completes

## Placeholder Files

The current files are empty placeholders. Replace them with actual sound files before distribution.

### Recommended Sound Specifications

- Format: MP3
- Duration: 1-3 seconds
- Bitrate: 128kbps or higher
- Sample Rate: 44.1kHz
- Volume: Normalized to -12dB

### Creating Sound Files

You can use tools like:
- Audacity (free, cross-platform)
- ffmpeg to generate tones
- Free sound libraries (ensure proper licensing)

Example ffmpeg commands to generate simple tones:

```bash
# Generate a 440Hz sine wave chime (1 second)
ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -ac 2 chime.mp3

# Generate a ping sound (0.5 seconds, 880Hz)
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.5" -ac 2 ping.mp3

# Generate a bell sound (1.5 seconds, multiple frequencies)
ffmpeg -f lavfi -i "sine=frequency=523.25:duration=1.5" -ac 2 bell.mp3
```

### License Requirements

Ensure all sound files are either:
- Created by you
- Licensed for commercial use
- Public domain
- Creative Commons with appropriate attribution