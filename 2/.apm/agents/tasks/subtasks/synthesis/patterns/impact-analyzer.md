# Impact Analyzer Synthesis Pattern

## Purpose
Analyze the business, technical, and user impact of findings from multiple analysis sources to prioritize remediation efforts.

## When to Use
- Bug prioritization
- Technical debt assessment
- Security vulnerability ranking
- Performance issue triage
- Architecture change evaluation

## Input Format
Expects findings with technical details that need business impact assessment.

## Impact Calculation Algorithm

```python
# Multi-dimensional impact scoring
def calculate_impact_score(finding):
    # Business impact factors
    BUSINESS_IMPACT = {
        'revenue_loss': 10.0,
        'customer_churn': 9.0,
        'brand_damage': 8.0,
        'compliance_violation': 9.5,
        'operational_cost': 6.0,
        'competitive_disadvantage': 7.0
    }
    
    # User impact factors
    USER_IMPACT = {
        'data_loss': 10.0,
        'service_unavailable': 9.0,
        'degraded_experience': 7.0,
        'feature_broken': 8.0,
        'minor_inconvenience': 3.0,
        'cosmetic_issue': 1.0
    }
    
    # Technical impact factors
    TECHNICAL_IMPACT = {
        'system_instability': 9.0,
        'security_breach': 10.0,
        'data_corruption': 10.0,
        'performance_degradation': 7.0,
        'technical_debt': 5.0,
        'maintenance_burden': 4.0
    }
    
    # Calculate weighted impact
    def calculate_dimension_score(impacts, weights):
        return sum(weights.get(impact, 0) * severity 
                  for impact, severity in impacts.items())
    
    business_score = calculate_dimension_score(finding.business_impacts, BUSINESS_IMPACT)
    user_score = calculate_dimension_score(finding.user_impacts, USER_IMPACT)
    technical_score = calculate_dimension_score(finding.technical_impacts, TECHNICAL_IMPACT)
    
    # Weighted combination
    total_impact = (business_score * 0.4 + 
                   user_score * 0.35 + 
                   technical_score * 0.25)
    
    return {
        'total_score': total_impact,
        'business_score': business_score,
        'user_score': user_score,
        'technical_score': technical_score
    }
```

## Synthesis Rules

1. **Cascade Analysis**: Consider downstream effects
2. **Stakeholder Perspective**: View from multiple angles
3. **Time Sensitivity**: Factor in urgency and deadlines
4. **Cumulative Effects**: Consider combined impact
5. **Mitigation Options**: Include workaround availability

## Output Template

```yaml
impact_analysis_summary:
  analysis_id: "IMPACT-2024-001"
  total_findings_analyzed: 45
  critical_impact_count: 8
  high_impact_count: 15
  medium_impact_count: 18
  low_impact_count: 4

critical_impact_findings:
  - finding_id: "SEC-001"
    description: "Authentication bypass vulnerability"
    impact_score: 9.8
    impact_breakdown:
      business:
        score: 10.0
        impacts:
          - type: "compliance_violation"
            details: "GDPR/SOC2 breach risk"
            cost_estimate: "$500K-2M fines"
          - type: "brand_damage"
            details: "Public security breach"
            recovery_time: "6-12 months"
      user:
        score: 10.0
        affected_users: "100% (all users)"
        impacts:
          - type: "data_loss"
            details: "PII exposure risk"
            severity: "CRITICAL"
      technical:
        score: 9.5
        impacts:
          - type: "security_breach"
            details: "Full system compromise possible"
            attack_complexity: "LOW"
    
    time_sensitivity:
      exploitation_likelihood: "HIGH"
      time_to_exploit: "< 24 hours"
      deadline: "IMMEDIATE"
    
    mitigation:
      temporary_workaround: "Disable affected endpoint"
      workaround_impact: "Feature unavailable"
      permanent_fix_effort: "8 hours"
      
  - finding_id: "PERF-001"
    description: "Database query causing 30s page loads"
    impact_score: 8.5
    impact_breakdown:
      business:
        score: 8.8
        impacts:
          - type: "revenue_loss"
            details: "Cart abandonment +40%"
            daily_loss: "$25,000"
          - type: "customer_churn"
            details: "User satisfaction -30%"
            projected_churn: "5% monthly"
      user:
        score: 8.2
        affected_users: "60% (product pages)"
        impacts:
          - type: "degraded_experience"
            details: "30s wait time"
            bounce_rate: "+85%"
      technical:
        score: 6.5
        impacts:
          - type: "performance_degradation"
            details: "Database CPU at 95%"
            cascade: "Affects all queries"

cumulative_impact_analysis:
  performance_issues:
    combined_impact_score: 8.9
    findings: ["PERF-001", "PERF-003", "PERF-007"]
    cumulative_effects:
      - "Overall site slowdown"
      - "Database overload"
      - "Cache invalidation storms"
    business_cost_daily: "$45,000"
    
  security_vulnerabilities:
    combined_impact_score: 9.5
    findings: ["SEC-001", "SEC-004"]
    attack_chain_possible: true
    combined_risk: "Full compromise"

stakeholder_impact_matrix:
  customers:
    high_impact_issues: 12
    primary_concerns:
      - "Service availability"
      - "Data security"
      - "Performance"
    satisfaction_impact: "-25%"
    
  engineering:
    high_impact_issues: 18
    primary_concerns:
      - "System stability"
      - "Technical debt"
      - "Maintenance burden"
    velocity_impact: "-30%"
    
  business:
    high_impact_issues: 8
    primary_concerns:
      - "Revenue impact"
      - "Compliance risk"
      - "Brand reputation"
    revenue_impact: "-$70K/day"
    
  operations:
    high_impact_issues: 6
    primary_concerns:
      - "Incident frequency"
      - "Support tickets"
      - "SLA compliance"
    operational_cost: "+40%"

impact_over_time:
  immediate: # < 24 hours
    findings: ["SEC-001", "PERF-001"]
    combined_impact: "CRITICAL"
    
  short_term: # < 1 week
    findings: ["DATA-003", "API-005"]
    combined_impact: "HIGH"
    
  medium_term: # < 1 month
    findings: ["ARCH-002", "DEBT-004"]
    combined_impact: "MEDIUM"
    
  long_term: # > 1 month
    findings: ["MAINT-001", "SCALE-003"]
    combined_impact: "LOW-MEDIUM"

cost_benefit_analysis:
  - finding_id: "SEC-001"
    fix_cost:
      development_hours: 8
      testing_hours: 4
      deployment_risk: "LOW"
      total_cost: "$2,400"
    prevented_loss:
      fine_avoidance: "$500K-2M"
      breach_costs: "$1M-5M"
      roi: "200x-2000x"
    recommendation: "FIX IMMEDIATELY"
    
  - finding_id: "PERF-001"
    fix_cost:
      development_hours: 16
      testing_hours: 8
      deployment_risk: "MEDIUM"
      total_cost: "$4,800"
    prevented_loss:
      daily_revenue: "$25,000"
      roi_days: 0.2
    recommendation: "FIX THIS SPRINT"

remediation_roadmap:
  sprint_1: # Immediate
    focus: "Critical security & performance"
    findings: ["SEC-001", "PERF-001", "DATA-003"]
    effort_hours: 40
    risk_reduction: "65%"
    
  sprint_2: # Next
    focus: "High impact bugs"
    findings: ["BUG-002", "API-005", "PERF-003"]
    effort_hours: 60
    risk_reduction: "20%"
    
  sprint_3: # Following
    focus: "Technical debt"
    findings: ["ARCH-002", "DEBT-004", "MAINT-001"]
    effort_hours: 80
    risk_reduction: "10%"

executive_summary:
  total_business_impact: "$95K/day revenue risk"
  total_users_affected: "85% experiencing issues"
  compliance_risks: 3
  critical_fixes_needed: 8
  total_effort_required: "180 hours"
  recommended_action: "Emergency fix cycle"
```

## Impact Visualization

```
Impact Distribution:
                    
CRITICAL ████████ 8 findings ($70K/day)
HIGH     ███████████████ 15 findings ($20K/day)
MEDIUM   ██████████████████ 18 findings ($5K/day)
LOW      ████ 4 findings (minimal)

By Stakeholder Impact:
         Customers  Engineering  Business  Operations
CRITICAL ████████   ████         ████████  ██
HIGH     ████████   ████████     ████      ████
MEDIUM   ████       ████████     ██        ████████
```

## Decision Matrix

```yaml
action_priority_matrix:
  immediate_action: # Today
    criteria:
      - impact_score: "> 9.0"
      - exploitation_active: true
      - compliance_violation: true
    findings: ["SEC-001", "DATA-003"]
    
  urgent_action: # This week
    criteria:
      - impact_score: "7.0 - 9.0"
      - revenue_impact: "> $10K/day"
      - user_impact: "> 50%"
    findings: ["PERF-001", "BUG-002"]
    
  planned_action: # This sprint
    criteria:
      - impact_score: "5.0 - 7.0"
      - technical_debt: "high"
      - maintenance_burden: "increasing"
    findings: ["ARCH-002", "DEBT-004"]
```

## Example Usage
Best for: Executive reporting, Sprint planning, Incident prioritization, Resource allocation