# PO Sprint Capacity Optimizer Synthesis Pattern

## Purpose
Balance sprint workload across teams, optimize resource utilization, and ensure sustainable pace while maximizing value delivery.

## When to Use
- After story sizing and team capacity analysis
- During sprint planning
- When rebalancing work mid-sprint
- For capacity forecasting

## Input Format
Expects sprint allocations, team capacity data, story assignments, and skill requirements.

## Optimization Algorithm

```python
# Multi-objective optimization for sprint capacity
def optimize_sprint_capacity(sprints, teams, stories, constraints):
    # 1. Calculate base capacity
    capacity = calculate_team_capacity(teams, sprints)
    
    # 2. Apply constraints
    capacity = apply_constraints(capacity, holidays, training)
    
    # 3. Optimize allocation
    allocation = initialize_allocation()
    
    for iteration in range(MAX_ITERATIONS):
        # Evaluate current allocation
        metrics = evaluate_allocation(allocation, capacity)
        
        # Multi-objective optimization
        if metrics.all_constraints_met():
            break
            
        # Adjust allocation
        allocation = adjust_allocation(
            allocation,
            metrics,
            priorities=['value', 'balance', 'risk']
        )
    
    # 4. Generate recommendations
    recommendations = generate_optimization_insights(
        allocation, metrics, capacity
    )
    
    return allocation, recommendations
```

## Optimization Objectives

### 1. **Primary Objectives**
- Maximize business value delivery
- Balance team utilization (80-90%)
- Minimize risk concentration
- Respect dependencies

### 2. **Secondary Objectives**
- Enable parallel work
- Minimize context switching
- Build in learning time
- Maintain sustainable pace

### 3. **Constraints**
- Hard capacity limits
- Skill requirements
- Dependencies
- Deadlines

## Output Template

```yaml
sprint_capacity_optimization:
  optimization_run: "2024-01-20T11:30:00Z"
  optimization_score: 8.7  # out of 10
  
  capacity_summary:
    total_capacity_points: 240  # 6 sprints × 40 points
    allocated_points: 225
    utilization: 93.75%
    risk_buffer: 15
    
  sprint_analysis:
    - sprint: 1
      name: "Foundation Sprint"
      
      team_allocation:
        frontend:
          capacity: 12
          allocated: 11
          utilization: 91.7%
          stories: ["STORY-020", "STORY-021"]
          
        backend_a:
          capacity: 15
          allocated: 13
          utilization: 86.7%
          stories: ["STORY-005", "STORY-001"]
          
        devops:
          capacity: 10
          allocated: 10
          utilization: 100%
          stories: ["STORY-030"]
          risk: "No buffer for issues"
          
      optimization_actions:
        - action: "Moved STORY-032 to Sprint 2"
          reason: "DevOps at capacity"
          impact: "Better balance, reduced risk"
          
        - action: "Added pair programming for STORY-001"
          reason: "Knowledge sharing"
          impact: "+1 point but reduced risk"
          
      sprint_metrics:
        value_score: 85
        balance_score: 82
        risk_score: 75
        overall: 81
        
  workload_balancing:
    before_optimization:
      variance: 35%  # Team utilization variance
      overloaded_teams: ["Backend A", "DevOps"]
      underutilized_teams: ["QA", "Frontend"]
      
    after_optimization:
      variance: 12%
      overloaded_teams: []
      underutilized_teams: []
      
    moves_made:
      - from_sprint: 2
        to_sprint: 3
        story: "STORY-045"
        reason: "Backend overload"
        
      - from_team: "Backend A"
        to_team: "Backend B"
        story: "STORY-023"
        reason: "Skill availability"
        
  skill_optimization:
    skill_gaps_addressed:
      - gap: "TypeScript expertise"
        solution: "Pair Sarah with Jessica"
        stories_affected: ["STORY-021", "STORY-022"]
        learning_time: "4 hours"
        
      - gap: "Kubernetes knowledge"
        solution: "DevOps assists Backend"
        stories_affected: ["STORY-089"]
        collaboration_time: "8 hours"
        
    cross_training_plan:
      sprint_2:
        - trainee: "Jessica"
          trainer: "Sarah"
          skill: "Advanced TypeScript"
          allocated_time: "8 hours"
          
      sprint_3:
        - trainee: "Backend Team"
          trainer: "External"
          skill: "GraphQL"
          allocated_time: "16 hours"
          
  sustainable_pace_analysis:
    team_health_metrics:
      frontend:
        average_utilization: 85%
        peak_utilization: 95%
        status: "HEALTHY"
        
      backend_a:
        average_utilization: 92%
        peak_utilization: 100%
        status: "AT_RISK"
        action: "Added buffer in Sprint 4"
        
    recommendations:
      - "Schedule team retrospective for Backend A"
      - "Plan vacation rotation for Sprint 5"
      - "Consider hiring for Backend team"
      
  parallel_work_optimization:
    parallel_efficiency: 82%
    
    sprint_parallelization:
      sprint_1:
        parallel_tracks: 3
        independent_work: 85%
        blocking_points: ["Database setup completion"]
        
      sprint_2:
        parallel_tracks: 4
        independent_work: 70%
        blocking_points: ["API contract finalization"]
        
  value_delivery_optimization:
    original_value_curve: "Linear"
    optimized_value_curve: "Front-loaded"
    
    value_by_sprint:
      sprint_1: 120  # Business value points
      sprint_2: 110
      sprint_3: 95
      sprint_4: 85
      sprint_5: 80
      sprint_6: 75
      
    early_value_delivery:
      - "MVP features in Sprint 3 vs Sprint 4"
      - "Payment system by Sprint 2"
      - "Core user flows complete by Sprint 2"
      
  risk_distribution:
    original_risk_concentration:
      sprint_2: "HIGH"
      sprint_3: "HIGH"
      sprint_4: "MEDIUM"
      
    optimized_risk_distribution:
      sprint_1: "MEDIUM"
      sprint_2: "MEDIUM"
      sprint_3: "MEDIUM"
      sprint_4: "LOW"
      
    risk_mitigation:
      - "Distributed complex stories across sprints"
      - "Added spikes for unknowns"
      - "Built in integration testing time"
      
  final_recommendations:
    immediate_actions:
      - "Confirm DevOps availability for Sprint 1"
      - "Start TypeScript training immediately"
      - "Lock API contracts by end of Sprint 1"
      
    planning_adjustments:
      - "Consider 2-week sprints vs 3-week"
      - "Add mid-sprint check-ins for at-risk teams"
      - "Plan integration week between Sprint 4-5"
      
    resource_recommendations:
      - "Hire senior backend developer by Sprint 3"
      - "Engage contractor for DevOps surge"
      - "Cross-train QA on frontend testing"
      
  optimization_metrics:
    efficiency_gain: 15%
    risk_reduction: 30%
    value_acceleration: 20%
    team_satisfaction: "+2 points"
```

## Advanced Optimization Strategies

### 1. **Value Stream Mapping**
- Identify value flow through sprints
- Optimize for early delivery
- Remove bottlenecks

### 2. **Resource Leveling**
- Smooth workload peaks
- Prevent team burnout
- Maintain consistent velocity

### 3. **Risk Balancing**
- Distribute complex work
- Avoid risk concentration
- Build in buffers strategically

## Quality Thresholds
- **Utilization**: 80-90% optimal
- **Variance**: <15% between teams
- **Risk**: Distributed evenly
- **Value**: Front-loaded delivery

## Example Usage
Best for: Sprint planning, resource management, capacity planning, portfolio optimization