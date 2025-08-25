/**
 * Multi-Tech Dashboard Redux Slice
 * 
 * Manages state for the Multi-Tech Process Discovery Dashboard
 * Sprint 7 Story 3.7 - Multi-Tech Dashboard Core
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  TechStack,
  DiscoveredProcess,
  SystemHealthMetrics,
  CorrelationResult,
  ProcessUpdateEvent,
  BulkActionRequest,
  BulkActionResult,
  ProcessFilter,
  ProcessSort,
  DashboardUIState,
  RealTimeDataState,
  TechStackSummary,
  ConnectionStatus,
  RefreshStatus,
  ProcessCategory
} from '../../types';

/**
 * Multi-Tech Dashboard State Interface
 */
export interface MultiTechDashboardState {
  // Process data organized by technology stack
  processesByTechStack: Record<TechStack, DiscoveredProcess[]>;
  
  // System-wide metrics and health
  systemHealth: SystemHealthMetrics | null;
  techStackSummaries: Record<TechStack, TechStackSummary>;
  
  // Correlation and analysis results
  correlationResults: CorrelationResult[];
  
  // UI state management
  ui: DashboardUIState;
  
  // Real-time data management
  realTime: RealTimeDataState;
  
  // Loading and error states
  loading: boolean;
  refreshStatus: RefreshStatus;
  error: string | null;
  lastRefresh: string | null;
}

/**
 * Initial state configuration
 */
const initialState: MultiTechDashboardState = {
  processesByTechStack: {
    nodejs: [],
    php: [],
    python: [],
    static: [],
    docker: []
  },
  
  systemHealth: null,
  
  techStackSummaries: {
    nodejs: {
      techStack: 'nodejs',
      totalProcesses: 0,
      runningProcesses: 0,
      registeredProcesses: 0,
      discoveredProcesses: 0,
      rogueProcesses: 0,
      orphanedProcesses: 0,
      health: {
        healthy: true,
        processCount: 0,
        runningCount: 0,
        rogueCount: 0,
        orphanedCount: 0,
        lastUpdate: new Date().toISOString(),
        issues: []
      },
      lastUpdate: new Date().toISOString()
    },
    php: {
      techStack: 'php',
      totalProcesses: 0,
      runningProcesses: 0,
      registeredProcesses: 0,
      discoveredProcesses: 0,
      rogueProcesses: 0,
      orphanedProcesses: 0,
      health: {
        healthy: true,
        processCount: 0,
        runningCount: 0,
        rogueCount: 0,
        orphanedCount: 0,
        lastUpdate: new Date().toISOString(),
        issues: []
      },
      lastUpdate: new Date().toISOString()
    },
    python: {
      techStack: 'python',
      totalProcesses: 0,
      runningProcesses: 0,
      registeredProcesses: 0,
      discoveredProcesses: 0,
      rogueProcesses: 0,
      orphanedProcesses: 0,
      health: {
        healthy: true,
        processCount: 0,
        runningCount: 0,
        rogueCount: 0,
        orphanedCount: 0,
        lastUpdate: new Date().toISOString(),
        issues: []
      },
      lastUpdate: new Date().toISOString()
    },
    static: {
      techStack: 'static',
      totalProcesses: 0,
      runningProcesses: 0,
      registeredProcesses: 0,
      discoveredProcesses: 0,
      rogueProcesses: 0,
      orphanedProcesses: 0,
      health: {
        healthy: true,
        processCount: 0,
        runningCount: 0,
        rogueCount: 0,
        orphanedCount: 0,
        lastUpdate: new Date().toISOString(),
        issues: []
      },
      lastUpdate: new Date().toISOString()
    },
    docker: {
      techStack: 'docker',
      totalProcesses: 0,
      runningProcesses: 0,
      registeredProcesses: 0,
      discoveredProcesses: 0,
      rogueProcesses: 0,
      orphanedProcesses: 0,
      health: {
        healthy: true,
        processCount: 0,
        runningCount: 0,
        rogueCount: 0,
        orphanedCount: 0,
        lastUpdate: new Date().toISOString(),
        issues: []
      },
      lastUpdate: new Date().toISOString()
    }
  },
  
  correlationResults: [],
  
  ui: {
    activeTab: 'all',
    selectedProcesses: [],
    bulkActionMode: false,
    filter: {},
    sort: {
      field: 'pid',
      direction: 'asc'
    },
    showDetails: false
  },
  
  realTime: {
    connectionStatus: 'disconnected',
    lastUpdate: new Date().toISOString(),
    updateInterval: 5000, // 5-second refresh requirement
    autoRefresh: true,
    eventHistory: [],
    errors: [],
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  },
  
  loading: false,
  refreshStatus: 'idle',
  error: null,
  lastRefresh: null
};

/**
 * Async Thunks for Multi-Tech Dashboard Operations
 */

// Discover all processes across technology stacks
export const discoverAllProcesses = createAsyncThunk(
  'multiTechDashboard/discoverAllProcesses',
  async (options?: { techStacks?: TechStack[]; forceRefresh?: boolean }) => {
    const { multiTechService } = await import('../../services/multiTechService');
    return multiTechService.discoverProcesses({
      techStacks: options?.techStacks || ['nodejs', 'php', 'python', 'static', 'docker'],
      forceRefresh: options?.forceRefresh || false,
      includeCorrelation: true
    });
  }
);

// Get system health metrics
export const fetchSystemHealth = createAsyncThunk(
  'multiTechDashboard/fetchSystemHealth',
  async () => {
    const { multiTechService } = await import('../../services/multiTechService');
    return multiTechService.getSystemHealth();
  }
);

// Execute bulk process actions
export const executeBulkAction = createAsyncThunk(
  'multiTechDashboard/executeBulkAction',
  async (request: BulkActionRequest): Promise<BulkActionResult> => {
    const { multiTechService } = await import('../../services/multiTechService');
    return multiTechService.executeBulkAction(request);
  }
);

/**
 * Helper function to calculate tech stack summary
 */
function calculateTechStackSummary(processes: DiscoveredProcess[], techStack: TechStack): TechStackSummary {
  const totalProcesses = processes.length;
  const runningProcesses = processes.filter(p => p.status === 'running').length;
  const registeredProcesses = processes.filter(p => p.category === 'registered').length;
  const discoveredProcesses = processes.filter(p => p.category === 'discovered').length;
  const rogueProcesses = processes.filter(p => p.category === 'rogue').length;
  const orphanedProcesses = processes.filter(p => p.category === 'orphaned').length;
  
  const health = {
    healthy: rogueProcesses === 0 && orphanedProcesses === 0,
    processCount: totalProcesses,
    runningCount: runningProcesses,
    rogueCount: rogueProcesses,
    orphanedCount: orphanedProcesses,
    lastUpdate: new Date().toISOString(),
    issues: [
      ...(rogueProcesses > 0 ? [`${rogueProcesses} rogue processes detected`] : []),
      ...(orphanedProcesses > 0 ? [`${orphanedProcesses} orphaned processes found`] : [])
    ]
  };
  
  return {
    techStack,
    totalProcesses,
    runningProcesses,
    registeredProcesses,
    discoveredProcesses,
    rogueProcesses,
    orphanedProcesses,
    health,
    lastUpdate: new Date().toISOString()
  };
}

/**
 * Multi-Tech Dashboard Redux Slice
 */
const multiTechDashboardSlice = createSlice({
  name: 'multiTechDashboard',
  initialState,
  reducers: {
    // UI State Management
    setActiveTab: (state, action: PayloadAction<TechStack | 'all'>) => {
      state.ui.activeTab = action.payload;
      state.ui.selectedProcesses = []; // Clear selections when switching tabs
    },
    
    toggleProcessSelection: (state, action: PayloadAction<string>) => {
      const processId = action.payload;
      const selected = state.ui.selectedProcesses;
      
      if (selected.includes(processId)) {
        state.ui.selectedProcesses = selected.filter(id => id !== processId);
      } else {
        state.ui.selectedProcesses.push(processId);
      }
    },
    
    selectAllProcesses: (state, action: PayloadAction<string[]>) => {
      state.ui.selectedProcesses = action.payload;
    },
    
    clearProcessSelection: (state) => {
      state.ui.selectedProcesses = [];
    },
    
    toggleBulkActionMode: (state) => {
      state.ui.bulkActionMode = !state.ui.bulkActionMode;
      if (!state.ui.bulkActionMode) {
        state.ui.selectedProcesses = [];
      }
    },
    
    updateFilter: (state, action: PayloadAction<Partial<ProcessFilter>>) => {
      state.ui.filter = { ...state.ui.filter, ...action.payload };
    },
    
    updateSort: (state, action: PayloadAction<ProcessSort>) => {
      state.ui.sort = action.payload;
    },
    
    showProcessDetails: (state, action: PayloadAction<string>) => {
      state.ui.showDetails = true;
      state.ui.detailsProcessId = action.payload;
    },
    
    hideProcessDetails: (state) => {
      state.ui.showDetails = false;
      state.ui.detailsProcessId = undefined;
    },
    
    // Real-time Data Management
    updateConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.realTime.connectionStatus = action.payload;
      state.realTime.lastUpdate = new Date().toISOString();
    },
    
    addProcessUpdateEvent: (state, action: PayloadAction<ProcessUpdateEvent>) => {
      // Add timestamp if not provided
      const event = {
        ...action.payload,
        timestamp: action.payload.timestamp || new Date().toISOString()
      };
      
      state.realTime.eventHistory.unshift(event);
      // Keep only last 200 events for better performance
      if (state.realTime.eventHistory.length > 200) {
        state.realTime.eventHistory = state.realTime.eventHistory.slice(0, 200);
      }
      state.realTime.lastUpdate = event.timestamp;
    },
    
    batchAddProcessUpdateEvents: (state, action: PayloadAction<ProcessUpdateEvent[]>) => {
      const events = action.payload.map(event => ({
        ...event,
        timestamp: event.timestamp || new Date().toISOString()
      }));
      
      state.realTime.eventHistory.unshift(...events);
      // Keep only last 200 events
      if (state.realTime.eventHistory.length > 200) {
        state.realTime.eventHistory = state.realTime.eventHistory.slice(0, 200);
      }
      
      if (events.length > 0) {
        state.realTime.lastUpdate = events[0].timestamp;
      }
    },
    
    clearEventHistory: (state) => {
      state.realTime.eventHistory = [];
    },
    
    setReconnectAttempts: (state, action: PayloadAction<number>) => {
      state.realTime.reconnectAttempts = action.payload;
    },
    
    resetReconnectAttempts: (state) => {
      state.realTime.reconnectAttempts = 0;
    },
    
    toggleAutoRefresh: (state) => {
      state.realTime.autoRefresh = !state.realTime.autoRefresh;
    },
    
    setUpdateInterval: (state, action: PayloadAction<number>) => {
      state.realTime.updateInterval = action.payload;
    },
    
    // Process Data Updates
    updateProcesses: (state, action: PayloadAction<{ techStack: TechStack; processes: DiscoveredProcess[] }>) => {
      const { techStack, processes } = action.payload;
      state.processesByTechStack[techStack] = processes;
      state.techStackSummaries[techStack] = calculateTechStackSummary(processes, techStack);
    },
    
    updateAllProcesses: (state, action: PayloadAction<Record<TechStack, DiscoveredProcess[]>>) => {
      state.processesByTechStack = action.payload;
      
      // Recalculate all tech stack summaries
      Object.keys(action.payload).forEach(techStackKey => {
        const techStack = techStackKey as TechStack;
        const processes = action.payload[techStack];
        state.techStackSummaries[techStack] = calculateTechStackSummary(processes, techStack);
      });
    },
    
    updateProcessStatus: (state, action: PayloadAction<{ processId: string; status: Partial<DiscoveredProcess> }>) => {
      const { processId, status } = action.payload;
      
      // Find and update the process across all tech stacks
      Object.values(state.processesByTechStack).forEach(processes => {
        const process = processes.find(p => `${p.pid}` === processId);
        if (process) {
          Object.assign(process, status);
        }
      });
      
      // Recalculate affected tech stack summaries
      Object.keys(state.processesByTechStack).forEach(techStackKey => {
        const techStack = techStackKey as TechStack;
        const processes = state.processesByTechStack[techStack];
        state.techStackSummaries[techStack] = calculateTechStackSummary(processes, techStack);
      });
    },
    
    // System Health Updates
    updateSystemHealth: (state, action: PayloadAction<SystemHealthMetrics>) => {
      state.systemHealth = action.payload;
    },
    
    // Correlation Results
    updateCorrelationResults: (state, action: PayloadAction<CorrelationResult[]>) => {
      state.correlationResults = action.payload;
    },
    
    // Error Handling
    addError: (state, action: PayloadAction<string>) => {
      state.realTime.errors.push(action.payload);
    },
    
    clearErrors: (state) => {
      state.realTime.errors = [];
    },
    
    // Refresh Status
    setRefreshStatus: (state, action: PayloadAction<RefreshStatus>) => {
      state.refreshStatus = action.payload;
      if (action.payload === 'success') {
        state.lastRefresh = new Date().toISOString();
      }
    }
  },
  
  extraReducers: (builder) => {
    // Discover All Processes
    builder
      .addCase(discoverAllProcesses.pending, (state) => {
        state.loading = true;
        state.refreshStatus = 'refreshing';
        state.error = null;
      })
      .addCase(discoverAllProcesses.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshStatus = 'success';
        state.lastRefresh = new Date().toISOString();
        
        const { techStackResults, correlation, systemHealth } = action.payload;
        
        // Update processes by tech stack
        if (techStackResults) {
          Object.entries(techStackResults).forEach(([techStack, result]) => {
            if (result.success && result.processes) {
              state.processesByTechStack[techStack as TechStack] = result.processes;
              state.techStackSummaries[techStack as TechStack] = 
                calculateTechStackSummary(result.processes, techStack as TechStack);
            }
          });
        }
        
        // Update correlation results
        if (correlation) {
          state.correlationResults = correlation.correlationResults || [];
        }
        
        // Update system health if provided
        if (systemHealth) {
          state.systemHealth = systemHealth;
        }
      })
      .addCase(discoverAllProcesses.rejected, (state, action) => {
        state.loading = false;
        state.refreshStatus = 'error';
        state.error = action.error.message || 'Failed to discover processes';
      });
    
    // Fetch System Health
    builder
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.systemHealth = action.payload;
      });
    
    // Execute Bulk Action
    builder
      .addCase(executeBulkAction.fulfilled, (state, action) => {
        const result = action.payload;
        if (result.success && result.processedCount > 0) {
          // Clear selected processes after successful bulk action
          state.ui.selectedProcesses = [];
          state.ui.bulkActionMode = false;
        }
      });
  }
});

// Export actions
export const {
  setActiveTab,
  toggleProcessSelection,
  selectAllProcesses,
  clearProcessSelection,
  toggleBulkActionMode,
  updateFilter,
  updateSort,
  showProcessDetails,
  hideProcessDetails,
  updateConnectionStatus,
  addProcessUpdateEvent,
  batchAddProcessUpdateEvents,
  clearEventHistory,
  setReconnectAttempts,
  resetReconnectAttempts,
  toggleAutoRefresh,
  setUpdateInterval,
  updateProcesses,
  updateAllProcesses,
  updateProcessStatus,
  updateSystemHealth,
  updateCorrelationResults,
  addError,
  clearErrors,
  setRefreshStatus
} = multiTechDashboardSlice.actions;

// Export reducer
export default multiTechDashboardSlice.reducer;