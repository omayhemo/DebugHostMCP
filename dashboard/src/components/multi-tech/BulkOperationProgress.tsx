/**
 * Bulk Operation Progress Component
 * 
 * Sprint 7 - Story 3.9: Bulk Operations & Safety Controls
 * 
 * Real-time progress tracking for bulk operations with:
 * - Live progress visualization
 * - Per-process status updates
 * - Error handling and recovery
 * - Performance metrics
 * - Cancellation support
 * - Success/failure summaries
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BulkOperationType, 
  DiscoveredProcess,
  BulkOperationResult
} from '../../types';
import { cn } from '../../utils/cn';

/**
 * Individual Process Operation Status
 */
interface ProcessOperationStatus {
  processId: string;
  process: DiscoveredProcess;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'skipped';
  startTime?: string;
  endTime?: string;
  error?: string;
  result?: any;
}

/**
 * Overall Operation Progress
 */
interface OperationProgress {
  total: number;
  completed: number;
  errors: number;
  skipped: number;
  startTime: string;
  endTime?: string;
  estimatedCompletion?: string;
  currentProcess?: ProcessOperationStatus;
  averageProcessingTime: number;
  operationsPerSecond: number;
}

interface BulkOperationProgressProps {
  operation: BulkOperationType;
  processes: DiscoveredProcess[];
  isVisible: boolean;
  onComplete: (result: BulkOperationResult) => void;
  onCancel: () => void;
  onError: (error: string) => void;
  className?: string;
}

/**
 * Operation Icons and Labels
 */
const OPERATION_CONFIG: Record<BulkOperationType, {
  icon: string;
  label: string;
  processingVerb: string;
}> = {
  terminate: { icon: '⚠️', label: 'Terminate Processes', processingVerb: 'Terminating' },
  restart: { icon: '🔄', label: 'Restart Processes', processingVerb: 'Restarting' },
  cleanup: { icon: '🧹', label: 'Cleanup Processes', processingVerb: 'Cleaning up' },
  correlate: { icon: '🔗', label: 'Correlate Processes', processingVerb: 'Correlating' },
  change_status: { icon: '📋', label: 'Change Status', processingVerb: 'Updating' },
  associate_workspace: { icon: '🔗', label: 'Associate Workspaces', processingVerb: 'Associating' },
  export_data: { icon: '📥', label: 'Export Data', processingVerb: 'Exporting' }
};

/**
 * Main Bulk Operation Progress Component
 */
export const BulkOperationProgress: React.FC<BulkOperationProgressProps> = ({
  operation,
  processes,
  isVisible,
  onComplete,
  onCancel,
  onError,
  className
}) => {
  // Progress state
  const [progress, setProgress] = useState<OperationProgress>({
    total: processes.length,
    completed: 0,
    errors: 0,
    skipped: 0,
    startTime: new Date().toISOString(),
    averageProcessingTime: 0,
    operationsPerSecond: 0
  });

  // Individual process statuses
  const [processStatuses, setProcessStatuses] = useState<Map<string, ProcessOperationStatus>>(
    new Map(processes.map(p => [
      `${p.pid}`,
      {
        processId: `${p.pid}`,
        process: p,
        status: 'pending'
      }
    ]))
  );

  // Operation state
  const [operationStatus, setOperationStatus] = useState<'idle' | 'running' | 'completed' | 'cancelled' | 'error'>('idle');
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);

  const operationConfig = OPERATION_CONFIG[operation];

  /**
   * Update individual process status
   */
  const updateProcessStatus = useCallback((
    processId: string, 
    status: ProcessOperationStatus['status'],
    error?: string,
    result?: any
  ) => {
    setProcessStatuses(prev => {
      const newStatuses = new Map(prev);
      const existing = newStatuses.get(processId);
      if (existing) {
        const updated = {
          ...existing,
          status,
          error,
          result,
          endTime: ['completed', 'error', 'skipped'].includes(status) 
            ? new Date().toISOString() 
            : existing.endTime
        };
        newStatuses.set(processId, updated);
      }
      return newStatuses;
    });
  }, []);

  /**
   * Calculate overall progress metrics
   */
  const updateProgress = useCallback(() => {
    const statuses = Array.from(processStatuses.values());
    const completed = statuses.filter(s => s.status === 'completed').length;
    const errors = statuses.filter(s => s.status === 'error').length;
    const skipped = statuses.filter(s => s.status === 'skipped').length;
    const processing = statuses.find(s => s.status === 'processing');

    // Calculate performance metrics
    const completedStatuses = statuses.filter(s => s.endTime && s.startTime);
    const totalProcessingTime = completedStatuses.reduce((sum, status) => {
      if (status.startTime && status.endTime) {
        return sum + (new Date(status.endTime).getTime() - new Date(status.startTime).getTime());
      }
      return sum;
    }, 0);
    
    const averageProcessingTime = completedStatuses.length > 0 
      ? totalProcessingTime / completedStatuses.length / 1000 
      : 0;

    const elapsedTime = (Date.now() - new Date(progress.startTime).getTime()) / 1000;
    const operationsPerSecond = elapsedTime > 0 ? completed / elapsedTime : 0;

    // Estimate completion time
    let estimatedCompletion: string | undefined;
    if (operationsPerSecond > 0 && completed < processes.length) {
      const remainingOperations = processes.length - completed;
      const estimatedSeconds = remainingOperations / operationsPerSecond;
      estimatedCompletion = new Date(Date.now() + estimatedSeconds * 1000).toISOString();
    }

    setProgress(prev => ({
      ...prev,
      completed,
      errors,
      skipped,
      currentProcess: processing,
      averageProcessingTime,
      operationsPerSecond,
      estimatedCompletion,
      endTime: (completed + errors + skipped) === processes.length 
        ? new Date().toISOString() 
        : prev.endTime
    }));
  }, [processStatuses, processes.length, progress.startTime]);

  /**
   * Simulate bulk operation execution
   * In a real implementation, this would call the actual MCP tools
   */
  const executeBulkOperation = useCallback(async () => {
    setOperationStatus('running');
    
    try {
      for (const process of processes) {
        if (cancelRequested) {
          // Cancel remaining operations
          const remainingProcesses = processes.slice(processes.indexOf(process));
          remainingProcesses.forEach(p => {
            updateProcessStatus(`${p.pid}`, 'skipped');
          });
          setOperationStatus('cancelled');
          return;
        }

        const processId = `${process.pid}`;
        
        // Update to processing
        updateProcessStatus(processId, 'processing');
        
        // Set start time
        setProcessStatuses(prev => {
          const newStatuses = new Map(prev);
          const existing = newStatuses.get(processId);
          if (existing) {
            newStatuses.set(processId, {
              ...existing,
              startTime: new Date().toISOString()
            });
          }
          return newStatuses;
        });

        try {
          // Simulate operation execution time (varies by operation)
          const baseTime = 500; // Base 500ms
          const operationMultiplier = {
            terminate: 1.0,
            restart: 2.0,
            cleanup: 0.5,
            correlate: 1.5,
            change_status: 0.3,
            associate_workspace: 1.0,
            export_data: 0.8
          };
          
          const executionTime = baseTime * (operationMultiplier[operation] || 1.0);
          await new Promise(resolve => setTimeout(resolve, executionTime));

          // Simulate success/failure (10% failure rate for demo)
          const shouldFail = Math.random() < 0.1;
          
          if (shouldFail) {
            updateProcessStatus(processId, 'error', 'Simulated operation failure');
          } else {
            updateProcessStatus(processId, 'completed', undefined, { 
              success: true, 
              timestamp: new Date().toISOString() 
            });
          }

        } catch (error: any) {
          updateProcessStatus(processId, 'error', error.message);
        }
      }

      // Complete operation
      setOperationStatus('completed');
      
      const finalStatuses = Array.from(processStatuses.values());
      const result: BulkOperationResult = {
        success: finalStatuses.some(s => s.status === 'completed'),
        operation,
        processedCount: finalStatuses.filter(s => s.status === 'completed').length,
        errorCount: finalStatuses.filter(s => s.status === 'error').length,
        skippedCount: finalStatuses.filter(s => s.status === 'skipped').length,
        errors: finalStatuses.filter(s => s.error).map(s => ({
          processId: s.processId,
          error: s.error!
        })),
        duration: Date.now() - new Date(progress.startTime).getTime(),
        timestamp: new Date().toISOString()
      };

      onComplete(result);

    } catch (error: any) {
      setOperationStatus('error');
      onError(error.message);
    }
  }, [processes, operation, cancelRequested, updateProcessStatus, processStatuses, progress.startTime, onComplete, onError]);

  // Update progress when process statuses change
  useEffect(() => {
    updateProgress();
  }, [processStatuses, updateProgress]);

  // Auto-start operation when visible
  useEffect(() => {
    if (isVisible && operationStatus === 'idle') {
      executeBulkOperation();
    }
  }, [isVisible, operationStatus, executeBulkOperation]);

  // Handle cancel request
  const handleCancel = useCallback(() => {
    setCancelRequested(true);
    onCancel();
  }, [onCancel]);

  if (!isVisible) return null;

  const progressPercentage = progress.total > 0 
    ? ((progress.completed + progress.errors + progress.skipped) / progress.total) * 100 
    : 0;

  const isActive = operationStatus === 'running';
  const isComplete = operationStatus === 'completed';
  const hasErrors = progress.errors > 0;

  return (
    <div className={cn(
      'bg-card border border-border rounded-lg shadow-lg',
      'transition-all duration-200',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-full',
            isActive && 'animate-pulse',
            isComplete && !hasErrors && 'bg-green-100 dark:bg-green-900/20',
            hasErrors && 'bg-orange-100 dark:bg-orange-900/20'
          )}>
            <span className="text-xl">{operationConfig.icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {operationConfig.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isActive ? operationConfig.processingVerb : 
               isComplete ? 'Completed' : 
               operationStatus === 'cancelled' ? 'Cancelled' :
               'Processing'} {progress.total} processes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetailedView(prev => !prev)}
            className="px-3 py-1.5 text-sm bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            {showDetailedView ? 'Hide Details' : 'Show Details'}
          </button>
          
          {isActive && (
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Progress: {progress.completed + progress.errors + progress.skipped} / {progress.total}
            </span>
            <span className="font-medium text-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-3">
            <div className="relative h-3 rounded-full overflow-hidden">
              {/* Completed (green) */}
              <div
                className="absolute top-0 left-0 h-full bg-green-600 transition-all duration-300"
                style={{ 
                  width: `${(progress.completed / progress.total) * 100}%` 
                }}
              />
              
              {/* Errors (red) */}
              <div
                className="absolute top-0 h-full bg-red-600 transition-all duration-300"
                style={{ 
                  left: `${(progress.completed / progress.total) * 100}%`,
                  width: `${(progress.errors / progress.total) * 100}%` 
                }}
              />
              
              {/* Skipped (yellow) */}
              <div
                className="absolute top-0 h-full bg-yellow-600 transition-all duration-300"
                style={{ 
                  left: `${((progress.completed + progress.errors) / progress.total) * 100}%`,
                  width: `${(progress.skipped / progress.total) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {progress.completed}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Completed
            </div>
          </div>

          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {progress.errors}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              Errors
            </div>
          </div>

          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {progress.skipped}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              Skipped
            </div>
          </div>

          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {progress.total - progress.completed - progress.errors - progress.skipped}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Remaining
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-2 bg-muted/30 rounded">
            <div className="font-medium text-foreground">Average Time</div>
            <div className="text-muted-foreground">
              {progress.averageProcessingTime > 0 
                ? `${progress.averageProcessingTime.toFixed(2)}s per process`
                : 'Calculating...'
              }
            </div>
          </div>

          <div className="p-2 bg-muted/30 rounded">
            <div className="font-medium text-foreground">Processing Rate</div>
            <div className="text-muted-foreground">
              {progress.operationsPerSecond > 0
                ? `${progress.operationsPerSecond.toFixed(1)} ops/sec`
                : 'Calculating...'
              }
            </div>
          </div>

          <div className="p-2 bg-muted/30 rounded">
            <div className="font-medium text-foreground">Estimated Completion</div>
            <div className="text-muted-foreground">
              {progress.estimatedCompletion && isActive
                ? new Date(progress.estimatedCompletion).toLocaleTimeString()
                : progress.endTime
                  ? new Date(progress.endTime).toLocaleTimeString()
                  : 'Calculating...'
              }
            </div>
          </div>
        </div>

        {/* Current Process */}
        {progress.currentProcess && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <div className="animate-pulse">
                <span className="text-primary">⚡</span>
              </div>
              <span className="text-foreground font-medium">
                {operationConfig.processingVerb}:
              </span>
              <span className="font-mono text-muted-foreground">
                PID {progress.currentProcess.processId}
              </span>
              <span className="text-muted-foreground">
                {progress.currentProcess.process.command}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Process View */}
      {showDetailedView && (
        <div className="border-t border-border">
          <div className="p-4">
            <h4 className="font-medium text-foreground mb-3">
              Process Details
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Array.from(processStatuses.values()).map(status => {
                const statusIcons = {
                  pending: '⏳',
                  processing: '⚡',
                  completed: '✅',
                  error: '❌',
                  skipped: '⏭️'
                };

                const statusColors = {
                  pending: 'text-gray-500',
                  processing: 'text-blue-600 animate-pulse',
                  completed: 'text-green-600',
                  error: 'text-red-600',
                  skipped: 'text-yellow-600'
                };

                return (
                  <div
                    key={status.processId}
                    className="flex items-center gap-3 p-2 bg-muted/20 rounded text-sm"
                  >
                    <span className={cn('text-base', statusColors[status.status])}>
                      {statusIcons[status.status]}
                    </span>
                    
                    <span className="font-mono w-12">
                      {status.processId}
                    </span>
                    
                    <span className="flex-1 truncate">
                      {status.process.command}
                    </span>
                    
                    <span className={cn('text-xs capitalize', statusColors[status.status])}>
                      {status.status}
                    </span>
                    
                    {status.error && (
                      <span className="text-xs text-red-600 max-w-xs truncate" title={status.error}>
                        {status.error}
                      </span>
                    )}

                    {status.startTime && status.endTime && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round((new Date(status.endTime).getTime() - new Date(status.startTime).getTime()) / 1000 * 100) / 100}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOperationProgress;