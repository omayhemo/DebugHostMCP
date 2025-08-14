# PO Risk-Adjusted Planning Synthesis Pattern

## Purpose
Factor implementation risks into planning decisions, creating contingency plans and risk-adjusted timelines for reliable delivery.

## When to Use
- During release planning
- When committing to deadlines
- For high-stakes features
- During sprint planning with uncertainties

## Input Format
Expects risk assessments, mitigation strategies, probability/impact scores, and contingency options.

## Risk Adjustment Algorithm

```python
# Risk-adjusted planning with Monte Carlo simulation
def create_risk_adjusted_plan(stories, risks, iterations=1000):
    # 1. Build risk model
    risk_model = build_risk_model(stories, risks)
    
    # 2. Run Monte Carlo simulation
    outcomes = []
    for i in range(iterations):
        # Simulate random risk events
        scenario = simulate_scenario(risk_model)
        
        # Calculate impact on timeline and resources
        timeline = calculate_timeline(stories, scenario)
        cost = calculate_cost(stories, scenario)
        
        outcomes.append({
            'timeline': timeline,
            'cost': cost,
            'risks_realized': scenario.realized_risks
        })
    
    # 3. Statistical analysis
    p50_timeline = percentile(outcomes.timelines, 50)
    p80_timeline = percentile(outcomes.timelines, 80)
    p95_timeline = percentile(outcomes.timelines, 95)
    
    # 4. Generate contingency plans
    contingencies = generate_contingency_plans(
        risks,
        outcomes,
        confidence_level=80
    )
    
    return risk_adjusted_plan, contingencies
```

## Risk Adjustment Factors

### 1. **Technical Risks**
- Complexity multiplier: 1.2-2.0x
- Unknown technology: +40% buffer
- Integration risks: +25% buffer
- Performance risks: +30% buffer

### 2. **Resource Risks**
- Key person dependency: +50% buffer
- Skill gaps: +30% buffer
- Team availability: +20% buffer

### 3. **External Risks**
- Third-party dependencies: +35% buffer
- Compliance changes: +25% buffer
- Market shifts: Variable

## Output Template

```yaml
risk_adjusted_plan:
  planning_date: "2024-01-20T12:30:00Z"
  confidence_level: 80  # percent
  simulation_runs: 1000
  
  timeline_analysis:
    baseline_estimate: "6 sprints"
    
    risk_adjusted_estimates:
      p50: "6.5 sprints"  # 50% probability
      p70: "7.2 sprints"  # 70% probability
      p80: "7.8 sprints"  # 80% probability (recommended)
      p95: "9.1 sprints"  # 95% probability
      
    recommendation: "Plan for 8 sprints (P80 + buffer)"
    
    critical_path_risks:
      - risk: "Database migration complexity"
        impact: "+0.5-1.5 sprints"
        probability: 40%
        
      - risk: "Payment API changes"
        impact: "+0.3-0.8 sprints"
        probability: 30%
        
  milestone_commitments:
    - milestone: "MVP Launch"
      baseline_date: "2024-04-15"
      
      risk_adjusted_dates:
        aggressive: "2024-04-15"    # P50, 50% confidence
        realistic: "2024-04-29"      # P80, 80% confidence
        conservative: "2024-05-13"   # P95, 95% confidence
        
      recommendation: "Commit to 2024-04-29 externally"
      internal_target: "2024-04-15"
      
      key_risks:
        - "Authentication implementation"
        - "Payment integration"
        - "Performance optimization"
        
  resource_planning:
    baseline_effort: 1200  # hours
    
    risk_adjusted_effort:
      expected: 1380        # +15% for likely risks
      p80: 1500            # +25% for 80% confidence
      worst_case: 1800     # +50% for all risks
      
    contingency_resources:
      - type: "Senior developer"
        when: "If complexity higher than expected"
        availability: "On-call from Sprint 3"
        
      - type: "Performance expert"
        when: "If performance issues arise"
        availability: "1 week in Sprint 4"
        
  risk_mitigation_timeline:
    sprint_1:
      mitigations:
        - action: "Database migration spike"
          addresses: "Migration complexity risk"
          effort: "3 days"
          
        - action: "Payment API prototype"
          addresses: "Integration risk"
          effort: "2 days"
          
    sprint_2:
      mitigations:
        - action: "Performance baseline"
          addresses: "Performance risk"
          effort: "2 days"
          
  contingency_plans:
    plan_a_primary:
      description: "Baseline plan with normal execution"
      probability: 50%
      duration: "6 sprints"
      trigger: "No major risks materialize"
      
    plan_b_moderate:
      description: "Adjusted plan with common risks"
      probability: 30%
      duration: "7 sprints"
      
      adjustments:
        - "Defer advanced features"
        - "Add specialist resources"
        - "Increase testing time"
        
      triggers:
        - "Migration takes >5 days"
        - "Performance below targets"
        
    plan_c_recovery:
      description: "Recovery plan for major issues"
      probability: 20%
      duration: "8-9 sprints"
      
      adjustments:
        - "Scope reduction (MVP-)"
        - "All hands on deck"
        - "External consultants"
        
      triggers:
        - "Multiple risks materialize"
        - "Critical blocker found"
        
  early_warning_indicators:
    week_2:
      - indicator: "Spike incomplete"
        risk: "Technical complexity"
        action: "Escalate immediately"
        
    week_4:
      - indicator: "Velocity <30 points"
        risk: "Delivery delay"
        action: "Review scope"
        
    week_8:
      - indicator: "Integration failures"
        risk: "Architecture issues"
        action: "Activate Plan B"
        
  risk_burndown:
    initial_risk_score: 485
    
    by_sprint:
      sprint_1:
        mitigated: 80
        remaining: 405
        new_risks: 10
        
      sprint_2:
        mitigated: 120
        remaining: 295
        new_risks: 15
        
    target_residual_risk: 100
    
  decision_points:
    - date: "2024-02-15"
      decision: "Go/No-Go for full scope"
      
      criteria:
        - "Authentication working"
        - "Performance acceptable"
        - "No blocking issues"
        
      options:
        go: "Continue with full scope"
        adjust: "Reduce scope by 20%"
        pivot: "Focus on core only"
        
  financial_impact:
    baseline_budget: 180,000
    
    risk_reserves:
      technical: 18,000     # 10%
      schedule: 27,000      # 15%
      scope: 9,000          # 5%
      total: 54,000         # 30%
      
    risk_adjusted_budget: 234,000
    
  communication_plan:
    stakeholder_updates:
      - audience: "Executive team"
        message: "80% confident in April 29 delivery"
        frequency: "Bi-weekly"
        
      - audience: "Development team"
        message: "Target April 15, plan for April 29"
        frequency: "Weekly"
        
  recommendations:
    planning:
      - "Use P80 estimates for external commitments"
      - "Keep P50 as internal stretch goal"
      - "Build explicit risk reserves"
      
    execution:
      - "Front-load risky work"
      - "Maintain contingency resources"
      - "Review risks weekly"
      
    communication:
      - "Be transparent about confidence levels"
      - "Update stakeholders on risk changes"
      - "Celebrate risk mitigation wins"
```

## Risk Response Strategies

### 1. **Avoid**
- Change approach
- Different technology
- Defer risky features

### 2. **Mitigate**
- Reduce probability
- Reduce impact
- Early validation

### 3. **Transfer**
- Insurance/warranties
- Fixed-price contracts
- Risk sharing

### 4. **Accept**
- Contingency plans
- Reserve budget/time
- Monitor closely

## Quality Metrics
- **Confidence Level**: 80% standard
- **Risk Coverage**: >90% identified
- **Contingency Plans**: 3 levels minimum
- **Early Warnings**: Weekly checkpoints

## Example Usage
Best for: Deadline commitments, high-stakes projects, complex implementations, executive planning