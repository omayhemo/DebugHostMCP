/**
 * Process Event Item Component
 * 
 * Individual activity event display for the real-time process monitoring:
 * - Different event types with visual styling
 * - Process information display
 * - Timestamp and relative time
 * - Visual animations for new/terminated processes
 * - Action buttons for process management
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ProcessUpdateEvent, DiscoveredProcess, TechStack } from '../../types';
import { ProcessStatusBadge } from './ProcessStatusBadge';
import { cn } from '../../utils/cn';

interface ProcessEventItemProps {
  event: ProcessUpdateEvent;
  isNew?: boolean;
  isTerminated?: boolean;
  showTechStack?: boolean;
  enableActions?: boolean;
  onProcessAction?: (action: string, process: DiscoveredProcess) => void;
  className?: string;
}

/**
 * Event type configuration for styling and display
 */
const EVENT_TYPE_CONFIG = {
  'process-discovered': {
    label: 'Process Started',
    icon: '🚀',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderLeft: 'border-l-green-500',
    description: 'New process detected and started',
    animationClass: 'animate-pulse'
  },
  'process-terminated': {
    label: 'Process Stopped',
    icon: '⏹️',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderLeft: 'border-l-red-500',
    description: 'Process was terminated or stopped',
    animationClass: 'animate-pulse'
  },
  'process-updated': {
    label: 'Process Updated',
    icon: '🔄',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderLeft: 'border-l-blue-500',
    description: 'Process information changed',
    animationClass: 'animate-bounce'
  },
  'process-categorized': {
    label: 'Category Changed',
    icon: '🏷️',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderLeft: 'border-l-purple-500',
    description: 'Process category was updated',
    animationClass: 'animate-pulse'
  }
} as const;

/**
 * Technology Stack configuration for icons
 */
const TECH_STACK_CONFIG = {
  nodejs: { icon: '📦', label: 'Node.js', color: 'text-green-600' },
  php: { icon: '🐘', label: 'PHP', color: 'text-blue-600' },
  python: { icon: '🐍', label: 'Python', color: 'text-yellow-600' },
  static: { icon: '📄', label: 'Static', color: 'text-purple-600' },
  docker: { icon: '🐳', label: 'Docker', color: 'text-indigo-600' }
} as const;

/**
 * Format relative time for event timestamps
 */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const eventTime = new Date(timestamp).getTime();
  const diff = now - eventTime;
  
  if (diff < 1000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

/**
 * Process Quick Actions Component
 */
interface ProcessQuickActionsProps {
  process: DiscoveredProcess;
  onAction: (action: string, process: DiscoveredProcess) => void;
}

const ProcessQuickActions: React.FC<ProcessQuickActionsProps> = ({ process, onAction }) => {
  const actions = useMemo(() => {
    const baseActions = [
      { id: 'view-details', icon: '🔍', label: 'View Details', color: 'text-blue-600' }
    ];
    
    if (process.category === 'rogue') {
      baseActions.push(
        { id: 'associate', icon: '🔗', label: 'Associate', color: 'text-green-600' },
        { id: 'terminate', icon: '⚠️', label: 'Terminate', color: 'text-red-600' }
      );
    }
    
    if (process.category === 'registered') {
      baseActions.push(
        { id: 'restart', icon: '🔄', label: 'Restart', color: 'text-blue-600' },
        { id: 'stop', icon: '⏹️', label: 'Stop', color: 'text-orange-600' }
      );
    }
    
    if (process.category === 'orphaned') {
      baseActions.push(
        { id: 'cleanup', icon: '🧹', label: 'Clean Up', color: 'text-red-600' }
      );
    }
    
    return baseActions;
  }, [process.category]);
  
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={(e) => {
            e.stopPropagation();
            onAction(action.id, process);
          }}
          className={cn(
            'p-1 rounded transition-colors hover:bg-background',
            action.color
          )}
          title={action.label}
        >
          <span className="text-sm">{action.icon}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Event Changes Display Component
 */
interface EventChangesProps {
  changes?: Partial<DiscoveredProcess>;
  eventType: string;
}

const EventChanges: React.FC<EventChangesProps> = ({ changes, eventType }) => {
  if (!changes || Object.keys(changes).length === 0) return null;
  
  const changeEntries = Object.entries(changes).filter(([, value]) => value !== undefined);
  
  if (changeEntries.length === 0) return null;
  
  return (
    <div className="mt-2 p-2 bg-muted/30 rounded-md">
      <div className="text-xs font-medium text-muted-foreground mb-1">Changes:</div>
      <div className="text-xs space-y-1">
        {changeEntries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="font-medium text-foreground capitalize">
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
            </span>
            <span className="text-muted-foreground">
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main ProcessEventItem Component
 */
export const ProcessEventItem: React.FC<ProcessEventItemProps> = ({
  event,
  isNew = false,
  isTerminated = false,
  showTechStack = true,
  enableActions = true,
  onProcessAction,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const eventConfig = EVENT_TYPE_CONFIG[event.type];
  const relativeTime = formatRelativeTime(event.timestamp);
  const absoluteTime = new Date(event.timestamp).toLocaleString();
  
  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  const handleProcessAction = useCallback((action: string, process: DiscoveredProcess) => {
    if (onProcessAction) {
      onProcessAction(action, process);
    }
  }, [onProcessAction]);
  
  // Determine animation classes based on event state
  const animationClasses = useMemo(() => {
    const classes = [];
    
    if (isNew) {
      classes.push('animate-slideInRight', 'bg-green-50/50', 'border-green-200');
    } else if (isTerminated) {
      classes.push('animate-fadeOut', 'opacity-50');
    }
    
    return classes.join(' ');
  }, [isNew, isTerminated]);
  
  return (
    <div
      className={cn(
        'group p-4 border-l-4 transition-all duration-300 hover:bg-muted/30',
        eventConfig.borderLeft,
        animationClasses,
        className
      )}
    >
      {/* Event Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Event Icon and Type */}
          <div className="flex items-center gap-2 mt-0.5">
            <span 
              className={cn(
                'text-lg',
                isNew && eventConfig.animationClass
              )}
              title={eventConfig.description}
            >
              {eventConfig.icon}
            </span>
            
            {showTechStack && event.techStack && (
              <span 
                className="text-sm"
                title={TECH_STACK_CONFIG[event.techStack].label}
              >
                {TECH_STACK_CONFIG[event.techStack].icon}
              </span>
            )}
          </div>
          
          {/* Event Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn('font-medium text-sm', eventConfig.color)}>
                  {eventConfig.label}
                </span>
                
                {event.process && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-foreground font-mono">
                      PID {event.process.pid}
                    </span>
                    {event.process.port && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-foreground font-mono">
                          Port {event.process.port}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span title={absoluteTime}>{relativeTime}</span>
                
                {event.process && event.process.command && (
                  <button
                    onClick={handleToggleExpand}
                    className="p-1 hover:bg-background rounded transition-colors"
                    title={isExpanded ? 'Collapse details' : 'Expand details'}
                  >
                    <span className={cn(
                      'transition-transform duration-200',
                      isExpanded ? 'rotate-90' : 'rotate-0'
                    )}>
                      ▶️
                    </span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Process Command (condensed) */}
            {event.process && event.process.command && !isExpanded && (
              <div className="mt-1">
                <span className="text-sm text-muted-foreground font-mono truncate block">
                  {event.process.command}
                </span>
              </div>
            )}
            
            {/* Process Status Badge */}
            {event.process && (
              <div className="mt-2">
                <ProcessStatusBadge process={event.process} size="sm" />
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          {enableActions && event.process && onProcessAction && (
            <ProcessQuickActions
              process={event.process}
              onAction={handleProcessAction}
            />
          )}
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && event.process && (
        <div className="mt-3 pl-8 space-y-3 border-l-2 border-muted ml-2">
          {/* Full Command */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">Command:</span>
            <div className="text-sm font-mono text-foreground mt-1 p-2 bg-muted/30 rounded">
              {event.process.command}
            </div>
          </div>
          
          {/* Working Directory */}
          {event.process.cwd && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Working Directory:</span>
              <div className="text-sm font-mono text-foreground mt-1">
                {event.process.cwd}
              </div>
            </div>
          )}
          
          {/* Workspace Information */}
          {event.process.workspace && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Workspace:</span>
              <div className="text-sm text-foreground mt-1 flex items-center gap-2">
                <span>{event.process.workspace}</span>
                {event.process.workspaceConfidence && (
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(event.process.workspaceConfidence * 100)}% confidence)
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Rogue Process Reason */}
          {event.process.category === 'rogue' && event.process.rogueReason && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Rogue Reason:</span>
              <div className="text-sm text-orange-600 mt-1">
                {event.process.rogueReason}
              </div>
            </div>
          )}
          
          {/* Process Changes */}
          <EventChanges changes={event.changes} eventType={event.type} />
          
          {/* Additional Metadata */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Additional Info:</span>
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                {JSON.stringify(event.metadata, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessEventItem;