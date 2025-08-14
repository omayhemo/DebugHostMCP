# Performance Baseline Comparator Synthesis Pattern

## Purpose
Compare performance test results against established baselines, identify regressions, and track performance trends over time.

## When to Use
- Release performance validation
- Continuous performance monitoring
- A/B testing performance impact
- Infrastructure change validation
- Performance regression detection

## Input Format
Expects performance metrics with timestamps, environment details, and test conditions.

## Comparison Algorithm

```python
# Performance Score Calculation
def calculate_performance_delta(current, baseline):
    METRIC_WEIGHTS = {
        'response_time': 0.4,
        'throughput': 0.3,
        'error_rate': 0.2,
        'resource_usage': 0.1
    }
    
    # Regression thresholds
    REGRESSION_THRESHOLDS = {
        'response_time': 1.1,      # 10% slower
        'throughput': 0.9,         # 10% less
        'error_rate': 1.5,         # 50% more errors
        'cpu_usage': 1.2,          # 20% more CPU
        'memory_usage': 1.15       # 15% more memory
    }
    
    # Calculate weighted delta
    performance_delta = 0
    for metric, weight in METRIC_WEIGHTS.items():
        current_value = current.get(metric)
        baseline_value = baseline.get(metric)
        
        if baseline_value > 0:
            ratio = current_value / baseline_value
            regression = ratio > REGRESSION_THRESHOLDS.get(metric, 1.1)
            delta = (ratio - 1.0) * weight
            performance_delta += delta
    
    return {
        'delta': performance_delta,
        'regression': performance_delta > 0.05,
        'improvement': performance_delta < -0.05
    }
```

## Synthesis Rules

1. **Statistical Significance**: Require multiple test runs for confidence
2. **Environment Normalization**: Account for infrastructure differences
3. **Trend Analysis**: Look beyond single comparison
4. **Outlier Detection**: Identify and handle anomalous results
5. **Context Awareness**: Consider code changes and load patterns

## Output Template

```yaml
performance_comparison:
  test_id: "PERF-2024-001"
  current_version: "v2.1.0"
  baseline_version: "v2.0.0"
  overall_verdict: "REGRESSION"
  performance_delta: "+12.5%"
  confidence_level: 0.95

response_time_analysis:
  baseline:
    p50_ms: 45
    p95_ms: 120
    p99_ms: 250
    
  current:
    p50_ms: 52
    p95_ms: 145
    p99_ms: 320
    
  deltas:
    p50_delta: "+15.6%"
    p95_delta: "+20.8%"
    p99_delta: "+28.0%"
    
  regression_severity: "HIGH"
  affected_operations:
    - operation: "GET /api/products"
      baseline_ms: 35
      current_ms: 48
      delta: "+37%"
      
    - operation: "POST /api/orders"
      baseline_ms: 120
      current_ms: 156
      delta: "+30%"

throughput_comparison:
  baseline_rps: 1000
  current_rps: 875
  delta: "-12.5%"
  
  under_load:
    baseline:
      sustained_rps: 2500
      max_rps: 3200
      
    current:
      sustained_rps: 2100
      max_rps: 2800
      
    capacity_reduction: "16%"

error_rate_comparison:
  baseline_error_rate: 0.1%
  current_error_rate: 0.3%
  delta: "+200%"
  
  error_breakdown:
    timeouts:
      baseline: 0.05%
      current: 0.20%
      
    server_errors:
      baseline: 0.05%
      current: 0.10%
      
  new_error_types:
    - type: "Connection pool exhausted"
      rate: 0.05%
      first_seen: "After 10min load"

resource_utilization:
  cpu_usage:
    baseline_avg: 35%
    current_avg: 48%
    delta: "+37%"
    
  memory_usage:
    baseline_avg_gb: 2.1
    current_avg_gb: 2.8
    delta: "+33%"
    growth_rate: "Linear"
    
  database_connections:
    baseline_avg: 25
    current_avg: 45
    delta: "+80%"
    pool_size: 50
    exhaustion_risk: "HIGH"

scalability_comparison:
  horizontal_scaling:
    baseline:
      efficiency_2_nodes: 1.85x
      efficiency_4_nodes: 3.4x
      
    current:
      efficiency_2_nodes: 1.70x
      efficiency_4_nodes: 2.9x
      
    scaling_degradation: "15%"

trend_analysis:
  performance_history:
    - version: "v1.8.0"
      p95_ms: 100
      rps: 1100
      
    - version: "v1.9.0"
      p95_ms: 110
      rps: 1050
      
    - version: "v2.0.0"
      p95_ms: 120
      rps: 1000
      
    - version: "v2.1.0"
      p95_ms: 145
      rps: 875
      
  trend: "Steady degradation"
  degradation_rate: "5% per release"

root_cause_indicators:
  code_changes:
    - area: "Database queries"
      complexity_increase: "+40%"
      likely_impact: "HIGH"
      
    - area: "New middleware"
      overhead_ms: 8
      impact_per_request: "Fixed cost"
      
  infrastructure_changes:
    - change: "None detected"
      impact: "Ruled out"

regression_details:
  critical_regressions:
    - metric: "p99 response time"
      threshold: 300ms
      current: 320ms
      sla_breach: true
      
    - metric: "Error rate"
      threshold: 0.1%
      current: 0.3%
      sla_breach: true
      
  performance_budget_status:
    total_budget_ms: 200
    current_usage_ms: 245
    over_budget: "22.5%"

recommendations:
  immediate_actions:
    - "Profile database queries in products API"
    - "Analyze connection pool sizing"
    - "Review new middleware overhead"
    
  rollback_assessment:
    recommendation: "Consider rollback"
    risk_of_keeping: "HIGH"
    customer_impact: "20% slower experience"
    
  optimization_targets:
    - target: "Product listing query"
      potential_improvement: "25ms"
      effort: "Medium"
      
    - target: "Connection pooling"
      potential_improvement: "15% throughput"
      effort: "Low"

environmental_factors:
  test_conditions_matched: true
  data_volume_similar: true
  load_pattern_consistent: true
  confidence_in_comparison: "HIGH"
```

## Trend Visualization

```
Performance Trend (p95 Response Time):

160ms │     ╱
150ms │    ╱
140ms │   ╱     ← Current (REGRESSION)
130ms │  ╱
120ms │ ╱────── ← Baseline
110ms │╱
100ms └─────────────────────
      v1.8 v1.9 v2.0 v2.1

Throughput Trend:
1100 │╲
1050 │ ╲
1000 │  ╲───── ← Baseline
950  │   ╲
900  │    ╲
875  │     ╲   ← Current
850  └─────────────────────
```

## Decision Matrix

```yaml
action_decision:
  regression_severity: "HIGH"
  sla_impact: "BREACHING"
  customer_impact: "NOTICEABLE"
  
  recommended_action: "ROLLBACK"
  
  if_not_rollback:
    required_fixes:
      - "Database query optimization"
      - "Connection pool tuning"
      - "Middleware optimization"
    estimated_time: "3 days"
    risk_level: "HIGH"
```

## Example Usage
Best for: Release validation, Performance monitoring, Capacity planning, SLA compliance