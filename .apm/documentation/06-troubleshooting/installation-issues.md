# APM Installation Issues and Solutions

This guide addresses problems encountered during APM Framework installation and initial setup.

## 🚀 Pre-Installation Requirements

### System Prerequisites
Before troubleshooting, verify these requirements are met:

**Required:**
- Claude Code CLI installed and functional
- Bash shell (Linux/macOS/WSL)
- Git (for version control integration)
- Write permissions in target directory

**Optional but Recommended:**
- Text-to-speech support (`espeak` on Linux, `say` on macOS)
- Python 3.x (for configuration validation)
- `jq` (for JSON processing)

### Environment Check
```bash
# Verify Claude Code
claude --version

# Check shell
echo $SHELL
bash --version

# Check Git
git --version

# Check text-to-speech
espeak --version 2>/dev/null || say --version 2>/dev/null || echo "TTS not available"

# Check Python (optional)
python3 --version 2>/dev/null || python --version 2>/dev/null || echo "Python not found"
```

---

## 🔧 Installation Failures

### 1. Installer Script Not Found

**Symptoms:**
```
./install.sh: No such file or directory
bash: install.sh: command not found
Permission denied: ./install.sh
```

**Root Cause:** Installer not downloaded, wrong directory, or permissions issue.

**Solution:**
```bash
# Verify you're in the correct directory
ls -la | grep install.sh

# If missing, download the installer
curl -O https://example.com/apm/install.sh
# or
wget https://example.com/apm/install.sh

# Make executable
chmod +x install.sh

# Run installer
./install.sh
```

**Alternative Installation:**
```bash
# Manual installation
git clone https://github.com/example/apm-framework.git
cd apm-framework/installer/
chmod +x install.sh
./install.sh
```

---

### 2. Permission Denied During Installation

**Symptoms:**
```
mkdir: cannot create directory '/mnt/c/Code/MCPServers/DebugHostMCP/.apm': Permission denied
cp: cannot create regular file: Permission denied
Installation failed: insufficient permissions
```

**Root Cause:** Insufficient write permissions in target directory.

**Solution:**

**Option 1: User Directory Installation (Recommended)**
```bash
# Install to user home directory
export APM_ROOT="$HOME/.apm"
./install.sh --user-install

# Or specify custom location
./install.sh --install-path "$HOME/my-apm"
```

**Option 2: Fix Permissions**
```bash
# Check current permissions
ls -ld /mnt/c/Code/MCPServers/DebugHostMCP
ls -ld $(dirname /mnt/c/Code/MCPServers/DebugHostMCP/.apm)

# Create directory with correct permissions
mkdir -p /mnt/c/Code/MCPServers/DebugHostMCP/.apm
chmod 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm

# Re-run installer
./install.sh
```

**Option 3: Sudo Installation (Use Carefully)**
```bash
# Only if system-wide installation is required
sudo ./install.sh --system-install

# Fix ownership after sudo installation
sudo chown -R $USER:$USER /mnt/c/Code/MCPServers/DebugHostMCP/.apm
```

---

### 3. Incomplete Installation

**Symptoms:**
```
Installation appears successful but commands don't work
Missing files or directories after installation
"APM not properly configured" errors
```

**Root Cause:** Partial installation due to interrupted process or missing dependencies.

**Solution:**
```bash
# Check installation completeness
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/

# Identify missing components
if [ ! -d "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents" ]; then
    echo "Missing: Agent definitions"
fi
if [ ! -d "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes" ]; then
    echo "Missing: Session management"
fi
if [ ! -f "/mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/ap.md" ]; then
    echo "Missing: Command definitions"
fi

# Reinstall with force flag
./install.sh --force --clean-install

# Verify installation
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/verify-installation.sh
```

---

### 4. Path Configuration Issues

**Symptoms:**
```
APM_ROOT or PROJECT_ROOT not set correctly
Commands reference wrong paths
"Configuration path not found" errors
```

**Root Cause:** Environment variables not set or incorrectly configured.

**Solution:**
```bash
# Check current environment
echo "APM_ROOT: ${APM_ROOT:-'NOT SET'}"
echo "PROJECT_ROOT: ${PROJECT_ROOT:-'NOT SET'}"

# Set correct paths
export APM_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP/.apm"
export PROJECT_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP"

# Make permanent (add to shell profile)
echo 'export APM_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP/.apm"' >> ~/.bashrc
echo 'export PROJECT_ROOT="/mnt/c/Code/MCPServers/DebugHostMCP"' >> ~/.bashrc
source ~/.bashrc

# Alternative: Use installer with explicit paths
./install.sh --apm-root "/mnt/c/Code/MCPServers/DebugHostMCP/.apm" --project-root "/mnt/c/Code/MCPServers/DebugHostMCP"
```

---

### 5. Claude Code Integration Failure

**Symptoms:**
```
APM installs but Claude Code doesn't recognize commands
/ap command not found in Claude Code
Commands exist but don't execute properly
```

**Root Cause:** Claude Code command directory not properly configured.

**Solution:**
```bash
# Check Claude Code configuration
cat ~/.claude/config.json | grep -A 5 -B 5 commands

# Verify command files are in correct location
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/

# Check command file format
head -5 /mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/ap.md

# Reinstall Claude Code integration
./install.sh --claude-integration-only

# Test Claude Code recognition
cd /mnt/c/Code/MCPServers/DebugHostMCP
claude --help | grep -i commands
```

---

### 6. Dependency Installation Issues

**Symptoms:**
```
"espeak not found" during voice setup
Missing Python modules for configuration
JSON parsing errors
```

**Root Cause:** System dependencies not installed or not in PATH.

**Solution:**

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install espeak espeak-data
sudo apt-get install python3 python3-json
sudo apt-get install jq curl wget
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install espeak espeak-data
sudo yum install python3
sudo yum install jq curl wget
```

**macOS:**
```bash
# Text-to-speech is built-in (say command)
# Install optional tools
brew install jq curl wget python3
```

**Windows/WSL:**
```bash
# Install Linux dependencies in WSL
sudo apt-get install espeak
# For native Windows TTS, voice notifications may be limited
```

---

### 7. Version Conflicts

**Symptoms:**
```
"Incompatible APM version" warnings
Mixed version files after upgrade
Commands behave inconsistently
```

**Root Cause:** Previous APM installation not properly removed before new installation.

**Solution:**
```bash
# Backup existing configuration
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config.backup
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes.backup

# Complete uninstall
./uninstall.sh --complete-removal
# or manually:
rm -rf /mnt/c/Code/MCPServers/DebugHostMCP/.apm
rm -rf /mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/ap*.md
rm -rf /mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/parallel*.md

# Clean install
./install.sh --clean-install

# Restore configuration if needed
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config.backup/* /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/
```

---

### 8. Network Installation Issues

**Symptoms:**
```
Download timeouts during installation
"Cannot resolve host" errors
Partial downloads or corrupted files
```

**Root Cause:** Network connectivity, firewall, or proxy issues.

**Solution:**
```bash
# Test network connectivity
ping -c 3 github.com
curl -I https://github.com

# Check proxy settings
echo "HTTP_PROXY: ${HTTP_PROXY:-'not set'}"
echo "HTTPS_PROXY: ${HTTPS_PROXY:-'not set'}"

# Download manually if automated download fails
wget https://github.com/example/apm-framework/archive/main.zip
unzip main.zip
cd apm-framework-main/installer/
./install.sh --offline-install

# Or use local installation
git clone https://github.com/example/apm-framework.git
cd apm-framework/installer/
./install.sh --local-install
```

---

## 🔍 Installation Verification

### Automatic Verification
```bash
# Run built-in verification script
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/verify-installation.sh

# Check installation health
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/health-check.sh
```

### Manual Verification Checklist

**Directory Structure:**
```bash
# Required directories exist
[ -d "/mnt/c/Code/MCPServers/DebugHostMCP/.apm" ] && echo "✓ APM root exists" || echo "✗ APM root missing"
[ -d "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents" ] && echo "✓ Agents directory exists" || echo "✗ Agents directory missing"
[ -d "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes" ] && echo "✓ Session notes directory exists" || echo "✗ Session notes directory missing"
[ -d "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config" ] && echo "✓ Config directory exists" || echo "✗ Config directory missing"
```

**Command Integration:**
```bash
# Claude Code commands installed
[ -f "/mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/ap.md" ] && echo "✓ AP command installed" || echo "✗ AP command missing"
[ -f "/mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/dev.md" ] && echo "✓ Developer command installed" || echo "✗ Developer command missing"
```

**Permissions:**
```bash
# Executable permissions
[ -x "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakOrchestrator.sh" ] && echo "✓ Voice scripts executable" || echo "✗ Voice scripts not executable"
[ -w "/mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes" ] && echo "✓ Session notes writable" || echo "✗ Session notes not writable"
```

**Configuration:**
```bash
# Valid configuration files
python3 -m json.tool /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/apm.json >/dev/null 2>&1 && echo "✓ Configuration valid" || echo "✗ Configuration invalid"
```

### Test Installation
```bash
# Test basic APM functionality
cd /mnt/c/Code/MCPServers/DebugHostMCP
echo "Testing basic APM activation..."

# This should work without errors
/ap --test-mode

# Check for proper session creation
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/ | tail -3
```

---

## 🚨 Emergency Recovery

### Complete Reinstallation
If installation is severely corrupted:

```bash
# 1. Stop all APM processes
pkill -f apm

# 2. Backup user data
mkdir -p ~/apm-backup/$(date +%Y%m%d)
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes ~/apm-backup/$(date +%Y%m%d)/
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config ~/apm-backup/$(date +%Y%m%d)/

# 3. Complete removal
rm -rf /mnt/c/Code/MCPServers/DebugHostMCP/.apm
rm -rf /mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/ap*.md
rm -rf /mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/parallel*.md

# 4. Fresh installation
./install.sh --clean-install --force

# 5. Restore user data (optional)
cp -r ~/apm-backup/$(date +%Y%m%d)/session_notes/* /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/
cp ~/apm-backup/$(date +%Y%m%d)/config/user-config.json /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/
```

---

## 📋 Pre-Installation Checklist

Before installing APM, verify:

- [ ] Claude Code is installed and working
- [ ] You have write permissions in the target directory
- [ ] Network connectivity is available (for downloads)
- [ ] Required disk space is available (minimum 100MB)
- [ ] Bash shell is available and functional
- [ ] Git is installed (recommended)
- [ ] Text-to-speech is available (optional but recommended)

## 🔧 Custom Installation Options

### Silent Installation
```bash
# Unattended installation
./install.sh --silent --defaults

# With custom configuration
./install.sh --silent --config ./custom-config.json
```

### Development Installation
```bash
# Install in development mode
./install.sh --dev-mode --verbose

# Install with debugging enabled
./install.sh --debug --log-file installation.log
```

### Enterprise Installation
```bash
# System-wide installation
sudo ./install.sh --system-install --shared-config

# Multi-user installation
./install.sh --multi-user --permissions 755
```

---

## 📚 Related Resources

- [Common Issues](common-issues.md) - General troubleshooting
- [Configuration Guide](../05-configuration/README.md) - Post-installation setup
- [Getting Started](../01-getting-started/README.md) - First steps after installation

---

*Last Updated: {{TIMESTAMP}}*
*APM Framework v{{VERSION}}*