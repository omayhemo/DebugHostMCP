# Load Testing Subtask

## Metadata
- **Category**: qa
- **Parallel-Safe**: true
- **Estimated-Time**: 5-7 minutes
- **Output-Format**: YAML

## Description
Execute load testing scenarios to evaluate application performance under expected and peak loads.

## Execution Instructions

You are a specialized load testing agent. Evaluate the application's performance characteristics under various load conditions.

### Scope
1. **Load Scenarios**
   - Normal load (baseline traffic)
   - Peak load (2-3x normal)
   - Stress conditions (5-10x normal)
   - Spike patterns (sudden bursts)
   - Sustained load over time

2. **Performance Metrics**
   - Response time (p50, p95, p99)
   - Throughput (requests/second)
   - Error rates and types
   - Resource utilization (CPU, memory, network)
   - Connection pool exhaustion

3. **Bottleneck Identification**
   - Database query performance
   - API endpoint latency
   - Static asset serving
   - Third-party service delays
   - Memory leaks under load

4. **Scalability Assessment**
   - Horizontal scaling effectiveness
   - Vertical scaling limits
   - Cache hit ratios
   - Load balancer distribution
   - Auto-scaling triggers

### Testing Approach
- Start with baseline measurements
- Gradually increase load
- Monitor for degradation points
- Identify breaking points
- Test recovery behavior

## Output Format

```yaml
status: success|partial|failure
summary: "System handles 1000 req/s normally, degrades at 2500, fails at 4000"
load_test_results:
  baseline_performance:
    load: "100 users"
    requests_per_second: 1000
    response_times:
      p50_ms: 45
      p95_ms: 120
      p99_ms: 250
    error_rate: 0.01%
    cpu_usage: 35%
    memory_usage: 2.1GB
  
  peak_performance:
    load: "300 users"
    requests_per_second: 2500
    response_times:
      p50_ms: 85
      p95_ms: 350
      p99_ms: 890
    error_rate: 0.5%
    cpu_usage: 78%
    memory_usage: 4.8GB
    
  breaking_point:
    load: "500 users"
    requests_per_second: 4000
    failure_mode: "Connection pool exhausted"
    error_rate: 15%
    recovery_time_seconds: 45

bottlenecks:
  - component: "Database connection pool"
    impact: "Primary limiting factor"
    threshold: "100 connections"
    recommendation: "Increase pool size to 200"
    
  - component: "API gateway"
    impact: "Rate limiting triggered"
    threshold: "3000 req/s"
    recommendation: "Adjust rate limits for internal services"

scalability_analysis:
  horizontal_scaling:
    effectiveness: "Linear up to 3 nodes"
    diminishing_returns_after: 4
    recommendation: "Optimize single-node performance first"
    
  vertical_scaling:
    cpu_bound: false
    memory_bound: true
    recommendation: "Increase memory to 8GB before adding nodes"

critical_endpoints:
  - endpoint: "/api/search"
    baseline_ms: 120
    under_load_ms: 890
    degradation_factor: 7.4
    
  - endpoint: "/api/checkout"
    baseline_ms: 200
    under_load_ms: 1500
    degradation_factor: 7.5
```

## Error Handling
If unable to complete load testing:
- Report partial results up to failure point
- Document failure conditions
- Suggest infrastructure requirements
- Recommend incremental testing approach