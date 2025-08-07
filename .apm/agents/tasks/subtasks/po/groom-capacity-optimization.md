# Capacity Optimization Subtask

## Purpose
Optimize team utilization and resource allocation across sprints to maximize throughput and minimize waste.

## Input
- Sprint allocation plan
- Team skills matrix
- Resource availability
- Story skill requirements
- Cross-training opportunities
- Time zone considerations

## Processing Steps
1. Analyze team utilization per sprint
2. Identify skill gaps and surpluses
3. Find cross-training opportunities
4. Balance workload distribution
5. Optimize for sustainable pace
6. Plan for contingencies

## Output Format
```yaml
capacity_optimization:
  optimization_period: "Q1 2024"
  teams_analyzed: 5
  total_capacity_hours: 3600
  
  team_analysis:
    frontend_team:
      size: 3
      total_capacity: 360  # hours/sprint
      
      skill_matrix:
        - developer: "Sarah"
          skills:
            react: "EXPERT"
            typescript: "EXPERT"
            css: "ADVANCED"
            testing: "INTERMEDIATE"
          availability: 100%
          
        - developer: "Mike"
          skills:
            react: "ADVANCED"
            typescript: "INTERMEDIATE"
            css: "EXPERT"
            testing: "ADVANCED"
          availability: 100%
          
        - developer: "Jessica"
          skills:
            react: "INTERMEDIATE"
            typescript: "BEGINNER"
            css: "ADVANCED"
            testing: "INTERMEDIATE"
          availability: 80%  # Part-time
          
      sprint_utilization:
        sprint_1: 95%
        sprint_2: 100%
        sprint_3: 85%
        sprint_4: 70%
        sprint_5: 90%
        sprint_6: 95%
        
    backend_team:
      size: 4
      total_capacity: 480  # hours/sprint
      
      skill_gaps:
        - skill: "GraphQL"
          required_for: ["STORY-067", "STORY-068"]
          current_level: "NONE"
          action: "Training needed"
          
        - skill: "Kubernetes"
          required_for: ["STORY-089"]
          current_level: "BASIC"
          action: "Pair with DevOps"
          
  utilization_analysis:
    overall_utilization: 87%
    
    by_sprint:
      sprint_1:
        utilization: 92%
        bottlenecks: ["Database expertise"]
        idle_capacity: ["Frontend: 20 hours"]
        
      sprint_2:
        utilization: 95%
        bottlenecks: ["Backend capacity"]
        idle_capacity: ["DevOps: 15 hours"]
        
    by_team:
      frontend: 85%
      backend: 92%
      devops: 78%
      qa: 88%
      data: 70%
      
  optimization_recommendations:
    immediate_actions:
      - action: "Cross-train Mike on TypeScript"
        benefit: "Reduce frontend bottleneck"
        effort: "16 hours"
        impact: "HIGH"
        
      - action: "Reallocate DevOps capacity in Sprint 2"
        benefit: "Support backend team"
        effort: "0 hours"
        impact: "MEDIUM"
        
      - action: "Bring QA earlier into Sprint 1"
        benefit: "Smooth QA workload"
        effort: "0 hours"
        impact: "HIGH"
        
    skill_development:
      - developer: "Jessica"
        skill: "TypeScript"
        method: "Pairing with Sarah"
        timeline: "Sprint 1-2"
        impact: "Increase frontend capacity 20%"
        
      - developer: "Backend Team"
        skill: "GraphQL"
        method: "Team workshop + course"
        timeline: "Sprint 2"
        impact: "Unblock 3 stories"
        
  workload_balancing:
    sprint_1:
      moves:
        - from: "Frontend"
          to: "Documentation"
          hours: 20
          stories: ["DOC-001", "DOC-002"]
          
    sprint_4:
      moves:
        - from: "Backend"
          to: "Frontend support"
          hours: 40
          reason: "Frontend overloaded"
          
  sustainable_pace_metrics:
    overtime_risk:
      sprint_2: "HIGH"
      sprint_3: "MEDIUM"
      mitigation: "Defer 2 P2 stories"
      
    burnout_indicators:
      backend_team: "YELLOW"
      action: "Add buffer time in Sprint 4"
      
  contingency_planning:
    identified_risks:
      - risk: "Sarah unavailable"
        probability: "LOW"
        impact: "HIGH"
        mitigation: "Mike as backup, Jessica training"
        
      - risk: "Backend overload in Sprint 2"
        probability: "HIGH"
        impact: "MEDIUM"
        mitigation: "DevOps assists with 2 stories"
        
  efficiency_improvements:
    - improvement: "Automated testing setup"
      time_saved: "40 hours/sprint"
      investment: "24 hours"
      break_even: "Sprint 2"
      
    - improvement: "Component library"
      time_saved: "20 hours/sprint"
      investment: "40 hours"
      break_even: "Sprint 4"
      
  capacity_forecast:
    trend: "INCREASING"
    
    factors:
      positive:
        - "Jessica going full-time in Sprint 3"
        - "New hire starting Sprint 4"
        - "Automation savings"
        
      negative:
        - "Complexity increasing"
        - "Technical debt accumulating"
        
    projected_velocity:
      current: 40
      sprint_3: 42
      sprint_6: 45
```

## Optimization Strategies
1. **Cross-Training**: Build redundancy in critical skills
2. **Load Leveling**: Smooth workload across sprints
3. **Skill Matching**: Assign stories to best-fit developers
4. **Automation Investment**: Reduce repetitive work
5. **Sustainable Pace**: Prevent burnout, maintain quality

## Utilization Targets
- **Optimal**: 85-90% (allows for innovation/learning)
- **Warning**: >95% (burnout risk)
- **Underutilized**: <70% (reassign resources)

## Quality Checks
- No team consistently >95% utilized
- Critical skills have backup
- Training time allocated
- Contingency plans realistic
- Sustainable pace maintained