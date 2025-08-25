/**
 * Safety Confirmation Dialog Component
 * 
 * Sprint 7 - Story 3.9: Bulk Operations & Safety Controls
 * 
 * Comprehensive safety confirmation dialog with detailed impact assessment,
 * risk visualization, and emergency override capabilities.
 * 
 * Features:
 * - Detailed risk assessment display
 * - Impact visualization with affected workspaces
 * - Process-by-process safety evaluation
 * - Emergency override authorization
 * - Rollback plan preview
 * - User confirmation requirements
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  BulkOperationType, 
  RiskLevel,
  BulkSafetyEvaluation, 
  ImpactAssessment,
  DiscoveredProcess
} from '../../types';
import { cn } from '../../utils/cn';

interface SafetyConfirmationDialogProps {
  operation: BulkOperationType;
  evaluation: BulkSafetyEvaluation;
  impact: ImpactAssessment;
  processes: DiscoveredProcess[];
  emergencyOverrideMode: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Risk Level Display Configuration
 */
const RISK_LEVEL_CONFIG: Record<RiskLevel, {
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: string;
  label: string;
  description: string;
}> = {
  low: {
    color: 'text-green-700 dark:text-green-300',
    backgroundColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: '✅',
    label: 'Low Risk',
    description: 'Operation is safe to proceed with standard precautions'
  },
  medium: {
    color: 'text-yellow-700 dark:text-yellow-300',
    backgroundColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: '⚠️',
    label: 'Medium Risk',
    description: 'Operation requires careful consideration and monitoring'
  },
  high: {
    color: 'text-orange-700 dark:text-orange-300',
    backgroundColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: '🔥',
    label: 'High Risk',
    description: 'Operation has significant risk and requires explicit confirmation'
  },
  critical: {
    color: 'text-red-700 dark:text-red-300',
    backgroundColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: '🚨',
    label: 'Critical Risk',
    description: 'Operation poses severe risk to system stability'
  }
};

/**
 * Operation Display Configuration
 */
const OPERATION_CONFIG: Record<BulkOperationType, {
  label: string;
  description: string;
  icon: string;
  warningMessage?: string;
}> = {
  terminate: {
    label: 'Terminate Processes',
    description: 'Stop selected processes immediately',
    icon: '⚠️',
    warningMessage: 'This action cannot be undone. Processes will need to be restarted manually.'
  },
  restart: {
    label: 'Restart Processes',
    description: 'Stop and restart selected processes',
    icon: '🔄',
    warningMessage: 'Services may be temporarily unavailable during restart.'
  },
  cleanup: {
    label: 'Cleanup Processes',
    description: 'Remove orphaned entries and clean up rogue processes',
    icon: '🧹'
  },
  correlate: {
    label: 'Correlate Processes',
    description: 'Associate processes with workspaces and projects',
    icon: '🔗'
  },
  change_status: {
    label: 'Change Status',
    description: 'Move processes between categories',
    icon: '📋'
  },
  associate_workspace: {
    label: 'Associate Workspaces',
    description: 'Link processes to workspace projects',
    icon: '🔗'
  },
  export_data: {
    label: 'Export Data',
    description: 'Export process information to file',
    icon: '📥'
  }
};

/**
 * Main Safety Confirmation Dialog Component
 */
export const SafetyConfirmationDialog: React.FC<SafetyConfirmationDialogProps> = ({
  operation,
  evaluation,
  impact,
  processes,
  emergencyOverrideMode,
  onConfirm,
  onCancel
}) => {
  const [confirmationChecks, setConfirmationChecks] = useState<Set<string>>(new Set());
  const [userConfirmation, setUserConfirmation] = useState('');
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  const operationConfig = OPERATION_CONFIG[operation];
  const riskConfig = RISK_LEVEL_CONFIG[evaluation.overallRisk];

  // Process the confirmation requirements
  const allConfirmationsChecked = useMemo(() => {
    return evaluation.requiredConfirmations.every(confirmation => 
      confirmationChecks.has(confirmation)
    );
  }, [evaluation.requiredConfirmations, confirmationChecks]);

  // User must type "CONFIRM" for high-risk operations
  const requiresTypedConfirmation = evaluation.overallRisk === 'high' || evaluation.overallRisk === 'critical';
  const typedConfirmationValid = !requiresTypedConfirmation || userConfirmation.toUpperCase() === 'CONFIRM';

  const canProceed = (allConfirmationsChecked && typedConfirmationValid) || emergencyOverrideMode;

  // Group processes by risk level for display
  const processesByRisk = useMemo(() => {
    const grouped = {
      critical: [] as DiscoveredProcess[],
      high: [] as DiscoveredProcess[],
      medium: [] as DiscoveredProcess[],
      low: [] as DiscoveredProcess[]
    };

    processes.forEach(process => {
      // Determine individual process risk level
      let processRisk: RiskLevel = 'low';
      
      if (process.pid < 1000) {
        processRisk = 'critical'; // System process
      } else if (process.category === 'rogue') {
        processRisk = 'high'; // Rogue process
      } else if (process.status === 'running' && (operation === 'terminate' || operation === 'restart')) {
        processRisk = 'medium'; // Running process being affected
      }

      grouped[processRisk].push(process);
    });

    return grouped;
  }, [processes, operation]);

  const handleConfirmationToggle = useCallback((confirmation: string) => {
    setConfirmationChecks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(confirmation)) {
        newSet.delete(confirmation);
      } else {
        newSet.add(confirmation);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-6 border-b border-border',
          riskConfig.backgroundColor,
          riskConfig.borderColor
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background/20 rounded-full">
              <span className="text-xl">{operationConfig.icon}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Safety Confirmation Required
              </h2>
              <p className="text-sm text-muted-foreground">
                {operationConfig.label} • {processes.length} processes
              </p>
            </div>
          </div>

          {/* Risk Level Badge */}
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border',
            riskConfig.color,
            riskConfig.backgroundColor,
            riskConfig.borderColor
          )}>
            <span className="text-lg">{riskConfig.icon}</span>
            <div>
              <div className="font-semibold text-sm">
                {riskConfig.label}
              </div>
              <div className="text-xs opacity-80">
                Overall Assessment
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Override Warning */}
        {emergencyOverrideMode && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <span className="text-xl">🚨</span>
              <div>
                <h3 className="font-semibold">Emergency Override Active</h3>
                <p className="text-sm">Safety checks are bypassed. Operation will proceed without validation.</p>
              </div>
            </div>
          </div>
        )}

        {/* Operation Warning */}
        {operationConfig.warningMessage && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <span>⚠️</span>
              <p className="text-sm font-medium">{operationConfig.warningMessage}</p>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Risk Assessment Summary */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Risk Assessment
            </h3>
            
            <div className={cn(
              'p-4 rounded-lg border',
              riskConfig.backgroundColor,
              riskConfig.borderColor
            )}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{riskConfig.icon}</span>
                <div className="flex-1">
                  <h4 className={cn('font-medium', riskConfig.color)}>
                    {riskConfig.label}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {riskConfig.description}
                  </p>
                  
                  {/* Risk Factors */}
                  {impact.riskFactors && impact.riskFactors.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-foreground mb-2">
                        Risk Factors:
                      </h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {impact.riskFactors.map((factor, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span>•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Impact Assessment */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Impact Assessment
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Affected Workspaces */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">
                  Affected Workspaces
                </h4>
                {impact.affectedWorkspaces && impact.affectedWorkspaces.length > 0 ? (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {impact.affectedWorkspaces.map((workspace, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span>📁</span>
                        <span>{workspace}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No workspaces identified</p>
                )}
              </div>

              {/* Operation Details */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">
                  Operation Details
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Processes: {impact.processCount}</div>
                  <div>Estimated Time: {impact.estimatedDowntime}</div>
                  {impact.rollbackPlan && (
                    <div>Rollback: Available</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Process Breakdown by Risk */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Process Risk Analysis
            </h3>
            
            <div className="space-y-3">
              {Object.entries(processesByRisk).map(([riskLevel, riskProcesses]) => {
                if (riskProcesses.length === 0) return null;
                
                const riskLevelConfig = RISK_LEVEL_CONFIG[riskLevel as RiskLevel];
                
                return (
                  <div
                    key={riskLevel}
                    className={cn(
                      'p-3 rounded-lg border',
                      riskLevelConfig.backgroundColor,
                      riskLevelConfig.borderColor
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span>{riskLevelConfig.icon}</span>
                      <h4 className={cn('font-medium', riskLevelConfig.color)}>
                        {riskLevelConfig.label} ({riskProcesses.length})
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {riskProcesses.slice(0, showAdvancedDetails ? undefined : 3).map(process => (
                        <div key={process.pid} className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-mono">{process.pid}</span>
                          <span className="truncate">{process.command}</span>
                          {process.workspace && (
                            <span className="text-xs bg-background/20 px-1 rounded">
                              {process.workspace}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {!showAdvancedDetails && riskProcesses.length > 3 && (
                      <button
                        onClick={() => setShowAdvancedDetails(true)}
                        className="text-xs text-muted-foreground hover:text-foreground mt-2"
                      >
                        Show {riskProcesses.length - 3} more processes...
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Required Confirmations */}
          {!emergencyOverrideMode && evaluation.requiredConfirmations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Required Confirmations
              </h3>
              
              <div className="space-y-3">
                {evaluation.requiredConfirmations.map((confirmation, index) => (
                  <label
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={confirmationChecks.has(confirmation)}
                      onChange={() => handleConfirmationToggle(confirmation)}
                      className="mt-0.5 rounded border-border"
                    />
                    <span className="text-sm text-foreground">
                      {confirmation}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Typed Confirmation for High-Risk Operations */}
          {!emergencyOverrideMode && requiresTypedConfirmation && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Final Confirmation
              </h3>
              
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                  This operation has been classified as <strong>{evaluation.overallRisk} risk</strong>.
                  To proceed, please type <strong>CONFIRM</strong> in the field below:
                </p>
                
                <input
                  type="text"
                  value={userConfirmation}
                  onChange={(e) => setUserConfirmation(e.target.value)}
                  placeholder="Type CONFIRM to proceed"
                  className={cn(
                    'w-full px-3 py-2 border rounded-md bg-background',
                    typedConfirmationValid 
                      ? 'border-green-300 dark:border-green-700'
                      : 'border-orange-300 dark:border-orange-700'
                  )}
                />
                
                {userConfirmation && !typedConfirmationValid && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Please type "CONFIRM" exactly as shown
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Rollback Plan */}
          {impact.rollbackPlan && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Rollback Plan
              </h3>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">💡</span>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {impact.rollbackPlan}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="flex items-center gap-4">
            {/* Advanced Details Toggle */}
            <button
              onClick={() => setShowAdvancedDetails(prev => !prev)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvancedDetails ? 'Hide' : 'Show'} advanced details
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={onConfirm}
              disabled={!canProceed}
              className={cn(
                'px-6 py-2 text-sm font-medium rounded-md transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                emergencyOverrideMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : evaluation.overallRisk === 'high' || evaluation.overallRisk === 'critical'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              )}
            >
              {emergencyOverrideMode && '🚨 '}
              Confirm & Execute
              {emergencyOverrideMode && ' (Override)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyConfirmationDialog;