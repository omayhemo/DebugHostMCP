# Risk Assessment Subtask

## Purpose
Assess implementation risks for stories and epics including technical, resource, and business risks.

## Input
- Story/epic complexity
- Technical dependencies
- Team capabilities
- External dependencies
- Historical project data
- Architecture constraints

## Processing Steps
1. Identify risk categories
2. Assess probability and impact
3. Calculate risk scores
4. Define mitigation strategies
5. Identify early warning signs
6. Plan contingencies

## Output Format
```yaml
risk_assessment:
  assessment_date: "2024-01-20"
  risk_appetite: "MODERATE"
  
  risk_summary:
    total_risks: 34
    critical_risks: 3
    high_risks: 8
    medium_risks: 15
    low_risks: 8
    
  identified_risks:
    - risk_id: "RISK-001"
      category: "Technical"
      story_id: "STORY-002"
      title: "Database migration data loss"
      
      probability: "MEDIUM"  # 40%
      impact: "CRITICAL"     # Data loss
      risk_score: 8.0        # P×I (4×10)
      
      description: |
        Risk of data loss during PostgreSQL migration
        due to schema differences and data type conversions
        
      potential_impacts:
        - "Customer data corruption"
        - "Service downtime 4-8 hours"
        - "Compliance violations"
        - "Reputation damage"
        
      mitigation_strategies:
        - strategy: "Incremental migration"
          effectiveness: "HIGH"
          cost: "MEDIUM"
          
        - strategy: "Dual-write period"
          effectiveness: "VERY_HIGH"
          cost: "HIGH"
          
        - strategy: "Comprehensive backups"
          effectiveness: "MEDIUM"
          cost: "LOW"
          
      early_warnings:
        - "Test migration failures"
        - "Data validation errors"
        - "Performance degradation"
        
      contingency_plan:
        - "Immediate rollback procedure"
        - "Point-in-time recovery"
        - "Manual data reconciliation"
        
      owner: "Backend Team Lead"
      review_date: "2024-02-01"
      
    - risk_id: "RISK-002"
      category: "Resource"
      epic_id: "EPIC-001"
      title: "Key developer departure"
      
      probability: "LOW"     # 20%
      impact: "HIGH"        # 3-week delay
      risk_score: 4.0
      
      description: |
        Single point of knowledge for authentication system
        
      mitigation_strategies:
        - strategy: "Knowledge transfer sessions"
          effectiveness: "HIGH"
          cost: "LOW"
          
        - strategy: "Pair programming"
          effectiveness: "VERY_HIGH"
          cost: "MEDIUM"
          
    - risk_id: "RISK-003"
      category: "External"
      story_id: "STORY-045"
      title: "Third-party API changes"
      
      probability: "MEDIUM"  # 30%
      impact: "MEDIUM"      # Feature delay
      risk_score: 4.5
      
      description: |
        Payment provider API deprecation announced
        
      mitigation_strategies:
        - strategy: "API version abstraction"
          effectiveness: "HIGH"
          cost: "MEDIUM"
          
        - strategy: "Multi-provider support"
          effectiveness: "VERY_HIGH"
          cost: "HIGH"
          
  risk_matrix:
    critical_impact:
      high_probability: ["RISK-009"]
      medium_probability: ["RISK-001", "RISK-015"]
      low_probability: []
      
    high_impact:
      high_probability: ["RISK-004", "RISK-007"]
      medium_probability: ["RISK-003", "RISK-011"]
      low_probability: ["RISK-002"]
      
  risk_trends:
    increasing: ["Third-party dependencies", "Security vulnerabilities"]
    stable: ["Resource availability", "Technical complexity"]
    decreasing: ["Market uncertainty"]
    
  portfolio_risk_metrics:
    total_risk_exposure: 485000  # USD
    risk_mitigation_budget: 75000
    residual_risk: 125000
    
  sprint_risk_heat_map:
    sprint_1:
      risk_level: "MEDIUM"
      main_risks: ["Database migration", "Team ramp-up"]
      
    sprint_2:
      risk_level: "HIGH"
      main_risks: ["Integration complexity", "Dependencies"]
      
    sprint_3:
      risk_level: "LOW"
      main_risks: ["Minor technical debt"]
      
  recommendations:
    immediate_actions:
      - "Implement database migration safeguards"
      - "Start knowledge transfer for auth system"
      - "Abstract payment provider API"
      
    risk_reduction_priorities:
      - "Reduce single points of failure"
      - "Implement progressive rollout"
      - "Increase test coverage for critical paths"
```

## Risk Categories
- **Technical**: Architecture, performance, security
- **Resource**: Skills, availability, dependencies
- **External**: Third-party, compliance, market
- **Business**: ROI, adoption, competition
- **Schedule**: Delays, dependencies, capacity

## Risk Scoring Matrix
```
Impact →
↑ Critical (10) | Medium | High    | Critical
↑ High (7)      | Low    | Medium  | High
↑ Medium (4)    | Low    | Low     | Medium
↑ Low (1)       | Low    | Low     | Low
Probability →     Low(3)   Med(5)   High(8)
```

## Quality Checks
- All high-value items assessed
- Mitigation strategies actionable
- Risk owners assigned
- Contingency plans realistic
- Early warnings measurable