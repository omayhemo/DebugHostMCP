# Risk Matrix Synthesis Pattern

## Purpose
Combine multiple risk assessments into a unified risk matrix, prioritizing by likelihood × impact.

## When to Use
- Security vulnerability assessments
- Performance issue prioritization
- Quality risk evaluation
- Compliance gap analysis

## Input Format
Expects subtask results with risk-related findings containing severity and confidence/likelihood.

## Synthesis Algorithm

```python
# Conceptual algorithm
risk_score = severity_weight × likelihood × impact_factor

# Severity weights
CRITICAL: 10
HIGH: 7
MEDIUM: 4
LOW: 1

# Likelihood (from confidence)
HIGH confidence → 0.9 likelihood
MEDIUM confidence → 0.6 likelihood
LOW confidence → 0.3 likelihood

# Impact factors
user_facing: 2.0
data_integrity: 3.0
security: 3.0
performance: 1.5
compliance: 2.5
```

## Aggregation Rules

1. **Deduplication**: Same issue from multiple sources increases confidence
2. **Escalation**: Any CRITICAL finding escalates overall risk level
3. **Clustering**: Group related findings for clearer action items
4. **Threshold**: Risk scores > 15 are highlighted as urgent

## Output Template

```yaml
risk_summary:
  critical_risks: 2
  high_risks: 5
  total_risk_score: 127
  risk_level: "HIGH"
  
priority_matrix:
  urgent:
    - finding: "SQL injection in login"
      risk_score: 30
      sources: ["security-scan", "code-quality"]
      action: "Fix immediately"
  
  high_priority:
    - finding: "Missing rate limiting"
      risk_score: 21
      sources: ["security-scan"]
      action: "Implement within sprint"
  
  medium_priority:
    - finding: "Deprecated dependencies"
      risk_score: 12
      sources: ["security-scan", "test-coverage"]
      action: "Plan for next sprint"

risk_categories:
  security: 45%
  performance: 20%
  reliability: 20%
  compliance: 15%
```

## Confidence Calculation
- Single source: Base confidence
- 2 sources agreeing: confidence × 1.5
- 3+ sources agreeing: confidence × 2.0
- Conflicting sources: Use lowest confidence

## Visual Representation
```
Impact →
↑   [Q1: High Impact/Low Likelihood ] [Q2: High Impact/High Likelihood]
L   [Q3: Low Impact/Low Likelihood  ] [Q4: Low Impact/High Likelihood ]
i
k
e
l
i
h
o
o
d
```

## Example Usage
Best for: Developer security scans, QA comprehensive testing, Architect system analysis