# QA Command: Generate Test Plan

## Command Overview
**Command**: `/generate-test-plan`  
**Purpose**: Generate comprehensive parallel test plan from test suites  
**Output**: Markdown test plan file ready for parallel execution

## Usage
```
/generate-test-plan [options]

Options:
  --suites      Test suites to include (all|unit|integration|e2e)
  --agents      Number of parallel agents (default: 10)
  --output      Output file path (default: tests/parallel-test-plan.md)
  --template    Use custom template
```

## Generation Process

### Phase 1: Test Discovery
1. **Scan Test Directories**: Identify all test files and suites
2. **Analyze Dependencies**: Determine test interdependencies
3. **Estimate Durations**: Based on historical data or defaults
4. **Categorize Tests**: Group by type (unit, integration, e2e, etc.)

### Phase 2: Agent Allocation
1. **Calculate Workload**: Distribute tests across agents
2. **Optimize Parallelism**: Minimize total execution time
3. **Respect Dependencies**: Ensure proper execution order
4. **Balance Resources**: Consider memory/CPU requirements

### Phase 3: Plan Generation
1. **Create Markdown Structure**: Format according to schema
2. **Define Agent Configurations**: Commands, timeouts, environment
3. **Set Execution Parameters**: Parallel limits, global timeout
4. **Add Documentation**: Notes, requirements, optimization hints

## Examples

### Generate plan for all test suites
```
/generate-test-plan --suites=all --agents=10
```

### Generate plan for specific suites
```
/generate-test-plan --suites=unit,integration --agents=5
```

### Custom output location
```
/generate-test-plan --output=tests/custom-plan.md
```

## Template Variables
- `{{TIMESTAMP}}` - Generation timestamp
- `{{AGENT_COUNT}}` - Number of agents
- `{{SUITE_TYPES}}` - Included test suites
- `{{TOTAL_TESTS}}` - Total test count
- `{{ESTIMATED_TIME}}` - Estimated execution time

## Integration with Test Infrastructure

### Supported Test Frameworks
- Jest/Mocha (JavaScript)
- Pytest (Python)
- JUnit (Java)
- RSpec (Ruby)
- Go test
- .NET test

### Test Discovery Patterns
- `**/*.test.js` - JavaScript tests
- `**/*.spec.ts` - TypeScript specs
- `test_*.py` - Python tests
- `*_test.go` - Go tests

## Optimization Strategies

### Parallelization Rules
1. **Independent First**: Tests without dependencies run first
2. **Critical Path**: Identify longest dependency chains
3. **Resource Balancing**: Heavy tests distributed across agents
4. **Failure Isolation**: Flaky tests in separate agents

### Performance Considerations
- Group fast unit tests together
- Isolate slow integration tests
- Separate resource-intensive tests
- Consider test data setup time

## Quality Assurance

The generated test plan includes:
- ✅ Complete test coverage mapping
- ✅ Dependency validation
- ✅ Resource requirement estimates
- ✅ Timeout recommendations
- ✅ Environment configurations