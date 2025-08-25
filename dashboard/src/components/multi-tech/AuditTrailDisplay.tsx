/**
 * Audit Trail Display Component
 * 
 * Sprint 7 - Story 3.9: Bulk Operations & Safety Controls
 * 
 * Comprehensive audit trail display for tracking all bulk operations with:
 * - Chronological operation history
 * - Safety decision logging
 * - User action tracking
 * - Emergency override audit
 * - Filtering and search capabilities
 * - Export functionality
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  BulkOperationType, 
  RiskLevel 
} from '../../types';
import { cn } from '../../utils/cn';

/**
 * Audit Log Entry Interface
 */
interface AuditLogEntry {
  id: string;
  timestamp: string;
  operation: BulkOperationType | 'safety_evaluation' | 'emergency_override' | 'user_action';
  operationType: 'bulk_operation' | 'safety_decision' | 'system_event' | 'user_action';
  user: string;
  processCount?: number;
  riskLevel?: RiskLevel;
  decision: 'allowed' | 'blocked' | 'confirmation_required' | 'emergency_override';
  details: {
    processIds?: string[];
    safetyReasoning?: string;
    impactAssessment?: string;
    confirmationRequired?: boolean;
    emergencyOverride?: boolean;
    error?: string;
    duration?: number;
    successCount?: number;
    errorCount?: number;
  };
  hash?: string; // Tamper-proof hash for audit integrity
}

/**
 * Filter Options for Audit Trail
 */
interface AuditTrailFilter {
  operation?: BulkOperationType | 'all';
  operationType?: AuditLogEntry['operationType'] | 'all';
  decision?: AuditLogEntry['decision'] | 'all';
  riskLevel?: RiskLevel | 'all';
  user?: string;
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'all';
  searchQuery?: string;
}

interface AuditTrailDisplayProps {
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * Mock Audit Data (In real implementation, this would come from the Agent Safety Framework)
 */
const generateMockAuditData = (): AuditLogEntry[] => {
  const operations: BulkOperationType[] = ['terminate', 'restart', 'cleanup', 'associate_workspace'];
  const users = ['admin', 'developer', 'system'];
  const decisions: AuditLogEntry['decision'][] = ['allowed', 'blocked', 'confirmation_required', 'emergency_override'];
  const riskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
  
  const entries: AuditLogEntry[] = [];
  
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const decision = decisions[Math.floor(Math.random() * decisions.length)];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const processCount = Math.floor(Math.random() * 20) + 1;
    
    entries.push({
      id: `audit_${i}`,
      timestamp,
      operation,
      operationType: 'bulk_operation',
      user,
      processCount,
      riskLevel,
      decision,
      details: {
        processIds: Array.from({ length: processCount }, (_, idx) => `${1000 + idx}`),
        safetyReasoning: `${riskLevel} risk assessment based on process analysis`,
        confirmationRequired: decision === 'confirmation_required',
        emergencyOverride: decision === 'emergency_override',
        duration: Math.floor(Math.random() * 30000) + 1000,
        successCount: decision === 'blocked' ? 0 : processCount,
        errorCount: decision === 'blocked' ? 0 : Math.floor(Math.random() * 3)
      },
      hash: `sha256_${Math.random().toString(36).substring(2)}`
    });
  }
  
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

/**
 * Operation Icons and Configuration
 */
const OPERATION_CONFIG: Record<string, {
  icon: string;
  label: string;
  color: string;
}> = {
  terminate: { icon: '⚠️', label: 'Terminate', color: 'red' },
  restart: { icon: '🔄', label: 'Restart', color: 'orange' },
  cleanup: { icon: '🧹', label: 'Cleanup', color: 'yellow' },
  correlate: { icon: '🔗', label: 'Correlate', color: 'blue' },
  change_status: { icon: '📋', label: 'Change Status', color: 'indigo' },
  associate_workspace: { icon: '🔗', label: 'Associate', color: 'green' },
  export_data: { icon: '📥', label: 'Export', color: 'purple' },
  safety_evaluation: { icon: '🛡️', label: 'Safety Check', color: 'blue' },
  emergency_override: { icon: '🚨', label: 'Emergency Override', color: 'red' },
  user_action: { icon: '👤', label: 'User Action', color: 'gray' }
};

/**
 * Decision Status Configuration
 */
const DECISION_CONFIG: Record<AuditLogEntry['decision'], {
  icon: string;
  label: string;
  color: string;
}> = {
  allowed: { icon: '✅', label: 'Allowed', color: 'green' },
  blocked: { icon: '❌', label: 'Blocked', color: 'red' },
  confirmation_required: { icon: '⚠️', label: 'Confirmation Required', color: 'orange' },
  emergency_override: { icon: '🚨', label: 'Emergency Override', color: 'red' }
};

/**
 * Risk Level Configuration
 */
const RISK_LEVEL_CONFIG: Record<RiskLevel, {
  icon: string;
  label: string;
  color: string;
}> = {
  low: { icon: '🟢', label: 'Low', color: 'green' },
  medium: { icon: '🟡', label: 'Medium', color: 'yellow' },
  high: { icon: '🟠', label: 'High', color: 'orange' },
  critical: { icon: '🔴', label: 'Critical', color: 'red' }
};

/**
 * Main Audit Trail Display Component
 */
export const AuditTrailDisplay: React.FC<AuditTrailDisplayProps> = ({
  isVisible,
  onClose,
  className
}) => {
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [filter, setFilter] = useState<AuditTrailFilter>({
    operation: 'all',
    operationType: 'all',
    decision: 'all',
    riskLevel: 'all',
    timeRange: 'week',
    searchQuery: ''
  });
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load audit data
  useEffect(() => {
    if (isVisible) {
      setIsLoading(true);
      // Simulate loading delay
      setTimeout(() => {
        setAuditEntries(generateMockAuditData());
        setIsLoading(false);
      }, 1000);
    }
  }, [isVisible]);

  // Filter and search audit entries
  const filteredEntries = useMemo(() => {
    return auditEntries.filter(entry => {
      // Operation filter
      if (filter.operation !== 'all' && entry.operation !== filter.operation) {
        return false;
      }

      // Operation type filter
      if (filter.operationType !== 'all' && entry.operationType !== filter.operationType) {
        return false;
      }

      // Decision filter
      if (filter.decision !== 'all' && entry.decision !== filter.decision) {
        return false;
      }

      // Risk level filter
      if (filter.riskLevel !== 'all' && entry.riskLevel !== filter.riskLevel) {
        return false;
      }

      // User filter
      if (filter.user && entry.user !== filter.user) {
        return false;
      }

      // Time range filter
      if (filter.timeRange !== 'all') {
        const entryTime = new Date(entry.timestamp);
        const now = new Date();
        const timeDiff = now.getTime() - entryTime.getTime();
        
        const timeRanges = {
          hour: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000
        };

        if (timeDiff > timeRanges[filter.timeRange]) {
          return false;
        }
      }

      // Search query filter
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const searchable = [
          entry.operation,
          entry.user,
          entry.details.safetyReasoning || '',
          entry.details.impactAssessment || '',
          ...(entry.details.processIds || [])
        ].join(' ').toLowerCase();
        
        if (!searchable.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [auditEntries, filter]);

  // Toggle entry details
  const toggleDetails = useCallback((entryId: string) => {
    setShowDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);

  // Export audit data
  const exportAuditData = useCallback(() => {
    const dataStr = JSON.stringify(filteredEntries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredEntries]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={cn(
        'bg-card border border-border rounded-lg shadow-2xl',
        'max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Operation Audit Trail
              </h2>
              <p className="text-sm text-muted-foreground">
                Comprehensive safety and operation logging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportAuditData}
              className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors text-sm font-medium"
            >
              📥 Export
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="Close audit trail"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Operation Filter */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Operation
              </label>
              <select
                value={filter.operation || 'all'}
                onChange={(e) => setFilter(prev => ({ 
                  ...prev, 
                  operation: e.target.value as AuditTrailFilter['operation'] 
                }))}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
              >
                <option value="all">All Operations</option>
                {Object.entries(OPERATION_CONFIG).map(([op, config]) => (
                  <option key={op} value={op}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Decision Filter */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Decision
              </label>
              <select
                value={filter.decision || 'all'}
                onChange={(e) => setFilter(prev => ({ 
                  ...prev, 
                  decision: e.target.value as AuditTrailFilter['decision'] 
                }))}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
              >
                <option value="all">All Decisions</option>
                {Object.entries(DECISION_CONFIG).map(([decision, config]) => (
                  <option key={decision} value={decision}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Level Filter */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Risk Level
              </label>
              <select
                value={filter.riskLevel || 'all'}
                onChange={(e) => setFilter(prev => ({ 
                  ...prev, 
                  riskLevel: e.target.value as AuditTrailFilter['riskLevel'] 
                }))}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
              >
                <option value="all">All Risk Levels</option>
                {Object.entries(RISK_LEVEL_CONFIG).map(([risk, config]) => (
                  <option key={risk} value={risk}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Time Range
              </label>
              <select
                value={filter.timeRange || 'week'}
                onChange={(e) => setFilter(prev => ({ 
                  ...prev, 
                  timeRange: e.target.value as AuditTrailFilter['timeRange'] 
                }))}
                className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
              >
                <option value="hour">Last Hour</option>
                <option value="day">Last Day</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search operations, users, process IDs..."
              value={filter.searchQuery || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border rounded bg-background placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-foreground">
                {filteredEntries.length}
              </div>
              <div className="text-xs text-muted-foreground">Total Entries</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {filteredEntries.filter(e => e.decision === 'allowed').length}
              </div>
              <div className="text-xs text-muted-foreground">Allowed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {filteredEntries.filter(e => e.decision === 'blocked').length}
              </div>
              <div className="text-xs text-muted-foreground">Blocked</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {filteredEntries.filter(e => e.decision === 'emergency_override').length}
              </div>
              <div className="text-xs text-muted-foreground">Overrides</div>
            </div>
          </div>
        </div>

        {/* Audit Entries */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <span>Loading audit trail...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No audit entries found
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                No entries match your current filters. Try adjusting the time range or search criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredEntries.map(entry => {
                const operationConfig = OPERATION_CONFIG[entry.operation] || OPERATION_CONFIG.user_action;
                const decisionConfig = DECISION_CONFIG[entry.decision];
                const riskConfig = entry.riskLevel ? RISK_LEVEL_CONFIG[entry.riskLevel] : null;
                const showEntryDetails = showDetails.has(entry.id);

                return (
                  <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors">
                    {/* Entry Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{operationConfig.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {operationConfig.label}
                            </span>
                            {entry.processCount && (
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {entry.processCount} processes
                              </span>
                            )}
                            {riskConfig && (
                              <span className={cn(
                                'text-xs px-2 py-1 rounded',
                                `bg-${riskConfig.color}-100 dark:bg-${riskConfig.color}-900/20`,
                                `text-${riskConfig.color}-700 dark:text-${riskConfig.color}-300`
                              )}>
                                {riskConfig.icon} {riskConfig.label}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            by {entry.user} • {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Decision Badge */}
                        <span className={cn(
                          'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                          `bg-${decisionConfig.color}-100 dark:bg-${decisionConfig.color}-900/20`,
                          `text-${decisionConfig.color}-700 dark:text-${decisionConfig.color}-300`
                        )}>
                          {decisionConfig.icon} {decisionConfig.label}
                        </span>

                        {/* Details Toggle */}
                        <button
                          onClick={() => toggleDetails(entry.id)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title={showEntryDetails ? 'Hide details' : 'Show details'}
                        >
                          <span className={cn(
                            'text-sm transition-transform',
                            showEntryDetails && 'rotate-90'
                          )}>
                            ▶️
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Entry Details */}
                    {showEntryDetails && (
                      <div className="mt-3 p-4 bg-muted/20 rounded-lg space-y-3">
                        {/* Safety Reasoning */}
                        {entry.details.safetyReasoning && (
                          <div>
                            <h5 className="text-sm font-medium text-foreground mb-1">
                              Safety Assessment
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              {entry.details.safetyReasoning}
                            </p>
                          </div>
                        )}

                        {/* Process Details */}
                        {entry.details.processIds && entry.details.processIds.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-foreground mb-1">
                              Affected Processes ({entry.details.processIds.length})
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {entry.details.processIds.slice(0, 10).map(pid => (
                                <span key={pid} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                  {pid}
                                </span>
                              ))}
                              {entry.details.processIds.length > 10 && (
                                <span className="text-xs text-muted-foreground px-2 py-1">
                                  +{entry.details.processIds.length - 10} more...
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Execution Results */}
                        {(entry.details.successCount !== undefined || entry.details.errorCount !== undefined) && (
                          <div>
                            <h5 className="text-sm font-medium text-foreground mb-1">
                              Execution Results
                            </h5>
                            <div className="flex gap-4 text-sm">
                              {entry.details.successCount !== undefined && (
                                <div className="flex items-center gap-1">
                                  <span className="text-green-600 dark:text-green-400">✅</span>
                                  <span>Success: {entry.details.successCount}</span>
                                </div>
                              )}
                              {entry.details.errorCount !== undefined && entry.details.errorCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-red-600 dark:text-red-400">❌</span>
                                  <span>Errors: {entry.details.errorCount}</span>
                                </div>
                              )}
                              {entry.details.duration && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">⏱️</span>
                                  <span>Duration: {entry.details.duration}ms</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Hash for Audit Integrity */}
                        {entry.hash && (
                          <div>
                            <h5 className="text-sm font-medium text-foreground mb-1">
                              Audit Hash (Tamper-Proof)
                            </h5>
                            <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                              {entry.hash}
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrailDisplay;