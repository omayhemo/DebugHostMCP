/**
 * Process Status Badge Component
 * 
 * Visual indicator for process categorization and status:
 * - Registered (Green): Process matches static allocation
 * - Discovered (Blue): Found process not in static registry
 * - Rogue (Orange): Process outside known workspaces with warnings
 * - Orphaned (Red): Static allocation with no running process
 * - Container (Indigo): Docker container process
 */

import React from 'react';
import { ProcessCategory, ProcessStatus, DiscoveredProcess } from '../../types';
import { cn } from '../../utils/cn';

interface ProcessStatusBadgeProps {
  process: DiscoveredProcess;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Category configuration with colors and descriptions
 */
const CATEGORY_CONFIG = {
  registered: {
    label: 'Registered',
    shortLabel: 'REG',
    icon: '✅',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-800 dark:text-green-200',
    borderColor: 'border-green-300 dark:border-green-700',
    description: 'Process matches static port allocation'
  },
  discovered: {
    label: 'Discovered',
    shortLabel: 'DISC',
    icon: '🔍',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-800 dark:text-blue-200',
    borderColor: 'border-blue-300 dark:border-blue-700',
    description: 'Process found but not in static registry'
  },
  rogue: {
    label: 'Rogue',
    shortLabel: 'ROGUE',
    icon: '⚠️',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-800 dark:text-orange-200',
    borderColor: 'border-orange-300 dark:border-orange-700',
    description: 'Process running outside known workspaces'
  },
  orphaned: {
    label: 'Orphaned',
    shortLabel: 'ORPH',
    icon: '❌',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-200',
    borderColor: 'border-red-300 dark:border-red-700',
    description: 'Static allocation exists but no process running'
  },
  containers: {
    label: 'Container',
    shortLabel: 'CONT',
    icon: '🐳',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    textColor: 'text-indigo-800 dark:text-indigo-200',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
    description: 'Docker container process'
  }
} as const;

/**
 * Process status configuration
 */
const STATUS_CONFIG = {
  running: {
    label: 'Running',
    icon: '▶️',
    color: 'text-green-600'
  },
  stopped: {
    label: 'Stopped',
    icon: '⏹️',
    color: 'text-gray-600'
  },
  starting: {
    label: 'Starting',
    icon: '⏳',
    color: 'text-yellow-600'
  },
  stopping: {
    label: 'Stopping',
    icon: '⏸️',
    color: 'text-orange-600'
  },
  failed: {
    label: 'Failed',
    icon: '❌',
    color: 'text-red-600'
  }
} as const;

/**
 * Size configuration
 */
const SIZE_CONFIG = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'text-xs',
    gap: 'gap-1'
  },
  md: {
    badge: 'px-2.5 py-1 text-sm',
    icon: 'text-sm',
    gap: 'gap-1.5'
  },
  lg: {
    badge: 'px-3 py-1.5 text-base',
    icon: 'text-base',
    gap: 'gap-2'
  }
} as const;

/**
 * Category Badge Component
 */
interface CategoryBadgeProps {
  category: ProcessCategory;
  rogueReason?: string;
  size: 'sm' | 'md' | 'lg';
  showTooltip: boolean;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ 
  category, 
  rogueReason, 
  size, 
  showTooltip 
}) => {
  const config = CATEGORY_CONFIG[category];
  const sizeConfig = SIZE_CONFIG[size];
  
  const tooltipContent = rogueReason 
    ? `${config.description}. Reason: ${rogueReason}`
    : config.description;
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeConfig.badge,
        sizeConfig.gap,
        'transition-all duration-200',
        showTooltip && 'cursor-help'
      )}
      title={showTooltip ? tooltipContent : undefined}
    >
      <span className={sizeConfig.icon} role="img" aria-label={config.label}>
        {config.icon}
      </span>
      <span className="font-semibold">
        {size === 'sm' ? config.shortLabel : config.label}
      </span>
    </span>
  );
};

/**
 * Status Badge Component
 */
interface StatusBadgeProps {
  status: ProcessStatus;
  size: 'sm' | 'md' | 'lg';
  showTooltip: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size, showTooltip }) => {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        config.color,
        sizeConfig.gap,
        showTooltip && 'cursor-help'
      )}
      title={showTooltip ? `Process is ${config.label.toLowerCase()}` : undefined}
    >
      <span className={sizeConfig.icon} role="img" aria-label={config.label}>
        {config.icon}
      </span>
      {size !== 'sm' && (
        <span className="font-medium">
          {config.label}
        </span>
      )}
    </span>
  );
};

/**
 * Health Indicator Component
 */
interface HealthIndicatorProps {
  health?: 'healthy' | 'warning' | 'error';
  size: 'sm' | 'md' | 'lg';
  showTooltip: boolean;
}

const HealthIndicator: React.FC<HealthIndicatorProps> = ({ health, size, showTooltip }) => {
  if (!health || health === 'healthy') return null;
  
  const sizeConfig = SIZE_CONFIG[size];
  
  const healthConfig = {
    warning: {
      icon: '⚠️',
      color: 'text-yellow-600',
      description: 'Process has warnings'
    },
    error: {
      icon: '🚨',
      color: 'text-red-600',
      description: 'Process has errors'
    }
  } as const;
  
  const config = healthConfig[health];
  
  return (
    <span
      className={cn(
        'inline-flex items-center',
        config.color,
        showTooltip && 'cursor-help'
      )}
      title={showTooltip ? config.description : undefined}
    >
      <span className={sizeConfig.icon} role="img" aria-label={`Health: ${health}`}>
        {config.icon}
      </span>
    </span>
  );
};

/**
 * Process Priority Indicator (for rogue processes)
 */
interface PriorityIndicatorProps {
  process: DiscoveredProcess;
  size: 'sm' | 'md' | 'lg';
  showTooltip: boolean;
}

const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({ process, size, showTooltip }) => {
  // Only show priority for rogue processes
  if (process.category !== 'rogue') return null;
  
  const sizeConfig = SIZE_CONFIG[size];
  
  // Determine priority based on process characteristics
  let priority: 'low' | 'medium' | 'high' = 'medium';
  let priorityIcon = '📍';
  let priorityColor = 'text-orange-600';
  let priorityDescription = 'Medium priority rogue process';
  
  // High priority: system ports or critical services
  if (process.port && process.port < 1024) {
    priority = 'high';
    priorityIcon = '🔴';
    priorityColor = 'text-red-600';
    priorityDescription = 'High priority: using system port';
  }
  // Low priority: high port numbers or specific patterns
  else if (process.port && process.port > 8000) {
    priority = 'low';
    priorityIcon = '🟡';
    priorityColor = 'text-yellow-600';
    priorityDescription = 'Low priority rogue process';
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center',
        priorityColor,
        showTooltip && 'cursor-help'
      )}
      title={showTooltip ? priorityDescription : undefined}
    >
      <span className={sizeConfig.icon} role="img" aria-label={`Priority: ${priority}`}>
        {priorityIcon}
      </span>
    </span>
  );
};

/**
 * Main ProcessStatusBadge Component
 */
export const ProcessStatusBadge: React.FC<ProcessStatusBadgeProps> = ({
  process,
  showTooltip = true,
  size = 'md',
  className
}) => {
  const sizeConfig = SIZE_CONFIG[size];
  
  return (
    <div className={cn('flex items-center', sizeConfig.gap, className)}>
      {/* Category Badge - Primary indicator */}
      <CategoryBadge
        category={process.category}
        rogueReason={process.rogueReason}
        size={size}
        showTooltip={showTooltip}
      />
      
      {/* Status Badge - Process running state */}
      <StatusBadge
        status={process.status}
        size={size}
        showTooltip={showTooltip}
      />
      
      {/* Health Indicator - Issues or warnings */}
      <HealthIndicator
        health={process.health}
        size={size}
        showTooltip={showTooltip}
      />
      
      {/* Priority Indicator - For rogue processes */}
      <PriorityIndicator
        process={process}
        size={size}
        showTooltip={showTooltip}
      />
    </div>
  );
};

/**
 * Compact version for table cells
 */
export const CompactProcessStatusBadge: React.FC<Omit<ProcessStatusBadgeProps, 'size'>> = (props) => (
  <ProcessStatusBadge {...props} size="sm" />
);

/**
 * Detailed version for process details
 */
export const DetailedProcessStatusBadge: React.FC<Omit<ProcessStatusBadgeProps, 'size'>> = (props) => (
  <ProcessStatusBadge {...props} size="lg" />
);

export default ProcessStatusBadge;