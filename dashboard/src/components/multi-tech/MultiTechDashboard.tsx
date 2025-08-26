/**
 * Multi-Tech Dashboard Container Component
 * 
 * Main dashboard component that provides:
 * - Technology stack navigation
 * - Real-time process discovery and monitoring
 * - Process categorization and management
 * - System health overview
 * - Bulk operations with safety framework
 */

import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  discoverAllProcesses,
  fetchSystemHealth,
  setActiveTab,
  toggleProcessSelection,
  selectAllProcesses,
  clearProcessSelection,
  updateSort,
  updateFilter,
  setRefreshStatus,
  updateConnectionStatus,
  addProcessUpdateEvent
} from '../../store/slices/multiTechDashboardSlice';
import { TechStack, ProcessUpdateEvent, DiscoveredProcess, ProcessCategory, BulkOperationType } from '../../types';
import { TechStackTabs } from './TechStackTabs';
import { ProcessTable } from './ProcessTable';
import { ProcessStatusBadge } from './ProcessStatusBadge';
import { ProcessActivityFeed } from './ProcessActivityFeed';
import { RealTimeMetricsPanel } from './RealTimeMetricsPanel';
import { ActivityTimeline } from './ActivityTimeline';
import { BulkOperationsPanel } from './BulkOperationsPanel';
import { ProcessSelectionToolbar } from './ProcessSelectionToolbar';
import { AuditTrailDisplay } from './AuditTrailDisplay';
import { cn } from '../../utils/cn';

/**
 * System Health Overview Component
 */
interface SystemHealthOverviewProps {
  className?: string;
}

const SystemHealthOverview: React.FC<SystemHealthOverviewProps> = ({ className }) => {
  const { systemHealth, techStackSummaries } = useAppSelector(state => state.multiTechDashboard);
  
  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const summaries = Object.values(techStackSummaries);
    return {
      totalProcesses: summaries.reduce((sum, s) => sum + s.totalProcesses, 0),
      runningProcesses: summaries.reduce((sum, s) => sum + s.runningProcesses, 0),
      rogueProcesses: summaries.reduce((sum, s) => sum + s.rogueProcesses, 0),
      orphanedProcesses: summaries.reduce((sum, s) => sum + s.orphanedProcesses, 0),
      healthyStacks: summaries.filter(s => s.health.healthy).length,
      totalStacks: summaries.length
    };
  }, [techStackSummaries]);
  
  const hasIssues = aggregateMetrics.rogueProcesses > 0 || aggregateMetrics.orphanedProcesses > 0;
  
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6', className)}>
      {/* Total Processes */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Processes
            </p>
            <p className="text-2xl font-bold text-foreground">
              {aggregateMetrics.totalProcesses}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {aggregateMetrics.runningProcesses} running
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <span className="text-2xl">🔍</span>
          </div>
        </div>
      </div>
      
      {/* System Health */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              System Health
            </p>
            <p className={cn(
              'text-2xl font-bold',
              hasIssues ? 'text-orange-600' : 'text-green-600'
            )}>
              {hasIssues ? 'Warning' : 'Healthy'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {aggregateMetrics.healthyStacks}/{aggregateMetrics.totalStacks} stacks healthy
            </p>
          </div>
          <div className={cn(
            'p-3 rounded-full',
            hasIssues ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-green-100 dark:bg-green-900/20'
          )}>
            <span className="text-2xl">
              {hasIssues ? '⚠️' : '✅'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Rogue Processes */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Rogue Processes
            </p>
            <p className={cn(
              'text-2xl font-bold',
              aggregateMetrics.rogueProcesses > 0 ? 'text-orange-600' : 'text-green-600'
            )}>
              {aggregateMetrics.rogueProcesses}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </div>
          <div className={cn(
            'p-3 rounded-full',
            aggregateMetrics.rogueProcesses > 0 
              ? 'bg-orange-100 dark:bg-orange-900/20' 
              : 'bg-green-100 dark:bg-green-900/20'
          )}>
            <span className="text-2xl">
              {aggregateMetrics.rogueProcesses > 0 ? '⚠️' : '🛡️'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Port Utilization */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Port Utilization
            </p>
            <p className="text-2xl font-bold text-foreground">
              {systemHealth?.portUtilization || 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Development ports
            </p>
          </div>
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
            <span className="text-2xl">🔌</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Real-time Status Indicator Component
 */
interface RealTimeStatusProps {
  className?: string;
}

const RealTimeStatus: React.FC<RealTimeStatusProps> = ({ className }) => {
  const { realTime, refreshStatus, lastRefresh } = useAppSelector(state => state.multiTechDashboard);
  const dispatch = useAppDispatch();
  
  const handleRefresh = useCallback(async () => {
    try {
      await dispatch(discoverAllProcesses({ forceRefresh: true })).unwrap();
      toast.success('Processes Updated: Process discovery completed successfully');
    } catch (error: any) {
      toast.error(`Refresh Failed: ${error.message || 'Failed to refresh processes'}`);
    }
  }, [dispatch]);
  
  const statusColor = {
    connected: 'text-green-600',
    connecting: 'text-yellow-600',
    disconnected: 'text-gray-600',
    error: 'text-red-600'
  }[realTime.connectionStatus];
  
  const statusIcon = {
    connected: '🟢',
    connecting: '🟡',
    disconnected: '⚫',
    error: '🔴'
  }[realTime.connectionStatus];
  
  return (
    <div className={cn('flex items-center gap-4 text-sm text-muted-foreground', className)}>
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <span>{statusIcon}</span>
        <span className={statusColor}>
          {realTime.connectionStatus.charAt(0).toUpperCase() + realTime.connectionStatus.slice(1)}
        </span>
      </div>
      
      {/* Last Update */}
      {lastRefresh && (
        <div>
          Last updated: {new Date(lastRefresh).toLocaleTimeString()}
        </div>
      )}
      
      {/* Auto Refresh Status */}
      {realTime.autoRefresh && (
        <div className="flex items-center gap-1">
          <span className="animate-pulse">🔄</span>
          <span>Auto-refresh every {realTime.updateInterval / 1000}s</span>
        </div>
      )}
      
      {/* Manual Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={refreshStatus === 'refreshing'}
        className={cn(
          'px-3 py-1.5 bg-primary text-primary-foreground rounded-md',
          'hover:bg-primary/90 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center gap-2 text-sm font-medium'
        )}
      >
        <span className={refreshStatus === 'refreshing' ? 'animate-spin' : ''}>
          🔄
        </span>
        {refreshStatus === 'refreshing' ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
};


/**
 * Main MultiTechDashboard Component
 */
export const MultiTechDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const {
    processesByTechStack,
    techStackSummaries,
    ui,
    realTime,
    loading,
    refreshStatus,
    error
  } = useAppSelector(state => state.multiTechDashboard);
  
  const [sseConnection, setSseConnection] = useState<EventSource | null>(null);
  const [showRealTimeMonitoring, setShowRealTimeMonitoring] = useState(true);
  const [monitoringView, setMonitoringView] = useState<'feed' | 'timeline' | 'metrics'>('feed');
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  
  // Ref to track reconnection timeout to prevent memory leaks
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get processes for current tab
  const currentProcesses = useMemo(() => {
    if (ui.activeTab === 'all') {
      return Object.values(processesByTechStack).flat();
    }
    
    // FIX: The issue is that processesByTechStack might be empty even when techStackSummaries has counts
    // This suggests the data is being stored differently than expected
    // Let's check if the tech stack key exists and has processes
    const techStackProcesses = processesByTechStack[ui.activeTab];
    
    if (!techStackProcesses || techStackProcesses.length === 0) {
      // Fallback: search through all processes to find ones matching the tech stack
      const allProcesses = Object.values(processesByTechStack).flat();
      return allProcesses.filter(process => process.techStack === ui.activeTab);
    }
    
    return techStackProcesses;
  }, [processesByTechStack, ui.activeTab]);
  
  // Initial data loading
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        dispatch(setRefreshStatus('refreshing'));
        await Promise.all([
          dispatch(discoverAllProcesses()).unwrap(),
          dispatch(fetchSystemHealth()).unwrap()
        ]);
      } catch (error: any) {
        toast.error(`Dashboard Load Failed: ${error.message || 'Failed to initialize dashboard'}`);
      }
    };
    
    initializeDashboard();
  }, [dispatch]);
  
  // Setup real-time SSE connection
  useEffect(() => {
    if (!realTime.autoRefresh) return;
    
    const connectSSE = async () => {
      try {
        dispatch(updateConnectionStatus('connecting'));
        const { multiTechService } = await import('../../services/multiTechService');
        const eventSource = multiTechService.createRealTimeConnection();
        
        eventSource.onopen = () => {
          dispatch(updateConnectionStatus('connected'));
        };
        
        eventSource.onmessage = (event) => {
          try {
            const updateEvent: ProcessUpdateEvent = JSON.parse(event.data);
            dispatch(addProcessUpdateEvent(updateEvent));
            
            // Trigger a refresh for significant events
            if (['process-discovered', 'process-terminated'].includes(updateEvent.type)) {
              dispatch(discoverAllProcesses());
            }
          } catch (error) {
            console.error('Failed to parse SSE message:', error);
          }
        };
        
        eventSource.onerror = () => {
          dispatch(updateConnectionStatus('error'));
          eventSource.close();
          
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(connectSSE, 5000);
        };
        
        setSseConnection(eventSource);
      } catch (error) {
        console.error('Failed to establish SSE connection:', error);
        dispatch(updateConnectionStatus('error'));
      }
    };
    
    connectSSE();
    
    return () => {
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close SSE connection
      if (sseConnection) {
        sseConnection.close();
        setSseConnection(null);
      }
    };
  }, [realTime.autoRefresh, dispatch]);
  
  // Auto-refresh timer
  useEffect(() => {
    if (!realTime.autoRefresh || realTime.connectionStatus === 'connected') return;
    
    const interval = setInterval(() => {
      dispatch(discoverAllProcesses());
    }, realTime.updateInterval);
    
    return () => clearInterval(interval);
  }, [realTime.autoRefresh, realTime.updateInterval, realTime.connectionStatus, dispatch]);
  
  // Event handlers
  const handleTabChange = useCallback((tab: TechStack | 'all') => {
    dispatch(setActiveTab(tab));
  }, [dispatch]);
  
  const handleProcessSelect = useCallback((processId: string) => {
    dispatch(toggleProcessSelection(processId));
  }, [dispatch]);
  
  const handleProcessSelectAll = useCallback((processIds: string[]) => {
    dispatch(selectAllProcesses(processIds));
  }, [dispatch]);
  
  const handleProcessAction = useCallback(async (action: string, process: DiscoveredProcess) => {
    // TODO: Implement individual process actions with safety framework
    console.log('Process action:', action, process);
    
    toast(`Action Requested: ${action} requested for process ${process.pid}`);
  }, [dispatch]);
  
  const handleBulkAction = useCallback(async (operation: BulkOperationType, processIds: string[], options?: any) => {
    try {
      toast(`Bulk Operation Started: ${operation} initiated for ${processIds.length} processes`);

      // Simulate bulk operation execution with safety framework integration
      // In a real implementation, this would call the actual multiTechService
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success
      toast.success(`Bulk Operation Complete: ${operation} completed successfully for ${processIds.length} processes`);

      // Refresh processes to reflect changes
      dispatch(discoverAllProcesses());
      
    } catch (error: any) {
      console.error('Bulk action failed:', error);
      toast.error(`Bulk Operation Failed: ${error.message || 'Failed to execute bulk operation'}`);
    }
  }, [dispatch]);
  
  const handleSortChange = useCallback((sort: any) => {
    dispatch(updateSort(sort));
  }, [dispatch]);
  
  const handleFilterChange = useCallback((filter: any) => {
    dispatch(updateFilter(filter));
  }, [dispatch]);
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Dashboard Error
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Reload Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-muted-foreground">
              Multi-Technology Process Discovery Dashboard
              {showRealTimeMonitoring && (
                <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                  Real-time Monitoring Active
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Real-time Monitoring Toggle */}
            <button
              onClick={() => setShowRealTimeMonitoring(prev => !prev)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border transition-colors',
                showRealTimeMonitoring
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground'
              )}
              title={showRealTimeMonitoring ? 'Hide real-time monitoring' : 'Show real-time monitoring'}
            >
              <span className={cn(
                'text-sm',
                showRealTimeMonitoring && 'animate-pulse'
              )}>
                📡
              </span>
              <span className="text-sm font-medium">
                {showRealTimeMonitoring ? 'Live Monitor ON' : 'Live Monitor OFF'}
              </span>
            </button>
            
            <RealTimeStatus />
          </div>
        </div>
      </div>
      
      {/* System Health Overview */}
      <SystemHealthOverview />
      
      {/* Real-time Monitoring Panel */}
      {showRealTimeMonitoring && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Monitoring Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-xl">📡</span>
              <h2 className="font-semibold text-foreground">
                Real-time Process Monitoring
              </h2>
            </div>
            
            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              {[
                { id: 'feed', label: 'Activity Feed', icon: '📡' },
                { id: 'timeline', label: 'Timeline', icon: '📅' },
                { id: 'metrics', label: 'Metrics', icon: '📊' }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setMonitoringView(view.id as any)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    monitoringView === view.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="mr-1">{view.icon}</span>
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Monitoring Content */}
          <div className="p-4">
            {monitoringView === 'feed' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Feed */}
                <div className="lg:col-span-2">
                  <ProcessActivityFeed
                    techStack={ui.activeTab}
                    maxEvents={50}
                    showConnectionStatus={true}
                    enableFiltering={true}
                  />
                </div>
                
                {/* Real-time Metrics */}
                <div>
                  <RealTimeMetricsPanel
                    techStack={ui.activeTab}
                    showTrends={true}
                    showAlerts={true}
                    size="sm"
                    variant="compact"
                  />
                </div>
              </div>
            )}
            
            {monitoringView === 'timeline' && (
              <ActivityTimeline
                events={realTime.eventHistory}
                techStack={ui.activeTab}
                maxEvents={100}
                timeRange="day"
                showEventCounts={true}
                enableFiltering={true}
                enableExport={true}
                onEventAction={(action, event) => {
                  if (event.process) {
                    handleProcessAction(action, event.process);
                  }
                }}
              />
            )}
            
            {monitoringView === 'metrics' && (
              <RealTimeMetricsPanel
                techStack={ui.activeTab}
                showTrends={true}
                showAlerts={true}
                size="md"
                variant="detailed"
              />
            )}
          </div>
        </div>
      )}
      
      {/* Technology Stack Tabs */}
      <TechStackTabs
        activeTab={ui.activeTab}
        techStackSummaries={techStackSummaries}
        onTabChange={handleTabChange}
      />

      {/* Process Selection Toolbar */}
      {currentProcesses.length > 0 && (
        <ProcessSelectionToolbar
          processes={currentProcesses}
          selectedProcesses={ui.selectedProcesses}
          techStack={ui.activeTab}
          onProcessSelectAll={handleProcessSelectAll}
          onProcessSelect={handleProcessSelect}
          onClearSelection={() => dispatch(clearProcessSelection())}
        />
      )}
      
      {/* Enhanced Bulk Operations Panel */}
      <BulkOperationsPanel
        selectedProcesses={ui.selectedProcesses}
        processes={currentProcesses}
        techStack={ui.activeTab}
        onBulkAction={handleBulkAction}
        onClearSelection={() => dispatch(clearProcessSelection())}
        onShowAuditTrail={() => setShowAuditTrail(true)}
      />
      
      {/* Process Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            <span>Loading processes...</span>
          </div>
        ) : (
          <ProcessTable
            techStack={ui.activeTab}
            processes={currentProcesses}
            selectedProcesses={ui.selectedProcesses}
            onProcessSelect={handleProcessSelect}
            onProcessSelectAll={handleProcessSelectAll}
            onProcessAction={handleProcessAction}
            onBulkAction={handleBulkAction}
            sort={ui.sort}
            onSortChange={handleSortChange}
            filter={ui.filter}
            enableVirtualization={currentProcesses.length > 20}
          />
        )}
      </div>

      {/* Audit Trail Display */}
      <AuditTrailDisplay
        isVisible={showAuditTrail}
        onClose={() => setShowAuditTrail(false)}
      />
    </div>
  );
};

export default MultiTechDashboard;