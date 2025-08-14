# APM Configuration Guide

This directory contains comprehensive configuration guides for the Agentic Persona Mapping (APM) framework.

## Configuration Overview

The APM framework provides extensive configuration options to customize:

- **Environment Variables**: Control behavior, paths, and integrations
- **Persona Definitions**: Modify agent behaviors and capabilities
- **Voice Notifications**: Configure audio alerts and notifications
- **Path Structures**: Customize directory layouts and file locations
- **Development Integration**: Configure MCP Plopdock and development tools

## Configuration File Locations

### Core Configuration
- **Settings**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/settings.json`
- **Environment**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/.env` (optional)
- **Claude Configuration**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/CLAUDE.md`

### Persona Configuration
- **Master Definitions**: `{{INSTALLER_ROOT}}/personas/_master/*.persona.json`
- **Generated Templates**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/` (auto-generated)

### Voice Configuration
- **Voice Scripts**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/`
- **Audio Settings**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice-config.json`

### Session Management
- **Session Notes**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/`
- **Rules**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules/`
- **Archive**: `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive/`

## Configuration Guides

### 📋 [Initial Setup Guide](./initial-setup.md)
Complete first-time configuration walkthrough for new APM installations.

### 🔧 [Environment Variables Guide](./environment-variables.md)
Comprehensive reference for all environment variables and their effects.

### 👤 [Persona Customization Guide](./customizing-personas.md)
Learn how to modify existing personas and create new ones.

### 🔊 [Voice Notifications Guide](./voice-notifications.md)
Configure audio alerts and voice feedback systems.

### 📁 [Path Configuration Guide](./path-configuration.md)
Customize directory structures and file locations.

## Quick Configuration Checklist

### Essential Setup
- [ ] Run `./install.sh` to set up basic structure
- [ ] Configure `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/settings.json` with your preferences
- [ ] Set up voice notifications (optional but recommended)
- [ ] Verify persona definitions are correctly generated
- [ ] Test configuration with `/ap` command

### Advanced Configuration
- [ ] Set up MCP Plopdock integration
- [ ] Configure custom environment variables
- [ ] Customize persona behaviors
- [ ] Set up session management preferences
- [ ] Configure project-specific paths

## Configuration Validation

To validate your configuration:

```bash
# Test basic APM functionality
cd /mnt/c/Code/MCPServers/DebugHostMCP
# In Claude Code, run: /ap

# Verify voice notifications
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh "Configuration test"

# Check persona generation
{{INSTALLER_ROOT}}/generate-personas.sh
```

## Common Configuration Issues

### Path Issues
- **Symptom**: Commands fail with "file not found"
- **Solution**: Check `APM_ROOT` in settings.json matches actual installation path

### Persona Loading Issues
- **Symptom**: Personas don't activate properly
- **Solution**: Regenerate persona templates with `generate-personas.sh`

### Voice Notification Issues
- **Symptom**: No audio feedback from agents
- **Solution**: Check voice script permissions and audio system configuration

### Session Management Issues
- **Symptom**: Session notes not saving or loading
- **Solution**: Verify session_notes directory exists and has write permissions

## Environment-Specific Configuration

### Development Environment
- Enable debug logging
- Use development voice scripts
- Configure rapid persona switching

### Production Environment
- Disable debug output
- Use production-optimized paths
- Enable comprehensive logging

### Team Environment
- Shared configuration repository
- Standardized persona definitions
- Centralized voice notification settings

## Support and Troubleshooting

For configuration support:

1. **Check Configuration Logs**: Review `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/configuration.log`
2. **Validate Settings**: Use built-in validation tools
3. **Review Documentation**: Each configuration area has detailed guides
4. **Test Incrementally**: Validate each configuration section separately

## Version Compatibility

This configuration guide is for APM Framework v4.0.0+. Key changes:

- **v4.0.0**: Native sub-agent architecture, unified persona system
- **v3.5.0**: MCP Plopdock integration, enhanced session management
- **v3.3.0**: Configurable prompt enhancement, voice notification improvements

---

**Next Steps**: Start with the [Initial Setup Guide](./initial-setup.md) for first-time configuration.