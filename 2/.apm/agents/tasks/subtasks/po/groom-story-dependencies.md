# Story Dependencies Mapping Subtask

## Purpose
Map inter-story dependencies to enable optimal sequencing and parallel work identification.

## Input
- Complete story list
- Technical architecture
- Integration requirements
- Data flow diagrams
- Team structure

## Processing Steps
1. Identify technical dependencies
2. Map data dependencies
3. Analyze resource dependencies
4. Classify dependency types
5. Detect circular dependencies
6. Optimize execution order

## Output Format
```yaml
dependency_mapping:
  total_stories: 45
  total_dependencies: 67
  circular_dependencies: 0
  
  dependency_types:
    blocking: 23      # Must complete before starting
    soft: 20          # Preferred but not required
    resource: 15      # Same team/person needed
    data: 9           # Requires data/schema from other story
    
  story_dependencies:
    - story_id: "STORY-001"
      title: "User registration API"
      
      depends_on:
        - dependency_id: "DEP-001"
          target_story: "STORY-005"
          target_title: "Database schema setup"
          type: "blocking"
          reason: "Requires user table"
          
        - dependency_id: "DEP-002"
          target_story: "STORY-008"
          target_title: "Email service integration"
          type: "soft"
          reason: "Better UX with email confirmation"
          
      blocks:
        - "STORY-002: Login endpoint"
        - "STORY-003: Profile management"
        - "STORY-004: Password reset"
        
      can_parallel_with:
        - "STORY-010: Product catalog API"
        - "STORY-011: Search service"
        
  critical_path:
    total_duration: "8 sprints"
    path:
      - story: "STORY-005"
        duration: 3
        sprint: 1
        
      - story: "STORY-001"
        duration: 5
        sprint: 1
        
      - story: "STORY-002"
        duration: 3
        sprint: 2
        
      - story: "STORY-015"
        duration: 8
        sprint: 2-3
        
  parallel_tracks:
    - track_id: "frontend"
      independent: true
      stories:
        - "STORY-020: Component library"
        - "STORY-021: Landing page"
        - "STORY-022: Dashboard layout"
      can_start: "immediately"
      
    - track_id: "infrastructure"
      independent: true
      stories:
        - "STORY-030: CI/CD pipeline"
        - "STORY-031: Monitoring setup"
        - "STORY-032: Log aggregation"
      can_start: "immediately"
      
    - track_id: "backend_core"
      independent: false
      stories:
        - "STORY-001: User registration"
        - "STORY-002: Authentication"
        - "STORY-003: Authorization"
      can_start: "after STORY-005"
      
  dependency_risks:
    - risk: "Email service delay"
      impact: ["STORY-001", "STORY-004"]
      mitigation: "Implement without email first"
      
    - risk: "Database migration complexity"
      impact: ["STORY-005", "All data stories"]
      mitigation: "Incremental migration approach"
      
  optimization_opportunities:
    - "Frontend track can progress independently"
    - "Infrastructure can be parallelized"
    - "Consider mocking email service initially"
    - "Database schema could be incremental"
    
  visual_graph: |
    graph TD
      STORY-005[DB Schema] --> STORY-001[User Registration]
      STORY-001 --> STORY-002[Login]
      STORY-001 --> STORY-003[Profile]
      STORY-001 --> STORY-004[Password Reset]
      STORY-008[Email Service] -.-> STORY-001
      STORY-008 -.-> STORY-004
      
      STORY-020[Component Library] --> STORY-021[Landing Page]
      STORY-020 --> STORY-022[Dashboard]
      
      STORY-030[CI/CD] -.-> STORY-031[Monitoring]
      STORY-030 -.-> STORY-032[Logging]
```

## Dependency Classification
- **Blocking**: Cannot start until dependency completes
- **Soft**: Can start but better to wait
- **Resource**: Same developer/team needed
- **Data**: Requires data model from dependency
- **External**: Third-party or external team

## Quality Checks
- No circular dependencies
- Critical path identified
- Parallel opportunities maximized
- Risk mitigation defined
- Visual representation accurate