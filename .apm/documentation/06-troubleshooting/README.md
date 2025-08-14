# APM Troubleshooting Guide

This section provides comprehensive troubleshooting resources for the Agentic Persona Mapping (APM) Framework. If you're experiencing issues, start here to find solutions quickly.

## 📚 Available Troubleshooting Resources

### 🔧 [Common Issues](common-issues.md)
Most frequently encountered problems and their solutions, including:
- Command execution failures
- Persona activation issues
- Session management problems
- Configuration errors

### 🚀 [Installation Issues](installation-issues.md)
Installation and setup troubleshooting for:
- Failed installations
- Permission problems
- Path configuration issues
- Environment setup errors

### ⚡ [Performance Issues](performance-issues.md)
Resolving performance-related problems:
- Slow command execution
- Memory usage problems
- Resource optimization
- System bottlenecks

### 🤖 [Agent Issues](agent-issues.md)
Agent-specific problems and fixes:
- Persona activation failures
- Voice notification problems
- Session handoff issues
- Agent behavior inconsistencies

### 🔍 [Diagnostic Tools](diagnostic-tools.md)
Built-in diagnostic and debugging tools:
- Health check commands
- Log analysis tools
- System diagnostics
- Debug modes

## 🆘 Quick Start Troubleshooting

### Step 1: Identify the Problem
1. **What were you trying to do?** - Note the exact command or operation
2. **What happened instead?** - Document the error message or unexpected behavior
3. **When did it start?** - Note if this worked before or is a new issue

### Step 2: Basic Diagnostics
Run these commands to gather basic system information:

```bash
# Check APM installation
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm

# Verify directory structure
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/

# Check permissions
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/
```

### Step 3: Find Your Issue
Navigate to the most relevant troubleshooting guide:
- **Installation problems** → [Installation Issues](installation-issues.md)
- **Command not working** → [Common Issues](common-issues.md)
- **Slow performance** → [Performance Issues](performance-issues.md)
- **Agent behavior** → [Agent Issues](agent-issues.md)

## 🔍 Before You Begin

### Information to Gather
Before troubleshooting, collect:
- **Operating System**: Windows, macOS, Linux (distribution)
- **APM Version**: Found in `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/VERSION`
- **Project Path**: Your current working directory
- **Error Messages**: Complete error text, not just snippets
- **Recent Changes**: Any recent installations or configuration changes

### Environment Check
Verify your environment:

```bash
# Check Claude Code installation
claude --version

# Verify APM paths
echo $APM_ROOT
echo $PROJECT_ROOT

# Check directory permissions
stat /mnt/c/Code/MCPServers/DebugHostMCP/.apm
stat /mnt/c/Code/MCPServers/DebugHostMCP/.apm
```

## 📋 Troubleshooting Workflow

### 1. Quick Fixes (2 minutes)
- Restart your terminal/command prompt
- Check if files exist in the expected locations
- Verify basic APM structure: `ls /mnt/c/Code/MCPServers/DebugHostMCP/.apm`

### 2. Common Solutions (5 minutes)
- Review [Common Issues](common-issues.md) for your specific problem
- Check file permissions and ownership
- Verify environment variables are set correctly

### 3. Deep Diagnostics (10+ minutes)
- Run diagnostic tools from [Diagnostic Tools](diagnostic-tools.md)
- Examine log files for detailed error information
- Test with minimal configuration to isolate the problem

### 4. Advanced Troubleshooting
- Check system resource usage (CPU, memory, disk space)
- Review recent system or software updates
- Test in a clean environment if possible

## 🆘 Getting Help

### Self-Service Resources
1. **Search this documentation** - Use Ctrl+F to search within pages
2. **Check logs** - Most issues leave traces in log files
3. **Review recent changes** - Often issues follow configuration changes

### When to Seek Support
Contact support when:
- You've followed the troubleshooting guides without success
- You encounter critical system errors
- Data loss or corruption is suspected
- Security-related issues are identified

### Information to Include in Support Requests
- **APM Version**: `cat /mnt/c/Code/MCPServers/DebugHostMCP/.apm/VERSION`
- **Operating System**: Full version information
- **Error Messages**: Complete, unedited error text
- **Steps to Reproduce**: Exact sequence that triggers the problem
- **Environment Details**: Relevant configuration and setup information
- **Troubleshooting Attempted**: List what you've already tried

## 🔧 Emergency Procedures

### System Recovery
If APM becomes completely unresponsive:

1. **Stop all processes**:
   ```bash
   pkill -f "apm"
   pkill -f "claude"
   ```

2. **Check for corrupted files**:
   ```bash
   find /mnt/c/Code/MCPServers/DebugHostMCP/.apm -name "*.json" -exec python -m json.tool {} \; > /dev/null
   ```

3. **Reset session state**:
   ```bash
   rm -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/current_session.md
   rm -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/state/*.lock
   ```

4. **Restart cleanly**:
   ```bash
   cd /mnt/c/Code/MCPServers/DebugHostMCP
   /ap
   ```

### Backup and Recovery
- **Session Notes**: Located in `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/`
- **Configuration**: Located in `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/`
- **Agent States**: Located in `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/state/`

---

## 📚 Related Documentation

- [Installation Guide](../01-getting-started/installation-verification.md)
- [Command Reference](../04-commands/README.md)
- [Configuration Guide](../05-configuration/README.md)

---

*Last Updated: {{TIMESTAMP}}*
*APM Framework v{{VERSION}}*