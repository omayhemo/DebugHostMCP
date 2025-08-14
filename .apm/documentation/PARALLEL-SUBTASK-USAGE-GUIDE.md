# Parallel Subtask Usage Guide for AP Mapping Teams

## Overview

This guide provides practical examples of how to use the new parallel subtask capabilities in the AP Mapping. Each persona can now execute multiple analysis tasks simultaneously, dramatically improving efficiency and insight quality.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Developer Persona Examples](#developer-persona-examples)
3. [QA Persona Examples](#qa-persona-examples)
4. [Product Owner Persona Examples](#product-owner-persona-examples)
5. [Common Patterns](#common-patterns)
6. [Synthesis Pattern Selection](#synthesis-pattern-selection)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### The Golden Rule

**🚨 CRITICAL**: ALL native sub-agent invocations MUST be in a SINGLE response for parallel execution.

✅ **CORRECT**: Multiple Tasks in one function_calls block
❌ **WRONG**: Tasks in separate responses (sequential)

### Basic Pattern

```
I'll analyze your system using parallel subtasks.

*Spawning parallel analysis tasks:*
[All Task invocations in ONE function_calls block]
- Task 1: Security scan
- Task 2: Performance check
- Task 3: Code quality analysis

*After all complete, applying synthesis pattern...*
```

## Developer Persona Examples

### Example 1: Comprehensive Code Review

**Scenario**: Review a pull request for a payment processing module

**Command**: `/parallel-review payment-service/`

**Execution**:
```yaml
Parallel Tasks Spawned:
1. Security vulnerability scan
2. Performance analysis
3. Test coverage audit
4. Code complexity check
5. Dependency vulnerability scan

Synthesis Pattern: Code Review Aggregator

Results Summary:
- Overall Score: 72/100
- Blocking Issues: 3
- Security: 1 critical (SQL injection)
- Performance: 2 N+1 queries
- Test Coverage: 45% (below 80% threshold)
- Complexity: 5 functions exceed threshold
- Dependencies: 2 outdated with vulnerabilities
```

### Example 2: Pre-Release Security Audit

**Scenario**: Security-focused review before production deployment

**Execution**:
```yaml
Parallel Tasks Spawned:
1. Security vulnerability scan
2. Dependency audit (security focus)
3. API security review
4. Architecture compliance (security patterns)

Synthesis Pattern: Risk Matrix

Risk Assessment:
- Critical Risks: 2
  - Authentication bypass in admin panel
  - Unencrypted PII in logs
- High Risks: 5
  - Missing rate limiting on APIs
  - Weak session management
  - CORS misconfiguration
- Total Risk Score: 127 (HIGH)
- Recommended Action: Block release
```

### Example 3: Performance Optimization Analysis

**Scenario**: Investigate reported slowness in product catalog

**Execution**:
```yaml
Parallel Tasks Spawned:
1. Performance profiling
2. Database query analysis
3. Memory usage profiling
4. API response time analysis

Synthesis Pattern: Performance Baseline Comparator

Performance Findings:
- Database: 15 slow queries, 8 missing indexes
- Memory: 3 memory leaks (45MB/hour growth)
- API: p95 response time increased 40%
- Bottleneck: Product search query (2.5s average)

Optimization Priorities:
1. Add index on products.category_id (-95% query time)
2. Fix N+1 in related products (-60% requests)
3. Implement query result caching (-70% load)
```

## QA Persona Examples

### Example 1: Cross-Browser Compatibility Testing

**Scenario**: Validate new checkout flow across browsers

**Command**: `/parallel-test checkout --browsers`

**Execution**:
```yaml
Parallel Tasks Spawned:
1. Chrome browser test
2. Firefox browser test
3. Safari browser test
4. Edge browser test
5. Mobile responsive test

Synthesis Pattern: Consensus Builder

Compatibility Results:
- Unanimous Pass: Login, product selection
- Majority Pass: Payment form (Safari issue)
- Failed: Order confirmation (Safari, Mobile)
- Browser-Specific Issues:
  - Safari: Date picker renders incorrectly
  - Mobile: Buttons too small (< 44px)
  - Edge: Minor CSS alignment issue

Overall Compatibility: 82%
Recommendation: Fix Safari/Mobile before release
```

### Example 2: Comprehensive E2E Testing

**Scenario**: Full user journey testing for critical paths

**Execution**:
```yaml
Parallel Tasks Spawned:
1. User registration journey
2. Product purchase journey
3. Account management journey
4. Search and discovery journey

Synthesis Pattern: Test Coverage Aggregator

Journey Coverage:
- Registration: 95% success (email validation issue)
- Purchase: 78% success (payment timeout)
- Account Mgmt: 92% success (password reset bug)
- Search: 88% success (filter combination error)

Critical Failures:
1. Payment confirmation timeout (22% of attempts)
2. Password reset email not sent (8% of attempts)
3. Search filters reset on pagination

Overall E2E Health: 86%
Customer Impact: HIGH (payment issues)
```

### Example 3: Performance and Load Testing

**Scenario**: Validate system capacity for Black Friday

**Execution**:
```yaml
Parallel Tasks Spawned:
1. Load test - normal traffic
2. Load test - 3x peak
3. Load test - 10x spike
4. Database performance test
5. CDN/Cache effectiveness test

Synthesis Pattern: Performance Baseline Comparator

Load Test Results:
- Normal Load (1K users): ✅ All metrics green
- 3x Peak (3K users): ⚠️ Response time +40%
- 10x Spike (10K users): ❌ System degradation

Breaking Points:
- API Gateway: 8K requests/second
- Database: Connection pool exhausted at 5K users
- Application: Memory pressure at 7K users

Recommendations:
1. Increase DB connection pool (100 → 200)
2. Implement API request queuing
3. Add 2 more application instances
4. Enable auto-scaling at 70% capacity
```

## Product Owner Persona Examples

### Example 1: Comprehensive Backlog Grooming

**Scenario**: Transform requirements documentation into prioritized sprint backlog

**Command**: `/groom --sprint-length 14 --team-velocity 40`

**Execution**:
```yaml
Parallel Tasks Spawned:
Phase 1 - Documentation Analysis:
- Domain model extraction
- Feature requirement mining
- Technical debt assessment
- Integration mapping
- Compliance analysis

Phase 2 - Epic Generation:
- Feature epics
- Technical epics
- Integration epics
- Compliance epics

Phase 3 - Story Breakdown:
- Story decomposition
- Point estimation
- Dependency mapping

Phase 4 - Optimization:
- Dependency graph construction
- Business value calculation
- Risk assessment
- Parallel stream identification

Phase 5 - Sprint Planning:
- Sprint allocation
- Capacity optimization
```

**Synthesis**: Business Value Maximizer + Sprint Capacity Optimizer

**Output**:
```yaml
Grooming Summary:
- Epics Generated: 12
- Stories Created: 67
- Total Points: 285
- Sprints Required: 8
- Parallel Tracks: 4

Top Priority Items:
1. Authentication System (ROI: 1045%)
2. Payment Processing (ROI: 890%)
3. User Dashboard (ROI: 650%)

Sprint 1 Allocation:
- Frontend: Component library (5 pts)
- Backend: Database schema (3 pts) + User API (5 pts)
- DevOps: CI/CD pipeline (8 pts)
```

### Example 2: Risk-Adjusted Release Planning

**Scenario**: Create realistic timeline with contingencies for stakeholder commitment

**Command**: `/groom --focus-areas "payment,compliance"`

**Execution**: 
- Focuses analysis on payment and compliance features
- Applies risk-adjusted planning synthesis
- Generates P50, P80, P95 timelines

**Output**:
```yaml
Release Plan:
- Baseline: 6 sprints
- P80 Commitment: 8 sprints (recommended)
- P95 Conservative: 10 sprints

Key Risks:
1. Payment gateway integration (+0.5-1 sprint)
2. Compliance audit requirements (+0.3-0.8 sprint)

Contingency Plans:
- Plan A: Normal execution (50% probability)
- Plan B: Common risks materialize (30% probability)
- Plan C: Major issues recovery (20% probability)
```

## Common Patterns

### Pattern 1: The Validation Suite
**When to use**: Validating changes before deployment

```yaml
Tasks:
- Security validation
- Performance validation
- Functionality validation
- Compatibility validation

Synthesis: Multi-Source Validator
Output: Confidence score with go/no-go decision
```

### Pattern 2: The 360° Review
**When to use**: Comprehensive analysis of a component

```yaml
Tasks:
- Code quality analysis
- Security assessment
- Performance profiling
- Test coverage check
- Documentation review

Synthesis: Impact Analyzer
Output: Prioritized issues with business impact
```

### Pattern 3: The Comparison Study
**When to use**: Evaluating changes against baseline

```yaml
Tasks:
- Current version analysis
- Previous version analysis
- Performance comparison
- Feature comparison

Synthesis: Performance Baseline Comparator
Output: Delta analysis with regression detection
```

## Synthesis Pattern Selection

### Decision Tree

```
Is it about combining test results?
├─ YES → Test Coverage Aggregator
└─ NO → Continue

Are you comparing against a baseline?
├─ YES → Performance Baseline Comparator
└─ NO → Continue

Do findings vary in severity/risk?
├─ YES → Risk Matrix or Priority Ranker
└─ NO → Continue

Are there conflicting results?
├─ YES → Consensus Builder or Multi-Source Validator
└─ NO → Continue

Is business impact important?
├─ YES → Impact Analyzer
└─ NO → Continue

Is it code/technical debt?
├─ YES → Technical Debt Prioritizer
└─ NO → Code Review Aggregator (default)
```

## Best Practices

### 1. Task Selection
- **Limit to 5-7 tasks** for optimal performance
- **Ensure independence** - tasks shouldn't depend on each other
- **Balance coverage** - mix different analysis types
- **Consider time** - all tasks should complete in similar timeframes

### 2. Result Interpretation
- **Check confidence scores** - higher confidence = more reliable
- **Look for consensus** - multiple tools finding same issue
- **Consider context** - some issues may be intentional
- **Verify critical findings** - manual check for high-impact issues

### 3. Action Planning
- **Start with critical** - security and data integrity first
- **Quick wins next** - high impact, low effort items
- **Batch related fixes** - group similar changes
- **Track progress** - use task management for findings

### 4. Team Collaboration
- **Share reports** - export findings for team review
- **Document decisions** - why certain issues were deferred
- **Update baselines** - after fixes, re-run for new baseline
- **Learn patterns** - identify recurring issue types

## Troubleshooting

### Issue: Tasks Running Sequentially

**Symptom**: Tasks complete one after another, taking 25+ minutes

**Solution**: Ensure ALL native sub-agent invocations are in a single response:
```python
# WRONG - Sequential
response1: Task(security_scan)
response2: Task(performance_check)

# CORRECT - Parallel
response1: 
  Task(security_scan)
  Task(performance_check)
```

### Issue: Inconsistent Results

**Symptom**: Different results each run

**Possible Causes**:
1. **Environment differences** - ensure consistent test environment
2. **Timing issues** - some issues are intermittent
3. **Data variations** - use consistent test data
4. **Tool limitations** - understand each tool's accuracy

### Issue: Synthesis Pattern Mismatch

**Symptom**: Results don't match expected format

**Solution**: Choose appropriate pattern:
- Multiple test types → Test Coverage Aggregator
- Security findings → Risk Matrix
- Performance issues → Performance Baseline Comparator
- Mixed findings → Code Review Aggregator

### Issue: Too Many Findings

**Symptom**: Overwhelmed by number of issues

**Solution**: Use synthesis patterns that prioritize:
1. **Risk Matrix** - for security/risk prioritization
2. **Priority Ranker** - for effort/impact balance
3. **Impact Analyzer** - for business priority

## Advanced Usage

### Custom Task Combinations

Create your own task combinations for specific needs:

```yaml
# Mobile App Release Validation
Tasks:
1. iOS compatibility test
2. Android compatibility test
3. API contract verification
4. Performance on 3G/4G
5. Offline functionality test

# Microservice Health Check
Tasks:
1. API response time check
2. Database connection pool analysis
3. Message queue performance
4. Circuit breaker status
5. Dependency health check

# Security Hardening Review
Tasks:
1. OWASP Top 10 scan
2. Dependency vulnerability check
3. Configuration security review
4. Secrets detection scan
5. Permission audit
```

### Scheduling Parallel Reviews

Integrate into your workflow:

1. **PR Checks**: Run on every pull request
2. **Nightly Builds**: Comprehensive analysis
3. **Pre-Release**: Full validation suite
4. **Post-Incident**: Root cause analysis
5. **Sprint Reviews**: Technical debt assessment

## Conclusion

Parallel subtasks transform how we analyze and validate code. What previously took hours of sequential analysis now completes in minutes with richer insights. Start with the common patterns, experiment with combinations, and build your own patterns for your team's specific needs.

Remember: **Always invoke all tasks in a single response for true parallel execution!**