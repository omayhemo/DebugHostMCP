# Common APM Issues and Solutions

This guide covers the most frequently encountered problems when using the Agentic Persona Mapping (APM) Framework and their proven solutions.

## 🚨 Most Common Issues

### 1. Command Not Recognized

**Symptoms:**
```
bash: /ap: command not found
-bash: ap: command not found
/ap: No such file or directory
```

**Root Cause:** APM commands are not properly installed or configured.

**Solution:**
```bash
# Check APM installation
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/

# Verify command files exist
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/

# Re-source your shell configuration
source ~/.bashrc  # or ~/.zshrc for zsh
```

**Prevention:**
- Always run the APM installer from the correct directory
- Ensure `.claude/commands/` directory exists in your project

---

### 2. Persona Not Activating

**Symptoms:**
```
/dev command runs but persona doesn't activate
No voice notification plays
Agent behaves like regular Claude instead of persona
```

**Root Cause:** Session management files missing or corrupted.

**Solution:**
```bash
# Check session notes directory
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/

# Create missing directories
mkdir -p /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/
mkdir -p /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive/

# Check voice scripts
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/

# Test voice script manually
bash /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDeveloper.sh "Testing voice"
```

**Prevention:**
- Always use `/ap` first to initialize the system
- Don't manually delete session files while agents are active

---

### 3. Permission Denied Errors

**Symptoms:**
```
Permission denied: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/
bash: /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speak*.sh: Permission denied
Cannot create file: Operation not permitted
```

**Root Cause:** Incorrect file permissions on APM directories or files.

**Solution:**
```bash
# Fix directory permissions
chmod -R 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/
chmod +x /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/*.sh

# Fix session notes permissions
chmod 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/
chmod 644 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/*.md

# Fix project permissions (if needed)
chmod 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/
```

**Prevention:**
- Run the APM installer with appropriate permissions
- Don't use `sudo` unless specifically required

---

### 4. Voice Notifications Not Working

**Symptoms:**
```
Commands execute but no audio feedback
Silent operation when voice should play
"espeak not found" or "say not found" errors
```

**Root Cause:** Text-to-speech software not installed or configured.

**Solution:**

**Linux:**
```bash
# Install espeak
sudo apt-get install espeak
# or
sudo yum install espeak

# Test espeak
espeak "Testing voice"
```

**macOS:**
```bash
# Test built-in say command
say "Testing voice"

# If not working, check System Preferences > Accessibility > Speech
```

**Windows/WSL:**
```bash
# Install Windows Subsystem for Linux sound support
# Or disable voice notifications in configuration
export VOICE_ENABLED=false
```

**Prevention:**
- Test voice capabilities during initial setup
- Configure fallback options for silent environments

---

### 5. Session Notes Not Found

**Symptoms:**
```
Cannot read session notes
Session context lost between commands
"No such file or directory" for session files
```

**Root Cause:** Session management directory structure missing or corrupted.

**Solution:**
```bash
# Recreate session structure
mkdir -p /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/
mkdir -p /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive/

# Check for hidden files
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/

# Create initial session note
echo "# APM Session Recovery - $(date)" > /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/recovery-session.md

# Test session creation
/ap
```

**Prevention:**
- Don't manually delete session directories
- Use `/wrap` command to properly close sessions

---

### 6. Agent Handoffs Failing

**Symptoms:**
```
/handoff dev command doesn't switch personas
Agents don't preserve context during handoffs
Multiple agents responding simultaneously
```

**Root Cause:** Session state corruption or incomplete handoff process.

**Solution:**
```bash
# Clear session state
rm -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/state/*.lock
rm -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/current_session.md

# Start fresh session
/ap

# Use proper handoff sequence
/handoff dev
# Wait for confirmation before continuing
```

**Prevention:**
- Always wait for handoff confirmation before issuing new commands
- Use `/switch` for complex handoffs requiring session compaction

---

### 7. Performance Issues

**Symptoms:**
```
Commands take unusually long to execute
High CPU usage during simple operations
Memory usage grows over time
System becomes unresponsive
```

**Root Cause:** Resource leaks, large log files, or system constraints.

**Solution:**
```bash
# Check system resources
top -p $(pgrep -f apm)
df -h /mnt/c/Code/MCPServers/DebugHostMCP/.apm

# Clean up large files
find /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/ -size +10M -ls
find /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/ -size +10M -delete

# Archive old sessions
mv /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/*.md /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive/

# Restart APM cleanly
/wrap
/ap
```

**Prevention:**
- Regularly archive old session notes
- Monitor disk space usage
- Use `/wrap` to clean up sessions periodically

---

### 8. Configuration Errors

**Symptoms:**
```
"Config file not found" errors
Environment variables not recognized
Path resolution failures
```

**Root Cause:** Missing or malformed configuration files.

**Solution:**
```bash
# Check configuration files
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/
cat /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/apm.json

# Validate JSON configuration
python -m json.tool /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/apm.json

# Reset to default configuration
cp /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/apm.json.default /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/apm.json

# Verify environment variables
env | grep APM
env | grep PROJECT
```

**Prevention:**
- Always backup configuration files before editing
- Use JSON validation tools when editing config files

---

### 9. Path Resolution Issues

**Symptoms:**
```
"No such file or directory" for existing files
Commands work in some directories but not others
Inconsistent behavior across different projects
```

**Root Cause:** Incorrect path configuration or environment variables.

**Solution:**
```bash
# Check current paths
echo "APM_ROOT: $APM_ROOT"
echo "PROJECT_ROOT: $PROJECT_ROOT"
echo "PWD: $(pwd)"

# Verify path variables in configuration
grep -r "APM_ROOT\|PROJECT_ROOT" /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/

# Reset paths
export APM_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP/.apm"
export PROJECT_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP"

# Test path resolution
ls -la $APM_ROOT/agents/
ls -la $PROJECT_ROOT/.apm/
```

**Prevention:**
- Set environment variables in your shell profile
- Use absolute paths in configuration files

---

### 10. Git Integration Issues

**Symptoms:**
```
APM commands don't respect .gitignore
Session notes accidentally committed
Permission conflicts with git operations
```

**Root Cause:** Incorrect .gitignore configuration or file permissions.

**Solution:**
```bash
# Check .gitignore
cat /mnt/c/Code/MCPServers/DebugHostMCP/.gitignore | grep -E "(apm|session|\.apm)"

# Add APM exclusions
echo ".apm/session_notes/*.md" >> /mnt/c/Code/MCPServers/DebugHostMCP/.gitignore
echo ".apm/state/" >> /mnt/c/Code/MCPServers/DebugHostMCP/.gitignore

# Remove accidentally committed files
git rm --cached .apm/session_notes/*.md
git commit -m "Remove APM session files from git"

# Fix permissions
chmod 644 /mnt/c/Code/MCPServers/DebugHostMCP/.gitignore
```

**Prevention:**
- Configure .gitignore before first APM use
- Keep session notes and temporary files out of version control

---

## 🔍 Diagnostic Commands

### Quick Health Check
```bash
# APM structure validation
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/ /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/ /mnt/c/Code/MCPServers/DebugHostMCP/.apm/

# Permission check
find /mnt/c/Code/MCPServers/DebugHostMCP/.apm -type f -name "*.sh" -not -executable

# Configuration validation
python -m json.tool /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/apm.json >/dev/null && echo "Config OK"
```

### Environment Verification
```bash
# Environment variables
env | grep -E "(APM|PROJECT)_ROOT"

# Path accessibility
[ -d "$APM_ROOT" ] && echo "APM_ROOT accessible" || echo "APM_ROOT missing"
[ -d "$PROJECT_ROOT" ] && echo "PROJECT_ROOT accessible" || echo "PROJECT_ROOT missing"

# Command availability
which espeak 2>/dev/null && echo "espeak available"
which say 2>/dev/null && echo "say available"
```

### Log Analysis
```bash
# Check for recent errors
tail -n 50 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/apm.log | grep -i error

# Session management logs
ls -lt /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/ | head -5

# Voice script logs (if available)
tail -n 20 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/voice.log
```

---

## 🆘 When to Escalate

Contact support or check advanced troubleshooting if:
- Multiple solutions from this guide don't resolve the issue
- You encounter data corruption or loss
- Security-related errors appear
- System-wide impacts are observed
- The problem affects multiple users or projects

---

## 📚 Related Resources

- [Installation Issues](installation-issues.md) - Setup and deployment problems
- [Performance Issues](performance-issues.md) - System performance optimization
- [Agent Issues](agent-issues.md) - Agent-specific troubleshooting
- [Diagnostic Tools](diagnostic-tools.md) - Advanced debugging utilities

---

*Last Updated: {{TIMESTAMP}}*
*APM Framework v{{VERSION}}*