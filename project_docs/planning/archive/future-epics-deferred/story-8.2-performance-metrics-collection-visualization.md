# Story 8.2: Performance Metrics Collection & Visualization

**Story ID**: 8.2  
**Epic**: Advanced Monitoring, Metrics & Performance Optimization (Epic 7)  
**Sprint**: 8  
**Story Points**: 8  
**Priority**: High  
**Created**: August 8, 2025  

## User Story

**As a** platform administrator and development team member  
**I want** detailed performance metrics collection with rich visualization dashboards  
**So that** I can understand system performance patterns, identify bottlenecks, and make data-driven optimization decisions  

## Business Value

- **Performance Optimization**: Data-driven insights enable targeted performance improvements
- **Capacity Planning**: Historical metrics support informed infrastructure scaling decisions
- **Cost Management**: Resource utilization insights help optimize infrastructure costs
- **Developer Productivity**: Performance visibility helps teams optimize applications

## Acceptance Criteria

### Comprehensive Metrics Collection
1. **GIVEN** applications and services are running  
   **WHEN** performance metrics are collected  
   **THEN** response times, throughput, error rates, and resource usage are tracked  

2. **GIVEN** database operations occur  
   **WHEN** monitoring database performance  
   **THEN** query execution times, connection counts, and slow queries are recorded  

3. **GIVEN** API endpoints are accessed  
   **WHEN** tracking API performance  
   **THEN** request duration, status codes, and payload sizes are measured  

### Rich Visualization Dashboards
4. **GIVEN** performance metrics are collected  
   **WHEN** users access dashboards  
   **THEN** real-time and historical data is displayed in intuitive charts and graphs  

5. **GIVEN** system components have different metrics  
   **WHEN** viewing dashboards  
   **THEN** metrics are organized by service, user, team, and time period  

6. **GIVEN** performance issues occur  
   **WHEN** analyzing dashboards  
   **THEN** anomalies and trends are highlighted with contextual information  

### Custom Metrics and Dimensions
7. **GIVEN** teams have specific monitoring needs  
   **WHEN** configuring custom metrics  
   **THEN** application-specific metrics can be defined and collected  

8. **GIVEN** multi-tenant usage patterns exist  
   **WHEN** analyzing performance by tenant  
   **THEN** metrics can be segmented by user, team, and project  

9. **GIVEN** business metrics are important  
   **WHEN** tracking application usage  
   **THEN** feature usage, user engagement, and business KPIs are available  

### Performance Analysis Tools
10. **GIVEN** performance bottlenecks exist  
    **WHEN** using analysis tools  
    **THEN** automated analysis identifies slow endpoints, resource contention, and optimization opportunities  

11. **GIVEN** performance trends change over time  
    **WHEN** analyzing historical data  
    **THEN** trend analysis shows performance regression or improvement patterns  

12. **GIVEN** comparative analysis is needed  
    **WHEN** comparing performance across time periods  
    **THEN** before/after comparisons highlight the impact of changes  

### Alert Integration and Thresholds
13. **GIVEN** performance thresholds are exceeded  
    **WHEN** metrics breach defined limits  
    **THEN** alerts are generated with performance context and suggested actions  

14. **GIVEN** performance patterns are abnormal  
    **WHEN** anomaly detection runs  
    **THEN** unusual performance patterns are flagged for investigation  

15. **GIVEN** SLA requirements exist  
    **WHEN** monitoring service level objectives  
    **THEN** SLA compliance is tracked and reported automatically  

## Technical Requirements

### Metrics Collection Architecture
```typescript
interface PerformanceMetrics {
  // HTTP/API Metrics
  http: {
    requestCount: number;
    requestDuration: number[];
    requestSize: number[];
    responseSize: number[];
    statusCodes: Record<string, number>;
    endpoints: Record<string, EndpointMetrics>;
  };
  
  // Database Metrics
  database: {
    queryCount: number;
    queryDuration: number[];
    slowQueries: SlowQuery[];
    connectionCount: number;
    connectionPoolUsage: number;
    deadlocks: number;
  };
  
  // Application Metrics
  application: {
    memoryUsage: number;
    gcMetrics: GCMetrics;
    eventLoopLag: number;
    customMetrics: Record<string, number>;
  };
  
  // Business Metrics
  business: {
    activeUsers: number;
    featureUsage: Record<string, number>;
    projectCreations: number;
    templateUsage: Record<string, number>;
  };
}

interface EndpointMetrics {
  path: string;
  method: string;
  requestCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  throughput: number;
}

interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  parameters?: any[];
}
```

### Performance Metrics Collector
```typescript
class PerformanceMetricsCollector {
  private prometheus: PrometheusRegistry;
  private customMetrics: Map<string, Metric>;
  private collectors: Map<string, MetricsCollector>;

  constructor() {
    this.prometheus = new PrometheusRegistry();
    this.customMetrics = new Map();
    this.setupDefaultMetrics();
    this.setupCustomCollectors();
  }

  private setupDefaultMetrics() {
    // HTTP metrics
    const httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'user_id'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    const httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'user_id']
    });

    // Database metrics
    const dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table', 'user_id'],
      buckets: [0.01, 0.1, 0.5, 1, 2, 5]
    });

    const dbConnectionsActive = new Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections'
    });

    // Container metrics
    const containerCpuUsage = new Gauge({
      name: 'container_cpu_usage_percent',
      help: 'CPU usage percentage by container',
      labelNames: ['container_id', 'container_name', 'user_id', 'project_id']
    });

    const containerMemoryUsage = new Gauge({
      name: 'container_memory_usage_bytes',
      help: 'Memory usage in bytes by container',
      labelNames: ['container_id', 'container_name', 'user_id', 'project_id']
    });

    // Register all metrics
    this.prometheus.registerMetric(httpRequestDuration);
    this.prometheus.registerMetric(httpRequestTotal);
    this.prometheus.registerMetric(dbQueryDuration);
    this.prometheus.registerMetric(dbConnectionsActive);
    this.prometheus.registerMetric(containerCpuUsage);
    this.prometheus.registerMetric(containerMemoryUsage);
  }

  async collectHttpMetrics(req: Request, res: Response, duration: number) {
    const labels = {
      method: req.method,
      route: this.normalizeRoute(req.route?.path || req.path),
      status_code: res.statusCode.toString(),
      user_id: req.user?.id || 'anonymous'
    };

    this.prometheus.getMetric('http_request_duration_seconds').observe(labels, duration);
    this.prometheus.getMetric('http_requests_total').inc(labels);

    // Store detailed metrics for dashboard
    await this.storeDetailedHttpMetrics({
      timestamp: new Date(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      requestSize: parseInt(req.get('Content-Length') || '0'),
      responseSize: res.get('Content-Length') ? parseInt(res.get('Content-Length')) : 0
    });
  }

  async collectDatabaseMetrics(query: string, duration: number, params?: any[]) {
    const queryType = this.classifyQuery(query);
    const tables = this.extractTables(query);

    for (const table of tables) {
      this.prometheus.getMetric('db_query_duration_seconds').observe({
        query_type: queryType,
        table: table,
        user_id: this.getCurrentUserId()
      }, duration);
    }

    // Store slow query information
    if (duration > 1) { // Queries taking more than 1 second
      await this.storeSlowQuery({
        query: this.sanitizeQuery(query),
        duration: duration,
        timestamp: new Date(),
        parameters: params,
        stackTrace: this.captureStackTrace()
      });
    }
  }

  async collectContainerMetrics() {
    const containers = await this.getActiveContainers();
    
    for (const container of containers) {
      const stats = await this.getContainerStats(container.id);
      const metadata = await this.getContainerMetadata(container.id);

      this.prometheus.getMetric('container_cpu_usage_percent').set({
        container_id: container.id,
        container_name: container.name,
        user_id: metadata.userId,
        project_id: metadata.projectId
      }, stats.cpuUsage);

      this.prometheus.getMetric('container_memory_usage_bytes').set({
        container_id: container.id,
        container_name: container.name,
        user_id: metadata.userId,
        project_id: metadata.projectId
      }, stats.memoryUsage);
    }
  }

  async registerCustomMetric(name: string, definition: CustomMetricDefinition) {
    const metric = this.createMetricFromDefinition(name, definition);
    this.customMetrics.set(name, metric);
    this.prometheus.registerMetric(metric);
  }

  async recordCustomMetric(name: string, value: number, labels?: Record<string, string>) {
    const metric = this.customMetrics.get(name);
    if (metric) {
      if (metric instanceof Counter) {
        metric.inc(labels, value);
      } else if (metric instanceof Gauge) {
        metric.set(labels, value);
      } else if (metric instanceof Histogram) {
        metric.observe(labels, value);
      }
    }
  }
}
```

### Dashboard Visualization System
```typescript
class DashboardVisualizationService {
  private grafanaClient: GrafanaClient;
  private dashboardTemplates: Map<string, DashboardTemplate>;

  constructor() {
    this.grafanaClient = new GrafanaClient(process.env.GRAFANA_URL);
    this.setupDashboardTemplates();
  }

  private setupDashboardTemplates() {
    this.dashboardTemplates.set('system-overview', {
      title: 'System Overview',
      panels: [
        {
          title: 'HTTP Request Rate',
          type: 'graph',
          targets: ['rate(http_requests_total[5m])'],
          yAxis: { label: 'Requests/sec' }
        },
        {
          title: 'Response Time Distribution',
          type: 'heatmap',
          targets: ['http_request_duration_seconds_bucket'],
          xAxis: { label: 'Time' },
          yAxis: { label: 'Response Time (s)' }
        },
        {
          title: 'Error Rate by Endpoint',
          type: 'table',
          targets: [
            'rate(http_requests_total{status_code=~"4..|5.."}[5m]) / rate(http_requests_total[5m]) * 100'
          ]
        }
      ]
    });

    this.dashboardTemplates.set('user-performance', {
      title: 'User Performance Dashboard',
      panels: [
        {
          title: 'Active Projects by User',
          type: 'stat',
          targets: ['count by (user_id) (container_cpu_usage_percent > 0)']
        },
        {
          title: 'Resource Usage by Team',
          type: 'pie',
          targets: ['sum by (team_id) (container_memory_usage_bytes)']
        },
        {
          title: 'Project Performance Trends',
          type: 'graph',
          targets: ['avg by (project_id) (http_request_duration_seconds)']
        }
      ]
    });
  }

  async createDashboard(templateName: string, customizations?: DashboardCustomizations): Promise<Dashboard> {
    const template = this.dashboardTemplates.get(templateName);
    if (!template) {
      throw new Error(`Dashboard template '${templateName}' not found`);
    }

    const dashboard = this.applyCustomizations(template, customizations);
    const grafanaDashboard = await this.grafanaClient.createDashboard(dashboard);
    
    return {
      id: grafanaDashboard.id,
      url: grafanaDashboard.url,
      title: dashboard.title,
      panels: dashboard.panels.length
    };
  }

  async getPerformanceInsights(timeRange: TimeRange, filters: MetricFilters): Promise<PerformanceInsights> {
    const queries = this.buildInsightQueries(timeRange, filters);
    const results = await Promise.all(
      queries.map(query => this.executePrometheusQuery(query))
    );

    return this.analyzePerformanceData(results, timeRange, filters);
  }

  private analyzePerformanceData(
    results: QueryResult[], 
    timeRange: TimeRange, 
    filters: MetricFilters
  ): PerformanceInsights {
    
    const insights: PerformanceInsights = {
      summary: {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        throughput: 0
      },
      trends: [],
      bottlenecks: [],
      recommendations: []
    };

    // Analyze request volume
    const requestData = results.find(r => r.metric === 'http_requests_total');
    if (requestData) {
      insights.summary.totalRequests = requestData.values.reduce((sum, v) => sum + v.value, 0);
    }

    // Analyze response times
    const responseTimeData = results.find(r => r.metric === 'http_request_duration_seconds');
    if (responseTimeData) {
      const avgResponseTime = responseTimeData.values.reduce((sum, v) => sum + v.value, 0) / responseTimeData.values.length;
      insights.summary.averageResponseTime = avgResponseTime;

      // Detect response time trends
      const trend = this.calculateTrend(responseTimeData.values);
      if (trend.slope > 0.1) {
        insights.trends.push({
          metric: 'Response Time',
          direction: 'increasing',
          severity: trend.slope > 0.5 ? 'high' : 'medium',
          description: 'Response times are trending upward, indicating potential performance degradation'
        });
      }
    }

    // Identify bottlenecks
    const slowEndpoints = this.identifySlowEndpoints(results);
    insights.bottlenecks.push(...slowEndpoints);

    // Generate recommendations
    insights.recommendations = this.generateOptimizationRecommendations(insights);

    return insights;
  }

  private generateOptimizationRecommendations(insights: PerformanceInsights): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // High response time recommendation
    if (insights.summary.averageResponseTime > 2) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'High Response Times Detected',
        description: 'Average response time is above acceptable thresholds',
        actions: [
          'Review slow database queries',
          'Consider implementing caching',
          'Optimize expensive operations',
          'Review resource allocation'
        ]
      });
    }

    // High error rate recommendation
    if (insights.summary.errorRate > 5) {
      recommendations.push({
        type: 'reliability',
        priority: 'critical',
        title: 'High Error Rate',
        description: 'Error rate exceeds acceptable levels',
        actions: [
          'Review application logs for error patterns',
          'Implement better error handling',
          'Check external service dependencies',
          'Review recent deployments'
        ]
      });
    }

    return recommendations;
  }
}
```

### API Endpoints for Metrics
```typescript
// Performance metrics and dashboard APIs
GET    /api/metrics/prometheus              // Prometheus metrics endpoint
GET    /api/metrics/performance             // Performance insights API
POST   /api/metrics/custom                  // Record custom metrics
GET    /api/dashboards                      // List available dashboards
POST   /api/dashboards                      // Create custom dashboard
GET    /api/dashboards/:id                  // Get dashboard configuration
PUT    /api/dashboards/:id                  // Update dashboard
GET    /api/analytics/insights              // Performance insights and recommendations
GET    /api/analytics/trends                // Performance trends analysis
```

## Dependencies

### Prerequisites
- Story 8.1 (System Health Monitoring & Alerting) - **RECOMMENDED**
- Time-series database for metrics storage
- Basic platform infrastructure with instrumentation hooks

### External Libraries
- `prom-client` - Prometheus metrics client for Node.js
- `grafana-api` - Grafana API client for dashboard management
- `influxdb-client` - InfluxDB client for time-series data
- `express-prometheus-middleware` - HTTP metrics middleware

## Testing Strategy

### Unit Tests
- Metrics collection accuracy and performance
- Dashboard template rendering and customization
- Performance analysis algorithms
- Custom metrics registration and recording
- Insight generation logic

### Integration Tests
- End-to-end metrics collection and visualization
- Dashboard creation and real-time updates
- Performance analysis with realistic data
- Custom metrics integration
- Multi-user metrics segmentation

### Performance Tests
- Metrics collection overhead measurement
- Dashboard query performance with large datasets
- Concurrent metrics collection and query load
- Time-series data ingestion and retention
- Visualization rendering performance

## Definition of Done

- [ ] Comprehensive metrics collection covering all system components
- [ ] Rich visualization dashboards with real-time updates
- [ ] Performance insights and trend analysis capabilities
- [ ] Custom metrics framework for application-specific monitoring
- [ ] Multi-tenant metrics segmentation by user and team
- [ ] Integration with Prometheus and Grafana ecosystems
- [ ] Performance optimization recommendations engine
- [ ] API endpoints for metrics access and dashboard management
- [ ] Performance overhead <3% of system resources
- [ ] Comprehensive test suite (>85% coverage)
- [ ] Documentation for metrics and dashboard usage
- [ ] Historical data retention with efficient querying

## Performance Requirements

### Metrics Collection Performance
- Metrics collection overhead: <3% CPU usage
- Metrics ingestion rate: 50,000+ metrics per minute
- Dashboard query response time: <2 seconds for typical queries
- Real-time updates: <5 second latency for dashboard refreshes

### Storage and Retention
- Metrics retention: 90 days with configurable policies
- Storage efficiency: Optimized compression and indexing
- Query performance: <500ms for dashboard queries
- Concurrent users: Support 100+ simultaneous dashboard viewers

## Story Sizing Justification (8 Points)

This is a **medium-high complexity** story requiring:
- Sophisticated metrics collection system with multiple data sources
- Rich visualization framework with customizable dashboards
- Performance analysis engine with trend detection and insights
- Integration with external monitoring ecosystems (Prometheus, Grafana)
- Time-series database optimization for efficient storage and querying
- Multi-tenant metrics segmentation and access control
- Performance optimization to minimize monitoring overhead
- Comprehensive testing for accuracy and scalability

The 8-point estimate reflects the technical complexity of building a comprehensive performance monitoring and visualization system that provides actionable insights while maintaining high performance.

---

*This story provides comprehensive performance visibility and insights that enable data-driven optimization and capacity planning decisions.*