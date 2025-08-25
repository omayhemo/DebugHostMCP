# Story 6.3: Resource Quotas & Usage Monitoring

**Story ID**: 6.3  
**Epic**: Multi-User Support & Workspace Management (Epic 5)  
**Sprint**: 6  
**Story Points**: 8  
**Priority**: High  
**Created**: August 8, 2025  

## User Story

**As a** platform administrator  
**I want** comprehensive resource quota management and usage monitoring  
**So that** system resources are fairly allocated among users and teams while preventing resource abuse and system overload  

## Business Value

- **Fair Resource Allocation**: Ensures equitable resource distribution among users
- **System Stability**: Prevents individual users from consuming excessive resources
- **Cost Management**: Controls resource consumption for cost-effective operation
- **Performance Monitoring**: Provides visibility into resource utilization patterns

## Acceptance Criteria

### User-Level Resource Quotas
1. **GIVEN** a new user joins the platform  
   **WHEN** their account is created  
   **THEN** default resource quotas are automatically assigned  

2. **GIVEN** a user attempts to exceed their resource quota  
   **WHEN** they try to start additional containers or allocate more resources  
   **THEN** the operation is blocked with clear quota information  

3. **GIVEN** an administrator wants to modify user quotas  
   **WHEN** they update quota limits  
   **THEN** changes are applied immediately with user notification  

### Team-Level Resource Management
4. **GIVEN** a team is created  
   **WHEN** examining team resource allocation  
   **THEN** team quotas aggregate individual member quotas with shared pools  

5. **GIVEN** team members share resources  
   **WHEN** resources are allocated  
   **THEN** team-level limits take precedence over individual limits  

6. **GIVEN** a team approaches resource limits  
   **WHEN** members attempt resource-intensive operations  
   **THEN** team leads receive warnings and can redistribute resources  

### Real-time Usage Monitoring
7. **GIVEN** users and teams consume resources  
   **WHEN** monitoring system checks usage  
   **THEN** real-time resource consumption is accurately tracked and displayed  

8. **GIVEN** resource usage patterns exist  
   **WHEN** administrators view usage analytics  
   **THEN** detailed breakdowns by user, team, project, and time period are available  

9. **GIVEN** resource usage spikes occur  
   **WHEN** thresholds are exceeded  
   **THEN** automatic alerts are sent to relevant stakeholders  

### Quota Enforcement Mechanisms
10. **GIVEN** resource quotas are defined  
    **WHEN** users perform resource-consuming actions  
    **THEN** enforcement occurs at container creation, not just limits  

11. **GIVEN** containers are running and consuming resources  
    **WHEN** resource monitoring occurs  
    **THEN** actual consumption is measured and compared to quotas  

12. **GIVEN** users consistently approach quota limits  
    **WHEN** usage patterns are analyzed  
    **THEN** recommendations for optimization or quota adjustments are provided  

### Resource Analytics and Reporting
13. **GIVEN** resource usage data is collected  
    **WHEN** generating usage reports  
    **THEN** comprehensive analytics with trends and projections are available  

14. **GIVEN** administrators need capacity planning  
    **WHEN** they access resource forecasting  
    **THEN** predictive analytics help inform infrastructure decisions  

15. **GIVEN** users want to optimize their resource usage  
    **WHEN** they view their resource dashboard  
    **THEN** actionable insights and recommendations are provided  

## Technical Requirements

### Resource Quota Schema
```typescript
interface ResourceQuota {
  // CPU resources
  maxCpuCores: number;
  maxCpuPercent: number;
  
  // Memory resources
  maxMemoryGB: number;
  maxMemoryPercent: number;
  
  // Storage resources
  maxStorageGB: number;
  maxTempStorageGB: number;
  
  // Container limits
  maxContainers: number;
  maxConcurrentContainers: number;
  
  // Network resources
  maxBandwidthMbps: number;
  maxConnections: number;
  
  // Time-based limits
  maxRuntimeHours: number; // per day
  maxIdleTimeMinutes: number;
}

interface ResourceUsage {
  // Current usage
  currentCpuCores: number;
  currentMemoryGB: number;
  currentStorageGB: number;
  currentContainers: number;
  
  // Peak usage (24h)
  peakCpuCores: number;
  peakMemoryGB: number;
  peakContainers: number;
  
  // Cumulative usage
  totalRuntimeHours: number;
  totalCpuCoreHours: number;
  totalMemoryGBHours: number;
  
  // Last updated
  lastUpdated: Date;
}
```

### Database Schema
```sql
CREATE TABLE resource_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL, -- 'user', 'team', 'system'
  entity_id UUID NOT NULL,
  quota_type VARCHAR(20) NOT NULL DEFAULT 'standard',
  
  -- CPU quotas
  max_cpu_cores NUMERIC(4,2) DEFAULT 4.0,
  max_cpu_percent NUMERIC(5,2) DEFAULT 80.0,
  
  -- Memory quotas  
  max_memory_gb NUMERIC(6,2) DEFAULT 8.0,
  max_memory_percent NUMERIC(5,2) DEFAULT 80.0,
  
  -- Storage quotas
  max_storage_gb NUMERIC(8,2) DEFAULT 50.0,
  max_temp_storage_gb NUMERIC(8,2) DEFAULT 10.0,
  
  -- Container quotas
  max_containers INTEGER DEFAULT 10,
  max_concurrent_containers INTEGER DEFAULT 5,
  
  -- Network quotas
  max_bandwidth_mbps INTEGER DEFAULT 100,
  max_connections INTEGER DEFAULT 100,
  
  -- Time quotas
  max_runtime_hours NUMERIC(6,2) DEFAULT 24.0,
  max_idle_time_minutes INTEGER DEFAULT 60,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_entity_quota UNIQUE(entity_type, entity_id)
);

CREATE TABLE resource_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  metric_type VARCHAR(30) NOT NULL,
  value NUMERIC(12,4) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_usage_metrics_entity (entity_type, entity_id, timestamp),
  INDEX idx_usage_metrics_type (metric_type, timestamp)
);

CREATE TABLE resource_usage_current (
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Current usage
  current_cpu_cores NUMERIC(4,2) DEFAULT 0,
  current_memory_gb NUMERIC(6,2) DEFAULT 0,
  current_storage_gb NUMERIC(8,2) DEFAULT 0,
  current_containers INTEGER DEFAULT 0,
  current_bandwidth_mbps INTEGER DEFAULT 0,
  
  -- Peak usage (24h rolling)
  peak_cpu_cores NUMERIC(4,2) DEFAULT 0,
  peak_memory_gb NUMERIC(6,2) DEFAULT 0,
  peak_containers INTEGER DEFAULT 0,
  
  -- Cumulative usage
  total_runtime_hours NUMERIC(12,4) DEFAULT 0,
  total_cpu_core_hours NUMERIC(12,4) DEFAULT 0,
  total_memory_gb_hours NUMERIC(12,4) DEFAULT 0,
  
  last_updated TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (entity_type, entity_id)
);
```

### Resource Monitoring Service
```typescript
class ResourceMonitoringService {
  private readonly monitoringInterval = 30000; // 30 seconds

  async startResourceMonitoring() {
    setInterval(() => {
      this.collectResourceMetrics();
    }, this.monitoringInterval);
  }

  async collectResourceMetrics() {
    try {
      // Get all active containers
      const containers = await docker.listContainers({ all: false });
      
      for (const container of containers) {
        const stats = await this.getContainerStats(container.Id);
        const entityInfo = await this.getContainerEntityInfo(container);
        
        await this.updateResourceUsage(entityInfo, stats);
        await this.checkQuotaViolations(entityInfo, stats);
      }
      
      // Update team-level aggregations
      await this.updateTeamResourceAggregations();
      
    } catch (error) {
      console.error('Resource monitoring error:', error);
    }
  }

  async getContainerStats(containerId: string) {
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });
    
    return {
      cpuUsage: this.calculateCpuUsage(stats),
      memoryUsageGB: stats.memory_stats.usage / (1024 ** 3),
      networkIO: stats.networks?.eth0 || { rx_bytes: 0, tx_bytes: 0 }
    };
  }

  async checkQuotaViolations(entityInfo: EntityInfo, currentUsage: ResourceStats) {
    const quota = await this.getResourceQuota(entityInfo.type, entityInfo.id);
    const violations = [];

    if (currentUsage.cpuUsage > quota.maxCpuCores) {
      violations.push({
        type: 'cpu_cores',
        current: currentUsage.cpuUsage,
        limit: quota.maxCpuCores
      });
    }

    if (currentUsage.memoryUsageGB > quota.maxMemoryGB) {
      violations.push({
        type: 'memory',
        current: currentUsage.memoryUsageGB,
        limit: quota.maxMemoryGB
      });
    }

    if (violations.length > 0) {
      await this.handleQuotaViolations(entityInfo, violations);
    }
  }

  async handleQuotaViolations(entityInfo: EntityInfo, violations: QuotaViolation[]) {
    // Log violation
    await this.logQuotaViolation(entityInfo, violations);
    
    // Send notifications
    await this.notifyQuotaViolation(entityInfo, violations);
    
    // Take enforcement action if configured
    if (this.shouldEnforceQuota(violations)) {
      await this.enforceQuotaLimits(entityInfo, violations);
    }
  }
}
```

### Quota Enforcement Engine
```typescript
class QuotaEnforcementEngine {
  async validateResourceRequest(
    entityType: string,
    entityId: string,
    resourceRequest: ResourceRequest
  ): Promise<QuotaValidationResult> {
    
    const quota = await this.getResourceQuota(entityType, entityId);
    const currentUsage = await this.getCurrentResourceUsage(entityType, entityId);
    
    const projectedUsage = {
      cpuCores: currentUsage.currentCpuCores + resourceRequest.cpuCores,
      memoryGB: currentUsage.currentMemoryGB + resourceRequest.memoryGB,
      containers: currentUsage.currentContainers + 1,
      storageGB: currentUsage.currentStorageGB + resourceRequest.storageGB
    };

    const violations = this.checkQuotaViolations(quota, projectedUsage);
    
    return {
      allowed: violations.length === 0,
      violations: violations,
      currentUsage: currentUsage,
      quota: quota,
      projectedUsage: projectedUsage
    };
  }

  async enforceResourceLimits(containerId: string, limits: ResourceLimits) {
    const container = docker.getContainer(containerId);
    
    await container.update({
      CpuQuota: Math.floor(limits.cpuCores * 100000), // Docker CPU quota format
      Memory: Math.floor(limits.memoryGB * 1024 * 1024 * 1024), // Bytes
      BlkioWeightDevice: [{
        Path: '/dev/sda1',
        Weight: this.calculateIOWeight(limits.storageGB)
      }]
    });
  }
}
```

### API Endpoints
```typescript
// Resource quota management
GET    /api/quotas/user/:userId        // Get user quotas
PUT    /api/quotas/user/:userId        // Update user quotas  
GET    /api/quotas/team/:teamId        // Get team quotas
PUT    /api/quotas/team/:teamId        // Update team quotas

// Resource usage monitoring
GET    /api/usage/user/:userId         // Current user usage
GET    /api/usage/team/:teamId         // Current team usage
GET    /api/usage/user/:userId/history // Historical usage data
GET    /api/usage/analytics            // System-wide usage analytics

// Quota enforcement
POST   /api/quotas/validate            // Validate resource request
GET    /api/quotas/violations          // List quota violations
POST   /api/quotas/enforce             // Trigger quota enforcement
```

## Dependencies

### Prerequisites
- Story 6.1 (User Workspace Isolation Architecture) - **REQUIRED**
- Story 6.2 (Team Management & Project Sharing) - **REQUIRED**
- Docker API integration for resource monitoring
- Time-series database for metrics storage (InfluxDB/Prometheus)

### External Libraries
- `node-cron` - Scheduled resource monitoring
- `influxdb-client` - Time-series metrics storage
- `dockerode` - Docker API integration for resource stats
- `lodash` - Data aggregation utilities

## Testing Strategy

### Unit Tests
- Quota calculation and validation logic
- Resource usage aggregation algorithms
- Quota enforcement mechanisms
- Notification and alerting systems
- Analytics and reporting functions

### Integration Tests
- End-to-end quota enforcement workflow
- Resource monitoring accuracy validation
- Multi-user quota interaction testing
- Team resource aggregation verification
- Performance under high resource usage

### Load Tests
- Resource monitoring system performance
- Quota enforcement under concurrent load
- Database performance with high-frequency metrics
- Alert system scalability testing

## Definition of Done

- [ ] User and team resource quota system implemented
- [ ] Real-time resource usage monitoring functional
- [ ] Quota enforcement preventing resource over-allocation
- [ ] Resource usage analytics and reporting dashboard
- [ ] Automated alerting for quota violations
- [ ] Historical usage data collection and analysis
- [ ] API endpoints for quota management
- [ ] Performance optimization for resource monitoring
- [ ] Comprehensive test suite (>85% coverage)
- [ ] Documentation for quota management
- [ ] Integration with notification system
- [ ] Capacity planning and forecasting tools

## Performance Requirements

### Monitoring Performance
- Resource metrics collection: <5 seconds per monitoring cycle
- Quota validation: <100ms per request
- Usage dashboard updates: <2 seconds for data refresh
- Historical data queries: <5 seconds for standard date ranges

### Scalability Targets
- Support monitoring 1000+ concurrent containers
- Handle 10,000+ resource metric data points per minute
- Process quota validations for 100+ concurrent users
- Generate usage reports for 500+ users and teams

## Story Sizing Justification (8 Points)

This is a **medium-high complexity** story requiring:
- Resource monitoring system with real-time data collection
- Complex quota calculation and enforcement algorithms
- Time-series data storage and analytics capabilities
- Integration with Docker API for resource statistics
- Multi-level quota management (user, team, system)
- Performance optimization for continuous monitoring
- Alerting and notification system integration
- Comprehensive reporting and analytics dashboard

The 8-point estimate reflects the technical complexity of resource monitoring and the need for real-time, accurate quota enforcement across multiple user and team contexts.

---

*This story ensures fair and efficient resource utilization while providing visibility and control over system resource consumption.*