export interface CPUMetric {
  timestamp: number;
  usage: number; // percentage 0-100
  cores: number;
}

export interface MemoryMetric {
  timestamp: number;
  used: number; // bytes
  total: number; // bytes
  available: number; // bytes
  usage: number; // percentage 0-100
}

export interface NetworkMetric {
  timestamp: number;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
}

export interface DiskMetric {
  timestamp: number;
  readBytes: number;
  writeBytes: number;
  readOps: number;
  writeOps: number;
}

export interface ContainerMetrics {
  containerId: string;
  containerName: string;
  timestamp: number;
  cpu: CPUMetric;
  memory: MemoryMetric;
  network: NetworkMetric;
  disk: DiskMetric;
}

export interface MetricsData {
  containers: ContainerMetrics[];
  system: {
    cpu: CPUMetric;
    memory: MemoryMetric;
    network: NetworkMetric;
    disk: DiskMetric;
  };
  timestamp: number;
}

export interface ChartDataPoint {
  x: number; // timestamp
  y: number; // value
}

export interface TimeRange {
  start: number;
  end: number;
  interval: number; // seconds
}

export interface MetricsConnection {
  connected: boolean;
  reconnectAttempts: number;
  lastError?: string;
  lastUpdate?: number;
}

export interface MetricsSettings {
  refreshInterval: number; // milliseconds
  timeRange: string; // '5m', '15m', '1h', '6h', '24h'
  autoRefresh: boolean;
  showSystem: boolean;
  selectedContainers: string[];
}