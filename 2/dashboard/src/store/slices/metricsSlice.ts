import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  unit?: string;
}

export interface ContainerMetrics {
  containerId: string;
  containerName: string;
  cpu: {
    usage: number; // Percentage
    cores: number;
  };
  memory: {
    usage: number; // Bytes
    limit: number; // Bytes
    percentage: number;
  };
  disk: {
    usage: number; // Bytes
    available: number; // Bytes
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  timestamp: string;
}

export interface MetricsTimeRange {
  start: string;
  end: string;
  interval: '1m' | '5m' | '15m' | '1h' | '6h' | '24h';
}

export interface MetricsFilters {
  containers: string[];
  metrics: string[];
  timeRange: MetricsTimeRange;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  lastPing: string | null;
  retryAttempts: number;
  maxRetryAttempts: number;
}

export interface MetricsState {
  // Real-time metrics data
  currentMetrics: Record<string, ContainerMetrics>;
  historicalMetrics: Record<string, MetricDataPoint[]>;
  
  // WebSocket connection state
  connectionStatus: ConnectionStatus;
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Filters and settings
  filters: MetricsFilters;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  
  // Chart configuration
  chartConfigs: Record<string, {
    type: 'line' | 'area' | 'bar';
    colors: string[];
    yAxisMin?: number;
    yAxisMax?: number;
  }>;
  
  // Performance tracking
  performanceMetrics: {
    updateLatency: number; // ms
    renderTime: number; // ms
    dataPoints: number;
    memoryUsage?: number; // MB
  };
  
  // Alert thresholds
  alertThresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
  
  // Selected containers for detailed view
  selectedContainers: string[];
  
  // Time range for historical data
  timeRange: MetricsTimeRange;
}

const initialState: MetricsState = {
  currentMetrics: {},
  historicalMetrics: {},
  connectionStatus: {
    connected: false,
    reconnecting: false,
    lastPing: null,
    retryAttempts: 0,
    maxRetryAttempts: 10,
  },
  loading: false,
  error: null,
  filters: {
    containers: [],
    metrics: ['cpu', 'memory', 'disk', 'network'],
    timeRange: {
      start: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      end: new Date().toISOString(),
      interval: '1m',
    },
  },
  autoRefresh: true,
  refreshInterval: 5, // 5 seconds
  chartConfigs: {
    cpu: { type: 'line', colors: ['#3b82f6'] },
    memory: { type: 'line', colors: ['#10b981'] },
    disk: { type: 'line', colors: ['#f59e0b'] },
    network: { type: 'line', colors: ['#8b5cf6', '#ec4899'] },
  },
  performanceMetrics: {
    updateLatency: 0,
    renderTime: 0,
    dataPoints: 0,
  },
  alertThresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
  },
  selectedContainers: [],
  timeRange: {
    start: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
    interval: '1m',
  },
};

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    // Real-time data updates
    updateContainerMetrics: (state, action: PayloadAction<ContainerMetrics>) => {
      const metrics = action.payload;
      state.currentMetrics[metrics.containerId] = metrics;
      state.error = null;
    },
    
    updateMultipleContainerMetrics: (state, action: PayloadAction<ContainerMetrics[]>) => {
      action.payload.forEach(metrics => {
        state.currentMetrics[metrics.containerId] = metrics;
      });
      state.error = null;
    },
    
    // Historical data management
    addHistoricalMetrics: (state, action: PayloadAction<{ containerId: string; metrics: MetricDataPoint[] }>) => {
      const { containerId, metrics } = action.payload;
      if (!state.historicalMetrics[containerId]) {
        state.historicalMetrics[containerId] = [];
      }
      state.historicalMetrics[containerId] = [...state.historicalMetrics[containerId], ...metrics]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-1000); // Keep last 1000 points
    },
    
    clearHistoricalMetrics: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload) {
        delete state.historicalMetrics[action.payload];
      } else {
        state.historicalMetrics = {};
      }
    },
    
    // Connection management
    setConnectionStatus: (state, action: PayloadAction<Partial<ConnectionStatus>>) => {
      state.connectionStatus = { ...state.connectionStatus, ...action.payload };
    },
    
    incrementRetryAttempts: (state) => {
      state.connectionStatus.retryAttempts += 1;
    },
    
    resetRetryAttempts: (state) => {
      state.connectionStatus.retryAttempts = 0;
    },
    
    // UI state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Settings
    toggleAutoRefresh: (state) => {
      state.autoRefresh = !state.autoRefresh;
    },
    
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefresh = action.payload;
    },
    
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
    },
    
    setTimeRange: (state, action: PayloadAction<MetricsTimeRange>) => {
      state.timeRange = action.payload;
      state.filters.timeRange = action.payload;
    },
    
    // Container selection
    setSelectedContainers: (state, action: PayloadAction<string[]>) => {
      state.selectedContainers = action.payload;
    },
    
    addSelectedContainer: (state, action: PayloadAction<string>) => {
      if (!state.selectedContainers.includes(action.payload)) {
        state.selectedContainers.push(action.payload);
      }
    },
    
    removeSelectedContainer: (state, action: PayloadAction<string>) => {
      state.selectedContainers = state.selectedContainers.filter(id => id !== action.payload);
    },
    
    selectAllContainers: (state) => {
      state.selectedContainers = Object.keys(state.currentMetrics);
    },
    
    deselectAllContainers: (state) => {
      state.selectedContainers = [];
    },
    
    // Filters
    updateFilters: (state, action: PayloadAction<Partial<MetricsFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Alert thresholds
    updateAlertThresholds: (state, action: PayloadAction<Partial<MetricsState['alertThresholds']>>) => {
      state.alertThresholds = { ...state.alertThresholds, ...action.payload };
    },
    
    // Performance metrics
    updatePerformanceMetrics: (state, action: PayloadAction<Partial<MetricsState['performanceMetrics']>>) => {
      state.performanceMetrics = { ...state.performanceMetrics, ...action.payload };
    },
    
    // Chart configuration
    updateChartConfig: (state, action: PayloadAction<{ chartId: string; config: Partial<MetricsState['chartConfigs'][string]> }>) => {
      const { chartId, config } = action.payload;
      state.chartConfigs[chartId] = { ...state.chartConfigs[chartId], ...config };
    },
    
    // Reset state
    resetMetricsState: (state) => {
      return initialState;
    },
  },
});

export const {
  updateContainerMetrics,
  updateMultipleContainerMetrics,
  addHistoricalMetrics,
  clearHistoricalMetrics,
  setConnectionStatus,
  incrementRetryAttempts,
  resetRetryAttempts,
  setLoading,
  setError,
  toggleAutoRefresh,
  setAutoRefresh,
  setRefreshInterval,
  setTimeRange,
  setSelectedContainers,
  addSelectedContainer,
  removeSelectedContainer,
  selectAllContainers,
  deselectAllContainers,
  updateFilters,
  updateAlertThresholds,
  updatePerformanceMetrics,
  updateChartConfig,
  resetMetricsState,
} = metricsSlice.actions;

export default metricsSlice.reducer;