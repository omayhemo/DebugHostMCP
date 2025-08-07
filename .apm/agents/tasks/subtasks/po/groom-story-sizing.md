# Story Sizing Subtask

## Purpose
Estimate story points for all generated stories using complexity analysis and historical data.

## Input
- Story details with acceptance criteria
- Technical requirements
- Historical velocity data
- Team skill matrix
- Similar story estimates

## Processing Steps
1. Analyze story complexity factors
2. Compare with historical stories
3. Apply sizing framework (Fibonacci)
4. Consider team expertise
5. Factor in dependencies
6. Validate with capacity

## Output Format
```yaml
story_sizing:
  sizing_method: "Modified Fibonacci"
  base_velocity: 40
  confidence_level: "HIGH"
  
  sized_stories:
    - story_id: "STORY-001"
      title: "Implement JWT authentication"
      
      complexity_factors:
        technical_complexity: "MEDIUM"
        integration_points: 2
        testing_effort: "HIGH"
        unknowns: 1
        
      similar_stories:
        - id: "HIST-045"
          title: "OAuth implementation"
          actual_points: 5
          similarity: 0.85
          
      size_breakdown:
        development: 3
        testing: 1.5
        integration: 0.5
        documentation: 0.5
        
      estimated_points: 5
      confidence: "HIGH"
      rationale: "Standard auth pattern with known libraries"
      
    - story_id: "STORY-002"
      title: "Migrate database to PostgreSQL"
      
      complexity_factors:
        technical_complexity: "HIGH"
        integration_points: 5
        testing_effort: "VERY_HIGH"
        unknowns: 3
        
      size_breakdown:
        development: 5
        testing: 3
        integration: 2
        documentation: 1
        deployment: 2
        
      estimated_points: 13
      confidence: "MEDIUM"
      rationale: "Complex migration with data transformation"
      risk_factors:
        - "Downtime requirements"
        - "Data integrity"
        - "Rollback complexity"
  
  velocity_analysis:
    team_velocity: 40
    total_points: 285
    estimated_sprints: 8
    
    velocity_factors:
      team_size: 5
      average_skill_level: "SENIOR"
      domain_familiarity: 0.8
      technical_debt_impact: 0.9
      
  sprint_capacity:
    sprint_1:
      capacity: 40
      allocated: 38
      stories: ["STORY-001", "STORY-003", "STORY-007"]
      
    sprint_2:
      capacity: 40
      allocated: 39
      stories: ["STORY-002", "STORY-004"]
      
  sizing_distribution:
    1_point: 5
    2_points: 12
    3_points: 18
    5_points: 15
    8_points: 8
    13_points: 3
    
  recommendations:
    - "Split STORY-045 (21 points) into smaller stories"
    - "Pair programming for STORY-002 (high complexity)"
    - "Spike needed for STORY-033 (many unknowns)"
```

## Sizing Framework
```
1 point:  Trivial change, <2 hours
2 points: Simple feature, well understood
3 points: Standard feature, some complexity
5 points: Complex feature, multiple components
8 points: Very complex, significant unknowns
13 points: Should be split into smaller stories
21 points: Epic, must be decomposed
```

## Complexity Factors
- Technical complexity
- Integration touchpoints
- Testing requirements
- Performance considerations
- Security implications
- Unknown/research needed
- Dependencies

## Quality Checks
- No story > 13 points
- Sizing rationale documented
- Risk factors identified
- Team capacity not exceeded
- Historical data considered