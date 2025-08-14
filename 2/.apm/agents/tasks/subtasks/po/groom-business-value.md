# Business Value Scoring Subtask

## Purpose
Calculate business value scores and ROI estimates for stories and epics to enable value-driven prioritization.

## Input
- Story/epic descriptions
- Business objectives
- Revenue projections
- Cost estimates
- User impact metrics
- Strategic goals

## Processing Steps
1. Map stories to business objectives
2. Calculate revenue impact
3. Estimate cost savings
4. Assess user experience impact
5. Factor strategic alignment
6. Compute ROI estimates

## Output Format
```yaml
business_value_analysis:
  scoring_methodology: "WSJF"  # Weighted Shortest Job First
  currency: "USD"
  time_horizon: "12 months"
  
  value_scores:
    - item_id: "EPIC-001"
      item_type: "epic"
      title: "User Authentication System"
      
      business_impact:
        revenue_impact:
          type: "enabler"
          value: 500000
          confidence: "HIGH"
          rationale: "Enables user accounts and purchases"
          
        cost_savings:
          type: "efficiency"
          value: 50000
          confidence: "MEDIUM"
          rationale: "Reduces support tickets"
          
        user_impact:
          affected_users: "100%"
          satisfaction_increase: "+15 NPS"
          churn_reduction: "5%"
          
      strategic_alignment:
        company_goals:
          - goal: "Platform security"
            alignment: "HIGH"
            weight: 0.3
            
          - goal: "User growth"
            alignment: "HIGH"
            weight: 0.4
            
          - goal: "Enterprise readiness"
            alignment: "MEDIUM"
            weight: 0.3
            
        total_alignment_score: 8.5  # out of 10
        
      value_components:
        user_value: 8
        time_criticality: 9
        risk_reduction: 7
        opportunity_enablement: 10
        
      cost_of_delay:
        per_week: 12500
        calculation: "Lost revenue + competitive disadvantage"
        
      implementation_cost:
        development_hours: 320
        hourly_rate: 150
        total_cost: 48000
        
      roi_calculation:
        gross_benefit: 550000
        total_cost: 48000
        net_benefit: 502000
        roi_percentage: 1045
        payback_period: "1.2 months"
        
      wsjf_score: 82.5
      priority_rank: 1
      
    - item_id: "STORY-023"
      item_type: "story"
      title: "Add product search filters"
      
      business_impact:
        revenue_impact:
          type: "conversion"
          value: 75000
          confidence: "MEDIUM"
          rationale: "3% conversion rate increase"
          
        user_impact:
          affected_users: "60%"
          satisfaction_increase: "+5 NPS"
          
      value_components:
        user_value: 7
        time_criticality: 5
        risk_reduction: 3
        opportunity_enablement: 6
        
      wsjf_score: 45.2
      priority_rank: 12
      
  value_distribution:
    high_value: 8     # >70 WSJF score
    medium_value: 15  # 40-70 WSJF score
    low_value: 22     # <40 WSJF score
    
  portfolio_analysis:
    total_portfolio_value: 2850000
    total_implementation_cost: 485000
    portfolio_roi: 587
    
    value_by_category:
      revenue_generation: 45%
      cost_reduction: 20%
      risk_mitigation: 15%
      strategic_enablement: 20%
      
  recommendations:
    immediate_priority:
      - "EPIC-001: Authentication (ROI: 1045%)"
      - "EPIC-003: Payment system (ROI: 890%)"
      - "STORY-045: Mobile app (ROI: 650%)"
      
    defer_consideration:
      - "STORY-089: Admin redesign (ROI: 125%)"
      - "EPIC-008: Reporting v2 (ROI: 180%)"
      
    quick_wins:
      - "STORY-023: Search filters (Low effort, good value)"
      - "STORY-034: Email templates (2 days, high impact)"
```

## Value Scoring Framework

### WSJF Components
1. **User/Business Value** (1-10)
   - Revenue impact
   - Cost savings
   - User satisfaction
   
2. **Time Criticality** (1-10)
   - Cost of delay
   - Market window
   - Competitive pressure
   
3. **Risk Reduction** (1-10)
   - Security improvements
   - Compliance requirements
   - Technical debt reduction
   
4. **Opportunity Enablement** (1-10)
   - Unlocks future features
   - Platform capabilities
   - Market expansion

### ROI Calculation
```
ROI = (Benefit - Cost) / Cost × 100
Payback Period = Cost / Monthly Benefit
```

## Quality Checks
- Value assumptions documented
- ROI calculations verified
- Strategic alignment assessed
- Quick wins identified
- Portfolio balanced