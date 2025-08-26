/**
 * Real-time Process Monitoring Hook
 * 
 * Custom hook for 5-second refresh cycle with change detection:
 * - Automatic process discovery refresh
 * - Change detection between refresh cycles  
 * - SSE connection management
 * - Performance optimization
 * - Error handling and reconnection logic
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  discoverAllProcesses,
  updateConnectionStatus,
  addProcessUpdateEvent,
  batchAddProcessUpdateEvents,
  setReconnectAttempts,
  resetReconnectAttempts,
  setRefreshStatus
} from '../store/slices/multiTechDashboardSlice';
import toast from 'react-hot-toast';
import { DiscoveredProcess, ProcessUpdateEvent } from '../types';

interface UseRealTimeProcessMonitoringOptions {
  enabled?: boolean;
  refreshInterval?: number;
  enableSSE?: boolean;
  maxReconnectAttempts?: number;
  onProcessChange?: (changes: ProcessChangeEvent[]) => void;
}

interface ProcessChangeEvent {
  type: 'added' | 'removed' | 'modified';
  process: DiscoveredProcess;
  previousProcess?: DiscoveredProcess;
  changes?: Partial<DiscoveredProcess>;
}

export const useRealTimeProcessMonitoring = ({
  enabled = true,
  refreshInterval = 5000,
  enableSSE = true,
  maxReconnectAttempts = 5,
  onProcessChange
}: UseRealTimeProcessMonitoringOptions = {}) => {
  const dispatch = useAppDispatch();
  const { processesByTechStack, realTime } = useAppSelector(state => state.multiTechDashboard);
  
  // Refs for maintaining state across renders
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const lastProcessMapRef = useRef<Map<string, DiscoveredProcess>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Local state
  const [isConnecting, setIsConnecting] = useState(false);
  const [changeStats, setChangeStats] = useState({
    totalChanges: 0,
    newProcesses: 0,
    terminatedProcesses: 0,
    modifiedProcesses: 0,
    lastChangeTime: null as Date | null
  });
  
  /**
   * Create a process map from current state for change detection
   */
  const createProcessMap = useCallback((processes: Record<string, DiscoveredProcess[]>) => {
    const processMap = new Map<string, DiscoveredProcess>();
    Object.values(processes).flat().forEach(process => {
      processMap.set(`${process.pid}`, process);
    });
    return processMap;
  }, []);
  
  /**
   * Detect changes between process maps
   */
  const detectProcessChanges = useCallback((
    previousMap: Map<string, DiscoveredProcess>,
    currentMap: Map<string, DiscoveredProcess>
  ): ProcessChangeEvent[] => {
    const changes: ProcessChangeEvent[] = [];
    
    // Find new and modified processes
    currentMap.forEach((currentProcess, pid) => {
      const previousProcess = previousMap.get(pid);
      
      if (!previousProcess) {
        // New process
        changes.push({
          type: 'added',
          process: currentProcess
        });
      } else {
        // Check for modifications
        const processChanges: Partial<DiscoveredProcess> = {};
        
        if (previousProcess.status !== currentProcess.status) {
          processChanges.status = currentProcess.status;
        }
        
        if (previousProcess.category !== currentProcess.category) {
          processChanges.category = currentProcess.category;
        }
        
        if (previousProcess.workspace !== currentProcess.workspace) {
          processChanges.workspace = currentProcess.workspace;
        }
        
        if (previousProcess.health !== currentProcess.health) {
          processChanges.health = currentProcess.health;
        }
        
        if (Object.keys(processChanges).length > 0) {
          changes.push({
            type: 'modified',
            process: currentProcess,
            previousProcess,
            changes: processChanges
          });
        }
      }
    });
    
    // Find removed processes
    previousMap.forEach((previousProcess, pid) => {
      if (!currentMap.has(pid)) {
        changes.push({
          type: 'removed',
          process: previousProcess
        });
      }
    });
    
    return changes;
  }, []);
  
  /**
   * Handle process changes and generate events
   */
  const handleProcessChanges = useCallback((changes: ProcessChangeEvent[]) => {
    if (changes.length === 0) return;
    
    const events: ProcessUpdateEvent[] = changes.map(change => {
      const baseEvent = {
        timestamp: new Date().toISOString(),
        process: change.process,
        techStack: change.process.techStack,
        metadata: { source: 'change-detection' }
      };
      
      switch (change.type) {
        case 'added':
          return {
            ...baseEvent,
            type: 'process-discovered' as const
          };
        case 'removed':
          return {
            ...baseEvent,
            type: 'process-terminated' as const
          };
        case 'modified':
          return {
            ...baseEvent,
            type: change.changes?.category ? 'process-categorized' as const : 'process-updated' as const,
            changes: change.changes
          };
        default:
          return {
            ...baseEvent,
            type: 'process-updated' as const
          };
      }
    });
    
    // Batch add events for better performance
    dispatch(batchAddProcessUpdateEvents(events));
    
    // Update stats
    setChangeStats(prev => ({
      totalChanges: prev.totalChanges + changes.length,
      newProcesses: prev.newProcesses + changes.filter(c => c.type === 'added').length,
      terminatedProcesses: prev.terminatedProcesses + changes.filter(c => c.type === 'removed').length,
      modifiedProcesses: prev.modifiedProcesses + changes.filter(c => c.type === 'modified').length,
      lastChangeTime: new Date()
    }));
    
    // Call external change handler
    if (onProcessChange) {
      onProcessChange(changes);
    }
    
    // Show notifications for significant changes
    const newProcessCount = changes.filter(c => c.type === 'added').length;
    const terminatedProcessCount = changes.filter(c => c.type === 'removed').length;
    
    if (newProcessCount > 0) {
      toast.success(`New Processes Detected: ${newProcessCount} new ${newProcessCount === 1 ? 'process' : 'processes'} discovered`);
    }
    
    if (terminatedProcessCount > 0) {
      toast.success(`Processes Terminated: ${terminatedProcessCount} ${terminatedProcessCount === 1 ? 'process' : 'processes'} terminated`);
    }
  }, [dispatch, onProcessChange]);
  
  /**
   * Perform process discovery and change detection
   */
  const refreshProcesses = useCallback(async () => {
    try {
      dispatch(setRefreshStatus('refreshing'));
      
      // Capture current state before refresh
      const previousProcessMap = createProcessMap(processesByTechStack);
      
      // Perform discovery
      const result = await dispatch(discoverAllProcesses({ forceRefresh: true })).unwrap();
      
      // Create new process map from results
      const newProcessMap = new Map<string, DiscoveredProcess>();
      if (result.techStackResults) {
        Object.values(result.techStackResults).forEach(stackResult => {
          if (stackResult.success && stackResult.processes) {
            stackResult.processes.forEach(process => {
              newProcessMap.set(`${process.pid}`, process);
            });
          }
        });
      }
      
      // Detect and handle changes
      const changes = detectProcessChanges(previousProcessMap, newProcessMap);
      handleProcessChanges(changes);
      
      // Update reference for next cycle
      lastProcessMapRef.current = newProcessMap;
      
      dispatch(setRefreshStatus('success'));
      
    } catch (error: any) {
      console.error('Process refresh failed:', error);
      dispatch(setRefreshStatus('error'));
      toast.error(`Refresh Failed: ${error.message || 'Failed to refresh process data'}`);
    }
  }, [dispatch, processesByTechStack, createProcessMap, detectProcessChanges, handleProcessChanges]);
  
  /**
   * Setup SSE connection with exponential backoff
   */
  const connectSSE = useCallback(async () => {
    if (!enableSSE || sseRef.current || isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      dispatch(updateConnectionStatus('connecting'));
      
      const { multiTechService } = await import('../services/multiTechService');
      const eventSource = multiTechService.createRealTimeConnection();
      
      eventSource.onopen = () => {
        console.log('SSE connection established');
        dispatch(updateConnectionStatus('connected'));
        dispatch(resetReconnectAttempts());
        setIsConnecting(false);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const updateEvent: ProcessUpdateEvent = JSON.parse(event.data);
          dispatch(addProcessUpdateEvent(updateEvent));
          
          // Trigger a refresh for significant events
          if (['process-discovered', 'process-terminated'].includes(updateEvent.type)) {
            setTimeout(refreshProcesses, 1000);
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };
      
      eventSource.onerror = () => {
        console.error('SSE connection error');
        dispatch(updateConnectionStatus('error'));
        eventSource.close();
        sseRef.current = null;
        setIsConnecting(false);
        
        // Implement exponential backoff for reconnection
        const currentAttempts = realTime.reconnectAttempts || 0;
        if (currentAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, currentAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${currentAttempts + 1})`);
          
          dispatch(setReconnectAttempts(currentAttempts + 1));
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
          toast.error('Connection Lost: Real-time connection could not be established after multiple attempts');
        }
      };
      
      sseRef.current = eventSource;
      
    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      dispatch(updateConnectionStatus('error'));
      setIsConnecting(false);
    }
  }, [dispatch, realTime.reconnectAttempts, maxReconnectAttempts, enableSSE, isConnecting, refreshProcesses]);
  
  /**
   * Cleanup SSE connection
   */
  const disconnectSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    dispatch(updateConnectionStatus('disconnected'));
    setIsConnecting(false);
  }, [dispatch]);
  
  /**
   * Manual reconnect function
   */
  const reconnect = useCallback(() => {
    disconnectSSE();
    dispatch(resetReconnectAttempts());
    setTimeout(connectSSE, 1000);
  }, [disconnectSSE, connectSSE, dispatch]);
  
  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(() => {
    if (!enabled) return;
    
    // Start refresh interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(refreshProcesses, refreshInterval);
    
    // Initial refresh
    refreshProcesses();
    
    // Initialize process map
    lastProcessMapRef.current = createProcessMap(processesByTechStack);
    
    // Connect SSE
    if (enableSSE) {
      connectSSE();
    }
  }, [enabled, refreshInterval, enableSSE, refreshProcesses, createProcessMap, processesByTechStack, connectSSE]);
  
  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    disconnectSSE();
  }, [disconnectSSE]);
  
  // Effect to manage monitoring lifecycle
  useEffect(() => {
    if (enabled) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    
    return stopMonitoring;
  }, [enabled, startMonitoring, stopMonitoring]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);
  
  return {
    // State
    isMonitoring: enabled && !!intervalRef.current,
    connectionStatus: realTime.connectionStatus,
    isConnecting,
    reconnectAttempts: realTime.reconnectAttempts || 0,
    maxReconnectAttempts,
    changeStats,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    refreshProcesses,
    reconnect,
    
    // Utilities
    clearChangeStats: () => setChangeStats({
      totalChanges: 0,
      newProcesses: 0,
      terminatedProcesses: 0,
      modifiedProcesses: 0,
      lastChangeTime: null
    })
  };
};

export default useRealTimeProcessMonitoring;