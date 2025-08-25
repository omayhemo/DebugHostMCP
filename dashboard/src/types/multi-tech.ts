/**
 * Multi-Tech Dashboard Types
 * 
 * TypeScript type definitions for the Multi-Tech Process Discovery
 * and Dashboard components. Based on Sprint 7 Story 3.7 requirements.
 */

// Technology Stack Enumeration
export type TechStack = 'nodejs' | 'php' | 'python' | 'static' | 'docker';

// Process Categories from Enhanced Port Registry
export type ProcessCategory = 'registered' | 'discovered' | 'rogue' | 'orphaned' | 'containers';

// Process Status for UI display
export type ProcessStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'failed';

// Connection Status for real-time updates
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

// Refresh Status for update cycles
export type RefreshStatus = 'idle' | 'refreshing' | 'error' | 'success';

/**
 * Discovered Process Interface
 * Represents a process discovered by the Multi-Tech Process Discovery Engine
 */
export interface DiscoveredProcess {
  // Core process identification
  pid: number;
  port?: number;
  command: string;
  cwd?: string;
  
  // Technology-specific information
  techStack: TechStack;
  framework?: string;
  serverType?: string;
  containerInfo?: ContainerInfo;
  
  // Process categorization from Enhanced Port Registry
  category: ProcessCategory;
  correlationStatus: ProcessCategory;
  rogueReason?: string;
  
  // Workspace correlation
  workspace?: string;
  workspaceConfidence?: number;
  suspectedWorkspace?: string;
  
  // Process metadata
  startTime?: string;
  uptime?: number;
  status: ProcessStatus;
  health?: 'healthy' | 'warning' | 'error';
  
  // Additional process details
  env?: Record<string, string>;
  user?: string;
  parentPid?: number;
  
  // UI-specific properties
  selected?: boolean;
  highlighted?: boolean;
}

/**
 * Container Information for Docker processes
 */
export interface ContainerInfo {
  containerId: string;
  containerName?: string;
  image: string;
  imageTag?: string;
  portMappings?: PortMapping[];
  networkMode?: string;
  volumes?: string[];
  status: 'running' | 'stopped' | 'paused' | 'restarting' | 'removing' | 'exited';
}

/**
 * Port Mapping for container processes
 */
export interface PortMapping {
  hostPort: number;
  containerPort: number;
  protocol: 'tcp' | 'udp';
  hostIP?: string;
}

/**
 * Technology Stack Health Metrics
 */
export interface TechStackHealth {
  healthy: boolean;
  processCount: number;
  runningCount: number;
  rogueCount: number;
  orphanedCount: number;
  cpuUsage?: number;
  memoryUsage?: number;
  issues?: string[];
  lastUpdate: string;
}

/**
 * System Health Metrics for overview panel
 */
export interface SystemHealthMetrics {
  cpu: number;
  memory: number;
  diskSpace: number;
  totalProcesses: number;
  rogueProcesses: number;
  portUtilization: number;
  lastUpdate: string;
  status: 'healthy' | 'warning' | 'error';
}

/**
 * Process Correlation Results from the correlation engine
 */
export interface CorrelationResult {
  processId: string;
  originalCategory: ProcessCategory;
  correlatedCategory: ProcessCategory;
  confidence: number;
  workspace?: string;
  reason?: string;
  suggestions?: string[];
}

/**
 * Process Group for organizing processes by category
 */
export interface ProcessGroup {
  category: ProcessCategory;
  processes: DiscoveredProcess[];
  count: number;
  health: TechStackHealth;
}

/**
 * Tech Stack Summary for tab display
 */
export interface TechStackSummary {
  techStack: TechStack;
  totalProcesses: number;
  runningProcesses: number;
  registeredProcesses: number;
  discoveredProcesses: number;
  rogueProcesses: number;
  orphanedProcesses: number;
  health: TechStackHealth;
  lastUpdate: string;
}

/**
 * Real-time Update Event from SSE
 */
export interface ProcessUpdateEvent {
  type: 'process-discovered' | 'process-terminated' | 'process-updated' | 'process-categorized';
  timestamp: string;
  process?: DiscoveredProcess;
  techStack?: TechStack;
  changes?: Partial<DiscoveredProcess>;
  metadata?: Record<string, any>;
}

/**
 * Bulk Action Request for process operations
 */
export interface BulkActionRequest {
  action: 'terminate' | 'associate' | 'cleanup' | 'export';
  processIds: string[];
  options?: {
    force?: boolean;
    reason?: string;
    workspace?: string;
  };
}

/**
 * Bulk Action Result
 */
export interface BulkActionResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  results: {
    processId: string;
    success: boolean;
    error?: string;
  }[];
  summary: string;
}

/**
 * Safety Confirmation Dialog Props
 */
export interface SafetyConfirmationProps {
  process?: DiscoveredProcess;
  processes?: DiscoveredProcess[];
  action: string;
  message: string;
  details?: string[];
  onConfirm: () => void;
  onCancel: () => void;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Process Action Context for safety framework
 */
export interface ProcessActionContext {
  process: DiscoveredProcess;
  action: string;
  workspace?: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  recommendations: string[];
}

/**
 * Filter Configuration for process table
 */
export interface ProcessFilter {
  techStack?: TechStack[];
  category?: ProcessCategory[];
  status?: ProcessStatus[];
  searchTerm?: string;
  showOnlyRogue?: boolean;
  showOnlyOrphaned?: boolean;
}

/**
 * Sort Configuration for process table
 */
export interface ProcessSort {
  field: keyof DiscoveredProcess;
  direction: 'asc' | 'desc';
}

/**
 * Dashboard UI State
 */
export interface DashboardUIState {
  activeTab: TechStack | 'all';
  selectedProcesses: string[];
  bulkActionMode: boolean;
  filter: ProcessFilter;
  sort: ProcessSort;
  showDetails: boolean;
  detailsProcessId?: string;
  confirmationDialog?: SafetyConfirmationProps;
}

/**
 * Real-time Data State
 */
export interface RealTimeDataState {
  connectionStatus: ConnectionStatus;
  lastUpdate: string;
  updateInterval: number;
  autoRefresh: boolean;
  eventHistory: ProcessUpdateEvent[];
  errors: string[];
  reconnectAttempts?: number;
  maxReconnectAttempts?: number;
}

/**
 * Sprint 7 - Story 3.9: Bulk Operations & Safety Controls Types
 */

/**
 * Bulk Operation Types for Safety-Aware Operations
 */
export type BulkOperationType = 
  | 'terminate' 
  | 'cleanup' 
  | 'correlate' 
  | 'change_status' 
  | 'restart'
  | 'associate_workspace'
  | 'export_data';

/**
 * Risk Level Classifications for Safety Framework
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Enhanced Bulk Action Request with Safety Integration
 */
export interface BulkOperationRequest {
  operation: BulkOperationType;
  processIds: string[];
  techStack?: TechStack;
  category?: ProcessCategory;
  workspaceId?: string;
  safetyOverride?: boolean;
  options?: {
    force?: boolean;
    reason?: string;
    workspace?: string;
    confirmationToken?: string;
    agentContext?: {
      agent?: string;
      user?: string;
      sessionId?: string;
    };
  };
}

/**
 * Enhanced Bulk Action Result with Detailed Metrics
 */
export interface BulkOperationResult {
  success: boolean;
  operation: BulkOperationType;
  processedCount: number;
  errorCount: number;
  skippedCount: number;
  errors: {
    processId: string;
    error: string;
  }[];
  duration: number;
  timestamp: string;
}

/**
 * Bulk Safety Evaluation Result
 */
export interface BulkSafetyEvaluation {
  overallRisk: RiskLevel;
  processEvaluations: ProcessSafetyEvaluation[];
  aggregateImpact: ImpactAssessment;
  requiredConfirmations: string[];
  auditRequired: boolean;
}

/**
 * Individual Process Safety Evaluation
 */
export interface ProcessSafetyEvaluation {
  processId: string;
  allowed: boolean;
  requiresConfirmation: boolean;
  riskLevel: RiskLevel;
  reasoning: string;
  alternatives: string[];
  processContext: 'registered' | 'workspace' | 'rogue' | 'system' | 'unknown';
}

/**
 * Impact Assessment for Operation Planning
 */
export interface ImpactAssessment {
  affectedWorkspaces: string[];
  processCount: number;
  estimatedDowntime: string;
  dependentServices: string[];
  rollbackPlan: string;
  riskFactors: string[];
}

/**
 * Process Memory and CPU Usage (Extended DiscoveredProcess)
 */
declare module './multi-tech' {
  interface DiscoveredProcess {
    memoryUsage?: number; // in bytes
    cpuUsage?: number; // percentage
  }
}