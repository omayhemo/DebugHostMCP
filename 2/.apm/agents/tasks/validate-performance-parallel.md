# Task: Parallel Performance Validation

## Objective
Execute comprehensive performance constraint validation in parallel across 4 critical domains for 65% faster assessment than sequential analysis.

## Context
Validate performance feasibility against strict constraints: <200MB memory usage, <2s load times, real-time SSE/WebSocket streaming, Chart.js optimization for dashboard with Docker API 1-3s latency.

## Parallel Subtasks (Execute ALL in single response)

### Subtask 1: Memory Usage Analysis
**Prompt**: "Analyze memory usage patterns for React 18 dashboard with Redux Toolkit state management and Chart.js visualizations against <200MB constraint. Focus on: React component memory lifecycle, Redux store memory footprint with RTK Query cache, Chart.js canvas memory usage with multiple charts, browser DevTools memory overhead, and memory leak prevention strategies. Provide memory budget breakdown."

### Subtask 2: Load Time Assessment
**Prompt**: "Evaluate load time feasibility for <2s target with React 18 + Vite + Redux Toolkit dashboard. Analyze: initial bundle loading time, code splitting impact, lazy loading strategies for Chart.js, Redux hydration time, critical rendering path optimization, and perceived vs actual load times. Include specific optimization techniques."

### Subtask 3: Real-time Streaming Performance
**Prompt**: "Assess real-time streaming performance for SSE/WebSocket integration with Docker API. Focus on: browser event handling performance, Redux state update frequency impact, Chart.js real-time data rendering limits, memory usage with continuous data streams, connection stability and reconnection overhead, and data throttling strategies."

### Subtask 4: Chart.js Optimization Analysis
**Prompt**: "Evaluate Chart.js performance optimization for real-time dashboard with memory constraints. Analyze: canvas rendering performance limits, data point optimization strategies, animation and transition impact, multiple chart instances memory usage, responsive design performance, and alternatives like D3.js or custom canvas solutions."

## Synthesis Requirements
After ALL subtasks complete:
1. Create memory usage budget with component-level breakdown
2. Generate load time optimization roadmap with specific techniques
3. Document streaming performance limits and optimization strategies
4. Provide Chart.js configuration recommendations for constraints
5. Identify performance monitoring requirements
6. Generate performance feasibility matrix with risk assessments

## Output Format
```
# Performance Validation Assessment Report

## Executive Summary
- Performance Feasibility: [GREEN/YELLOW/RED]
- Critical Bottleneck: [Primary performance constraint]
- Optimization Priority: [Most impactful improvement area]

## Memory Usage Analysis
- Budget Breakdown: [Component-level memory allocation]
- Risk Areas: [Potential memory issues]
- Mitigation: [Memory optimization strategies]

## Load Time Assessment
- Baseline Projection: [Expected load times]
- Optimization Techniques: [Specific improvements]
- Critical Path: [Load sequence priorities]

## Streaming Performance Analysis
- Throughput Limits: [Data handling capacity]
- UI Responsiveness: [Real-time update capabilities]
- Connection Strategy: [SSE vs WebSocket recommendations]

## Chart.js Optimization Strategy
- Configuration: [Performance-optimized settings]
- Data Management: [Efficient data handling]
- Alternative Assessment: [Other visualization options]

## Performance Monitoring Plan
- Metrics to Track: [Key performance indicators]
- Monitoring Tools: [Recommended tooling]
- Alert Thresholds: [Performance boundaries]

## Final Assessment
[Detailed performance feasibility with constraints and recommendations]
```

## Success Criteria
- All 4 performance domains analyzed in single parallel execution
- Specific memory budget with component-level breakdown
- Load time optimization roadmap with measurable improvements
- Real-time streaming strategy with performance guarantees
- Chart.js optimization plan addressing memory constraints
- Clear performance feasibility determination with monitoring plan