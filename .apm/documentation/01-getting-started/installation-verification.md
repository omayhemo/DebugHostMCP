# Installation Verification Guide

Ensure your APM framework installation is complete and optimized for maximum performance. This guide provides comprehensive validation steps and troubleshooting solutions.

## 🚀 Quick Verification Checklist

Run through this checklist to verify your APM installation:

### ✅ Core Installation Check

**1. APM Directory Structure**
```bash
# Verify APM installation directory exists
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/
```

**Expected Output:**
```
.apm/
├── agents/           # Core persona definitions and voice scripts
├── session_notes/    # Session management directory
├── rules/           # Behavioral rules and guidelines  
├── CLAUDE.md        # APM-specific instructions
└── config/          # Configuration files
```

**2. Essential Personas Available**
```bash
# Check persona definitions
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/
```

**Expected Personas:**
- `ap_orchestrator.md` - Central coordinator
- `developer.md` - Full-stack development
- `architect.md` - System design
- `qa.md` - Quality assurance
- `pm.md` - Product management

**3. Voice System Integration**
```bash
# Verify voice scripts
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/
```

**Expected Scripts:**
- `speakOrchestrator.sh`
- `speakDeveloper.sh`
- `speakArchitect.sh`
- `speakQa.sh`
- `speakPm.sh`

### ✅ Claude Code Integration Check

**1. Command Availability**

Open Claude Code and test core commands:

```bash
# Test orchestrator activation
/ap
```

**Expected Behavior:**
1. Session notes directory listed
2. Latest session note read (if exists)
3. Rules directory listed  
4. New session note created
5. Voice notification played
6. Orchestrator persona activated

**2. Parallel Command Testing**
```bash
# Test native sub-agent parallelism
/parallel-sprint
```

**Expected Result:**
- Multiple sub-agents launch concurrently
- Progress updates from parallel streams
- Synthesis of results from all agents

## 🔧 Advanced Verification Tests

### Native Sub-Agent Performance Test

**Test Command:**
```bash
/qa-framework
```

**Validation Points:**
- [ ] Multiple test processes launch simultaneously
- [ ] Real-time progress updates from each stream
- [ ] No Task tool dependencies (native execution only)
- [ ] Results synthesis from all parallel agents
- [ ] 4-8x performance compared to sequential execution

### Session Management Test

**Test Sequence:**
```bash
1. /ap                    # Start orchestrator
2. /handoff developer     # Transition to developer
3. /switch architect      # Switch to architect with session compaction
4. /wrap                  # Archive session with summary
```

**Validation Points:**
- [ ] Context preserved across handoffs
- [ ] Session notes updated continuously
- [ ] Archival creates proper file structure
- [ ] Voice notifications for each transition

### Voice System Test

**Manual Test:**
```bash
# Check TTS configuration
cat /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/tts-config.yaml
```

**Audio Test:**
1. Activate any persona: `/dev`
2. Listen for voice notification
3. Verify persona-specific voice characteristics

## 🔍 Troubleshooting Common Issues

### Issue: Command Not Found

**Symptom:** `/ap` command not recognized

**Solutions:**

1. **Verify Claude Configuration**
```bash
# Check Claude commands directory
ls -la ~/.claude/commands/
```

2. **Reinstall Commands**
```bash
# Re-run installer
/mnt/c/Code/MCPServers/DebugHostMCP/installer/install.sh
```

3. **Manual Command Registration**
```bash
# Copy command files to Claude directory
cp /mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/* ~/.claude/commands/
```

### Issue: Voice System Not Working

**Symptom:** No audio notifications during persona activation

**Solutions:**

1. **Check TTS Provider**
```bash
# Verify TTS configuration
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/configure-tts.sh --status
```

2. **Test Audio System**
```bash
# Test system audio
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/speakBase.sh "Test message"
```

3. **Configure Alternative Provider**
```bash
# Switch to system TTS
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/configure-tts.sh --provider system
```

### Issue: Slow Performance

**Symptom:** APM commands take longer than expected

**Solutions:**

1. **Verify Native Sub-Agent Mode**
```bash
# Check for Task tool dependencies (should be none)
grep -r "Task tool" /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/
```

2. **Enable Debug Mode**
```bash
# Add to environment
export APM_DEBUG_MODE=true
export APM_PERFORMANCE_MONITORING=true
```

3. **Check Resource Usage**
```bash
# Monitor during APM execution
htop # or Activity Monitor on macOS
```

### Issue: Session Notes Not Creating

**Symptom:** Session notes directory empty after persona activation

**Solutions:**

1. **Check Directory Permissions**
```bash
# Verify write permissions
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/
chmod 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/
```

2. **Manual Session Setup**
```bash
# Initialize session notes structure
/session-note-setup
```

3. **Verify Path Configuration**
```bash
# Check APM configuration paths
cat /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/paths.json
```

## ⚡ Performance Optimization

### Optimal Configuration

**1. Enable Performance Monitoring**
```json
// /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/performance.json
{
  "native_subagents": true,
  "parallel_execution": true,
  "performance_tracking": true,
  "memory_optimization": true
}
```

**2. Configure Resource Limits**
```json
// /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/resources.json
{
  "max_concurrent_agents": 4,
  "memory_per_agent": "512MB",
  "execution_timeout": "300s"
}
```

**3. Environment Variables**
```bash
# Add to shell profile
export APM_NATIVE_MODE=true
export APM_PARALLEL_OPTIMIZATION=true  
export APM_VOICE_ENABLED=true
```

### Performance Benchmarks

Run this test to validate optimal performance:

```bash
# Performance benchmark test
time /parallel-qa-framework
```

**Expected Results (APM v4.0.0):**
- **Native Execution**: 4-8x faster than v3.x
- **Memory Efficiency**: 60% less RAM usage
- **Concurrent Agents**: 2-4 agents running simultaneously
- **Zero Crashes**: Rock-solid stability

## 🧪 Integration Testing

### MCP Plopdock Integration

**Test Command:**
```bash
# Verify MCP integration
/dev
# Should prevent direct server commands and suggest MCP alternatives
npm run dev
```

**Expected Behavior:**
- Command intercepted by PreToolUse hook
- Alternative MCP command suggested
- Development server management through MCP Plopdock

### QA Framework Integration

**Test Command:**
```bash
# Test AI-powered QA capabilities
/qa-predict
```

**Expected Capabilities:**
- 92% test failure prediction accuracy
- ML-powered optimization recommendations  
- Performance regression detection
- Automated anomaly identification

## ✅ Installation Validation Checklist

Complete this checklist to confirm successful installation:

### Core Components
- [ ] APM directory structure present
- [ ] All essential personas available
- [ ] Voice system configured and functional
- [ ] Session management working properly

### Performance Verification
- [ ] Native sub-agent execution confirmed
- [ ] Parallel commands deliver 4-8x speedup
- [ ] No Task tool dependencies found
- [ ] Memory usage optimized

### Integration Testing
- [ ] Claude Code commands registered
- [ ] MCP Plopdock integration working
- [ ] QA Framework AI capabilities active
- [ ] Voice notifications functioning

### Advanced Features
- [ ] Configurable prompt enhancement available
- [ ] Continuous session notes updating
- [ ] Backlog management integration
- [ ] Performance monitoring active

## 🎯 Success Indicators

**Your APM installation is optimal when:**

✅ **Commands respond instantly** with native sub-agent execution  
✅ **Voice notifications** provide context-aware feedback  
✅ **Parallel execution** delivers visible performance improvements  
✅ **Session continuity** preserves context across interactions  
✅ **Specialized personas** demonstrate domain expertise  

## 🛣️ Next Steps

**Installation Verified?** ✅ 
Proceed to [First Project Tutorial](./first-project-tutorial.md) to build your first APM-powered application.

**Issues Found?** ⚠️
- Review the [troubleshooting section](#-troubleshooting-common-issues) above
- Consult [Getting Help](./getting-help.md) for additional support resources
- Consider re-running the installer: `/mnt/c/Code/MCPServers/DebugHostMCP/installer/install.sh`

---

**🎯 Goal**: Confirm APM framework is properly installed and optimized for 4-8x development acceleration.

**⚡ Performance Standard**: Native sub-agent execution with zero crashes and optimal resource utilization.

**🔧 Support**: Visit [Getting Help](./getting-help.md) for comprehensive troubleshooting and community support.