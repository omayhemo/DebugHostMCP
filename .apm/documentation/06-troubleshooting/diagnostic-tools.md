# APM Diagnostic Tools and Debugging Utilities

This guide covers the built-in diagnostic tools, debugging utilities, and advanced troubleshooting techniques for the APM Framework.

## 🔧 Built-in Diagnostic Suite

### APM Health Check System

**Primary Health Check:**
```bash
# Comprehensive system health check
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/health-check.sh

# Quick health assessment
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/health-check.sh --quick

# Detailed health report with recommendations
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/health-check.sh --detailed --report-file health-report.html
```

**Health Check Output Example:**
```
=== APM Health Check Report ===
✓ APM Installation: OK
✓ Directory Structure: OK
✓ File Permissions: OK
✓ Voice System: OK
⚠ Session Notes: Large files detected (recommend archiving)
✗ Configuration: Invalid JSON in apm.json
✓ Agent Personas: OK
✓ Command Integration: OK

Overall Health: 85% (Good)
Critical Issues: 1
Warnings: 1
Recommendations: 3
```

---

## 🔍 System Diagnostic Tools

### 1. Installation Verification Tool

**Purpose:** Verify APM installation integrity and completeness.

```bash
# Basic installation check
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/verify-installation.sh

# Verbose installation verification
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/verify-installation.sh --verbose --check-permissions

# Installation repair mode
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/verify-installation.sh --repair --backup
```

**Verification Checks:**
- Directory structure completeness
- File permissions and ownership
- Configuration file validity
- Command integration status
- Voice system availability
- Dependencies and prerequisites

**Sample Output:**
```bash
=== APM Installation Verification ===

Directory Structure:
✓ /mnt/c/Code/MCPServers/DebugHostMCP/.apm/ exists and accessible
✓ /mnt/c/Code/MCPServers/DebugHostMCP/.apm/agents/ contains all required subdirectories
✓ /mnt/c/Code/MCPServers/DebugHostMCP/.apm/session_notes/ writable
✓ /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/ contains valid configurations

File Permissions:
✓ Voice scripts executable (755)
✓ Configuration files readable (644)
✓ Session directory writable (755)

Command Integration:
✓ Claude Code commands installed
✓ Command files properly formatted
✓ Command paths resolve correctly

Dependencies:
✓ Bash shell available
✓ Text-to-speech system detected
⚠ Python3 not found (optional but recommended)

Installation Status: COMPLETE
Issues Found: 0 critical, 1 warning
```

---

### 2. Configuration Validator

**Purpose:** Validate and troubleshoot APM configuration files.

```bash
# Validate all configuration files
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/validate-config.sh

# Validate specific configuration
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/validate-config.sh --config apm.json

# Configuration repair and optimization
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/validate-config.sh --repair --optimize
```

**Configuration Checks:**
- JSON syntax validation
- Required fields verification
- Value range validation
- Dependency consistency
- Path resolution verification
- Performance setting optimization

**Sample Output:**
```bash
=== Configuration Validation Report ===

Main Configuration (apm.json):
✓ Valid JSON syntax
✓ All required fields present
✓ Path variables resolve correctly
⚠ PARALLEL_WORKERS (8) exceeds CPU cores (4)

Persona Configurations:
✓ developer.json - Valid
✓ architect.json - Valid
✗ qa.json - Invalid: missing required field 'test_frameworks'

Voice Configuration:
✓ TTS system configured correctly
✓ Voice scripts accessible

Performance Configuration:
⚠ MAX_SESSION_SIZE too large, may impact performance
✓ Memory limits appropriate for system

Validation Result: 2 errors, 2 warnings
Recommendations: 4 optimizations available
```

---

### 3. Performance Profiler

**Purpose:** Analyze APM performance characteristics and identify bottlenecks.

```bash
# Basic performance profiling
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/profile-apm.sh

# Detailed performance analysis
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/profile-apm.sh --detailed --duration 60

# Real-time performance monitoring
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/profile-apm.sh --monitor --interval 5
```

**Performance Metrics:**
- Command execution times
- Memory usage patterns
- CPU utilization
- I/O performance
- Session management overhead
- Parallel operation efficiency

**Sample Output:**
```bash
=== APM Performance Profile ===

Command Execution Times (average over 10 runs):
/ap activation: 1.2s (baseline: <2s) ✓
/dev activation: 0.8s (baseline: <3s) ✓
/handoff operation: 2.1s (baseline: <1s) ⚠
/parallel-test: 3.4s (4.2x speedup vs sequential) ✓

Resource Usage:
Peak Memory: 87MB (limit: 200MB) ✓
CPU Usage: 45% average, 78% peak ✓
Disk I/O: 15MB/s average ✓

Performance Issues Detected:
⚠ Handoff operations slower than expected
⚠ Large session files impacting load time

Optimization Opportunities:
- Enable session compression (estimated 20% improvement)
- Archive sessions >5MB (estimated 15% improvement)
- Tune parallel worker count (estimated 10% improvement)
```

---

## 🤖 Agent-Specific Diagnostic Tools

### 4. Agent Health Monitor

**Purpose:** Monitor and diagnose agent-specific issues.

```bash
# Check all agents
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/agent-health-check.sh

# Check specific agent
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/agent-health-check.sh --agent developer

# Continuous agent monitoring
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/agent-health-check.sh --monitor --interval 30
```

**Agent Health Metrics:**
- Activation success rate
- Response time consistency
- Persona adherence
- Voice notification functionality
- Session handoff reliability
- Memory usage per agent

---

### 5. Session Diagnostics

**Purpose:** Analyze and troubleshoot session management.

```bash
# Analyze current session
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/analyze-session.sh

# Session history analysis
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/analyze-session.sh --history --days 7

# Session corruption detection
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/analyze-session.sh --check-corruption --repair
```

**Session Analysis Output:**
```bash
=== Session Analysis Report ===

Current Session:
File: 2025-01-15-14-30-00-Developer-Work.md
Size: 2.1MB
Age: 3 hours, 15 minutes
Entries: 47 progress updates
Status: Active, healthy

Session Statistics (last 7 days):
Total Sessions: 23
Average Duration: 2.4 hours
Average Size: 1.8MB
Largest Session: 5.2MB (archived)

Issues Detected:
⚠ 3 sessions exceed recommended size (>5MB)
✓ No corruption detected
✓ All sessions properly formatted

Recommendations:
- Archive sessions >5MB for better performance
- Enable automatic session rotation
- Consider session compression for large contexts
```

---

## 🔬 Advanced Debugging Tools

### 6. Debug Mode Activation

**Purpose:** Enable detailed debugging for troubleshooting complex issues.

```bash
# Enable global debug mode
export APM_DEBUG=true
export APM_VERBOSE=true

# Enable specific debug categories
export APM_DEBUG_AGENTS=true
export APM_DEBUG_SESSION=true
export APM_DEBUG_VOICE=true
export APM_DEBUG_PARALLEL=true

# Run commands with debug output
/ap --debug
/dev --verbose --debug
```

**Debug Categories:**
- `APM_DEBUG_AGENTS`: Agent activation and behavior
- `APM_DEBUG_SESSION`: Session management operations
- `APM_DEBUG_VOICE`: Voice notification system
- `APM_DEBUG_PARALLEL`: Parallel operation coordination
- `APM_DEBUG_CONFIG`: Configuration loading and validation
- `APM_DEBUG_PERFORMANCE`: Performance metrics collection

---

### 7. Log Analysis Tools

**Purpose:** Analyze APM logs for patterns, errors, and performance issues.

```bash
# Analyze all logs
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/analyze-logs.sh

# Focus on error patterns
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/analyze-logs.sh --errors --last-24h

# Performance log analysis
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/analyze-logs.sh --performance --chart
```

**Log Analysis Features:**
- Error pattern detection
- Performance trend analysis
- Resource usage patterns
- Session activity correlation
- Agent behavior analysis
- Automatic issue categorization

**Sample Log Analysis:**
```bash
=== Log Analysis Report ===

Time Range: Last 24 hours
Total Log Entries: 1,247
Errors: 3
Warnings: 12
Performance Events: 89

Error Summary:
1. Voice system timeout (2 occurrences)
2. Session file lock conflict (1 occurrence)

Performance Insights:
- Peak activity: 14:00-16:00 (87 commands/hour)
- Slowest operation: /handoff (average 2.1s)
- Memory usage trending upward (investigate)

Recommendations:
1. Investigate voice system stability
2. Review session locking mechanism
3. Monitor memory usage growth
```

---

### 8. Network Diagnostics (for Remote Operations)

**Purpose:** Diagnose network-related issues in distributed APM setups.

```bash
# Network connectivity check
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/network-diagnostics.sh

# Remote APM server diagnostics
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/network-diagnostics.sh --server apm-server.example.com

# Network performance testing
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/network-diagnostics.sh --performance-test
```

---

## 🧪 Testing and Validation Tools

### 9. Integration Test Suite

**Purpose:** Comprehensive testing of APM functionality.

```bash
# Run full integration test suite
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/integration-tests.sh

# Quick smoke tests
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/integration-tests.sh --smoke

# Regression testing
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/integration-tests.sh --regression --baseline baseline.json
```

**Test Categories:**
- Agent activation tests
- Session management tests
- Voice system tests
- Parallel operation tests
- Configuration validation tests
- Performance regression tests

---

### 10. Stress Testing Tools

**Purpose:** Test APM behavior under load and stress conditions.

```bash
# Agent stress testing
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/stress-test.sh --agents --concurrent 10

# Session management stress test
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/stress-test.sh --sessions --duration 300

# Memory stress testing
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/stress-test.sh --memory --limit 500MB
```

---

## 📊 Reporting and Visualization

### 11. Health Dashboard

**Purpose:** Visual dashboard for APM system health and performance.

```bash
# Generate health dashboard
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/generate-dashboard.sh

# Real-time dashboard (web interface)
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/dashboard-server.sh --port 8080

# Export dashboard data
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/generate-dashboard.sh --export dashboard-data.json
```

**Dashboard Features:**
- Real-time system health indicators
- Performance trend charts
- Agent activity visualization
- Resource usage graphs
- Error rate tracking
- Historical performance data

---

### 12. Diagnostic Report Generator

**Purpose:** Comprehensive diagnostic reports for support and analysis.

```bash
# Generate comprehensive diagnostic report
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/generate-diagnostic-report.sh

# Include performance data
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/generate-diagnostic-report.sh --include-performance

# Anonymized report for support
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/generate-diagnostic-report.sh --anonymize --support
```

**Report Contents:**
- System configuration summary
- Performance metrics and trends
- Error logs and analysis
- Resource usage patterns
- Agent behavior analysis
- Recommendations and action items

---

## 🛠️ Custom Diagnostic Tools

### Creating Custom Diagnostics

**Template for Custom Diagnostic Script:**
```bash
#!/bin/bash
# Custom APM Diagnostic Script Template

# Load APM environment
source /mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/common/apm-environment.sh

# Your diagnostic logic here
function custom_diagnostic() {
    echo "=== Custom APM Diagnostic ==="
    
    # Check specific condition
    if [ -condition ]; then
        echo "✓ Custom check passed"
    else
        echo "✗ Custom check failed"
    fi
}

# Run diagnostic
custom_diagnostic
```

**Integration with APM Diagnostic Suite:**
```bash
# Add custom diagnostic to health check
echo "source /mnt/c/Code/MCPServers/DebugHostMCP/custom-diagnostic.sh" >> /mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/custom-diagnostics.conf

# Run health check with custom diagnostics
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/health-check.sh --include-custom
```

---

## 🆘 Emergency Diagnostic Procedures

### Emergency System Analysis

**When APM is completely non-functional:**

```bash
# Emergency diagnostic script (minimal dependencies)
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/emergency-diagnostic.sh

# Core system check (no APM dependencies)
bash -c "
echo '=== Emergency APM Diagnostic ==='
echo 'Timestamp: $(date)'
echo 'User: $(whoami)'
echo 'System: $(uname -a)'
echo 'APM Root: /mnt/c/Code/MCPServers/DebugHostMCP/.apm'
echo 'Permissions: $(ls -ld /mnt/c/Code/MCPServers/DebugHostMCP/.apm)'
echo 'Disk Space: $(df -h /mnt/c/Code/MCPServers/DebugHostMCP/.apm)'
echo 'Processes: $(ps aux | grep -E \"claude|apm\" | wc -l)'
"
```

### Data Recovery Diagnostics

**For session data recovery:**

```bash
# Recover session data
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/recover-session-data.sh

# Validate recovered data
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/validate-recovered-data.sh

# Rebuild session index
/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/rebuild-session-index.sh
```

---

## 📋 Diagnostic Checklists

### Pre-Issue Diagnostic Checklist

Before reporting issues, run:

- [ ] `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/health-check.sh`
- [ ] `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/verify-installation.sh`
- [ ] `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/validate-config.sh`
- [ ] `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/analyze-logs.sh --errors`
- [ ] Check disk space: `df -h /mnt/c/Code/MCPServers/DebugHostMCP/.apm`
- [ ] Check permissions: `ls -la /mnt/c/Code/MCPServers/DebugHostMCP/.apm`
- [ ] Test basic functionality: `/ap --test-mode`

### Post-Fix Validation Checklist

After applying fixes:

- [ ] `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/health-check.sh --detailed`
- [ ] Test affected functionality
- [ ] Monitor for 10 minutes with `--monitor` mode
- [ ] Generate diagnostic report for baseline
- [ ] Update documentation with lessons learned

---

## 🔧 Maintenance Diagnostic Tools

### Scheduled Diagnostics

**Daily Health Check:**
```bash
# Add to crontab for daily health monitoring
0 9 * * * /mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/health-check.sh --daily-report >> /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/daily-health.log
```

**Weekly Performance Analysis:**
```bash
# Weekly performance report
0 9 * * 1 /mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/profile-apm.sh --weekly-report >> /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/weekly-performance.log
```

**Monthly Comprehensive Analysis:**
```bash
# Monthly comprehensive diagnostic
0 9 1 * * /mnt/c/Code/MCPServers/DebugHostMCP/.apm/scripts/generate-diagnostic-report.sh --monthly >> /mnt/c/Code/MCPServers/DebugHostMCP/.apm/logs/monthly-diagnostic.log
```

---

## 📚 Related Resources

- [Common Issues](common-issues.md) - Most frequent problems and solutions
- [Performance Issues](performance-issues.md) - Performance troubleshooting
- [Agent Issues](agent-issues.md) - Agent-specific troubleshooting
- [Configuration Guide](../05-configuration/README.md) - System configuration

---

*Last Updated: {{TIMESTAMP}}*
*APM Framework v{{VERSION}}*