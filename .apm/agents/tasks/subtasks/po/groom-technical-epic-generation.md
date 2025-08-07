# Technical Epic Generation Subtask

## Purpose
Create technical epics from infrastructure needs, technical debt, and architectural improvements.

## Input
- Technical debt analysis results
- Architecture recommendations
- Performance requirements
- Scalability needs
- Security findings

## Processing Steps
1. Group technical improvements by system area
2. Define technical objectives
3. Establish measurable improvements
4. Prioritize by risk and impact
5. Estimate technical complexity
6. Identify prerequisite work

## Output Format
```yaml
technical_epics:
  - id: "EPIC-T001"
    title: "Database Performance Optimization"
    category: "Infrastructure"
    technical_objective: "Improve query performance and scalability"
    priority: "P1"
    
    description: |
      Optimize database performance through indexing strategy,
      query optimization, and potential sharding implementation
      to support 10x user growth.
    
    technical_scope:
      - "Index optimization for slow queries"
      - "Query performance profiling"
      - "Connection pooling implementation"
      - "Read replica setup"
      - "Caching layer integration"
    
    current_state:
      - "Average query time: 500ms"
      - "Peak connections: 980/1000"
      - "No caching strategy"
      - "Single database instance"
    
    target_state:
      - "Average query time: <100ms"
      - "Connection pooling with 5000 capacity"
      - "Redis caching for hot data"
      - "Read replicas for analytics"
    
    measurable_outcomes:
      - metric: "P95 query latency"
        current: "800ms"
        target: "<150ms"
        
      - metric: "Database CPU utilization"
        current: "85%"
        target: "<60%"
        
      - metric: "Concurrent connections"
        current: "1000 max"
        target: "5000+"
    
    implementation_phases:
      phase_1:
        name: "Quick wins"
        tasks:
          - "Add missing indexes"
          - "Optimize slow queries"
        duration: "1 sprint"
        
      phase_2:
        name: "Caching layer"
        tasks:
          - "Implement Redis"
          - "Cache warming strategy"
        duration: "2 sprints"
        
      phase_3:
        name: "Scale out"
        tasks:
          - "Read replica setup"
          - "Connection pooling"
        duration: "2 sprints"
    
    technical_risks:
      - "Downtime during migration"
      - "Cache invalidation complexity"
      - "Replication lag issues"
    
    dependencies:
      - "Load testing environment"
      - "Monitoring infrastructure"
      - "DevOps resources"
    
    estimated_effort: "XL"
    roi_justification: |
      Prevents performance degradation with user growth.
      Reduces infrastructure costs by 40%.
      Improves user experience significantly.
```

## Technical Epic Categories
- Infrastructure & DevOps
- Performance Optimization
- Security Hardening
- Technical Debt Reduction
- Platform Modernization
- Monitoring & Observability
- Disaster Recovery

## Quality Checks
- Clear before/after metrics
- Phased implementation plan
- Risk mitigation strategies
- ROI clearly articulated
- Dependencies identified