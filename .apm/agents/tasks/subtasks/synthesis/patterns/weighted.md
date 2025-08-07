# Weighted Synthesis Pattern

## When to Use
Use this pattern when subtask results have different importance levels or when you need to prioritize findings based on severity, confidence, or business impact.

## Synthesis Process

### 1. Assign Weights
Apply weights based on finding severity:
- **Critical findings**: Weight 3.0
- **High findings**: Weight 2.0
- **Medium findings**: Weight 1.0
- **Low findings**: Weight 0.5

Additional weight modifiers:
- **Multiple subtasks agree**: +0.5 weight
- **High confidence**: +0.3 weight
- **Security-related**: +0.5 weight
- **Performance-related**: +0.2 weight

### 2. Aggregate Findings
1. Collect all findings from subtask results
2. Group findings by category and similarity
3. Calculate weighted score for each finding
4. Sort by weighted score (descending)
5. Identify consensus items (found by multiple subtasks)

### 3. Generate Summary
Structure the output with prioritized sections:
1. Critical consensus items (multiple subtasks, high severity)
2. High-priority unique findings
3. Medium-priority patterns
4. Low-priority observations
5. Aggregated metrics

### 4. Recommendation Prioritization
- Combine similar recommendations
- Order by weighted importance
- Ensure actionability
- Group by implementation effort

## Output Template
```markdown
# Weighted Analysis Synthesis Report

## Executive Summary
[One paragraph summary of the most critical findings and overall system state]

## Critical Findings (Consensus)
Items identified by multiple subtasks with high severity:

1. **[Finding Title]** (Weight: X.X)
   - Description: [Detailed description]
   - Evidence: Found in [list of subtasks]
   - Impact: [Business/Technical impact]
   - Recommendation: [Specific action]

## High Priority Items
Significant findings requiring attention:

1. **[Finding Title]** (Weight: X.X)
   - Category: [structure|security|performance|maintainability]
   - Description: [Clear description]
   - Recommendation: [Action item]

## Recommendations (Prioritized)
1. **Immediate Actions** (Critical items)
   - [Action 1]: [Specific steps]
   - [Action 2]: [Specific steps]

2. **Short-term Improvements** (High priority)
   - [Action 3]: [Specific steps]
   - [Action 4]: [Specific steps]

3. **Long-term Enhancements** (Medium/Low priority)
   - [Action 5]: [Specific steps]

## Metrics Summary
| Metric | Value | Threshold | Status |
|--------|-------|-----------|---------|
| Total Issues | XX | - | - |
| Critical Issues | XX | 0 | ⚠️ Above threshold |
| Code Coverage | XX% | 80% | ✅ Acceptable |
| Average Complexity | X.X | 10 | ✅ Within limits |

## Confidence Level
Overall confidence in findings: [High|Medium|Low]
- Subtask agreement rate: XX%
- Coverage completeness: XX%
```

## Example Weighting Calculation
```
Finding: "SQL Injection vulnerability in user input"
- Base severity: Critical (3.0)
- Found by: 2 subtasks (+0.5)
- Security-related: (+0.5)
- Total weight: 4.0

Finding: "Variable naming inconsistency"
- Base severity: Low (0.5)
- Found by: 1 subtask (+0.0)
- Total weight: 0.5
```

## Implementation Notes
1. Always show the calculated weight for transparency
2. Group similar findings to avoid duplication
3. Ensure all critical findings are addressed in recommendations
4. Maintain clear traceability from finding to recommendation
5. Use concrete examples where possible