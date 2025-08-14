# APM Agent-Specific Issues and Solutions

This guide addresses problems specific to APM agent personas, their activation, behavior, and interactions.

## 🤖 Agent System Overview

### APM v4.0.0 Native Sub-Agent Architecture
- **Native Integration**: All agents use Claude Code's native sub-agent system
- **True Parallelism**: Multiple agents can execute concurrently
- **4-8x Performance**: Massive improvement over Task-based system
- **Zero CLI Crashes**: Rock-solid integration with native architecture

### Available Agents
- **AP Orchestrator** (`/ap`): Central coordination and delegation
- **Developer** (`/dev`): Code implementation and technical tasks
- **Architect** (`/architect`): System architecture and design
- **Design Architect** (`/design-architect`): UI/UX architecture
- **Analyst** (`/analyst`): Research and data analysis
- **Project Manager** (`/pm`): Project coordination and planning
- **Product Owner** (`/po`): Product requirements and priorities
- **QA Engineer** (`/qa`): Quality assurance and testing
- **Scrum Master** (`/sm`): Agile process facilitation

---

## 🚨 Agent Activation Issues

### 1. Persona Not Activating

**Symptoms:**
```
Agent command executes but persona doesn't activate
Response comes from generic Claude instead of specific agent
No voice notification plays
Agent doesn't follow persona-specific behavior patterns
```

**Root Causes:**
- Session management not initialized
- Missing persona configuration files
- Voice system not configured
- Session state corruption

**Solution:**

**Immediate Diagnosis:**
```bash
# Check if APM is properly initialized
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/

# Verify persona configuration exists
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/

# Test voice system
bash /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDeveloper.sh "Test message"

# Check session state
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/state/
```

**Resolution Steps:**
```bash
# 1. Initialize APM properly
/ap  # This MUST be run first

# 2. Verify session creation
ls -lt /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/ | head -3

# 3. Then activate specific agent
/dev  # or other agent command

# 4. Verify persona activation with voice
# Should hear: "Developer Agent activated..."
```

**Prevention:**
- Always use `/ap` first in new sessions
- Don't skip the initialization sequence
- Verify voice system during APM setup

---

### 2. Multiple Agents Responding

**Symptoms:**
```
More than one agent responds to commands
Conflicting advice from different personas
Session state confusion between agents
```

**Root Causes:**
- Improper session handoff
- Parallel operations not properly coordinated
- Session state not properly cleared

**Solution:**

**Immediate Action:**
```bash
# Clear session state
rm -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/state/*.lock
rm -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/current_session.md

# Force session cleanup
/wrap --force

# Start fresh with single agent
/ap
/handoff dev  # Single agent activation
```

**Proper Handoff Procedure:**
```bash
# Current agent should wrap up
/wrap

# Explicit handoff to new agent
/handoff architect

# Or use switch for complex transitions
/switch qa --compact-session
```

---

### 3. Agent Behavior Inconsistencies

**Symptoms:**
```
Agent doesn't follow expected behavior patterns
Responses don't match persona characteristics
Agent switches behavior mid-conversation
```

**Root Causes:**
- Corrupted persona configuration
- Session context interference
- Mixed agent state

**Solution:**

**Verify Persona Configuration:**
```bash
# Check persona definition files
cat /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/developer.json
cat /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/architect.json

# Validate JSON configuration
python3 -m json.tool /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/developer.json

# Check for configuration corruption
find /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/ -name "*.json" -exec python3 -m json.tool {} \; > /dev/null
```

**Reset Agent Configuration:**
```bash
# Backup current configuration
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas.backup

# Restore default configuration
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/default/personas/* /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/

# Test agent activation
/ap
/dev --test-mode
```

---

### 4. Voice Notification Issues

**Symptoms:**
```
Agent activates but no voice notification
Voice notifications are garbled or incomplete
Wrong agent voice plays for different personas
```

**Root Causes:**
- Text-to-speech system not configured
- Voice script permissions
- Audio system issues

**Solution:**

**Voice System Diagnosis:**
```bash
# Test text-to-speech system
espeak "Testing voice system" 2>/dev/null || say "Testing voice system" 2>/dev/null

# Check voice script permissions
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/*.sh

# Test specific agent voice
bash /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakDeveloper.sh "Developer test"
bash /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakArchitect.sh "Architect test"
```

**Voice System Repair:**
```bash
# Fix voice script permissions
chmod +x /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/*.sh

# Install/update TTS system
# Linux:
sudo apt-get install espeak espeak-data
# macOS: Built-in say command should work

# Test voice configuration
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-voice-system.sh
```

**Alternative Solutions:**
```bash
# Disable voice if problematic
export VOICE_ENABLED=false

# Use visual notifications instead
echo "NOTIFICATION_MODE=visual" >> /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/voice.conf

# Enable debug mode for voice issues
export VOICE_DEBUG=true
```

---

## 🔄 Session Management Issues

### 5. Session Handoff Failures

**Symptoms:**
```
/handoff command doesn't switch agents
Context lost during agent transitions
New agent doesn't have previous conversation context
```

**Root Causes:**
- Session serialization issues
- Context size too large
- File permission problems

**Solution:**

**Handoff Diagnosis:**
```bash
# Check session notes directory
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/

# Check session file sizes
find /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/ -name "*.md" -exec ls -lh {} \;

# Verify write permissions
touch /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/test-write.md && rm /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/test-write.md
```

**Handoff Repair:**
```bash
# Use proper handoff sequence
/ap  # Start with orchestrator
/handoff dev  # Explicit handoff

# For problematic handoffs, use switch with compaction
/switch architect --compact-session

# If handoffs consistently fail, archive large sessions
mv /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/*.md /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/archive/
```

---

### 6. Context Preservation Issues

**Symptoms:**
```
New agent doesn't remember previous conversation
Agent asks for information already provided
Context appears incomplete or corrupted
```

**Root Causes:**
- Session note corruption
- Context size limits exceeded
- File system issues

**Solution:**

**Context Analysis:**
```bash
# Check session note integrity
tail -20 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/*.md

# Check for session file corruption
find /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/ -name "*.md" -exec head -1 {} \; | grep -v "^#"

# Verify context size
wc -c /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/*.md
```

**Context Repair:**
```bash
# Compact existing session
/switch dev --compact-session

# Or create fresh context summary
/wrap --create-summary
/ap
```

---

## ⚡ Parallel Agent Issues

### 7. Parallel Operation Failures

**Symptoms:**
```
/parallel commands don't show expected performance improvement
Some parallel agents fail to execute
Coordination between parallel agents breaks down
```

**Root Causes:**
- Resource constraints
- Native sub-agent coordination issues
- System limitations

**Solution:**

**Parallel System Diagnosis:**
```bash
# Check system resources
nproc  # Available CPU cores
free -h  # Available memory

# Test parallel capability
/parallel-test --benchmark --verbose

# Monitor parallel execution
top -p $(pgrep -f claude)
```

**Parallel Optimization:**
```bash
# Adjust parallel worker count
export APM_PARALLEL_WORKERS=$(nproc)

# Reduce parallel load for resource-constrained systems
export APM_PARALLEL_WORKERS=2
export APM_WORKER_MEMORY=50M

# Test optimized parallel operation
/parallel-architecture --workers=2
```

---

### 8. Native Sub-Agent Coordination Issues

**Symptoms:**
```
Parallel agents work independently without coordination
Results from parallel agents conflict
Sub-agents don't properly merge results
```

**Root Causes:**
- Coordination protocol issues
- Communication between sub-agents failing
- Result merging problems

**Solution:**

**Coordination Analysis:**
```bash
# Check coordination logs
tail -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/coordination.log

# Test sub-agent communication
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-subagent-coordination.sh

# Verify result merging capability
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-result-merging.sh
```

**Coordination Repair:**
```bash
# Reset coordination state
rm -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/state/coordination/*.lock

# Use explicit coordination
/parallel-development --explicit-coordination

# Fall back to sequential mode if needed
export APM_FORCE_SEQUENTIAL=true
```

---

## 🎯 Persona-Specific Issues

### 9. Developer Agent Issues

**Common Developer Problems:**
```
Agent doesn't follow coding standards
Code suggestions are not contextual
Agent doesn't integrate with project structure
```

**Solutions:**
```bash
# Update developer persona configuration
cat > /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/developer-custom.json << 'EOF'
{
  "persona": "developer",
  "coding_standards": "project-specific",
  "context_awareness": "high",
  "integration_mode": "seamless"
}
EOF

# Use custom developer configuration
/dev --config developer-custom.json
```

### 10. Architect Agent Issues

**Common Architect Problems:**
```
Agent focuses on low-level details instead of high-level architecture
Architectural decisions don't consider project constraints
Agent doesn't maintain architectural consistency
```

**Solutions:**
```bash
# Configure architect for high-level focus
echo "ARCHITECT_FOCUS=high-level" >> /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/personas.conf
echo "ARCHITECT_CONSISTENCY=strict" >> /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/personas.conf

# Load project constraints
/architect --load-constraints project-constraints.json
```

### 11. QA Agent Issues

**Common QA Problems:**
```
Agent doesn't understand project testing standards
Test strategies don't match project requirements
QA framework integration fails
```

**Solutions:**
```bash
# Configure QA for project-specific requirements
/qa --load-test-standards project-test-standards.json

# Update QA framework configuration
cat > /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/qa-framework.json << 'EOF'
{
  "test_types": ["unit", "integration", "e2e"],
  "frameworks": ["jest", "pytest", "selenium"],
  "coverage_threshold": 80
}
EOF
```

---

## 🔍 Agent Diagnostic Tools

### Comprehensive Agent Health Check

**Built-in Diagnostics:**
```bash
# Run complete agent health check
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/agent-health-check.sh

# Test individual agent activation
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-agent-activation.sh developer
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-agent-activation.sh architect
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-agent-activation.sh qa
```

**Custom Diagnostic Commands:**
```bash
# Test agent persona consistency
/dev --test-persona --verbose
/architect --test-persona --verbose
/qa --test-persona --verbose

# Test agent handoff capabilities
/ap --test-handoffs --verbose

# Test parallel agent coordination
/parallel-test --test-coordination --verbose
```

### Agent Performance Analysis

**Performance Monitoring:**
```bash
# Monitor agent activation time
time /dev --benchmark
time /architect --benchmark

# Monitor handoff performance
time /handoff architect --benchmark

# Monitor parallel agent performance
time /parallel-development --benchmark
```

**Resource Usage Analysis:**
```bash
# Monitor agent resource consumption
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/monitor-agent-resources.sh

# Analyze agent memory usage
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/analyze-agent-memory.sh

# Check agent CPU usage patterns
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/analyze-agent-cpu.sh
```

---

## 🛠️ Agent Recovery Procedures

### Emergency Agent Reset

**Complete Agent System Reset:**
```bash
# Stop all agent processes
pkill -f apm
pkill -f claude

# Clear agent state
rm -rf /mnt/c/Code/MCPServers/DebugHostMCP/.apm/state/agents/
rm -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/state/*.lock

# Reset session management
rm -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/current_session.md

# Restart APM system
/ap --recovery-mode
```

### Individual Agent Reset

**Reset Specific Agent:**
```bash
# Reset developer agent
rm -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/state/agents/developer.state
cp /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/default/personas/developer.json /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/

# Test agent reset
/dev --test-mode --verbose
```

### Rollback to Previous Configuration

**Configuration Rollback:**
```bash
# Backup current configuration
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas.backup.$(date +%Y%m%d)

# Restore from backup
cp -r /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas.backup.YYYYMMDD/* /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/

# Test restored configuration
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-all-agents.sh
```

---

## 📊 Agent Quality Assurance

### Agent Behavior Validation

**Behavioral Tests:**
```bash
# Test agent persona adherence
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-persona-adherence.sh

# Validate agent response patterns
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/validate-agent-responses.sh

# Check agent knowledge consistency
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-agent-knowledge.sh
```

**Integration Tests:**
```bash
# Test agent integration with project
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-project-integration.sh

# Test agent collaboration
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-agent-collaboration.sh

# Test agent workflow compatibility
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/test-workflow-compatibility.sh
```

---

## 📚 Related Resources

- [Common Issues](common-issues.md) - General APM troubleshooting
- [Performance Issues](performance-issues.md) - Agent performance optimization
- [Diagnostic Tools](diagnostic-tools.md) - Advanced debugging utilities
- [Persona Guide](../02-personas/README.md) - Understanding agent personas

---

*Last Updated: {{TIMESTAMP}}*
*APM Framework v{{VERSION}}*