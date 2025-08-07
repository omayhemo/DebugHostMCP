# Sprint Allocation Subtask

## Purpose
Allocate stories to sprints based on priorities, dependencies, capacity, and team availability.

## Input
- Prioritized story list with sizes
- Dependency graph
- Team velocity and capacity
- Sprint length and count
- Holiday/vacation schedule
- Risk assessments

## Processing Steps
1. Calculate available capacity per sprint
2. Apply dependency constraints
3. Allocate by priority within capacity
4. Balance workload across teams
5. Factor in risk buffers
6. Optimize for value delivery

## Output Format
```yaml
sprint_allocation:
  planning_horizon: "Q1 2024"
  total_sprints: 6
  sprint_length: 14  # days
  
  capacity_planning:
    base_velocity: 40
    team_size: 5
    
    capacity_adjustments:
      sprint_1:
        holidays: 2  # days
        capacity_reduction: 10%
        adjusted_velocity: 36
        
      sprint_3:
        team_changes: "New developer onboarding"
        capacity_reduction: 15%
        adjusted_velocity: 34
        
  sprint_details:
    - sprint_number: 1
      name: "Foundation Sprint"
      start_date: "2024-01-15"
      end_date: "2024-01-28"
      
      goals:
        - "Establish core infrastructure"
        - "Complete authentication foundation"
        - "Setup development environment"
        
      allocated_stories:
        - story_id: "STORY-005"
          title: "Database schema setup"
          points: 3
          team: "Backend"
          priority: "P0"
          dependencies: []
          
        - story_id: "STORY-030"
          title: "CI/CD pipeline"
          points: 8
          team: "DevOps"
          priority: "P0"
          dependencies: []
          
        - story_id: "STORY-020"
          title: "Component library setup"
          points: 5
          team: "Frontend"
          priority: "P1"
          dependencies: []
          
        - story_id: "STORY-001"
          title: "User registration API"
          points: 5
          team: "Backend"
          priority: "P0"
          dependencies: ["STORY-005"]
          
      sprint_metrics:
        total_points: 36
        capacity_utilization: "100%"
        p0_stories: 3
        p1_stories: 1
        risk_buffer: 0
        
      parallel_tracks:
        - track: "Infrastructure"
          stories: ["STORY-030", "STORY-031"]
          team: "DevOps"
          
        - track: "Backend Core"
          stories: ["STORY-005", "STORY-001"]
          team: "Backend A"
          
        - track: "Frontend Foundation"
          stories: ["STORY-020"]
          team: "Frontend"
          
    - sprint_number: 2
      name: "Core Features Sprint"
      start_date: "2024-01-29"
      end_date: "2024-02-11"
      
      goals:
        - "Complete authentication flow"
        - "Launch basic UI"
        - "Enable user workflows"
        
      allocated_stories:
        - story_id: "STORY-002"
          title: "Login endpoint"
          points: 3
          team: "Backend"
          priority: "P0"
          dependencies: ["STORY-001"]
          
      sprint_metrics:
        total_points: 38
        capacity_utilization: "95%"
        risk_buffer: 2
        
  allocation_summary:
    total_stories_allocated: 67
    total_points_allocated: 225
    stories_deferred: 12
    
    allocation_by_priority:
      P0: 
        allocated: 25
        deferred: 0
        
      P1:
        allocated: 30
        deferred: 2
        
      P2:
        allocated: 12
        deferred: 10
        
  velocity_tracking:
    historical_velocity: 38
    planned_velocity: 40
    
    sprint_velocities:
      sprint_1: 36
      sprint_2: 38
      sprint_3: 34
      sprint_4: 40
      sprint_5: 40
      sprint_6: 37
      
  risk_management:
    total_risk_buffer: 15  # points
    
    risk_allocation:
      sprint_1: 0   # High confidence
      sprint_2: 2   # Integration risks
      sprint_3: 5   # New team member
      sprint_4: 3   # Complex features
      sprint_5: 3   # External dependencies
      sprint_6: 2   # Normal buffer
      
  optimization_insights:
    critical_path_sprints: [1, 2, 4]
    
    recommendations:
      - "Consider splitting STORY-045 to fit in Sprint 3"
      - "Frontend team underutilized in Sprint 4"
      - "High risk concentration in Sprint 3"
      - "Consider moving P2 stories to next quarter"
      
  milestone_alignment:
    - milestone: "MVP Launch"
      target_sprint: 4
      status: "ON_TRACK"
      required_stories: ["STORY-001", "STORY-002", "STORY-015"]
      
    - milestone: "Beta Release"
      target_sprint: 6
      status: "AT_RISK"
      risk: "Integration dependencies"
```

## Allocation Strategies
1. **Priority-First**: P0 before P1 before P2
2. **Dependency-Aware**: Respects blocking dependencies
3. **Risk-Balanced**: Distributes risky items
4. **Team-Balanced**: Even distribution across teams
5. **Value-Optimized**: Maximize value per sprint

## Sprint Goals Framework
- 3-5 clear, measurable goals per sprint
- Aligned with milestones
- Team-wide understanding
- Success criteria defined

## Quality Checks
- No over-allocation
- Dependencies satisfied
- Risk buffers included
- Team balance maintained
- Milestones achievable