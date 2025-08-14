# Test Coverage Aggregator Synthesis Pattern

## Purpose
Aggregate test coverage data from multiple sources (unit, integration, e2e, manual) into a comprehensive quality view.

## When to Use
- Multi-layer testing assessment
- Cross-browser test results
- Platform coverage analysis
- Test suite effectiveness evaluation
- Quality gate decisions

## Input Format
Expects test results with coverage metrics, pass/fail data, and test categorization.

## Aggregation Algorithm

```python
# Coverage Calculation
def calculate_weighted_coverage(test_results):
    # Test type weights (importance for overall quality)
    TEST_WEIGHTS = {
        'unit': 0.3,
        'integration': 0.3,
        'e2e': 0.25,
        'manual': 0.15
    }
    
    # Coverage dimensions
    COVERAGE_TYPES = {
        'line': 0.4,
        'branch': 0.3,
        'function': 0.2,
        'path': 0.1
    }
    
    # Platform weights
    PLATFORM_WEIGHTS = {
        'desktop': 0.5,
        'mobile': 0.3,
        'tablet': 0.2
    }
    
    weighted_score = sum(
        coverage * weight 
        for coverage, weight in calculated_weights
    )
    
    return weighted_score

# Risk calculation based on uncovered areas
def calculate_risk_score(uncovered_areas):
    CRITICALITY_MULTIPLIERS = {
        'authentication': 3.0,
        'payment': 3.0,
        'data_processing': 2.5,
        'user_interface': 1.5,
        'reporting': 1.0
    }
    
    return sum(
        area.uncovered_percent * CRITICALITY_MULTIPLIERS.get(area.type, 1.0)
        for area in uncovered_areas
    )
```

## Synthesis Rules

1. **Multi-Dimensional Coverage**: Combine line, branch, function, and path coverage
2. **Test Type Weighting**: Weight by test pyramid recommendations
3. **Critical Path Priority**: Emphasize coverage of critical user journeys
4. **Platform Aggregation**: Ensure cross-platform consistency
5. **Gap Identification**: Highlight untested areas by criticality

## Output Template

```yaml
coverage_summary:
  overall_score: 76.5  # Weighted aggregate
  confidence_level: "HIGH"
  test_effectiveness: "GOOD"
  quality_gate_status: "PASS"
  
coverage_by_type:
  unit_tests:
    line_coverage: 82%
    branch_coverage: 75%
    function_coverage: 88%
    tests_count: 1245
    weight_applied: 0.3
    
  integration_tests:
    api_coverage: 91%
    database_coverage: 85%
    service_coverage: 78%
    tests_count: 234
    weight_applied: 0.3
    
  e2e_tests:
    journey_coverage: 73%
    browser_coverage: 80%
    platform_coverage: 65%
    tests_count: 45
    weight_applied: 0.25
    
  manual_tests:
    exploratory_coverage: "estimated 60%"
    usability_coverage: "good"
    tests_documented: 89
    weight_applied: 0.15

coverage_by_component:
  authentication:
    overall: 94%
    unit: 96%
    integration: 92%
    e2e: 90%
    risk_level: "LOW"
    
  payment_processing:
    overall: 71%
    unit: 85%
    integration: 70%
    e2e: 45%
    risk_level: "HIGH"
    missing_scenarios: ["refund flow", "partial payment"]
    
  user_interface:
    overall: 68%
    unit: 78%
    integration: "n/a"
    e2e: 58%
    visual_regression: 72%
    risk_level: "MEDIUM"

critical_gaps:
  - component: "Payment refund flow"
    coverage: 0%
    criticality: "CRITICAL"
    test_types_missing: ["unit", "integration", "e2e"]
    recommendation: "Immediate test implementation required"
    
  - component: "Error recovery paths"
    coverage: 35%
    criticality: "HIGH"
    test_types_missing: ["e2e", "manual"]
    recommendation: "Add error scenario testing"

platform_coverage:
  desktop:
    chrome: 95%
    firefox: 92%
    safari: 88%
    edge: 90%
    
  mobile:
    ios_safari: 75%
    android_chrome: 78%
    responsive_web: 82%
    
  aggregate_platform_score: 85%

test_quality_metrics:
  assertion_density: 3.2  # assertions per test
  test_duplication: 12%
  flaky_test_rate: 3%
  average_test_runtime: 145ms
  slow_tests: 23
  
  quality_issues:
    - "15 tests with no assertions"
    - "45 tests testing implementation details"
    - "8 tests dependent on external services"

coverage_trends:
  current_sprint: 76.5%
  last_sprint: 72.3%
  trend: "IMPROVING"
  velocity: "+4.2%"
  
  projection:
    next_sprint: 78.5%
    target: 80%
    sprints_to_target: 1

recommendations:
  immediate_actions:
    - "Add tests for payment refund flow"
    - "Increase e2e coverage for critical paths"
    - "Fix 15 tests without assertions"
    
  short_term:
    - "Improve mobile platform coverage"
    - "Add visual regression tests"
    - "Reduce test duplication"
    
  long_term:
    - "Implement mutation testing"
    - "Add contract testing"
    - "Automate manual test scenarios"

test_pyramid_analysis:
  current_distribution:
    unit: 70%
    integration: 20%
    e2e: 10%
    
  ideal_distribution:
    unit: 70%
    integration: 20%
    e2e: 10%
    
  alignment: "GOOD"
  
risk_assessment:
  untested_critical_paths: 3
  high_risk_components: 2
  overall_risk: "MEDIUM"
  mitigation_effort_days: 5
```

## Visualization Support

```
Coverage Heatmap:
Component        Unit  Int   E2E   Overall  Risk
─────────────────────────────────────────────────
Authentication   ████  ████  ████  ████     LOW
User Profile     ████  ███   ███   ███      LOW  
Product Catalog  ████  ████  ██    ███      MED
Shopping Cart    ███   ███   ██    ███      MED
Payment          ███   ██    █     ██       HIGH
Order History    ████  ███   ███   ███      LOW

Legend: ████ >80%  ███ 60-80%  ██ 40-60%  █ <40%
```

## Quality Gate Criteria

```yaml
quality_gates:
  mandatory:
    overall_coverage: ">= 70%"
    critical_path_coverage: ">= 90%"
    no_untested_critical_components: true
    
  recommended:
    branch_coverage: ">= 65%"
    new_code_coverage: ">= 80%"
    test_quality_score: ">= 7.0"
```

## Example Usage
Best for: QA comprehensive testing, Release readiness assessment, Sprint quality reviews