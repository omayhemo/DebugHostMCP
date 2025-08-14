# Parallel Subtask Examples

This directory contains real-world examples of parallel subtask execution and their synthesized results.

## Available Examples

### 1. Python Task Manager Review
**File**: `python-task-manager-review.yaml`
**Description**: Comprehensive code review of the AP Mapping's Python task manager using 5 parallel subtasks.

**Tasks Executed**:
- Security vulnerability scan
- Performance analysis
- Test coverage audit
- Code complexity check
- Dependency audit

**Key Findings**:
- Overall Score: 58/100
- 0% test coverage (critical issue)
- N+1 query problems
- High complexity functions
- All dependencies secure

**Demonstrates**:
- How multiple perspectives reveal different issues
- Code Review Aggregator synthesis pattern
- Prioritized action items with time estimates

### 2. Cross-Browser Test Results (Coming Soon)
**File**: `cross-browser-compatibility-test.yaml`
**Description**: Browser compatibility testing across Chrome, Firefox, Safari, Edge.

**Demonstrates**:
- Consensus Builder pattern for conflicting results
- Platform-specific issue tracking
- Visual regression detection

### 3. Security Audit Results (Coming Soon)
**File**: `security-audit-comprehensive.yaml`
**Description**: Multi-layer security assessment combining automated and manual findings.

**Demonstrates**:
- Risk Matrix pattern for security prioritization
- Vulnerability chain analysis
- Compliance impact assessment

### 4. Performance Regression Analysis (Coming Soon)
**File**: `performance-regression-v2.1.yaml`
**Description**: Performance comparison between releases.

**Demonstrates**:
- Performance Baseline Comparator pattern
- Regression detection and root cause analysis
- Rollback decision support

## How to Use These Examples

1. **Learning Synthesis Patterns**: Study how different patterns organize and prioritize findings
2. **Report Templates**: Use as templates for your own parallel analyses
3. **Issue Examples**: See real-world issues detected by parallel analysis
4. **Decision Making**: Understand how to interpret synthesized results

## Creating Your Own Examples

When running parallel analyses, save interesting results here:

1. Run your parallel analysis
2. Copy the synthesized YAML output
3. Create a descriptive filename
4. Add brief description to this README
5. Highlight what makes this example valuable

## Best Practices Demonstrated

- **Multi-dimensional analysis**: Security + Performance + Quality
- **Clear prioritization**: Critical → High → Medium → Low
- **Actionable outcomes**: Specific fixes with effort estimates
- **Business impact**: Technical findings translated to business terms
- **Confidence scoring**: Understanding reliability of findings