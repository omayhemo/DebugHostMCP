/**
 * Process Activity Feed Component
 * 
 * Live stream of process events with real-time updates:
 * - Process start/stop/change events
 * - Technology-specific activity filtering
 * - 5-second refresh cycle with change detection
 * - Visual indicators for different event types
 * - Connection status monitoring
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { ProcessUpdateEvent, TechStack, DiscoveredProcess, ProcessCategory, ConnectionStatus } from '../../types';
import { 
  addProcessUpdateEvent, 
  updateConnectionStatus,
  discoverAllProcesses 
} from '../../store/slices/multiTechDashboardSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { cn } from '../../utils/cn';
import { ProcessEventItem } from './ProcessEventItem';
import { ChangeDetectionIndicator } from './ChangeDetectionIndicator';
import { ConnectionStatusMonitor } from './ConnectionStatusMonitor';

interface ProcessActivityFeedProps {
  techStack?: TechStack | 'all';
  maxEvents?: number;
  showConnectionStatus?: boolean;
  enableFiltering?: boolean;
  className?: string;
}

/**
 * Event type configuration for filtering and display
 */
const EVENT_TYPE_CONFIG = {
  'process-discovered': {
    label: 'Process Started',
    icon: '🚀',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    priority: 'medium' as const
  },
  'process-terminated': {
    label: 'Process Stopped',
    icon: '⏹️',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    priority: 'high' as const
  },
  'process-updated': {
    label: 'Process Changed',
    icon: '🔄',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    priority: 'low' as const
  },
  'process-categorized': {
    label: 'Category Changed',
    icon: '🏷️',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    priority: 'medium' as const
  }
} as const;

/**
 * Activity Filter Controls Component
 */
interface ActivityFilterProps {
  selectedEventTypes: string[];
  onEventTypeToggle: (eventType: string) => void;
  selectedTechStacks: TechStack[];
  onTechStackToggle: (techStack: TechStack) => void;
  showOnlyHighPriority: boolean;
  onPriorityToggle: () => void;
}

const ActivityFilter: React.FC<ActivityFilterProps> = ({
  selectedEventTypes,
  onEventTypeToggle,
  selectedTechStacks,
  onTechStackToggle,
  showOnlyHighPriority,
  onPriorityToggle
}) => {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 border-b border-border">
      {/* Event Type Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Events:</span>
        {Object.entries(EVENT_TYPE_CONFIG).map(([eventType, config]) => (
          <button
            key={eventType}
            onClick={() => onEventTypeToggle(eventType)}
            className={cn(
              'px-2 py-1 text-xs rounded-md border transition-colors',
              selectedEventTypes.includes(eventType)
                ? cn(config.bgColor, config.color, config.borderColor)
                : 'bg-background border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </button>
        ))}
      </div>
      
      <div className="w-px h-6 bg-border" />
      
      {/* Tech Stack Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Stacks:</span>
        {(['nodejs', 'php', 'python', 'static', 'docker'] as TechStack[]).map((techStack) => (
          <button
            key={techStack}
            onClick={() => onTechStackToggle(techStack)}
            className={cn(
              'px-2 py-1 text-xs rounded-md border transition-colors',
              selectedTechStacks.includes(techStack)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {techStack.toUpperCase()}
          </button>
        ))}
      </div>
      
      <div className="w-px h-6 bg-border" />
      
      {/* Priority Filter */}
      <button
        onClick={onPriorityToggle}
        className={cn(
          'px-2 py-1 text-xs rounded-md border transition-colors',
          showOnlyHighPriority
            ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700'
            : 'bg-background border-border text-muted-foreground hover:text-foreground'
        )}
      >
        <span className="mr-1">⚡</span>
        High Priority Only
      </button>
    </div>
  );
};

/**
 * Activity Statistics Component
 */
interface ActivityStatsProps {
  events: ProcessUpdateEvent[];
  isConnected: boolean;
  lastUpdate: Date;
}

const ActivityStats: React.FC<ActivityStatsProps> = ({ events, isConnected, lastUpdate }) => {
  const stats = useMemo(() => {
    const recentEvents = events.filter(e => 
      Date.now() - new Date(e.timestamp).getTime() < 60000 // Last minute
    );
    
    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalRecent: recentEvents.length,
      totalAll: events.length,
      byType: eventsByType
    };
  }, [events]);
  
  return (
    <div className="flex items-center justify-between p-3 bg-background border-b border-border">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          )} />
          <span className="text-muted-foreground">
            {stats.totalRecent} events (last minute)
          </span>
        </div>
        
        {Object.entries(stats.byType).map(([type, count]) => (
          <div key={type} className="flex items-center gap-1">
            <span>{EVENT_TYPE_CONFIG[type as keyof typeof EVENT_TYPE_CONFIG]?.icon}</span>
            <span className="font-medium">{count}</span>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground">
        Last update: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
};

/**
 * Main ProcessActivityFeed Component
 */
export const ProcessActivityFeed: React.FC<ProcessActivityFeedProps> = ({
  techStack = 'all',
  maxEvents = 100,
  showConnectionStatus = true,
  enableFiltering = true,
  className
}) => {
  const dispatch = useAppDispatch();
  const { realTime } = useAppSelector(state => state.multiTechDashboard);
  
  // Local state for filtering
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(
    Object.keys(EVENT_TYPE_CONFIG)
  );
  const [selectedTechStacks, setSelectedTechStacks] = useState<TechStack[]>(
    ['nodejs', 'php', 'python', 'static', 'docker']
  );
  const [showOnlyHighPriority, setShowOnlyHighPriority] = useState(false);
  const [sseConnection, setSseConnection] = useState<EventSource | null>(null);
  const [changeDetection, setChangeDetection] = useState<{
    newProcesses: Set<string>;
    terminatedProcesses: Set<string>;
    lastScanProcesses: Set<string>;
  }>({
    newProcesses: new Set(),
    terminatedProcesses: new Set(),
    lastScanProcesses: new Set()
  });

  // Filter events based on current selections
  const filteredEvents = useMemo(() => {
    let events = realTime.eventHistory;
    
    // Filter by tech stack
    if (techStack !== 'all') {
      events = events.filter(event => event.techStack === techStack);
    } else if (selectedTechStacks.length < 5) {
      events = events.filter(event => 
        event.techStack && selectedTechStacks.includes(event.techStack)
      );
    }
    
    // Filter by event types
    events = events.filter(event => selectedEventTypes.includes(event.type));
    
    // Filter by priority
    if (showOnlyHighPriority) {
      events = events.filter(event => {
        const config = EVENT_TYPE_CONFIG[event.type];
        return config?.priority === 'high';
      });
    }
    
    return events.slice(0, maxEvents);
  }, [realTime.eventHistory, techStack, selectedTechStacks, selectedEventTypes, showOnlyHighPriority, maxEvents]);

  // Setup SSE connection for real-time updates
  useEffect(() => {
    if (!realTime.autoRefresh) return;

    const connectSSE = async () => {
      try {
        dispatch(updateConnectionStatus('connecting'));
        
        const { multiTechService } = await import('../../services/multiTechService');
        const eventSource = multiTechService.createRealTimeConnection();
        
        eventSource.onopen = () => {
          dispatch(updateConnectionStatus('connected'));
          dispatch(addNotification({
            type: 'success',
            title: 'Real-time Connection Established',
            message: 'Process activity feed is now live'
          }));
        };
        
        eventSource.onmessage = (event) => {
          try {
            const updateEvent: ProcessUpdateEvent = JSON.parse(event.data);
            dispatch(addProcessUpdateEvent(updateEvent));
            
            // Update change detection
            if (updateEvent.type === 'process-discovered' && updateEvent.process) {
              setChangeDetection(prev => ({
                ...prev,
                newProcesses: new Set([...prev.newProcesses, `${updateEvent.process!.pid}`])
              }));
              
              // Clear new process indicator after 10 seconds
              setTimeout(() => {
                setChangeDetection(prev => ({
                  ...prev,
                  newProcesses: new Set([...prev.newProcesses].filter(id => id !== `${updateEvent.process!.pid}`))
                }));
              }, 10000);
            }
            
            if (updateEvent.type === 'process-terminated' && updateEvent.process) {
              setChangeDetection(prev => ({
                ...prev,
                terminatedProcesses: new Set([...prev.terminatedProcesses, `${updateEvent.process!.pid}`])
              }));
              
              // Clear terminated process indicator after 5 seconds
              setTimeout(() => {
                setChangeDetection(prev => ({
                  ...prev,
                  terminatedProcesses: new Set([...prev.terminatedProcesses].filter(id => id !== `${updateEvent.process!.pid}`))
                }));
              }, 5000);
            }
            
            // Trigger refresh for significant events
            if (['process-discovered', 'process-terminated'].includes(updateEvent.type)) {
              setTimeout(() => {
                dispatch(discoverAllProcesses());
              }, 1000); // Small delay to avoid race conditions
            }
            
          } catch (error) {
            console.error('Failed to parse SSE message:', error);
            dispatch(addNotification({
              type: 'error',
              title: 'Event Processing Error',
              message: 'Failed to process real-time update'
            }));
          }
        };
        
        eventSource.onerror = () => {
          dispatch(updateConnectionStatus('error'));
          eventSource.close();
          
          dispatch(addNotification({
            type: 'error',
            title: 'Connection Lost',
            message: 'Attempting to reconnect in 5 seconds...'
          }));
          
          // Attempt to reconnect after 5 seconds
          setTimeout(connectSSE, 5000);
        };
        
        setSseConnection(eventSource);
      } catch (error) {
        console.error('Failed to establish SSE connection:', error);
        dispatch(updateConnectionStatus('error'));
        dispatch(addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: 'Could not establish real-time connection'
        }));
      }
    };
    
    connectSSE();
    
    return () => {
      if (sseConnection) {
        sseConnection.close();
        setSseConnection(null);
      }
    };
  }, [realTime.autoRefresh, dispatch]);
  
  // Event handler functions
  const handleEventTypeToggle = useCallback((eventType: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(eventType)
        ? prev.filter(type => type !== eventType)
        : [...prev, eventType]
    );
  }, []);
  
  const handleTechStackToggle = useCallback((stack: TechStack) => {
    setSelectedTechStacks(prev =>
      prev.includes(stack)
        ? prev.filter(s => s !== stack)
        : [...prev, stack]
    );
  }, []);
  
  const handlePriorityToggle = useCallback(() => {
    setShowOnlyHighPriority(prev => !prev);
  }, []);
  
  const isConnected = realTime.connectionStatus === 'connected';
  const lastUpdate = new Date(realTime.lastUpdate);
  
  return (
    <div className={cn('flex flex-col bg-card border border-border rounded-lg overflow-hidden', className)}>
      {/* Header with connection status */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📡</span>
            <h3 className="font-semibold text-foreground">
              Process Activity Feed
            </h3>
          </div>
          
          <ChangeDetectionIndicator
            newProcessCount={changeDetection.newProcesses.size}
            terminatedProcessCount={changeDetection.terminatedProcesses.size}
            size="sm"
          />
        </div>
        
        {showConnectionStatus && (
          <ConnectionStatusMonitor
            connectionStatus={realTime.connectionStatus}
            lastUpdate={lastUpdate}
            autoRefresh={realTime.autoRefresh}
            updateInterval={realTime.updateInterval}
            size="sm"
          />
        )}
      </div>
      
      {/* Activity Statistics */}
      <ActivityStats
        events={filteredEvents}
        isConnected={isConnected}
        lastUpdate={lastUpdate}
      />
      
      {/* Filter Controls */}
      {enableFiltering && (
        <ActivityFilter
          selectedEventTypes={selectedEventTypes}
          onEventTypeToggle={handleEventTypeToggle}
          selectedTechStacks={selectedTechStacks}
          onTechStackToggle={handleTechStackToggle}
          showOnlyHighPriority={showOnlyHighPriority}
          onPriorityToggle={handlePriorityToggle}
        />
      )}
      
      {/* Event List */}
      <div className="flex-1 overflow-auto max-h-96">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-2">
              {isConnected ? '📡' : '📴'}
            </div>
            <h4 className="font-medium text-foreground mb-1">
              {isConnected ? 'No Activity' : 'Disconnected'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isConnected 
                ? 'Waiting for process events...'
                : 'Real-time connection not available'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEvents.map((event, index) => (
              <ProcessEventItem
                key={`${event.timestamp}-${index}`}
                event={event}
                isNew={event.process && changeDetection.newProcesses.has(`${event.process.pid}`)}
                isTerminated={event.process && changeDetection.terminatedProcesses.has(`${event.process.pid}`)}
                showTechStack={techStack === 'all'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessActivityFeed;