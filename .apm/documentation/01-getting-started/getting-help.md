# Getting Help with APM Framework

Need assistance with APM? This comprehensive guide provides multiple support channels, troubleshooting resources, and community connections to ensure your success.

## 🆘 Quick Help Index

**🔥 Emergency Issues**
- [Critical Installation Problems](#-critical-installation-problems)
- [Performance Degradation](#-performance-degradation)  
- [Command Not Working](#-command-not-working)

**🛠️ Common Questions**
- [Troubleshooting Guide](#-troubleshooting-guide)
- [FAQ Section](#-frequently-asked-questions)
- [Best Practices](#-best-practices)

**🌐 Community & Support**
- [Community Resources](#-community-resources)
- [Official Support](#-official-support-channels)
- [Contributing](#-contributing-to-apm)

## 🚨 Critical Installation Problems

### Issue: APM Commands Not Recognized

**Symptoms:**
- `/ap` command returns "command not found"
- No APM personas available
- Installation appears incomplete

**Immediate Solutions:**

1. **Verify Installation Location**
```bash
# Check if APM is installed
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/
```

2. **Re-run Installation**
```bash
# Complete reinstallation
cd /mnt/c/Code/MCPServers/DebugHostMCP
./installer/install.sh --force
```

3. **Manual Command Registration**
```bash
# Direct command copy
cp /mnt/c/Code/MCPServers/DebugHostMCP/.claude/commands/* ~/.claude/commands/
source ~/.bashrc  # or ~/.zshrc
```

**Still Not Working?** → [Jump to Official Support](#-official-support-channels)

### Issue: Voice System Failure

**Symptoms:**
- No audio notifications during persona activation
- Silent APM interactions
- TTS errors in logs

**Quick Fixes:**

1. **Check Audio System**
```bash
# Test system audio
echo "test" | espeak  # or say "test" on macOS
```

2. **Reconfigure TTS Provider**
```bash
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/voice/configure-tts.sh --provider system
```

3. **Disable Voice (Temporary)**
```bash
export APM_VOICE_ENABLED=false
/ap  # Should work without audio
```

## ⚡ Performance Degradation

### Slow Command Execution

**If APM commands take >30 seconds:**

1. **Check Native Sub-Agent Mode**
```bash
# Verify no Task tool dependencies
grep -r "Task tool" /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/
```
**Expected:** No results (native mode active)

2. **Enable Performance Monitoring**
```bash
export APM_DEBUG_MODE=true
export APM_PERFORMANCE_MONITORING=true
/ap  # Monitor execution time
```

3. **Resource Optimization**
```bash
# Check system resources
htop  # Look for high CPU/memory usage
```

**Performance Standards (APM v4.0.0):**
- **Command Response**: <5 seconds
- **Parallel Execution**: 4-8x speedup
- **Memory Usage**: <512MB per persona
- **Native Integration**: Zero crashes

## 🛠️ Troubleshooting Guide

### Common Issues and Solutions

#### 1. Session Notes Not Creating

**Problem:** Empty session notes directory after persona activation

**Solutions:**
```bash
# Check permissions
chmod 755 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/

# Initialize manually
/session-note-setup

# Verify path configuration
cat /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/paths.json
```

#### 2. Context Loss Between Sessions

**Problem:** Personas don't remember previous work

**Solutions:**
```bash
# Always read latest session notes
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/
# Read the most recent non-archived file

# Use proper handoffs
/handoff developer  # Preserves context
# Instead of direct activation: /dev
```

#### 3. Parallel Execution Not Working

**Problem:** Multiple personas running sequentially instead of concurrently

**Solutions:**
```bash
# Verify APM v4.0.0 native mode
cat /mnt/c/Code/MCPServers/DebugHostMCP/VERSION
# Should show v4.0.0 or higher

# Check for deprecated Task dependencies
find /mnt/c/Code/MCPServers/DebugHostMCP/.apm -name "*.md" -exec grep -l "Task tool" {} \;
# Should return no results
```

#### 4. Persona Behavior Inconsistencies

**Problem:** Personas not following expected behavioral patterns

**Solutions:**
```bash
# Read current persona rules
ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules/
cat /mnt/c/Code/MCPServers/DebugHostMCP/.apm/rules/[relevant-rule-file].md

# Update persona definitions if needed
/mnt/c/Code/MCPServers/DebugHostMCP/installer/generate-personas.sh
```

### Advanced Troubleshooting

#### Debug Mode Activation

```bash
# Enable comprehensive debugging
export APM_DEBUG_MODE=true
export APM_VERBOSE_LOGGING=true
export APM_TRACE_EXECUTION=true

# Run problematic command with full logging
/ap 2>&1 | tee apm-debug.log
```

#### Log Analysis

```bash
# Check APM logs
tail -f /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/apm.log

# System logs (macOS)
log show --predicate 'subsystem contains "com.anthropic.claude"' --last 1h

# System logs (Linux)
journalctl -f | grep -i claude
```

## ❓ Frequently Asked Questions

### General Questions

**Q: How is APM different from regular AI assistants?**
A: APM provides specialized AI personas optimized for specific development roles, with native parallel execution delivering 4-8x performance improvements and seamless context preservation.

**Q: Can I use APM with existing projects?**
A: Yes! APM integrates with any codebase. Simply run the installer in your project root, and APM will adapt to your existing structure.

**Q: Does APM require specific programming languages?**
A: No. APM personas work with any technology stack - JavaScript, Python, Java, C#, Go, Rust, and more.

### Technical Questions

**Q: Why are my commands slow in APM v4.0.0?**
A: APM v4.0.0 uses native sub-agents for 4-8x speedup. Slow performance indicates Task tool dependencies weren't fully removed. Run `grep -r "Task tool" .apm/` to identify remaining dependencies.

**Q: How do I customize persona behavior?**
A: Edit persona definitions in `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/personas/` and regenerate with `/mnt/c/Code/MCPServers/DebugHostMCP/installer/generate-personas.sh`.

**Q: Can I create custom personas?**
A: Yes! Follow the persona template in `/mnt/c/Code/MCPServers/DebugHostMCP/installer/templates/agents/personas/` and add your custom persona to the generation process.

### Workflow Questions

**Q: When should I use /ap vs direct persona activation?**
A: Always start with `/ap` for new sessions or complex tasks. Use direct activation (`/dev`, `/qa`) only for simple, single-persona tasks.

**Q: How do I handle long-running development sessions?**
A: Use `/handoff [persona]` for context-preserving transitions and `/wrap` to properly archive sessions before ending.

**Q: What's the difference between /handoff and /switch?**
A: `/handoff` preserves full context, while `/switch` compacts the session before transitioning (useful for memory optimization).

## 💡 Best Practices

### Optimization Tips

**1. Start Every Session with Orchestrator**
```bash
/ap  # Provides optimal workflow planning
```

**2. Leverage Parallel Commands for Complex Tasks**
```bash
/parallel-sprint     # Multiple developers
/parallel-qa-framework  # Comprehensive testing
```

**3. Maintain Context Continuity**
```bash
# Always read previous session notes
# Use proper handoffs instead of direct activation
# Update session notes throughout work
```

**4. Monitor Performance**
```bash
export APM_PERFORMANCE_MONITORING=true
# Track 4-8x acceleration metrics
```

### Anti-Patterns to Avoid

**❌ Sequential Persona Usage**
```bash
# WRONG: Wait for each persona to complete
/dev → wait → /qa → wait → /architect
```

**✅ Parallel Execution**
```bash
# CORRECT: Use parallel commands
/parallel-sprint  # All personas work concurrently
```

**❌ Ignoring Session Notes**
- Starting sessions without reading context
- Not updating progress during work
- Failing to archive completed sessions

**✅ Proper Session Management**
- Read latest notes on activation
- Update continuously during work
- Archive with `/wrap` when complete

## 🌐 Community Resources

### Official Communities

**🎮 Discord Server**
- **URL**: {{COMMUNITY_DISCORD_URL}}
- **Channels**: #general-help, #advanced-usage, #troubleshooting
- **Response Time**: Usually <2 hours
- **Best For**: Real-time discussions, quick questions

**💻 GitHub Discussions**
- **URL**: {{GITHUB_DISCUSSIONS_URL}}
- **Categories**: Q&A, Ideas, Show and Tell
- **Best For**: Detailed technical discussions, feature requests

**📚 Documentation Wiki**
- **URL**: {{WIKI_URL}}
- **Content**: Community-contributed guides, examples, tips
- **Best For**: Learning advanced patterns, sharing experiences

### Learning Resources

**📺 Video Tutorials**
- [APM Quick Start]({{YOUTUBE_QUICKSTART}}) - 10 minute overview
- [Advanced Parallel Development]({{YOUTUBE_ADVANCED}}) - 30 minute deep dive
- [Custom Persona Creation]({{YOUTUBE_CUSTOM}}) - 20 minute tutorial

**📖 Blog Posts**
- [APM Best Practices]({{BLOG_BEST_PRACTICES}})
- [Performance Optimization Guide]({{BLOG_PERFORMANCE}})
- [Enterprise APM Deployment]({{BLOG_ENTERPRISE}})

**🎪 Example Projects**
- [Task Management App]({{GITHUB_EXAMPLES}}/task-manager)
- [E-commerce Platform]({{GITHUB_EXAMPLES}}/ecommerce)
- [Data Analytics Dashboard]({{GITHUB_EXAMPLES}}/analytics)

## 📞 Official Support Channels

### Community Support (Free)

**🌟 GitHub Issues**
- **URL**: {{GITHUB_ISSUES_URL}}
- **Use For**: Bug reports, feature requests
- **Response Time**: 1-3 business days
- **Required**: Detailed reproduction steps, system info

**Template for Bug Reports:**
```markdown
## Bug Description
[Clear description of the issue]

## Environment
- APM Version: [from cat VERSION]
- OS: [macOS/Linux/Windows]
- Claude Code Version: [version info]

## Reproduction Steps
1. Step one
2. Step two
3. Issue occurs

## Expected vs Actual Behavior
**Expected**: [what should happen]
**Actual**: [what actually happens]

## Additional Context
[Logs, screenshots, configuration files]
```

### Priority Support (Paid)

**🎯 Enterprise Support**
- **Email**: support@apm-framework.com
- **SLA**: 4-hour response for critical issues
- **Includes**: Custom persona development, deployment assistance
- **Cost**: Contact for enterprise pricing

**⚡ Priority Discord**
- **Access**: Enterprise and sponsor tiers
- **Features**: Direct developer access, priority responses
- **Response Time**: <30 minutes during business hours

## 🤝 Contributing to APM

### Ways to Help

**🐛 Bug Reports**
- Test APM with different projects
- Report issues with detailed reproduction steps
- Verify fixes and provide feedback

**💡 Feature Contributions**
- Suggest new personas or capabilities
- Contribute custom persona templates
- Share optimization techniques

**📚 Documentation**
- Improve existing guides
- Add missing examples
- Translate documentation

**🧪 Testing**
- Beta test new versions
- Performance benchmarking
- Integration testing with various tech stacks

### Development Setup

```bash
# Fork the repository
git clone {{GITHUB_REPO_URL}}
cd agentic-persona-mapping

# Install development dependencies
npm install  # or pip install -r requirements.txt

# Run tests
npm test  # or python -m pytest

# Submit pull request with changes
```

## 📊 Support Response Times

| Channel | Response Time | Best For |
|---------|---------------|----------|
| **Discord** | <2 hours | Quick questions, real-time help |
| **GitHub Issues** | 1-3 business days | Bug reports, feature requests |
| **GitHub Discussions** | 12-24 hours | Technical discussions |
| **Email Support** | 4-24 hours | Enterprise customers |
| **Community Wiki** | Self-service | Learning, examples |

## 🎯 Getting Help Checklist

Before requesting help, please:

- [ ] Read the [troubleshooting section](#-troubleshooting-guide)
- [ ] Check [FAQ](#-frequently-asked-questions) for common solutions
- [ ] Verify your APM installation with `/ap`
- [ ] Review recent session notes for context
- [ ] Enable debug mode if experiencing issues
- [ ] Prepare reproduction steps and error logs

---

**🌟 Remember**: The APM community is here to help you succeed. Don't hesitate to reach out - we've all been beginners, and helping each other is how we grow.

**⚡ Quick Help**: For immediate assistance, join our Discord at {{COMMUNITY_DISCORD_URL}} and ask in #general-help.

**🎯 Support Philosophy**: Every question helps improve APM. Your challenges today become tomorrow's documentation improvements.