# Consensus Builder Synthesis Pattern

## Purpose
Build consensus when multiple subtasks analyze the same aspect from different perspectives, resolving conflicts and highlighting agreements.

## When to Use
- Cross-browser testing results
- Multi-reviewer code analysis
- Feature validation from different angles
- Architecture reviews

## Input Format
Expects subtask results with overlapping analysis areas but potentially different conclusions.

## Synthesis Algorithm

```python
# Consensus scoring
FULL_AGREEMENT = 1.0      # All sources agree
MAJORITY_AGREEMENT = 0.7   # >50% sources agree
SPLIT_OPINION = 0.4        # Equal split
OUTLIER = 0.1              # Single source disagrees with others

# Confidence weighting
def calculate_consensus(findings):
    if all agree:
        confidence = 1.0
        consensus_type = "unanimous"
    elif majority agree:
        confidence = 0.7 + (0.3 * agreement_ratio)
        consensus_type = "majority"
    elif split evenly:
        confidence = 0.4
        consensus_type = "divided"
    else:
        confidence = 0.2
        consensus_type = "conflicted"
```

## Conflict Resolution Rules

1. **Severity Escalation**: In disagreement, use highest severity
2. **Evidence-Based**: Source with specific evidence trumps general assessment
3. **Recency**: More recent analysis preferred for dynamic issues
4. **Expertise Weighting**: Domain-specific subtasks get higher weight

## Output Template

```yaml
consensus_summary:
  total_findings: 45
  unanimous_agreements: 30
  majority_agreements: 10
  conflicts: 5
  confidence_score: 0.85

agreements:
  - finding: "Authentication flow secure"
    consensus: unanimous
    sources: ["security-scan", "api-test", "code-quality"]
    confidence: 1.0
    
  - finding: "Performance acceptable"
    consensus: majority
    sources_agree: ["performance-check", "load-test"]
    sources_disagree: ["user-feedback"]
    confidence: 0.75
    rationale: "Synthetic tests pass, but real users report slowness"

conflicts:
  - issue: "Database connection pooling"
    perspectives:
      - source: "performance-check"
        finding: "Pool size insufficient"
        evidence: "Connection wait times >500ms"
      - source: "resource-monitor"
        finding: "Pool size adequate"
        evidence: "CPU and memory within limits"
    resolution: "Increase pool size (performance evidence stronger)"
    action: "Monitor after change"

recommendations:
  high_confidence:
    - "Fix authentication vulnerabilities (unanimous)"
    - "Improve error handling (unanimous)"
  medium_confidence:
    - "Optimize database queries (majority)"
  requires_investigation:
    - "Memory leak reports (conflicting evidence)"
```

## Meta-Analysis Features

1. **Trend Detection**: Identify patterns across findings
2. **Root Cause Hints**: When multiple symptoms point to same cause
3. **False Positive Detection**: When only automated tools flag issue
4. **Human Override**: Explicit mechanism for expert judgment

## Visualization
```
Finding Confidence Spectrum:
[████████████████████] Unanimous (100%)
[██████████████░░░░░░] Majority (70%)
[████████░░░░░░░░░░░░] Divided (40%)
[████░░░░░░░░░░░░░░░░] Conflicted (20%)
```

## Example Usage
Best for: QA cross-browser results, PO validation suite, Multi-perspective architecture reviews