/**
 * Activity Timeline Component
 * 
 * Chronological view of process events with timeline visualization:
 * - Time-based event grouping
 * - Visual timeline with event markers
 * - Expandable event details
 * - Time range filtering
 * - Event type filtering
 * - Export functionality
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ProcessUpdateEvent, TechStack } from '../../types';
import { ProcessEventItem } from './ProcessEventItem';
import { cn } from '../../utils/cn';

interface ActivityTimelineProps {
  events: ProcessUpdateEvent[];
  techStack?: TechStack | 'all';
  maxEvents?: number;
  timeRange?: 'hour' | 'day' | 'week';
  groupByHour?: boolean;
  showEventCounts?: boolean;
  enableFiltering?: boolean;
  enableExport?: boolean;
  onEventAction?: (action: string, event: ProcessUpdateEvent) => void;
  className?: string;
}

/**
 * Time range configuration
 */
const TIME_RANGE_CONFIG = {
  hour: {
    label: 'Last Hour',
    duration: 3600000, // 1 hour in milliseconds
    groupInterval: 300000, // 5 minutes
    groupLabel: (time: Date) => time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  },
  day: {
    label: 'Last Day',
    duration: 86400000, // 24 hours
    groupInterval: 3600000, // 1 hour
    groupLabel: (time: Date) => time.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    })
  },
  week: {
    label: 'Last Week',
    duration: 604800000, // 7 days
    groupInterval: 86400000, // 1 day
    groupLabel: (time: Date) => time.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }
} as const;

/**
 * Event type configuration for filtering
 */
const EVENT_TYPE_CONFIG = {
  'process-discovered': {
    label: 'Started',
    icon: '🚀',
    color: 'text-green-600',
    count: 0
  },
  'process-terminated': {
    label: 'Stopped',
    icon: '⏹️',
    color: 'text-red-600',
    count: 0
  },
  'process-updated': {
    label: 'Updated',
    icon: '🔄',
    color: 'text-blue-600',
    count: 0
  },
  'process-categorized': {
    label: 'Categorized',
    icon: '🏷️',
    color: 'text-purple-600',
    count: 0
  }
} as const;

/**
 * Timeline Event Group Interface
 */
interface EventGroup {
  timeKey: string;
  timeLabel: string;
  timestamp: Date;
  events: ProcessUpdateEvent[];
  eventCounts: Record<string, number>;
}

/**
 * Time Range Selector Component
 */
interface TimeRangeSelectorProps {
  selectedRange: 'hour' | 'day' | 'week';
  onRangeChange: (range: 'hour' | 'day' | 'week') => void;
  eventCounts: Record<'hour' | 'day' | 'week', number>;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  eventCounts
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Time Range:</span>
      {Object.entries(TIME_RANGE_CONFIG).map(([range, config]) => (
        <button
          key={range}
          onClick={() => onRangeChange(range as 'hour' | 'day' | 'week')}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md border transition-colors',
            selectedRange === range
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
          )}
        >
          {config.label}
          {eventCounts[range as 'hour' | 'day' | 'week'] > 0 && (
            <span className={cn(
              'ml-2 px-1.5 py-0.5 text-xs rounded-full',
              selectedRange === range
                ? 'bg-primary-foreground text-primary'
                : 'bg-muted text-muted-foreground'
            )}>
              {eventCounts[range as 'hour' | 'day' | 'week']}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

/**
 * Event Type Filter Component
 */
interface EventTypeFilterProps {
  selectedTypes: string[];
  onTypeToggle: (type: string) => void;
  eventCounts: Record<string, number>;
}

const EventTypeFilter: React.FC<EventTypeFilterProps> = ({
  selectedTypes,
  onTypeToggle,
  eventCounts
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Events:</span>
      {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
        <button
          key={type}
          onClick={() => onTypeToggle(type)}
          className={cn(
            'px-2 py-1 text-xs rounded-md border transition-colors flex items-center gap-1',
            selectedTypes.includes(type)
              ? cn('border-primary/30', config.color, 'bg-primary/5')
              : 'bg-background border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <span>{config.icon}</span>
          <span>{config.label}</span>
          {eventCounts[type] > 0 && (
            <span className={cn(
              'ml-1 px-1 py-0.5 text-xs rounded-full',
              selectedTypes.includes(type)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {eventCounts[type]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

/**
 * Timeline Group Component
 */
interface TimelineGroupProps {
  group: EventGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEventAction?: (action: string, event: ProcessUpdateEvent) => void;
  showEventCounts: boolean;
}

const TimelineGroup: React.FC<TimelineGroupProps> = ({
  group,
  isExpanded,
  onToggleExpand,
  onEventAction,
  showEventCounts
}) => {
  return (
    <div className="relative">
      {/* Timeline Marker */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
      <div className="absolute left-5 top-4 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
      
      {/* Group Header */}
      <div className="ml-12 mb-4">
        <button
          onClick={onToggleExpand}
          className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm transition-transform duration-200" style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
            }}>
              ▶️
            </span>
            
            <div className="text-left">
              <h3 className="font-medium text-foreground">
                {group.timeLabel}
              </h3>
              <p className="text-sm text-muted-foreground">
                {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
              </p>
            </div>
          </div>
          
          {showEventCounts && (
            <div className="flex items-center gap-2">
              {Object.entries(group.eventCounts).map(([type, count]) => {
                if (count === 0) return null;
                const config = EVENT_TYPE_CONFIG[type as keyof typeof EVENT_TYPE_CONFIG];
                return (
                  <div
                    key={type}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                      'bg-background border'
                    )}
                  >
                    <span>{config.icon}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </button>
        
        {/* Group Events */}
        {isExpanded && (
          <div className="mt-3 space-y-1 border-l-2 border-muted ml-4 pl-4">
            {group.events.map((event, index) => (
              <ProcessEventItem
                key={`${event.timestamp}-${index}`}
                event={event}
                showTechStack={true}
                enableActions={true}
                onProcessAction={(action, process) => {
                  if (onEventAction) {
                    onEventAction(action, event);
                  }
                }}
                className="border-0 p-2 hover:bg-muted/20 rounded-md"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Export Controls Component
 */
interface ExportControlsProps {
  events: ProcessUpdateEvent[];
  onExport: (format: 'json' | 'csv') => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({ events, onExport }) => {
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  }, [onExport]);
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Export:</span>
      <button
        onClick={() => handleExport('json')}
        disabled={isExporting || events.length === 0}
        className={cn(
          'px-2 py-1 text-xs rounded-md border transition-colors',
          'bg-background border-border text-muted-foreground',
          'hover:text-foreground hover:border-muted-foreground',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        📄 JSON
      </button>
      <button
        onClick={() => handleExport('csv')}
        disabled={isExporting || events.length === 0}
        className={cn(
          'px-2 py-1 text-xs rounded-md border transition-colors',
          'bg-background border-border text-muted-foreground',
          'hover:text-foreground hover:border-muted-foreground',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        📊 CSV
      </button>
    </div>
  );
};

/**
 * Main ActivityTimeline Component
 */
export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  techStack = 'all',
  maxEvents = 200,
  timeRange = 'day',
  groupByHour = true,
  showEventCounts = true,
  enableFiltering = true,
  enableExport = false,
  onEventAction,
  className
}) => {
  // Local state for filtering
  const [selectedTimeRange, setSelectedTimeRange] = useState<'hour' | 'day' | 'week'>(timeRange);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(
    Object.keys(EVENT_TYPE_CONFIG)
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Filter and process events
  const processedEvents = useMemo(() => {
    const now = Date.now();
    const rangeConfig = TIME_RANGE_CONFIG[selectedTimeRange];
    const cutoffTime = now - rangeConfig.duration;
    
    // Filter by time range, tech stack, and event types
    let filtered = events
      .filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime >= cutoffTime;
      })
      .filter(event => selectedEventTypes.includes(event.type))
      .filter(event => {
        if (techStack === 'all') return true;
        return event.techStack === techStack;
      })
      .slice(0, maxEvents);
    
    return filtered.reverse(); // Most recent first
  }, [events, selectedTimeRange, selectedEventTypes, techStack, maxEvents]);
  
  // Group events by time intervals
  const eventGroups = useMemo(() => {
    const rangeConfig = TIME_RANGE_CONFIG[selectedTimeRange];
    const groups = new Map<string, EventGroup>();
    
    processedEvents.forEach(event => {
      const eventTime = new Date(event.timestamp);
      const groupTime = new Date(
        Math.floor(eventTime.getTime() / rangeConfig.groupInterval) * rangeConfig.groupInterval
      );
      const timeKey = groupTime.toISOString();
      
      if (!groups.has(timeKey)) {
        groups.set(timeKey, {
          timeKey,
          timeLabel: rangeConfig.groupLabel(groupTime),
          timestamp: groupTime,
          events: [],
          eventCounts: {
            'process-discovered': 0,
            'process-terminated': 0,
            'process-updated': 0,
            'process-categorized': 0
          }
        });
      }
      
      const group = groups.get(timeKey)!;
      group.events.push(event);
      group.eventCounts[event.type]++;
    });
    
    return Array.from(groups.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [processedEvents, selectedTimeRange]);
  
  // Calculate event counts for different time ranges
  const eventCounts = useMemo(() => {
    const now = Date.now();
    const counts = { hour: 0, day: 0, week: 0 };
    
    Object.keys(counts).forEach(range => {
      const config = TIME_RANGE_CONFIG[range as keyof typeof TIME_RANGE_CONFIG];
      const cutoffTime = now - config.duration;
      
      counts[range as keyof typeof counts] = events.filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime >= cutoffTime &&
               selectedEventTypes.includes(event.type) &&
               (techStack === 'all' || event.techStack === techStack);
      }).length;
    });
    
    return counts;
  }, [events, selectedEventTypes, techStack]);
  
  // Calculate event type counts for filtering
  const eventTypeCounts = useMemo(() => {
    return processedEvents.reduce((counts, event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, [processedEvents]);
  
  // Event handlers
  const handleTimeRangeChange = useCallback((range: 'hour' | 'day' | 'week') => {
    setSelectedTimeRange(range);
    setExpandedGroups(new Set()); // Collapse all groups when changing time range
  }, []);
  
  const handleEventTypeToggle = useCallback((type: string) => {
    setSelectedEventTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);
  
  const handleGroupToggle = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);
  
  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    const dataToExport = processedEvents.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      techStack: event.techStack,
      processId: event.process?.pid,
      processPort: event.process?.port,
      processCommand: event.process?.command,
      processWorkspace: event.process?.workspace,
      processCategory: event.process?.category
    }));
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `process-activity-${selectedTimeRange}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = Object.keys(dataToExport[0] || {}).join(',');
      const csv = [headers, ...dataToExport.map(row => 
        Object.values(row).map(val => `"${val || ''}"`).join(',')
      )].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `process-activity-${selectedTimeRange}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [processedEvents, selectedTimeRange]);
  
  // Auto-expand first group
  useEffect(() => {
    if (eventGroups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set([eventGroups[0].timeKey]));
    }
  }, [eventGroups]);
  
  if (processedEvents.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        'bg-card border border-border rounded-lg',
        className
      )}>
        <div className="text-4xl mb-2">📅</div>
        <h3 className="font-medium text-foreground mb-1">
          No Activity
        </h3>
        <p className="text-sm text-muted-foreground">
          No process events found in the selected time range
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn('flex flex-col bg-card border border-border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h3 className="font-semibold text-foreground">
              Activity Timeline
            </h3>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {processedEvents.length} {processedEvents.length === 1 ? 'event' : 'events'}
          </div>
        </div>
        
        {/* Filters */}
        {enableFiltering && (
          <div className="flex flex-wrap gap-4">
            <TimeRangeSelector
              selectedRange={selectedTimeRange}
              onRangeChange={handleTimeRangeChange}
              eventCounts={eventCounts}
            />
            
            <EventTypeFilter
              selectedTypes={selectedEventTypes}
              onTypeToggle={handleEventTypeToggle}
              eventCounts={eventTypeCounts}
            />
            
            {enableExport && (
              <ExportControls
                events={processedEvents}
                onExport={handleExport}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Timeline */}
      <div className="flex-1 overflow-auto p-4">
        {eventGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No events found for the selected filters
          </div>
        ) : (
          <div className="space-y-6">
            {eventGroups.map(group => (
              <TimelineGroup
                key={group.timeKey}
                group={group}
                isExpanded={expandedGroups.has(group.timeKey)}
                onToggleExpand={() => handleGroupToggle(group.timeKey)}
                onEventAction={onEventAction}
                showEventCounts={showEventCounts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Compact version for sidebar displays
 */
export const CompactActivityTimeline: React.FC<Omit<ActivityTimelineProps, 'enableFiltering' | 'enableExport'>> = (props) => (
  <ActivityTimeline {...props} enableFiltering={false} enableExport={false} />
);

export default ActivityTimeline;