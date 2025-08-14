# Performance Analysis Subtask

## Metadata
- **Category**: analysis
- **Complexity**: medium
- **Est. Duration**: 4-6 minutes
- **Dependencies**: none

## Context
Use this subtask to identify performance bottlenecks, inefficient algorithms, and resource usage issues in code.

## Input Requirements
- **Required**: Code files or module to analyze
- **Optional**: Performance requirements or SLAs

## Execution Instructions
Analyze code for performance issues:

1. **Algorithm Efficiency**
   - Check time complexity of key algorithms
   - Identify O(n²) or worse operations
   - Look for unnecessary nested loops
   - Review recursive functions for optimization

2. **Database Performance**
   - Identify N+1 query problems
   - Check for missing indexes
   - Review query optimization
   - Assess connection pooling

3. **Memory Usage**
   - Look for memory leaks
   - Check large object creation
   - Review caching strategies
   - Identify unnecessary object retention

4. **I/O Operations**
   - Check for synchronous I/O in async contexts
   - Review file handling efficiency
   - Assess network request patterns
   - Look for blocking operations

## Output Format
```yaml
status: success
summary: Performance analysis found X critical bottlenecks
findings:
  - category: algorithm
    severity: high
    description: "Nested loops in getUserPermissions() resulting in O(n³) complexity"
    recommendation: "Use hash maps to reduce to O(n) complexity"
  - category: database
    severity: critical
    description: "N+1 query problem in product listing API"
    recommendation: "Use eager loading or JOIN queries"
  - category: memory
    severity: medium
    description: "Large dataset loaded entirely into memory"
    recommendation: "Implement streaming or pagination"
metrics:
  - name: "Estimated Response Time"
    value: 2500
    unit: "ms (worst case)"
  - name: "Memory Usage"
    value: 512
    unit: "MB (peak)"
```

## Error Handling
- If unable to determine complexity: Provide estimated ranges
- Note any assumptions about data sizes
- Flag areas needing runtime profiling