# QA Command: Analyze Test Results

## Command Overview
**Command**: `/analyze-test-results`  
**Purpose**: Analyze test execution results and identify patterns  
**Input**: Test plan with execution history  
**Output**: Comprehensive analysis report with recommendations

## Usage
```
/analyze-test-results [options]

Options:
  --plan        Test plan file to analyze (default: tests/parallel-test-plan.md)
  --history     Number of runs to analyze (default: 10)
  --report      Output report format (markdown|json|html)
  --metrics     Include detailed metrics analysis
```

## Analysis Components

### Phase 1: Result Aggregation
1. **Collect Execution History**: Parse all test runs from plan
2. **Aggregate Metrics**: Success rates, durations, failures
3. **Identify Patterns**: Recurring failures, performance trends
4. **Calculate Statistics**: Mean, median, standard deviation

### Phase 2: Pattern Analysis
1. **Flaky Test Detection**
   - Tests with intermittent failures
   - Success rate between 50-95%
   - Environmental dependencies
   
2. **Performance Regression**
   - Tests with increasing duration
   - Resource consumption trends
   - Bottleneck identification
   
3. **Failure Clustering**
   - Related test failures
   - Common root causes
   - Dependency chain failures

### Phase 3: Root Cause Analysis
1. **Failure Classification**
   - Code defects
   - Test infrastructure issues
   - Environmental problems
   - Timing/race conditions
   
2. **Impact Assessment**
   - Critical path failures
   - Cascade failure potential
   - Business impact rating

### Phase 4: Recommendations
1. **Test Optimization**
   - Parallelization improvements
   - Timeout adjustments
   - Resource allocation
   
2. **Quality Improvements**
   - Test stability fixes
   - Infrastructure upgrades
   - Monitoring enhancements

## Analysis Report Sections

### Executive Summary
```markdown
## Test Analysis Report
Generated: {{TIMESTAMP}}
Period: {{START_DATE}} to {{END_DATE}}
Total Runs: {{RUN_COUNT}}

### Key Metrics
- Overall Success Rate: {{SUCCESS_RATE}}%
- Average Execution Time: {{AVG_TIME}}
- Flaky Tests: {{FLAKY_COUNT}}
- Performance Regressions: {{REGRESSION_COUNT}}
```

### Detailed Findings
```markdown
### 1. Test Stability
- Most Stable: {{STABLE_TESTS}}
- Least Stable: {{UNSTABLE_TESTS}}
- Recommended Actions: {{STABILITY_ACTIONS}}

### 2. Performance Analysis
- Fastest Tests: {{FAST_TESTS}}
- Slowest Tests: {{SLOW_TESTS}}
- Optimization Opportunities: {{PERF_OPPORTUNITIES}}

### 3. Failure Analysis
- Common Failures: {{COMMON_FAILURES}}
- Root Causes: {{ROOT_CAUSES}}
- Remediation Steps: {{REMEDIATION}}
```

## Examples

### Basic analysis
```
/analyze-test-results
```

### Analyze specific plan with detailed metrics
```
/analyze-test-results --plan=tests/integration-plan.md --metrics
```

### Generate HTML report for last 20 runs
```
/analyze-test-results --history=20 --report=html
```

## Metrics Calculated

### Reliability Metrics
- **Success Rate**: Pass/(Pass+Fail) * 100
- **Flakiness Score**: Variance in results
- **MTBF**: Mean time between failures
- **Failure Rate**: Failures per time period

### Performance Metrics
- **Execution Time**: Min/Max/Average/P95
- **Throughput**: Tests per minute
- **Resource Usage**: CPU/Memory/IO
- **Parallelization Efficiency**: Actual vs theoretical speedup

### Quality Metrics
- **Coverage Impact**: Tests affecting coverage
- **Defect Detection**: Bugs found per test
- **Test Effectiveness**: Defects found/test effort
- **Maintenance Cost**: Time spent fixing tests

## Visualization Options

### Charts Generated
1. **Success Rate Trend**: Line chart over time
2. **Duration Distribution**: Histogram of test times
3. **Failure Heatmap**: Time vs test failure matrix
4. **Dependency Graph**: Test relationship visualization

## Actionable Insights

### Optimization Recommendations
- Split large test suites
- Increase parallelization
- Add retry mechanisms
- Optimize test data setup

### Quality Recommendations
- Fix flaky tests first
- Add missing test coverage
- Improve error messages
- Enhance test isolation