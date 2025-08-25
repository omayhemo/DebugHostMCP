/**
 * Bulk Operations Panel Component
 * 
 * Sprint 7 - Story 3.9: Bulk Operations & Safety Controls (5 story points)
 * 
 * Advanced bulk operations panel with Agent Safety Framework integration
 * for comprehensive batch process management with enterprise-grade safety controls.
 * 
 * Features:
 * - Multi-process selection with category filtering
 * - Safety-aware bulk operations with risk assessment
 * - Impact assessment preview before execution
 * - Emergency override capabilities
 * - Comprehensive audit logging
 * - Real-time progress tracking
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  DiscoveredProcess, 
  TechStack, 
  ProcessCategory,
  BulkOperationRequest,
  BulkSafetyEvaluation,
  ImpactAssessment 
} from '../../types';
import { addNotification } from '../../store/slices/uiSlice';
import { cn } from '../../utils/cn';

/**
 * Bulk Operation Types
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
 * Risk Level Classifications
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Operation Status for Progress Tracking
 */
export type OperationStatus = 'idle' | 'assessing' | 'confirming' | 'executing' | 'completed' | 'error';

interface BulkOperationsPanelProps {
  selectedProcesses: string[];
  processes: DiscoveredProcess[];
  techStack: TechStack | 'all';
  onBulkAction: (operation: BulkOperationType, processIds: string[], options?: any) => Promise<void>;
  onClearSelection: () => void;
  onShowAuditTrail: () => void;
  className?: string;
}

/**
 * Bulk Operation Configuration
 */
const BULK_OPERATIONS: {
  type: BulkOperationType;
  label: string;
  description: string;
  icon: string;
  riskLevel: RiskLevel;
  color: string;
  requiresConfirmation: boolean;
  emergencyOverrideAllowed: boolean;
}[] = [
  {
    type: 'associate_workspace',
    label: 'Associate Workspaces',
    description: 'Associate selected processes with workspaces',
    icon: '🔗',
    riskLevel: 'low',
    color: 'green',
    requiresConfirmation: false,
    emergencyOverrideAllowed: false
  },
  {
    type: 'change_status',
    label: 'Change Status',
    description: 'Move processes between categories (discovered → registered)',
    icon: '📋',
    riskLevel: 'low',
    color: 'blue',
    requiresConfirmation: true,
    emergencyOverrideAllowed: false
  },
  {
    type: 'restart',
    label: 'Restart Processes',
    description: 'Restart selected registered processes',
    icon: '🔄',
    riskLevel: 'medium',
    color: 'orange',
    requiresConfirmation: true,
    emergencyOverrideAllowed: true
  },
  {
    type: 'cleanup',
    label: 'Cleanup Processes',
    description: 'Clean up orphaned or rogue processes',
    icon: '🧹',
    riskLevel: 'medium',
    color: 'yellow',
    requiresConfirmation: true,
    emergencyOverrideAllowed: true
  },
  {
    type: 'terminate',
    label: 'Terminate Processes',
    description: 'Terminate selected processes (DANGEROUS)',
    icon: '⚠️',
    riskLevel: 'high',
    color: 'red',
    requiresConfirmation: true,
    emergencyOverrideAllowed: true
  },
  {
    type: 'export_data',
    label: 'Export Data',
    description: 'Export process information to file',
    icon: '📥',
    riskLevel: 'low',
    color: 'indigo',
    requiresConfirmation: false,
    emergencyOverrideAllowed: false
  }
];

/**
 * Category Selection Filters
 */
const CATEGORY_FILTERS: {
  category: ProcessCategory | 'all';
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    category: 'all',
    label: 'All Categories',
    description: 'All selected processes regardless of category',
    icon: '🔍'
  },
  {
    category: 'registered',
    label: 'Registered Only',
    description: 'Only registered processes',
    icon: '✅'
  },
  {
    category: 'discovered',
    label: 'Discovered Only',
    description: 'Only discovered processes',
    icon: '🔍'
  },
  {
    category: 'rogue',
    label: 'Rogue Only',
    description: 'Only rogue processes requiring attention',
    icon: '⚠️'
  },
  {
    category: 'orphaned',
    label: 'Orphaned Only',
    description: 'Only orphaned processes',
    icon: '🧹'
  }
];

/**
 * Main Bulk Operations Panel Component
 */
export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selectedProcesses,
  processes,
  techStack,
  onBulkAction,
  onClearSelection,
  onShowAuditTrail,
  className
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  
  // Component state
  const [operationStatus, setOperationStatus] = useState<OperationStatus>('idle');
  const [selectedOperation, setSelectedOperation] = useState<BulkOperationType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ProcessCategory | 'all'>('all');
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [safetyEvaluation, setSafetyEvaluation] = useState<BulkSafetyEvaluation | null>(null);
  const [impactAssessment, setImpactAssessment] = useState<ImpactAssessment | null>(null);
  const [emergencyOverrideMode, setEmergencyOverrideMode] = useState(false);
  const [operationProgress, setOperationProgress] = useState<{
    completed: number;
    total: number;
    currentProcess?: string;
    errors: string[];
  } | null>(null);

  // Get filtered processes based on selection and category filter
  const filteredSelectedProcesses = useMemo(() => {
    const selectedProcessData = processes.filter(p => 
      selectedProcesses.includes(`${p.pid}`)
    );

    if (categoryFilter === 'all') {
      return selectedProcessData;
    }

    return selectedProcessData.filter(p => p.category === categoryFilter);
  }, [processes, selectedProcesses, categoryFilter]);

  // Group processes by category for display
  const processesByCategory = useMemo(() => {
    const grouped = filteredSelectedProcesses.reduce((acc, process) => {
      if (!acc[process.category]) {
        acc[process.category] = [];
      }
      acc[process.category].push(process);
      return acc;
    }, {} as Record<ProcessCategory, DiscoveredProcess[]>);

    return grouped;
  }, [filteredSelectedProcesses]);

  // Calculate risk metrics
  const riskMetrics = useMemo(() => {
    const categories = Object.keys(processesByCategory) as ProcessCategory[];
    const hasRogue = categories.includes('rogue');
    const hasSystem = filteredSelectedProcesses.some(p => p.pid < 1000);
    const hasRunning = filteredSelectedProcesses.some(p => p.status === 'running');
    const workspaceCount = new Set(
      filteredSelectedProcesses
        .filter(p => p.workspace)
        .map(p => p.workspace)
    ).size;

    return {
      totalProcesses: filteredSelectedProcesses.length,
      hasRogue,
      hasSystem,
      hasRunning,
      workspaceCount,
      categories
    };
  }, [filteredSelectedProcesses, processesByCategory]);

  /**
   * Handle bulk operation initiation
   */
  const handleBulkOperation = useCallback(async (operation: BulkOperationType) => {
    if (filteredSelectedProcesses.length === 0) {
      dispatch(addNotification({
        type: 'warning',
        title: 'No Processes Selected',
        message: 'Please select processes to perform bulk operations.'
      }));
      return;
    }

    setSelectedOperation(operation);
    setOperationStatus('assessing');

    try {
      // Perform safety evaluation and impact assessment
      const evaluation = await performBulkSafetyEvaluation(
        operation,
        filteredSelectedProcesses,
        user?.id || 'unknown'
      );

      setSafetyEvaluation(evaluation);

      const impact = await performImpactAssessment(
        operation,
        filteredSelectedProcesses,
        processesByCategory
      );

      setImpactAssessment(impact);

      // Determine if confirmation is required
      const operationConfig = BULK_OPERATIONS.find(op => op.type === operation);
      const requiresConfirmation = operationConfig?.requiresConfirmation || 
                                 evaluation.overallRisk !== 'low' ||
                                 evaluation.requiredConfirmations.length > 0;

      if (requiresConfirmation) {
        setOperationStatus('confirming');
        setShowSafetyDialog(true);
      } else {
        // Execute directly for low-risk operations
        await executeBulkOperation(operation, filteredSelectedProcesses);
      }

    } catch (error: any) {
      console.error('Bulk operation assessment failed:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Operation Assessment Failed',
        message: error.message || 'Failed to assess operation safety'
      }));
      setOperationStatus('error');
    }
  }, [filteredSelectedProcesses, processesByCategory, user, dispatch]);

  /**
   * Execute bulk operation after confirmation
   */
  const executeBulkOperation = useCallback(async (
    operation: BulkOperationType, 
    targetProcesses: DiscoveredProcess[]
  ) => {
    setOperationStatus('executing');
    setShowSafetyDialog(false);

    try {
      setOperationProgress({
        completed: 0,
        total: targetProcesses.length,
        errors: []
      });

      // Execute the bulk operation
      await onBulkAction(operation, targetProcesses.map(p => `${p.pid}`), {
        safetyEvaluation,
        impactAssessment,
        emergencyOverride: emergencyOverrideMode,
        user: user?.id || 'unknown',
        onProgress: (completed: number, currentProcess?: string, error?: string) => {
          setOperationProgress(prev => ({
            completed,
            total: prev?.total || targetProcesses.length,
            currentProcess,
            errors: error ? [...(prev?.errors || []), error] : prev?.errors || []
          }));
        }
      });

      setOperationStatus('completed');

      dispatch(addNotification({
        type: 'success',
        title: 'Bulk Operation Complete',
        message: `Successfully completed ${operation} on ${targetProcesses.length} processes`
      }));

      // Auto-close after success
      setTimeout(() => {
        setOperationStatus('idle');
        setOperationProgress(null);
        onClearSelection();
      }, 3000);

    } catch (error: any) {
      console.error('Bulk operation execution failed:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Bulk Operation Failed',
        message: error.message || 'Operation failed to complete'
      }));
      setOperationStatus('error');
    }
  }, [onBulkAction, safetyEvaluation, impactAssessment, emergencyOverrideMode, user, dispatch, onClearSelection]);

  // Don't show panel if no processes are selected
  if (selectedProcesses.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'bg-card border border-border rounded-lg shadow-lg',
      'transition-all duration-200',
      className
    )}>
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Bulk Operations & Safety Controls
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedProcesses.length} processes selected
              {categoryFilter !== 'all' && ` • ${categoryFilter} category`}
              {riskMetrics.workspaceCount > 0 && ` • ${riskMetrics.workspaceCount} workspaces`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Emergency Override Toggle */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setEmergencyOverrideMode(prev => !prev)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                emergencyOverrideMode
                  ? 'bg-red-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
              title="Emergency override bypasses safety checks (admin only)"
            >
              🚨 {emergencyOverrideMode ? 'Override ON' : 'Override OFF'}
            </button>
          )}

          {/* Audit Trail Button */}
          <button
            onClick={onShowAuditTrail}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            title="View operation audit trail"
          >
            📋
          </button>

          {/* Close Button */}
          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            title="Clear selection"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-4 border-b border-border">
        <label className="block text-sm font-medium text-foreground mb-2">
          Filter by Category
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map(filter => (
            <button
              key={filter.category}
              onClick={() => setCategoryFilter(filter.category)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                categoryFilter === filter.category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
              title={filter.description}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
              {filter.category !== 'all' && (
                <span className="ml-1 px-1.5 py-0.5 bg-background/20 rounded text-xs">
                  {processesByCategory[filter.category as ProcessCategory]?.length || 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Process Summary */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {filteredSelectedProcesses.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Processes
            </div>
          </div>

          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold',
              riskMetrics.hasRunning ? 'text-green-600' : 'text-muted-foreground'
            )}>
              {filteredSelectedProcesses.filter(p => p.status === 'running').length}
            </div>
            <div className="text-sm text-muted-foreground">
              Running
            </div>
          </div>

          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold',
              riskMetrics.hasRogue ? 'text-orange-600' : 'text-muted-foreground'
            )}>
              {processesByCategory.rogue?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Rogue
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {riskMetrics.workspaceCount}
            </div>
            <div className="text-sm text-muted-foreground">
              Workspaces
            </div>
          </div>
        </div>

        {/* Risk Indicators */}
        {(riskMetrics.hasSystem || riskMetrics.hasRogue) && (
          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
              <span>⚠️</span>
              <span>
                High-risk processes detected: 
                {riskMetrics.hasSystem && ' System processes'}
                {riskMetrics.hasSystem && riskMetrics.hasRogue && ','}
                {riskMetrics.hasRogue && ' Rogue processes'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Operation Status Display */}
      {operationStatus !== 'idle' && (
        <div className="p-4 border-b border-border">
          <OperationStatusDisplay
            status={operationStatus}
            operation={selectedOperation}
            progress={operationProgress}
            onCancel={() => {
              setOperationStatus('idle');
              setOperationProgress(null);
              setShowSafetyDialog(false);
            }}
          />
        </div>
      )}

      {/* Bulk Operations */}
      <div className="p-4">
        <label className="block text-sm font-medium text-foreground mb-3">
          Bulk Operations
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BULK_OPERATIONS.map(operation => {
            const isDisabled = operationStatus !== 'idle' ||
              (operation.type === 'restart' && !processesByCategory.registered?.length) ||
              (operation.type === 'cleanup' && 
               (!processesByCategory.rogue?.length && !processesByCategory.orphaned?.length));

            return (
              <button
                key={operation.type}
                onClick={() => handleBulkOperation(operation.type)}
                disabled={isDisabled}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-md border transition-colors',
                  'hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed',
                  `border-${operation.color}-200 dark:border-${operation.color}-800`,
                  operation.riskLevel === 'high' && 'border-red-300 dark:border-red-700'
                )}
                title={operation.description}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{operation.icon}</span>
                  <span className="font-medium text-sm">{operation.label}</span>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {operation.description}
                </div>
                {operation.riskLevel !== 'low' && (
                  <div className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    operation.riskLevel === 'medium' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
                    operation.riskLevel === 'high' && 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
                    operation.riskLevel === 'critical' && 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                  )}>
                    {operation.riskLevel.toUpperCase()} RISK
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Safety Confirmation Dialog */}
      {showSafetyDialog && safetyEvaluation && impactAssessment && (
        <SafetyConfirmationDialog
          operation={selectedOperation!}
          evaluation={safetyEvaluation}
          impact={impactAssessment}
          processes={filteredSelectedProcesses}
          emergencyOverrideMode={emergencyOverrideMode}
          onConfirm={() => executeBulkOperation(selectedOperation!, filteredSelectedProcesses)}
          onCancel={() => {
            setShowSafetyDialog(false);
            setOperationStatus('idle');
          }}
        />
      )}
    </div>
  );
};

/**
 * Operation Status Display Component
 */
interface OperationStatusDisplayProps {
  status: OperationStatus;
  operation: BulkOperationType | null;
  progress: {
    completed: number;
    total: number;
    currentProcess?: string;
    errors: string[];
  } | null;
  onCancel: () => void;
}

const OperationStatusDisplay: React.FC<OperationStatusDisplayProps> = ({
  status,
  operation,
  progress,
  onCancel
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'assessing':
        return {
          icon: '🔍',
          title: 'Assessing Operation Safety',
          message: 'Analyzing processes and evaluating risk...',
          color: 'blue'
        };
      case 'confirming':
        return {
          icon: '⚠️',
          title: 'Confirmation Required',
          message: 'Review safety assessment and confirm operation',
          color: 'orange'
        };
      case 'executing':
        return {
          icon: '⚡',
          title: 'Executing Operation',
          message: progress ? `Processing ${progress.completed}/${progress.total} processes...` : 'Executing...',
          color: 'green'
        };
      case 'completed':
        return {
          icon: '✅',
          title: 'Operation Complete',
          message: 'All processes have been successfully processed',
          color: 'green'
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Operation Failed',
          message: 'An error occurred during operation execution',
          color: 'red'
        };
      default:
        return {
          icon: '⏳',
          title: 'Processing',
          message: 'Operation in progress...',
          color: 'gray'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-full',
          status === 'executing' && 'animate-pulse'
        )}>
          <span className="text-xl">{statusDisplay.icon}</span>
        </div>
        <div>
          <h4 className="font-medium text-foreground">
            {statusDisplay.title}
          </h4>
          <p className="text-sm text-muted-foreground">
            {statusDisplay.message}
          </p>
          {progress?.currentProcess && (
            <p className="text-xs text-muted-foreground mt-1">
              Current: {progress.currentProcess}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="flex-1 mx-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-200"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {progress.completed}/{progress.total}
            {progress.errors.length > 0 && (
              <span className="text-red-600 ml-2">
                ({progress.errors.length} errors)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {(status === 'assessing' || status === 'confirming') && (
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

/**
 * Placeholder functions for safety evaluation and impact assessment
 * These would integrate with the Agent Safety Framework in a real implementation
 */
async function performBulkSafetyEvaluation(
  operation: BulkOperationType,
  processes: DiscoveredProcess[],
  userId: string
): Promise<BulkSafetyEvaluation> {
  // Simulate safety evaluation delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock safety evaluation - would use actual Agent Safety Framework
  const hasRogue = processes.some(p => p.category === 'rogue');
  const hasSystem = processes.some(p => p.pid < 1000);
  const hasRunning = processes.some(p => p.status === 'running');

  let overallRisk: RiskLevel = 'low';
  const requiredConfirmations: string[] = [];

  if (operation === 'terminate') {
    overallRisk = hasSystem ? 'critical' : hasRunning ? 'high' : 'medium';
    requiredConfirmations.push('Confirm process termination');
    if (hasSystem) requiredConfirmations.push('Confirm system process termination');
  } else if (operation === 'restart') {
    overallRisk = hasSystem ? 'high' : 'medium';
    requiredConfirmations.push('Confirm process restart');
  } else if (hasRogue) {
    overallRisk = 'medium';
    requiredConfirmations.push('Confirm rogue process operation');
  }

  return {
    overallRisk,
    processEvaluations: [], // Would contain individual process evaluations
    aggregateImpact: {} as ImpactAssessment, // Would contain aggregated impact
    requiredConfirmations,
    auditRequired: true
  };
}

async function performImpactAssessment(
  operation: BulkOperationType,
  processes: DiscoveredProcess[],
  processesByCategory: Record<ProcessCategory, DiscoveredProcess[]>
): Promise<ImpactAssessment> {
  // Simulate impact assessment delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock impact assessment - would use actual system analysis
  const workspaces = new Set(processes.filter(p => p.workspace).map(p => p.workspace));

  return {
    affectedWorkspaces: Array.from(workspaces) as string[],
    processCount: processes.length,
    estimatedDowntime: operation === 'terminate' ? '5-10 seconds' : '1-2 seconds',
    dependentServices: [], // Would contain dependent service analysis
    rollbackPlan: `Operation can be rolled back by restarting affected processes`,
    riskFactors: [
      ...(processes.some(p => p.category === 'rogue') ? ['Rogue processes detected'] : []),
      ...(processes.some(p => p.pid < 1000) ? ['System processes involved'] : []),
      ...(workspaces.size > 1 ? [`Multiple workspaces affected (${workspaces.size})`] : [])
    ]
  } as ImpactAssessment;
}

export default BulkOperationsPanel;