# PO Story Dependency Resolver Synthesis Pattern

## Purpose
Optimize story sequencing by resolving dependencies, identifying parallel opportunities, and creating an executable development order.

## When to Use
- After story breakdown and dependency mapping
- Before sprint allocation
- When optimizing for parallel development
- During release planning

## Input Format
Expects story definitions with dependencies, technical requirements, and team assignments.

## Resolution Algorithm

```python
# Dependency resolution using topological sort with parallelization
def resolve_story_dependencies(stories, dependencies):
    # 1. Build dependency graph
    graph = build_dependency_graph(stories, dependencies)
    
    # 2. Detect circular dependencies
    cycles = detect_cycles(graph)
    if cycles:
        resolve_cycles(cycles)
    
    # 3. Calculate levels (parallel groups)
    levels = []
    remaining = set(stories)
    
    while remaining:
        # Find stories with no pending dependencies
        available = find_available_stories(remaining, graph)
        if not available:
            handle_deadlock(remaining)
        
        levels.append(available)
        remaining -= available
        update_graph(graph, available)
    
    # 4. Optimize within levels
    for level in levels:
        optimize_level_assignment(level, teams)
    
    return levels, optimization_report
```

## Resolution Strategies

### 1. **Dependency Types Priority**
```yaml
dependency_priorities:
  blocking: 1.0      # Must complete first
  data: 0.8         # Schema/model dependencies
  integration: 0.6  # API contracts
  soft: 0.3        # Preferred order
  optional: 0.1    # Nice to have
```

### 2. **Cycle Resolution**
- Identify minimal breaking point
- Convert to soft dependency
- Introduce interface/mock
- Split story if necessary

### 3. **Parallelization Rules**
- Group independent stories
- Balance team workload
- Minimize context switching
- Respect skill requirements

## Output Template

```yaml
dependency_resolution_report:
  resolution_timestamp: "2024-01-20T11:00:00Z"
  total_stories: 67
  dependency_count: 89
  cycles_detected: 2
  
  execution_levels:
    - level: 0
      name: "Foundation"
      parallel_tracks: 3
      
      stories:
        - track: "infrastructure"
          team: "DevOps"
          stories:
            - id: "STORY-030"
              title: "CI/CD pipeline"
              points: 8
              
        - track: "database"
          team: "Backend A"
          stories:
            - id: "STORY-005"
              title: "Database schema"
              points: 3
              
        - track: "frontend"
          team: "Frontend"
          stories:
            - id: "STORY-020"
              title: "Component library"
              points: 5
              
      can_start: "Immediately"
      duration: "5-8 days"
      
    - level: 1
      name: "Core Services"
      parallel_tracks: 2
      depends_on_level: 0
      
      stories:
        - track: "authentication"
          team: "Backend A"
          stories:
            - id: "STORY-001"
              title: "User registration"
              points: 5
              depends_on: ["STORY-005"]
              
            - id: "STORY-002"
              title: "Login endpoint"
              points: 3
              depends_on: ["STORY-001"]
              
  dependency_analysis:
    critical_path:
      length: "8 sprints"
      stories: ["STORY-005", "STORY-001", "STORY-002", "STORY-015", "STORY-045"]
      bottlenecks:
        - story: "STORY-015"
          reason: "Multiple dependencies converge"
          mitigation: "Start preparation in parallel"
          
    dependency_chains:
      longest_chain: 6
      average_chain: 2.3
      
      chains:
        - name: "Authentication flow"
          length: 4
          stories: ["STORY-005", "STORY-001", "STORY-002", "STORY-004"]
          
  cycle_resolutions:
    - cycle: ["STORY-023", "STORY-024", "STORY-025"]
      resolution: "Convert STORY-024→STORY-025 to soft dependency"
      technique: "Interface abstraction"
      impact: "Minimal - add interface definition task"
      
  optimization_results:
    original_duration: "12 sprints sequential"
    optimized_duration: "6 sprints parallel"
    time_saved: "50%"
    
    parallelization_metrics:
      max_parallel_tracks: 4
      average_parallel_tracks: 2.8
      resource_utilization: 87%
      
  team_allocation:
    balanced_workload:
      frontend: 
        sprints: [1,2,3,4,5,6]
        utilization: "85%"
        
      backend_a:
        sprints: [1,2,3,4,5,6]
        utilization: "90%"
        
      backend_b:
        sprints: [2,3,4,5]
        utilization: "80%"
        
  risk_mitigation:
    identified_risks:
      - risk: "Database migration blocks multiple tracks"
        mitigation: "Create development database early"
        owner: "Backend Lead"
        
      - risk: "API contract changes"
        mitigation: "Lock contracts by Sprint 2"
        owner: "Tech Lead"
        
  executable_plan:
    sprint_1:
      start_immediately:
        - "STORY-030 (CI/CD)"
        - "STORY-005 (Database)"
        - "STORY-020 (Components)"
        
      preparation:
        - "Review API contracts"
        - "Finalize authentication design"
        
    sprint_2:
      start_stories:
        - "STORY-001 (Registration)"
        - "STORY-021 (Landing page)"
        - "STORY-031 (Monitoring)"
        
      complete_stories:
        - "STORY-030"
        - "STORY-005"
        
  recommendations:
    immediate_actions:
      - "Start all Level 0 stories in parallel"
      - "Assign interface definition tasks"
      - "Lock API contracts early"
      
    optimization_opportunities:
      - "Frontend can use mocks for 70% of work"
      - "Split STORY-045 to reduce critical path"
      - "Consider feature flags for gradual rollout"
      
    watch_points:
      - "STORY-015 convergence point"
      - "Backend team capacity in Sprint 3"
      - "Integration testing in Sprint 5"
```

## Advanced Features

### Soft Dependency Handling
```yaml
soft_dependency_strategies:
  mocking:
    when: "API not ready"
    how: "Create mock service"
    effort: "+2 story points"
    
  interface_first:
    when: "Circular dependency"
    how: "Define interface, implement later"
    effort: "+1 story point"
    
  feature_flag:
    when: "Optional enhancement"
    how: "Deploy behind flag"
    effort: "+0.5 story points"
```

### Resource Conflict Resolution
- Identify overallocated resources
- Suggest story reordering
- Recommend cross-training
- Propose team rebalancing

## Quality Metrics
- **Cycle-free**: No circular dependencies
- **Balance**: Team utilization 80-90%
- **Parallelization**: >2 average tracks
- **Critical Path**: Minimized length

## Example Usage
Best for: Sprint planning, release optimization, dependency management, resource planning