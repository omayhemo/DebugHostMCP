# Multi-Tech Stack Dashboard UI Specification

**Version**: 2.1.0  
**Date**: August 24, 2025  
**Status**: Design Specification Ready  
**Related**: [Multi-Tech Process Discovery Architecture](../architecture/MULTI-TECH-PROCESS-DISCOVERY-ARCHITECTURE.md)

## Overview

The Multi-Tech Stack Dashboard represents a **revolutionary enhancement** to PlopDock's user interface, transforming the current single-view project dashboard into a **comprehensive, real-time process management platform** supporting all technology stacks with intelligent rogue process detection and management capabilities.

## Current State vs. Enhanced State

### Current Dashboard (v2.0)
- **Single View**: Registered projects only
- **Static Data**: No real-time process discovery
- **Limited Actions**: Basic start/stop for registered services
- **Tech Agnostic**: No technology-specific insights

### Enhanced Dashboard (v2.1)
- **Multi-Tab Interface**: Technology stack-specific views
- **Real-time Discovery**: Live process monitoring and correlation
- **Intelligent Actions**: Context-aware process management
- **Tech-Specific Insights**: Technology stack-specific information and controls

## Dashboard Architecture

### Component Hierarchy

```
MultiTechDashboard
├── SystemHealthOverview
├── TechStackTabNavigation
│   ├── NodeJSTab
│   ├── PHPTab  
│   ├── PythonTab
│   ├── StaticTab
│   └── DockerTab
├── ProcessTable (per tab)
│   ├── RegisteredProcesses
│   ├── DiscoveredProcesses
│   ├── RogueProcesses
│   └── OrphanedProcesses
├── ProcessActionPanel
└── SystemReportsPanel
```

### State Management Architecture

```typescript
interface DashboardState {
  // Multi-tech process data
  processesByTechStack: {
    nodejs: ProcessGroup
    php: ProcessGroup
    python: ProcessGroup
    static: ProcessGroup
    docker: ProcessGroup
  }
  
  // System health and metrics
  systemHealth: {
    cpu: number
    memory: number
    diskSpace: number
    networkActivity: NetworkMetrics
  }
  
  // Process categorization
  processCategories: {
    registered: RegisteredProcess[]
    discovered: DiscoveredProcess[]
    rogue: RogueProcess[]
    orphaned: OrphanedProcess[]
    containers: ContainerProcess[]
  }
  
  // UI state
  ui: {
    activeTab: TechStack
    selectedProcesses: string[]
    actionPanelOpen: boolean
    filterSettings: FilterConfig
    refreshInterval: number
  }
  
  // Real-time updates
  realTimeData: {
    lastUpdate: string
    autoRefreshEnabled: boolean
    updateHistory: UpdateEvent[]
  }
}

interface ProcessGroup {
  processes: Process[]
  summary: {
    total: number
    running: number
    stopped: number
    rogue: number
    orphaned: number
  }
  health: TechStackHealth
}
```

## Enhanced Dashboard Views

### 1. System Overview Panel (Top Section)

```tsx
const SystemOverviewPanel = () => {
  return (
    <div className="system-overview-panel">
      <div className="metrics-grid">
        <MetricCard 
          title="Total Processes"
          value={systemMetrics.totalProcesses}
          trend={systemMetrics.processTrend}
          status="healthy"
        />
        <MetricCard 
          title="Rogue Processes" 
          value={systemMetrics.rogueCount}
          trend={systemMetrics.rogueTrend}
          status={systemMetrics.rogueCount > 0 ? "warning" : "healthy"}
        />
        <MetricCard 
          title="Port Utilization"
          value={`${systemMetrics.portUtilization}%`}
          breakdown={portUtilizationByRange}
          status="info"
        />
        <MetricCard 
          title="System Health"
          value="Healthy"
          details={systemHealthDetails}
          status="healthy"
        />
      </div>
      
      <div className="quick-actions">
        <Button onClick={discoverAllProcesses}>🔍 Discover All</Button>
        <Button onClick={cleanupRogueProcesses} variant="warning">🧹 Cleanup Rogue</Button>
        <Button onClick={generateHealthReport}>📊 Health Report</Button>
        <Button onClick={exportProcessData}>📥 Export Data</Button>
      </div>
    </div>
  )
}
```

### 2. Technology Stack Tab Navigation

```tsx
const TechStackTabNavigation = ({ activeTab, onTabChange, processCounts }) => {
  const tabs = [
    { 
      id: 'nodejs', 
      label: 'Node.js', 
      icon: '📦', 
      count: processCounts.nodejs,
      health: techStackHealth.nodejs
    },
    { 
      id: 'php', 
      label: 'PHP', 
      icon: '🐘', 
      count: processCounts.php,
      health: techStackHealth.php  
    },
    { 
      id: 'python', 
      label: 'Python', 
      icon: '🐍', 
      count: processCounts.python,
      health: techStackHealth.python
    },
    { 
      id: 'static', 
      label: 'Static', 
      icon: '📄', 
      count: processCounts.static,
      health: techStackHealth.static
    },
    { 
      id: 'docker', 
      label: 'Docker', 
      icon: '🐳', 
      count: processCounts.docker,
      health: techStackHealth.docker
    }
  ]
  
  return (
    <div className="tech-stack-tabs">
      {tabs.map(tab => (
        <TabButton
          key={tab.id}
          active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          health={tab.health}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
          <span className="tab-count">({tab.count})</span>
          {tab.health !== 'healthy' && (
            <HealthIndicator status={tab.health} />
          )}
        </TabButton>
      ))}
    </div>
  )
}
```

### 3. Enhanced Process Table (per Technology Stack)

```tsx
const ProcessTable = ({ techStack, processes, onProcessAction }) => {
  const columns = [
    { 
      key: 'status', 
      label: 'Status', 
      render: (process) => <ProcessStatusBadge process={process} />
    },
    { 
      key: 'pid', 
      label: 'PID', 
      render: (process) => <PIDCell pid={process.pid} />
    },
    { 
      key: 'port', 
      label: 'Port', 
      render: (process) => <PortCell port={process.port} conflicts={process.conflicts} />
    },
    { 
      key: 'command', 
      label: 'Command', 
      render: (process) => <CommandCell command={process.command} truncate={true} />
    },
    { 
      key: 'workspace', 
      label: 'Workspace', 
      render: (process) => <WorkspaceCell 
        workspace={process.workspace} 
        confidence={process.confidence}
        suspected={process.suspectedWorkspace}
      />
    },
    { 
      key: 'serverType', 
      label: 'Server Type', 
      render: (process) => <ServerTypeBadge type={process.serverType} />
    },
    { 
      key: 'uptime', 
      label: 'Uptime', 
      render: (process) => <UptimeCell startTime={process.startTime} />
    },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (process) => <ProcessActions 
        process={process} 
        onAction={onProcessAction}
        techStack={techStack}
      />
    }
  ]
  
  // Group processes by status for better organization
  const groupedProcesses = {
    registered: processes.filter(p => p.status === 'registered'),
    discovered: processes.filter(p => p.status === 'discovered'), 
    rogue: processes.filter(p => p.status === 'rogue'),
    orphaned: processes.filter(p => p.status === 'orphaned')
  }
  
  return (
    <div className="process-table-container">
      {Object.entries(groupedProcesses).map(([status, statusProcesses]) => (
        statusProcesses.length > 0 && (
          <ProcessGroup key={status} status={status}>
            <ProcessGroupHeader status={status} count={statusProcesses.length} />
            <Table
              data={statusProcesses}
              columns={columns}
              className={`process-table process-table-${status}`}
            />
          </ProcessGroup>
        )
      ))}
    </div>
  )
}
```

## Technology-Specific UI Components

### 1. Node.js Dashboard Features

```tsx
const NodeJSDashboard = ({ processes, onAction }) => {
  const nodeJSInsights = {
    viteProcesses: processes.filter(p => p.serverType === 'vite'),
    portConflicts: detectPortConflicts(processes),
    packageManagerDistribution: analyzePackageManagers(processes),
    developmentServers: categorizeDevelopmentServers(processes)
  }
  
  return (
    <div className="nodejs-dashboard">
      <TechStackSummary techStack="nodejs" insights={nodeJSInsights} />
      
      {nodeJSInsights.portConflicts.length > 0 && (
        <PortConflictAlert 
          conflicts={nodeJSInsights.portConflicts}
          onResolve={handlePortConflictResolution}
        />
      )}
      
      <ViteSpecificPanel 
        processes={nodeJSInsights.viteProcesses}
        onAction={onAction}
      />
      
      <ProcessTable techStack="nodejs" processes={processes} onProcessAction={onAction} />
    </div>
  )
}

const ViteSpecificPanel = ({ processes, onAction }) => {
  return (
    <div className="vite-panel">
      <h3>🚀 Vite Development Servers</h3>
      <div className="vite-insights">
        <VitePortSequenceVisualization processes={processes} />
        <ViteConfigAnalysis processes={processes} />
        <VitePerformanceMetrics processes={processes} />
      </div>
      <ViteQuickActions processes={processes} onAction={onAction} />
    </div>
  )
}
```

### 2. PHP Dashboard Features

```tsx
const PHPDashboard = ({ processes, onAction }) => {
  const phpInsights = {
    builtinServers: processes.filter(p => p.serverType === 'php-builtin'),
    webServers: processes.filter(p => ['apache', 'nginx'].includes(p.serverType)),
    phpFpmProcesses: processes.filter(p => p.serverType === 'php-fpm'),
    containers: processes.filter(p => p.isContainer)
  }
  
  return (
    <div className="php-dashboard">
      <PHPServerTypeDistribution distribution={phpInsights} />
      <PHPConfigurationAnalysis processes={processes} />
      <ProcessTable techStack="php" processes={processes} onProcessAction={onAction} />
    </div>
  )
}
```

### 3. Python Dashboard Features

```tsx
const PythonDashboard = ({ processes, onAction }) => {
  const pythonInsights = {
    frameworks: analyzeFrameworkDistribution(processes),
    wsgiServers: processes.filter(p => ['gunicorn', 'uwsgi', 'uvicorn'].includes(p.serverType)),
    staticServers: processes.filter(p => p.serverType === 'http.server'),
    devServers: processes.filter(p => ['flask', 'django'].includes(p.serverType))
  }
  
  return (
    <div className="python-dashboard">
      <FrameworkDistributionChart distribution={pythonInsights.frameworks} />
      <WSGIServerPanel processes={pythonInsights.wsgiServers} onAction={onAction} />
      <ProcessTable techStack="python" processes={processes} onProcessAction={onAction} />
    </div>
  )
}
```

### 4. Docker Dashboard Features

```tsx
const DockerDashboard = ({ processes, onAction }) => {
  return (
    <div className="docker-dashboard">
      <ContainerOverview containers={processes} />
      <PortMappingVisualization containers={processes} />
      <ContainerResourceUsage containers={processes} />
      <ProcessTable techStack="docker" processes={processes} onProcessAction={onAction} />
    </div>
  )
}

const PortMappingVisualization = ({ containers }) => {
  return (
    <div className="port-mapping-viz">
      <h3>🔗 Port Mappings</h3>
      {containers.map(container => (
        <PortMappingCard 
          key={container.containerId}
          container={container}
          mapping={container.portMapping}
        />
      ))}
    </div>
  )
}
```

## Enhanced Process Actions

### Context-Aware Action Buttons

```tsx
const ProcessActions = ({ process, onAction, techStack }) => {
  const actions = getAvailableActions(process, techStack)
  
  return (
    <div className="process-actions">
      <ActionButton 
        action="view-details"
        onClick={() => onAction('view-details', process)}
        icon="🔍"
        tooltip="View process details"
      />
      
      {process.status === 'rogue' && (
        <>
          <ActionButton
            action="associate"
            onClick={() => onAction('associate-with-project', process)} 
            icon="🔗"
            tooltip="Associate with project"
            variant="success"
          />
          <ActionButton
            action="terminate"
            onClick={() => onAction('terminate-safely', process)}
            icon="⚠️"
            tooltip="Terminate safely"
            variant="warning"
            confirmRequired={true}
          />
        </>
      )}
      
      {process.status === 'registered' && (
        <>
          <ActionButton
            action="restart"
            onClick={() => onAction('restart', process)}
            icon="🔄"
            tooltip="Restart process"
          />
          <ActionButton
            action="stop"
            onClick={() => onAction('stop', process)}
            icon="⏹️"
            tooltip="Stop process"
          />
        </>
      )}
      
      {process.status === 'orphaned' && (
        <ActionButton
          action="cleanup"
          onClick={() => onAction('cleanup-orphaned', process)}
          icon="🧹"
          tooltip="Clean up orphaned process"
          variant="danger"
        />
      )}
    </div>
  )
}
```

### Bulk Actions Panel

```tsx
const BulkActionsPanel = ({ selectedProcesses, techStack, onBulkAction }) => {
  return (
    <div className="bulk-actions-panel">
      <h3>Bulk Actions ({selectedProcesses.length} selected)</h3>
      
      <div className="bulk-action-buttons">
        <Button 
          onClick={() => onBulkAction('terminate-all', selectedProcesses)}
          variant="warning"
          disabled={selectedProcesses.length === 0}
        >
          🛑 Terminate Selected
        </Button>
        
        <Button
          onClick={() => onBulkAction('associate-all', selectedProcesses)}
          variant="success" 
          disabled={selectedProcesses.filter(p => p.status === 'rogue').length === 0}
        >
          🔗 Associate All Rogue
        </Button>
        
        <Button
          onClick={() => onBulkAction('cleanup-orphaned', selectedProcesses)}
          variant="danger"
          disabled={selectedProcesses.filter(p => p.status === 'orphaned').length === 0}
        >
          🧹 Cleanup Orphaned
        </Button>
        
        <Button
          onClick={() => onBulkAction('export-data', selectedProcesses)}
        >
          📥 Export Selected
        </Button>
      </div>
    </div>
  )
}
```

## Real-Time Updates and WebSocket Integration

### Real-Time Data Flow

```typescript
class DashboardRealTimeManager {
  private websocket: WebSocket
  private eventHandlers: Map<string, EventHandler>
  
  constructor(dashboardState: DashboardState) {
    this.websocket = new WebSocket(`ws://localhost:2601/realtime`)
    this.setupEventHandlers(dashboardState)
  }
  
  private setupEventHandlers(state: DashboardState) {
    this.eventHandlers.set('process-discovered', (event: ProcessDiscoveredEvent) => {
      state.processesByTechStack[event.techStack].processes.push(event.process)
      this.notifyUI('new-process-discovered', event)
    })
    
    this.eventHandlers.set('process-terminated', (event: ProcessTerminatedEvent) => {
      this.removeProcessFromState(event.pid)
      this.notifyUI('process-terminated', event)
    })
    
    this.eventHandlers.set('rogue-process-detected', (event: RogueProcessEvent) => {
      this.highlightRogueProcess(event.process)
      this.showNotification('Rogue process detected', event.process)
    })
  }
}
```

### Live Process Monitoring

```tsx
const LiveProcessMonitor = () => {
  const [recentEvents, setRecentEvents] = useState<ProcessEvent[]>([])
  
  useEffect(() => {
    const eventStream = new EventSource('/api/process-events')
    
    eventStream.onmessage = (event) => {
      const processEvent = JSON.parse(event.data)
      setRecentEvents(prev => [processEvent, ...prev.slice(0, 9)]) // Keep last 10 events
    }
    
    return () => eventStream.close()
  }, [])
  
  return (
    <div className="live-monitor">
      <h3>🔴 Live Process Activity</h3>
      <div className="event-stream">
        {recentEvents.map(event => (
          <ProcessEventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
```

## Advanced Features

### 1. Process Correlation Wizard

```tsx
const ProcessCorrelationWizard = ({ rogueProcess, onCorrelate }) => {
  return (
    <Modal title="Associate Rogue Process">
      <div className="correlation-wizard">
        <ProcessInfo process={rogueProcess} />
        
        <WorkspaceSuggestions 
          process={rogueProcess}
          onSelect={onCorrelate}
        />
        
        <ManualWorkspaceEntry 
          onSubmit={onCorrelate}
        />
        
        <RegisterAsNewProject
          process={rogueProcess}
          onSubmit={onCorrelate}
        />
      </div>
    </Modal>
  )
}
```

### 2. System Health Diagnostics

```tsx
const SystemHealthDiagnostics = () => {
  return (
    <div className="health-diagnostics">
      <PortConflictAnalysis />
      <ResourceUsageAnalysis />
      <ProcessRelationshipMap />
      <RecommendationEngine />
    </div>
  )
}
```

### 3. Export and Reporting

```tsx
const ProcessReportGenerator = ({ processes }) => {
  const generateReport = (format: 'json' | 'csv' | 'markdown') => {
    // Generate comprehensive process report
  }
  
  return (
    <div className="report-generator">
      <ReportFilters />
      <ReportPreview />
      <ExportButtons onExport={generateReport} />
    </div>
  )
}
```

## Performance Optimization

### Virtual Scrolling for Large Process Lists
```tsx
const VirtualizedProcessTable = ({ processes }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={processes.length}
      itemSize={50}
      itemData={processes}
    >
      {ProcessTableRow}
    </FixedSizeList>
  )
}
```

### Efficient State Updates
```typescript
const useProcessState = () => {
  const [state, setState] = useImmer<DashboardState>(initialState)
  
  const updateProcesses = useCallback((techStack: TechStack, newProcesses: Process[]) => {
    setState(draft => {
      draft.processesByTechStack[techStack] = newProcesses
    })
  }, [])
  
  return { state, updateProcesses }
}
```

This comprehensive Multi-Tech Stack Dashboard specification provides a **complete transformation** of the PlopDock user interface from a basic project manager into a **sophisticated, real-time process management platform** capable of handling the full complexity of modern multi-technology development environments.

The dashboard empowers developers with **complete visibility and control** over their development processes, dramatically reducing the friction caused by rogue processes and port conflicts while providing technology-specific insights and management capabilities.

---

**Implementation Timeline**: 8-10 weeks for full dashboard development
**Technology Stack**: React 18, TypeScript, WebSocket, Immer, React-Window
**Testing Strategy**: Component testing with React Testing Library, E2E with Playwright