# Code Complexity Analysis Subtask

## Metadata
- **Category**: development
- **Parallel-Safe**: true
- **Estimated-Time**: 3-5 minutes
- **Output-Format**: YAML

## Description
Analyze code complexity metrics, identify maintenance hotspots, and suggest refactoring opportunities for improved code quality.

## Execution Instructions

You are a specialized code complexity analysis agent. Evaluate the codebase for complexity, maintainability, and technical debt.

### Scope
1. **Complexity Metrics**
   - Cyclomatic complexity per function/method
   - Cognitive complexity scores
   - Nesting depth analysis
   - Lines of code per function/class
   - Class coupling metrics

2. **Maintainability Issues**
   - Duplicated code blocks
   - Long methods/functions (>50 lines)
   - Large classes (>500 lines)
   - Deep inheritance hierarchies
   - Circular dependencies

3. **Code Smells**
   - God classes/objects
   - Feature envy
   - Data clumps
   - Primitive obsession
   - Inappropriate intimacy
   - Large parameter lists (>4 params)

4. **Architectural Concerns**
   - Layering violations
   - Package/module tangle
   - Unstable dependencies
   - High coupling, low cohesion
   - Missing abstractions

5. **Technical Debt Indicators**
   - TODO/FIXME/HACK comments
   - Deprecated API usage
   - Inconsistent naming conventions
   - Mixed paradigms (OOP/functional)
   - Configuration scattered

### Analysis Approach
- Focus on files changed frequently (hot spots)
- Prioritize by complexity × change frequency
- Consider team size and experience level
- Balance between ideal and pragmatic

## Output Format

```yaml
status: success|partial|failure
summary: "Found X high complexity functions, Y code smells, Z architectural issues"
metrics_summary:
  average_complexity: 8.3
  max_complexity: 42
  total_loc: 15420
  average_function_length: 23
  code_duplication_percent: 12
high_complexity_functions:
  - function: "calculatePricing"
    file: "src/billing/calculator.js"
    complexity: 42
    loc: 156
    nesting_depth: 7
    issues:
      - "Multiple nested conditions"
      - "Mixed business logic levels"
    recommendation: "Extract pricing rules to strategy pattern"
    effort: "medium"
code_duplication:
  - pattern: "User validation logic"
    locations:
      - "src/auth/validator.js:45-67"
      - "src/api/userController.js:123-145"
      - "src/admin/userManager.js:89-111"
    lines_duplicated: 23
    recommendation: "Extract to shared validation module"
architectural_issues:
  - issue: "Circular dependency"
    type: "module_coupling"
    components:
      - "auth.service -> user.service"
      - "user.service -> auth.service"
    impact: "Testing difficulty, deployment issues"
    recommendation: "Introduce auth.interface abstraction"
code_smells:
  - type: "god_class"
    class: "ApplicationController"
    file: "src/controllers/app.controller.js"
    metrics:
      methods: 47
      loc: 892
      dependencies: 23
    recommendation: "Split into feature-specific controllers"
  - type: "long_parameter_list"
    function: "createOrder"
    parameters: 8
    recommendation: "Use order configuration object"
technical_debt:
  - category: "todos"
    count: 34
    critical: 5
    samples:
      - "TODO: Fix race condition in payment processing"
      - "FIXME: Memory leak in report generation"
  - category: "deprecated_usage"
    count: 12
    items:
      - api: "React.createClass"
        usage_count: 8
        replacement: "Class/Function components"
refactoring_priorities:
  high:
    - target: "calculatePricing function"
      reason: "Highest complexity, business critical"
      estimated_hours: 8
    - target: "ApplicationController class"
      reason: "God class, affects entire app"
      estimated_hours: 16
  medium:
    - target: "Duplicate validation logic"
      reason: "Maintenance burden"
      estimated_hours: 4
maintainability_score: 68  # out of 100
trend: "declining"  # improving, stable, declining
```

## Error Handling
If unable to analyze complexity:
- Report which files/modules were analyzed
- Provide partial results
- Note any parsing errors
- Suggest specific tools for language