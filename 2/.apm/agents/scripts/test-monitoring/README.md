# APM Test Monitoring Framework
Template Version: {{VERSION}}

## Overview

The APM Test Monitoring Framework provides comprehensive, real-time monitoring capabilities for quality assurance operations. This framework integrates seamlessly with the APM QA agent personas and provides CLI-based monitoring tools for development teams.

## Features

### 🔍 Real-Time Test Monitoring
- **Live Process Tracking**: Monitor active test processes (Jest, Pytest, Mocha, etc.)
- **File Change Detection**: Track recent test file modifications
- **Coverage Analysis**: Monitor test coverage reports and metrics
- **Log Aggregation**: Centralized test log monitoring

### 📊 QA Framework Integration
- **APM QA Agent Status**: Monitor QA agent availability and capabilities
- **Report Tracking**: Track QA reports and test results
- **Framework Statistics**: Real-time QA framework metrics
- **AI/ML Analytics**: Integration with test prediction and optimization

### ⚡ Performance Monitoring
- **Test Execution Speed**: Track test execution times
- **Resource Usage**: Monitor CPU/memory usage during tests
- **Parallel Execution**: Monitor parallel test execution efficiency
- **Anomaly Detection**: Identify performance degradation patterns

## Components

### Core Scripts
```
scripts/test-monitoring/
├── monitor-tests.sh.template          # Main monitoring script
├── test-dashboard.sh.template         # Web-based dashboard
├── test-metrics-collector.sh.template # Metrics collection
├── test-status-api.sh.template        # REST API for status
└── README.md.template                 # This documentation
```

### Integration Points
- **QA Agent**: `/qa-framework` commands with monitoring
- **Parallel Commands**: Native monitoring for parallel test execution
- **CI/CD**: Jenkins/GitHub Actions integration
- **Notifications**: TTS and webhook notifications

## Installation

The test monitoring framework is automatically installed with the APM framework:

```bash
# Standard APM installation includes test monitoring
./installer/install.sh

# Verify monitoring installation
./scripts/test-monitoring/monitor-tests.sh --help
```

## Usage

### Basic Monitoring

```bash
# Start continuous test monitoring
./scripts/test-monitoring/monitor-tests.sh

# Run monitoring once and exit
./scripts/test-monitoring/monitor-tests.sh --once

# Set custom refresh interval (default: 5 seconds)
./scripts/test-monitoring/monitor-tests.sh --interval 10
```

### Focused Monitoring

```bash
# Monitor only QA reports
./scripts/test-monitoring/monitor-tests.sh --reports

# Monitor only running test processes
./scripts/test-monitoring/monitor-tests.sh --processes

# Monitor with web dashboard
./scripts/test-monitoring/test-dashboard.sh --port 2601
```

### APM Integration

```bash
# Use with QA agent for enhanced monitoring
/qa-framework test-execute --monitor

# Parallel test execution with monitoring
/parallel-qa-framework --monitor

# AI-powered test monitoring
/qa-predict --monitor --real-time

# Anomaly detection with monitoring
/qa-anomaly --monitor --scope execution
```

## Configuration

### Environment Variables

```bash
# Set monitoring refresh interval
export APM_TEST_MONITOR_INTERVAL=5

# Set QA reports directory
export APM_QA_REPORTS_DIR="/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/qa"

# Enable advanced monitoring features
export APM_MONITOR_ADVANCED=true

# Set notification webhooks
export APM_MONITOR_WEBHOOK_URL="https://hooks.slack.com/..."
```

### Configuration File

Create `/mnt/c/Code/MCPServers/DebugHostMCP/.apm/config/test-monitoring.yaml`:

```yaml
monitoring:
  refresh_interval: 5
  notifications:
    enabled: true
    webhook_url: "${APM_MONITOR_WEBHOOK_URL}"
    tts_enabled: true
  
  features:
    process_monitoring: true
    file_watching: true
    coverage_tracking: true
    log_aggregation: true
    performance_metrics: true
  
  integrations:
    qa_framework: true
    parallel_execution: true
    ai_ml_analytics: true
    ci_cd: true

  thresholds:
    test_failure_rate: 5.0  # Percentage
    execution_time_increase: 20.0  # Percentage
    coverage_drop: 2.0  # Percentage
```

## Integration with QA Personas

### QA Agent Integration

The monitoring framework integrates directly with QA agent capabilities:

```bash
# QA agent with monitoring
/qa

# Within QA agent session
run comprehensive test monitoring

# Use parallel monitoring
/parallel-qa-framework --monitor --dashboard
```

### Monitoring Commands in QA Agent

```bash
# Real-time test status
show test monitoring status

# Monitor specific test suite
monitor unit tests

# Monitor parallel execution
monitor parallel test execution

# View monitoring dashboard
open test monitoring dashboard
```

## Advanced Features

### AI/ML Integration

```bash
# Predictive test monitoring
/qa-predict --monitor --failure-prediction

# Anomaly detection monitoring
/qa-anomaly --monitor --real-time-alerts

# Performance optimization monitoring
/qa-optimize --monitor --execution-metrics
```

### Custom Dashboards

```bash
# Start web dashboard
./scripts/test-monitoring/test-dashboard.sh --port 2601

# Custom dashboard with metrics
./scripts/test-monitoring/test-dashboard.sh --metrics-only

# Executive dashboard
./scripts/test-monitoring/test-dashboard.sh --executive-view
```

### API Access

```bash
# Start monitoring API
./scripts/test-monitoring/test-status-api.sh --port 3000

# Query test status via API
curl http://localhost:3000/api/test-status

# Get real-time metrics
curl http://localhost:3000/api/metrics/real-time
```

## Monitoring Outputs

### Console Output

The monitoring script provides color-coded, real-time console output:

- **Green (✓)**: Successful operations and healthy status
- **Red (✗)**: Failures, errors, or missing components
- **Yellow**: Warnings and informational messages
- **Blue**: Headers and command suggestions

### Report Generation

```bash
# Generate monitoring report
./scripts/test-monitoring/monitor-tests.sh --report --output report.json

# Export metrics to CSV
./scripts/test-monitoring/test-metrics-collector.sh --export csv

# Create executive summary
./scripts/test-monitoring/generate-executive-summary.sh
```

## Troubleshooting

### Common Issues

1. **No test processes detected**
   ```bash
   # Verify test commands are running
   ps aux | grep -E "(jest|npm.*test|pytest)"
   
   # Check if tests are configured
   ls -la package.json pytest.ini jest.config.js
   ```

2. **QA reports not found**
   ```bash
   # Verify QA reports directory
   ls -la /mnt/c/Code/MCPServers/DebugHostMCP/project_docs/qa/
   
   # Create QA reports directory
   mkdir -p /mnt/c/Code/MCPServers/DebugHostMCP/project_docs/qa/reports/
   ```

3. **Monitoring script permission denied**
   ```bash
   # Make script executable
   chmod +x ./scripts/test-monitoring/monitor-tests.sh
   ```

### Debug Mode

```bash
# Run with debug output
DEBUG=1 ./scripts/test-monitoring/monitor-tests.sh

# Verbose logging
./scripts/test-monitoring/monitor-tests.sh --verbose

# Test monitoring configuration
./scripts/test-monitoring/monitor-tests.sh --test-config
```

## Performance Considerations

### Resource Usage
- **CPU Impact**: Minimal (<1% CPU usage)
- **Memory Usage**: ~10MB for basic monitoring
- **Disk I/O**: Efficient file watching with inotify
- **Network**: Optional webhook notifications

### Scalability
- **Large Projects**: Optimized for 10,000+ test files
- **Parallel Tests**: Supports monitoring 100+ concurrent test processes
- **Continuous Integration**: Designed for 24/7 CI/CD operation

## Integration Examples

### GitHub Actions

```yaml
# .github/workflows/test-monitoring.yml
name: Test Monitoring
on: [push, pull_request]

jobs:
  test-monitoring:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup APM Test Monitoring
        run: |
          ./installer/install.sh
          ./scripts/test-monitoring/monitor-tests.sh --once --report
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Test Monitoring') {
            steps {
                script {
                    sh './scripts/test-monitoring/monitor-tests.sh --once'
                    sh './scripts/test-monitoring/test-metrics-collector.sh --export jenkins'
                }
            }
        }
    }
}
```

## API Reference

### Monitoring Script Options

```bash
monitor-tests.sh [OPTIONS]

OPTIONS:
  --help, -h         Show help message
  --once, -o         Run once and exit
  --interval, -i N   Set refresh interval (seconds)
  --reports, -r      Show only QA reports
  --processes, -p    Show only running processes
  --report          Generate JSON report
  --verbose         Enable verbose output
  --test-config     Test configuration
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APM_TEST_MONITOR_INTERVAL` | Refresh interval (seconds) | 5 |
| `APM_QA_REPORTS_DIR` | QA reports directory | `/mnt/c/Code/MCPServers/DebugHostMCP/project_docs/qa` |
| `APM_MONITOR_ADVANCED` | Enable advanced features | false |
| `APM_MONITOR_WEBHOOK_URL` | Notification webhook URL | - |

## Support

For issues with the test monitoring framework:

1. Check the troubleshooting section above
2. Verify APM framework installation
3. Review monitoring configuration
4. Check system requirements and permissions

The test monitoring framework is an integral part of the APM QA system and is designed to provide comprehensive visibility into testing operations for development teams.