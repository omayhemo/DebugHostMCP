# Code Quality Analysis Subtask

## Metadata
- **Category**: analysis
- **Complexity**: medium
- **Est. Duration**: 3-5 minutes
- **Dependencies**: none

## Context
Use this subtask to analyze code quality, identify issues, and suggest improvements. Ideal for reviewing modules, components, or entire codebases for maintainability and best practices.

## Input Requirements
- **Required**: Code files or directory path to analyze
- **Optional**: Specific focus areas (e.g., security, performance, maintainability)

## Execution Instructions
Analyze the provided code/component for quality issues:

1. **Structure Analysis**
   - Check module organization and cohesion
   - Evaluate separation of concerns
   - Assess dependency relationships
   - Identify circular dependencies
   - Review file and folder organization

2. **Best Practices Review**
   - Verify naming conventions (variables, functions, classes)
   - Check error handling patterns
   - Evaluate documentation coverage
   - Assess code comments quality
   - Review type safety (if applicable)

3. **Maintainability Assessment**
   - Calculate cyclomatic complexity for key functions
   - Identify code duplication
   - Find refactoring opportunities
   - Assess testability
   - Check for code smells

4. **Security Quick Check**
   - Look for obvious security anti-patterns
   - Check for hard-coded credentials
   - Identify potential injection vulnerabilities
   - Review authentication/authorization patterns

## Output Format
```yaml
status: success
summary: Code quality analysis complete with X critical, Y medium issues found
findings:
  - category: structure
    severity: high
    description: "Circular dependency between modules A and B"
    recommendation: "Extract shared functionality to new module C"
  - category: maintainability
    severity: medium
    description: "Function calculateTotal has cyclomatic complexity of 15"
    recommendation: "Break down into smaller functions: calculateSubtotal, applyDiscounts, addTaxes"
  - category: naming
    severity: low
    description: "Variable 'temp' used in processData function"
    recommendation: "Use descriptive name like 'processedRecords'"
  - category: security
    severity: critical
    description: "SQL query construction using string concatenation"
    recommendation: "Use parameterized queries to prevent SQL injection"
metrics:
  - name: "Total Issues"
    value: 12
    unit: "count"
  - name: "Critical Issues"
    value: 2
    unit: "count"  
  - name: "Code Coverage"
    value: 67
    unit: "percent"
  - name: "Average Complexity"
    value: 8.5
    unit: "cyclomatic"
```

## Error Handling
- If code cannot be accessed: `status: failure`, describe access issue
- If analysis partially completes: `status: partial`, list what was analyzed
- If no issues found: `status: success`, with empty findings array