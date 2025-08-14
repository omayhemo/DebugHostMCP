# Parallel Subtask Quick Reference Card

## 🚨 Critical Rule
**ALL Task invocations MUST be in a SINGLE response for parallel execution**

## Available Personas & Commands

### 🚀 Developer
**Command**: `/parallel-review [path]`

**Available Subtasks**:
- `security-scan` - Vulnerability detection
- `performance-check` - Bottleneck analysis
- `test-coverage` - Coverage gaps
- `code-complexity` - Maintainability
- `dependency-audit` - Package health
- `memory-profiling` - Memory leaks
- `database-optimization` - Query analysis
- `api-design-review` - REST/GraphQL best practices
- `architecture-compliance` - Pattern adherence

### ✅ QA
**Command**: `/parallel-test [feature]`

**Available Subtasks**:
- `cross-browser-test` - Browser compatibility
- `accessibility-audit` - WCAG compliance
- `api-contract-test` - Contract validation
- `load-test` - Performance under load
- `mobile-responsive-test` - Mobile experience
- `e2e-user-journey` - Complete flow testing

### 🏗️ Architect (Existing)
**Command**: Use Task tool directly

**Available Subtasks**:
- `code-quality` - Architecture quality
- `security-scan` - Security patterns
- `performance-check` - System performance

## Synthesis Patterns

### Choose Based on Your Needs:

| Pattern | When to Use | Output Focus |
|---------|-------------|--------------|
| **Risk Matrix** | Security/performance issues | Severity × likelihood ranking |
| **Consensus Builder** | Multiple test results | Agreement/conflict resolution |
| **Priority Ranker** | Bug/task lists | Effort vs impact ordering |
| **Code Review Aggregator** | General code review | Unified review report |
| **Technical Debt Prioritizer** | Code quality issues | ROI-based debt ranking |
| **Test Coverage Aggregator** | Test suite analysis | Multi-dimensional coverage |
| **Performance Baseline Comparator** | Version comparison | Regression detection |
| **Multi-Source Validator** | Verify findings | Confidence scoring |
| **Impact Analyzer** | Business priority | Multi-stakeholder impact |
| **Confidence Aggregator** | Research/analysis | Certainty assessment |
| **Weighted** (Architect) | Mixed importance | Priority-based weighting |

## Common Task Combinations

### 🔒 Security Audit
```yaml
Tasks: [security-scan, dependency-audit, api-design-review, architecture-compliance]
Synthesis: Risk Matrix
```

### 📊 Performance Review
```yaml
Tasks: [performance-check, database-optimization, memory-profiling, load-test]
Synthesis: Performance Baseline Comparator
```

### ✨ Code Quality Check
```yaml
Tasks: [code-complexity, test-coverage, architecture-compliance, security-scan]
Synthesis: Technical Debt Prioritizer
```

### 🌐 Browser Compatibility
```yaml
Tasks: [cross-browser-chrome, cross-browser-firefox, cross-browser-safari, mobile-responsive]
Synthesis: Consensus Builder
```

### 🎯 Pre-Release Validation
```yaml
Tasks: [e2e-user-journey, security-scan, load-test, accessibility-audit]
Synthesis: Multi-Source Validator
```

## Output Examples

### Risk Matrix Output
```
CRITICAL: 2 issues (immediate fix)
HIGH: 5 issues (this sprint)
MEDIUM: 12 issues (backlog)
LOW: 8 issues (technical debt)
```

### Consensus Builder Output
```
Unanimous Pass: 15 features
Majority Pass: 8 features (minor issues)
Split Opinion: 3 features (investigate)
Failed: 2 features (blocking)
```

### Priority Ranker Output
```
P0 - Immediate: 3 items (2 hours)
P1 - This Sprint: 8 items (16 hours)
P2 - Next Sprint: 15 items (40 hours)
P3 - Backlog: 22 items
```

## Time Estimates

| Parallel Execution | Sequential Alternative | Time Saved |
|-------------------|------------------------|------------|
| 5-7 minutes | 25-35 minutes | ~80% |
| All tasks simultaneous | One at a time | 5x faster |

## Quick Troubleshooting

**Tasks running sequentially?**
- Check: All Tasks in one function_calls block
- Fix: Don't await between Task calls

**Too many findings?**
- Use Priority Ranker or Impact Analyzer
- Focus on critical/high severity first

**Conflicting results?**
- Use Consensus Builder or Multi-Source Validator
- Manual review for split opinions

**Not sure which synthesis?**
- Default to Code Review Aggregator
- Check decision tree in full guide

## Pro Tips

1. **Start small**: 3-4 tasks first, then expand
2. **Mix perspectives**: Security + Performance + Quality
3. **Regular baselines**: Run weekly for trend analysis
4. **Document decisions**: Why defer certain findings
5. **Quick wins first**: High impact, low effort items

---

**Remember**: Parallel = All Tasks in ONE response! 🚀