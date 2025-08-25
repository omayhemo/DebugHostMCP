/**
 * Animated Process Row Component
 * 
 * Enhanced ProcessRow with visual transitions and animations:
 * - Smooth entry/exit animations
 * - State change highlighting
 * - Process addition/removal effects
 * - Category change indicators
 * - Performance optimized animations
 */

import React, { useEffect, useState, useRef } from 'react';
import { DiscoveredProcess } from '../../types';
import { cn } from '../../utils/cn';
import { ProcessStatusBadge } from './ProcessStatusBadge';

interface AnimatedProcessRowProps {
  process: DiscoveredProcess;
  isSelected: boolean;
  onSelect: (processId: string) => void;
  onAction: (action: string, process: DiscoveredProcess) => void;
  isNew?: boolean;
  isTerminating?: boolean;
  hasStateChanged?: boolean;
  changedFields?: (keyof DiscoveredProcess)[];
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Animation variants for different states
 */
const ANIMATION_VARIANTS = {
  // New process entering
  enter: {
    initial: 'translate-x-full opacity-0 scale-95',
    animate: 'translate-x-0 opacity-100 scale-100',
    duration: 'duration-500'
  },
  // Process being terminated
  exit: {
    initial: 'translate-x-0 opacity-100 scale-100',
    animate: '-translate-x-full opacity-0 scale-95',
    duration: 'duration-300'
  },
  // State change highlight
  highlight: {
    initial: 'bg-background',
    animate: 'bg-blue-50 dark:bg-blue-950/30',
    duration: 'duration-1000'
  },
  // Field change pulse
  fieldChange: {
    initial: 'bg-background',
    animate: 'bg-amber-50 dark:bg-amber-950/30',
    duration: 'duration-800'
  }
} as const;

/**
 * Field Change Indicator Component
 */
interface FieldChangeIndicatorProps {
  field: keyof DiscoveredProcess;
  isVisible: boolean;
}

const FieldChangeIndicator: React.FC<FieldChangeIndicatorProps> = ({ field, isVisible }) => {
  if (!isVisible) return null;
  
  const fieldLabels: Record<keyof DiscoveredProcess, string> = {
    status: 'Status',
    category: 'Category', 
    workspace: 'Workspace',
    health: 'Health',
    port: 'Port',
    pid: 'PID',
    command: 'Command',
    cwd: 'Directory',
    techStack: 'Tech Stack',
    framework: 'Framework',
    serverType: 'Server Type',
    containerInfo: 'Container',
    correlationStatus: 'Correlation',
    rogueReason: 'Rogue Reason',
    workspaceConfidence: 'Workspace Confidence',
    suspectedWorkspace: 'Suspected Workspace',
    startTime: 'Start Time',
    uptime: 'Uptime',
    env: 'Environment',
    user: 'User',
    parentPid: 'Parent PID',
    selected: 'Selected',
    highlighted: 'Highlighted'
  };
  
  return (
    <div className={cn(
      'absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium rounded-full',
      'bg-blue-500 text-white animate-pulse transition-all duration-500',
      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
    )}>
      {fieldLabels[field]} Changed
    </div>
  );
};

/**
 * Process Action Buttons Component
 */
interface ProcessActionsProps {
  process: DiscoveredProcess;
  onAction: (action: string, process: DiscoveredProcess) => void;
}

const ProcessActions: React.FC<ProcessActionsProps> = ({ process, onAction }) => {
  const actions = React.useMemo(() => {
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
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={(e) => {
            e.stopPropagation();
            onAction(action.id, process);
          }}
          className={cn(
            'p-1 rounded transition-all duration-200 hover:bg-background hover:scale-110',
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
 * Main AnimatedProcessRow Component
 */
export const AnimatedProcessRow: React.FC<AnimatedProcessRowProps> = ({
  process,
  isSelected,
  onSelect,
  onAction,
  isNew = false,
  isTerminating = false,
  hasStateChanged = false,
  changedFields = [],
  style,
  className
}) => {
  const processId = `${process.pid}`;
  const [animationState, setAnimationState] = useState<'idle' | 'entering' | 'exiting' | 'highlighting'>('idle');
  const [showFieldIndicators, setShowFieldIndicators] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const uptime = process.startTime 
    ? Math.floor((Date.now() - new Date(process.startTime).getTime()) / 1000 / 60)
    : null;
  
  // Handle new process animation
  useEffect(() => {
    if (isNew && animationState === 'idle') {
      setAnimationState('entering');
      timeoutRef.current = setTimeout(() => {
        setAnimationState('idle');
      }, 500);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isNew, animationState]);
  
  // Handle terminating animation
  useEffect(() => {
    if (isTerminating && animationState !== 'exiting') {
      setAnimationState('exiting');
    }
  }, [isTerminating, animationState]);
  
  // Handle state change highlighting
  useEffect(() => {
    if (hasStateChanged && animationState === 'idle') {
      setAnimationState('highlighting');
      setShowFieldIndicators(true);
      
      // Clear highlighting after animation
      timeoutRef.current = setTimeout(() => {
        setAnimationState('idle');
      }, 1000);
      
      // Clear field indicators after longer delay
      const fieldTimeout = setTimeout(() => {
        setShowFieldIndicators(false);
      }, 3000);
      
      return () => {
        clearTimeout(fieldTimeout);
      };
    }
  }, [hasStateChanged, animationState]);
  
  const handleSelect = React.useCallback(() => {
    onSelect(processId);
  }, [onSelect, processId]);
  
  // Determine animation classes
  const animationClasses = React.useMemo(() => {
    const baseClasses = 'transition-all ease-in-out';
    
    switch (animationState) {
      case 'entering':
        return cn(
          baseClasses,
          ANIMATION_VARIANTS.enter.animate,
          ANIMATION_VARIANTS.enter.duration
        );
      case 'exiting':
        return cn(
          baseClasses,
          ANIMATION_VARIANTS.exit.animate,
          ANIMATION_VARIANTS.exit.duration
        );
      case 'highlighting':
        return cn(
          baseClasses,
          ANIMATION_VARIANTS.highlight.animate,
          ANIMATION_VARIANTS.highlight.duration
        );
      default:
        return baseClasses;
    }
  }, [animationState]);
  
  // Initial animation classes for new processes
  const initialClasses = isNew && animationState === 'entering' 
    ? ANIMATION_VARIANTS.enter.initial 
    : '';
  
  return (
    <div
      style={style}
      className={cn(
        'group relative flex items-center gap-4 px-4 py-3 border-b border-border',
        'hover:bg-muted/30 cursor-pointer',
        animationClasses,
        initialClasses,
        isSelected && 'bg-primary/5 border-primary/20 ring-1 ring-primary/20',
        isTerminating && 'opacity-50',
        className
      )}
    >
      {/* Selection Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleSelect}
        className="rounded border-border transition-all duration-200 hover:scale-110"
      />
      
      {/* Status Badge */}
      <div className="w-48 relative">
        <ProcessStatusBadge process={process} size="sm" />
        {changedFields.includes('category') && (
          <FieldChangeIndicator field="category" isVisible={showFieldIndicators} />
        )}
      </div>
      
      {/* PID */}
      <div className="w-20 text-sm font-mono relative">
        {process.pid}
        {changedFields.includes('pid') && (
          <FieldChangeIndicator field="pid" isVisible={showFieldIndicators} />
        )}
      </div>
      
      {/* Port */}
      <div className="w-20 text-sm font-mono relative">
        {process.port || '-'}
        {changedFields.includes('port') && (
          <FieldChangeIndicator field="port" isVisible={showFieldIndicators} />
        )}
      </div>
      
      {/* Command */}
      <div className="flex-1 min-w-0 relative">
        <div className="text-sm font-mono truncate" title={process.command}>
          {process.command}
        </div>
        {process.cwd && (
          <div className="text-xs text-muted-foreground truncate" title={process.cwd}>
            {process.cwd}
          </div>
        )}
        {changedFields.includes('command') && (
          <FieldChangeIndicator field="command" isVisible={showFieldIndicators} />
        )}
      </div>
      
      {/* Workspace */}
      <div className="w-48 min-w-0 relative">
        {process.workspace ? (
          <div>
            <div className="text-sm truncate" title={process.workspace}>
              {process.workspace}
            </div>
            {process.workspaceConfidence && (
              <div className="text-xs text-muted-foreground">
                {Math.round(process.workspaceConfidence * 100)}% confidence
              </div>
            )}
          </div>
        ) : process.suspectedWorkspace ? (
          <div className="text-sm text-orange-600 truncate" title={process.suspectedWorkspace}>
            {process.suspectedWorkspace} (suspected)
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unknown</span>
        )}
        {changedFields.includes('workspace') && (
          <FieldChangeIndicator field="workspace" isVisible={showFieldIndicators} />
        )}
      </div>
      
      {/* Server Type */}
      <div className="w-30 text-sm relative">
        {process.serverType || process.framework || '-'}
        {changedFields.includes('serverType') && (
          <FieldChangeIndicator field="serverType" isVisible={showFieldIndicators} />
        )}
      </div>
      
      {/* Uptime */}
      <div className="w-24 text-sm text-muted-foreground">
        {uptime !== null ? `${uptime}m` : '-'}
      </div>
      
      {/* Actions */}
      <div className="w-30 flex items-center justify-end">
        <ProcessActions process={process} onAction={onAction} />
      </div>
      
      {/* New Process Indicator */}
      {isNew && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
      )}
      
      {/* State Change Glow Effect */}
      {animationState === 'highlighting' && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded animate-pulse" />
      )}
    </div>
  );
};

export default AnimatedProcessRow;