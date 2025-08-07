# Technical Debt Prioritizer Synthesis Pattern

## Purpose
Synthesize code quality findings into prioritized technical debt backlog, balancing business impact with refactoring effort.

## When to Use
- Code complexity analysis results
- Multiple code quality scans
- Architecture review findings
- Developer code reviews
- Legacy code assessments

## Input Format
Expects findings related to code quality, complexity, maintainability, and architectural issues.

## Prioritization Algorithm

```python
# Technical Debt Score Calculation
debt_score = (impact × urgency × risk) / (effort × stability)

# Impact Factors
IMPACT_WEIGHTS = {
    'performance_degradation': 3.0,
    'security_vulnerability': 3.0,
    'developer_velocity': 2.5,
    'bug_frequency': 2.5,
    'testing_difficulty': 2.0,
    'onboarding_friction': 1.5,
    'code_duplication': 1.5
}

# Risk Multipliers
RISK_FACTORS = {
    'single_point_failure': 3.0,
    'data_corruption_risk': 3.0,
    'compliance_impact': 2.5,
    'customer_facing': 2.0,
    'internal_tool': 1.0
}

# Effort Estimates (story points)
EFFORT_BRACKETS = {
    'trivial': 1,      # Few hours
    'small': 3,        # 1-2 days
    'medium': 8,       # 3-5 days
    'large': 21,       # 1-2 weeks
    'epic': 55         # > 2 weeks
}

# Code Stability (change frequency)
STABILITY_SCORES = {
    'very_stable': 0.5,    # Rarely changes
    'stable': 0.7,         # Monthly changes
    'active': 1.0,         # Weekly changes
    'volatile': 1.5        # Daily changes
}
```

## Synthesis Rules

1. **Compound Debt**: Multiple issues in same component increase priority
2. **Dependency Chain**: Debt in core modules weighted higher
3. **Team Context**: Consider team size, expertise, and velocity
4. **Business Alignment**: Align with upcoming feature work
5. **Quick Wins**: Boost high-impact, low-effort items

## Output Template

```yaml
technical_debt_summary:
  total_debt_items: 67
  critical_items: 8
  total_estimated_points: 234
  debt_ratio: 23%  # debt work vs feature work
  quality_trend: "declining"

priority_matrix:
  immediate_action:
    - id: "DEBT-001"
      description: "God class in payment processor"
      impact: "High bug rate, slow feature delivery"
      metrics:
        complexity: 42
        coupling: 23
        loc: 892
      effort_points: 21
      risk: "Payment failures"
      recommendation: "Split into 3 focused services"
      roi_score: 8.5

  high_priority:
    - id: "DEBT-002"
      description: "Circular dependencies in auth system"
      impact: "Cannot unit test, deployment issues"
      components: ["auth.service", "user.service"]
      effort_points: 8
      risk: "Security vulnerabilities"
      recommendation: "Introduce interface layer"
      roi_score: 7.2

  quick_wins:
    - id: "DEBT-003"
      description: "Duplicate validation logic"
      locations: 3
      effort_points: 3
      impact: "3x maintenance effort"
      recommendation: "Extract to shared module"
      roi_score: 9.1

debt_categories:
  architecture:
    items: 12
    points: 89
    top_issue: "Layering violations"
  
  code_quality:
    items: 34
    points: 98
    top_issue: "High complexity functions"
  
  testing:
    items: 21
    points: 47
    top_issue: "Untestable code"

refactoring_roadmap:
  sprint_1:
    points: 21
    items: ["DEBT-003", "DEBT-007", "DEBT-012"]
    focus: "Quick wins and critical fixes"
  
  sprint_2:
    points: 34
    items: ["DEBT-001"]
    focus: "Payment system refactor"
  
  sprint_3:
    points: 29
    items: ["DEBT-002", "DEBT-008"]
    focus: "Auth system decoupling"

team_recommendations:
  - "Allocate 20% sprint capacity to debt"
  - "Pair programming for complex refactors"
  - "Create ADRs for architectural changes"
  - "Add complexity checks to CI/CD"

metrics_tracking:
  before:
    avg_complexity: 12.3
    test_coverage: 67%
    build_time: 4.2min
    bug_rate: 3.2/week
  
  projected_after:
    avg_complexity: 7.8
    test_coverage: 82%
    build_time: 2.8min
    bug_rate: 1.1/week
```

## ROI Calculation

```python
def calculate_refactor_roi(debt_item):
    # Time saved per month
    current_overhead = debt_item.maintenance_hours * 4
    reduced_overhead = current_overhead * 0.3  # 70% reduction
    hours_saved = current_overhead - reduced_overhead
    
    # Bug reduction value
    bugs_prevented = debt_item.bug_rate * 0.6
    bug_fix_hours = bugs_prevented * 4
    
    # Feature velocity improvement
    velocity_boost = 0.2 if debt_item.blocks_features else 0
    
    total_value = hours_saved + bug_fix_hours + (velocity_boost * 40)
    roi = total_value / debt_item.effort_hours
    
    return roi
```

## Debt Burndown Tracking

```yaml
burndown_metrics:
  start_date: "2024-01-01"
  total_points: 234
  completed: 45
  in_progress: 21
  velocity: 15  # points per sprint
  projected_completion: "2024-08-15"
  
  milestones:
    - date: "2024-02-01"
      target: "Critical items complete"
      points: 55
    - date: "2024-04-01"
      target: "Core architecture cleaned"
      points: 120
```

## Example Usage
Best for: Developer parallel code reviews, Architect system analysis, Tech lead planning