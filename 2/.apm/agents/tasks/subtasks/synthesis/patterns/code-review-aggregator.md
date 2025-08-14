# Code Review Aggregator Synthesis Pattern

## Purpose
Aggregate findings from multiple code analysis subtasks into a unified, actionable code review report with clear priorities and remediation steps.

## When to Use
- Comprehensive code reviews
- Pre-release quality gates
- Pull request analysis
- Security audit synthesis
- Performance review compilation

## Input Format
Expects results from security scans, performance checks, test coverage, complexity analysis, and dependency audits.

## Aggregation Algorithm

```python
# Severity Scoring
SEVERITY_WEIGHTS = {
    'critical': 10,
    'high': 7,
    'medium': 4,
    'low': 1
}

# Category Priorities
CATEGORY_PRIORITIES = {
    'security': 1.5,      # Highest priority
    'data_integrity': 1.4,
    'performance': 1.2,
    'reliability': 1.1,
    'maintainability': 1.0,
    'style': 0.7
}

# Confidence Boosting
def boost_confidence(findings):
    # Multiple tools finding same issue
    if len(findings.sources) > 1:
        confidence *= 1.2 ** (len(findings.sources) - 1)
    
    # Specific evidence provided
    if findings.has_line_numbers:
        confidence *= 1.1
    
    return min(confidence, 1.0)
```

## Aggregation Rules

1. **Deduplication**: Merge similar findings from different tools
2. **Context Enrichment**: Add code context to findings
3. **Impact Analysis**: Calculate blast radius of issues
4. **Fix Ordering**: Dependencies first, then by priority
5. **Effort Estimation**: Sum efforts for grouped fixes

## Output Template

```yaml
review_summary:
  review_id: "REV-2024-001"
  timestamp: "2024-01-07T10:30:00Z"
  overall_score: 72  # out of 100
  verdict: "NEEDS_WORK"  # APPROVED, NEEDS_WORK, BLOCKED
  blocking_issues: 3
  total_issues: 47
  estimated_fix_time: "12 hours"

blocking_issues:
  - id: "SEC-001"
    type: "SQL Injection"
    severity: "critical"
    file: "src/api/users.js"
    line: 145
    description: "Unsanitized user input in SQL query"
    evidence: "query = `SELECT * FROM users WHERE id = ${userId}`"
    fix: "Use parameterized queries"
    effort: "30 minutes"
    tools_detected: ["security-scan", "code-quality"]
    confidence: 0.95

  - id: "SEC-002"
    type: "Authentication Bypass"
    severity: "critical"
    file: "src/auth/validator.js"
    line: 78
    description: "JWT validation can be bypassed with null token"
    fix: "Add null check before validation"
    effort: "15 minutes"
    confidence: 0.90

high_priority_issues:
  performance:
    - id: "PERF-001"
      type: "N+1 Query"
      impact: "500ms per 100 records"
      location: "src/services/orderService.js:234"
      fix: "Add eager loading for customer data"
      effort: "2 hours"
  
  reliability:
    - id: "REL-001"
      type: "Missing Error Handling"
      locations: ["api/payment.js:123", "api/payment.js:156"]
      impact: "Unhandled promise rejections"
      fix: "Add try-catch blocks"
      effort: "1 hour"

code_quality_metrics:
  test_coverage:
    overall: 67%
    uncovered_critical_paths: 3
    recommendation: "Increase to 80% minimum"
  
  complexity:
    high_complexity_functions: 8
    average_complexity: 8.3
    recommendation: "Refactor functions > 10 complexity"
  
  duplication:
    duplicate_blocks: 12
    lines_duplicated: 234
    recommendation: "Extract common utilities"

dependencies:
  vulnerabilities:
    critical: 2
    high: 5
    packages: ["lodash@4.17.11", "axios@0.19.0"]
    action: "Update immediately"
  
  outdated:
    major_behind: 8
    security_patches_available: 4
    action: "Plan update sprint"

actionable_items:
  immediate:  # < 1 hour total
    - "Fix SQL injection (30 min)"
    - "Fix auth bypass (15 min)"
    - "Update lodash (15 min)"
  
  short_term:  # < 1 day
    - "Add error handling (2 hrs)"
    - "Fix N+1 queries (3 hrs)"
    - "Increase test coverage (4 hrs)"
  
  long_term:  # > 1 day
    - "Refactor complex functions"
    - "Eliminate code duplication"
    - "Architectural improvements"

fix_sequence:
  # Ordered by dependencies and priority
  1: ["SEC-001", "SEC-002"]  # Security first
  2: ["DEP-001", "DEP-002"]  # Update vulnerable deps
  3: ["REL-001"]            # Reliability fixes
  4: ["PERF-001"]           # Performance
  5: ["QUAL-001", "QUAL-002"] # Quality improvements

team_assignments:
  senior_dev: ["SEC-001", "SEC-002", "ARCH-001"]
  mid_dev: ["PERF-001", "REL-001"]
  junior_dev: ["TEST-001", "DOC-001"]

ci_cd_recommendations:
  - "Add security scanning to PR checks"
  - "Enforce 80% test coverage minimum"
  - "Block PRs with complexity > 15"
  - "Automate dependency updates"
```

## Risk Matrix Visualization

```
SEVERITY
   ↑
 C |[■■■]     [■]
 R |  SEC-001
 I |          SEC-002
 T |
 I |[■■■■■]   [■■]
 C | PERF-001
 A | REL-001
 L |
   |[■■■■■■■■■■■■■]
 H | Multiple issues
 I |
 G |
 H |
   |[■■■■■■■■■■■■■■■■■■■]
 M | Code quality issues
 E |
 D |
   |[■■■■■■■■■■■■■■■■■■■■■■■■]
 L | Style and convention issues
 O |
 W +------------------------→
    IMMEDIATE  SHORT  LONG
         FIX TIMELINE
```

## Trend Analysis

```yaml
quality_trends:
  vs_last_review:
    score_change: +5  # improving
    issues_change: -12
    coverage_change: +3%
    complexity_change: -0.5
  
  patterns:
    - "Security issues decreasing"
    - "Test coverage improving"
    - "Technical debt stable"
    - "New dependencies adding risk"
```

## Example Usage
Best for: Developer PR reviews, QA gate checks, Security audit summaries, Release readiness