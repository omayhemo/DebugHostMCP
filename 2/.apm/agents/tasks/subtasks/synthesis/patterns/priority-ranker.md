# Priority Ranker Synthesis Pattern

## Purpose
Rank and prioritize findings from multiple subtasks based on business impact, effort, and strategic value.

## When to Use
- Feature prioritization
- Bug triage
- Technical debt ranking
- Story validation results
- Backlog grooming

## Input Format
Expects findings with severity, impact, and optional effort estimates.

## Ranking Algorithm

```python
# Priority Score Calculation
priority_score = (impact * urgency * value) / (effort * risk)

# Factor Weights
IMPACT_WEIGHTS = {
    'user_facing': 3.0,
    'revenue': 3.0,
    'security': 2.5,
    'performance': 2.0,
    'technical_debt': 1.5,
    'developer_experience': 1.0
}

URGENCY_MULTIPLIERS = {
    'immediate': 3.0,    # Production down
    'this_sprint': 2.0,  # Committed work
    'next_sprint': 1.5,  # Planned work
    'this_quarter': 1.0, # Roadmap item
    'eventually': 0.5    # Nice to have
}

EFFORT_SCORES = {
    'trivial': 1,     # < 2 hours
    'small': 2,       # 2-8 hours
    'medium': 5,      # 1-3 days
    'large': 10,      # 3-5 days
    'extra_large': 20 # > 1 week
}
```

## Prioritization Rules

1. **Override Conditions**
   - Security vulnerabilities → Top priority
   - Production outages → Immediate
   - Compliance requirements → Date-driven

2. **Tiebreaker Criteria**
   - Quick wins (high impact, low effort) first
   - User-reported over internally found
   - Dependencies resolved first

3. **Batch Optimization**
   - Group related items
   - Consider context switching cost
   - Align with sprint capacity

## Output Template

```yaml
priority_summary:
  total_items: 42
  p0_immediate: 2
  p1_high: 8
  p2_medium: 15
  p3_low: 17
  
prioritized_list:
  immediate_action:
    - id: "SEC-001"
      title: "SQL injection vulnerability"
      impact_score: 30
      effort: "small"
      rationale: "Critical security risk"
      owner: "security-team"
      deadline: "24 hours"
      
  high_priority:
    - id: "PERF-001"
      title: "Homepage load time 5s+"
      impact_score: 24
      effort: "medium"
      rationale: "Major user experience impact"
      owner: "frontend-team"
      target: "this sprint"
      
    - id: "BUG-042"
      title: "Checkout fails for IE users"
      impact_score: 22
      effort: "small"
      rationale: "Revenue impact, quick fix"
      owner: "frontend-team"
      target: "this sprint"

  medium_priority:
    - id: "TECH-012"
      title: "Refactor authentication module"
      impact_score: 15
      effort: "large"
      rationale: "Technical debt, enables future work"
      owner: "backend-team"
      target: "next sprint"

priority_matrix:
  high_impact_low_effort:
    count: 5
    items: ["BUG-042", "PERF-003", ...]
  
  high_impact_high_effort:
    count: 3
    items: ["FEAT-001", "TECH-012", ...]

effort_distribution:
  sprint_capacity: 100
  allocated: 75
  remaining: 25
  overflow_to_next: 15

recommendations:
  - "Address SEC-001 immediately"
  - "Batch frontend fixes together"
  - "Defer TECH-012 if capacity tight"
  - "Consider parallel work on PERF items"
```

## Strategic Alignment

```yaml
alignment_check:
  q4_goals:
    performance: 3 items aligned
    security: 2 items aligned
    new_features: 1 item aligned
  
  misaligned_items:
    - id: "FEAT-099"
      reason: "Not in current roadmap"
      recommendation: "Defer to Q1"
```

## Capacity Planning

```python
def calculate_sprint_fit(priorities, team_capacity):
    allocated = []
    remaining = team_capacity
    
    for item in priorities:
        if item.effort <= remaining:
            allocated.append(item)
            remaining -= item.effort
        else:
            break
    
    return allocated, remaining
```

## Example Usage
Best for: PO backlog management, Developer sprint planning, QA test prioritization