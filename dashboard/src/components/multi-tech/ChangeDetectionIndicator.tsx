/**
 * Change Detection Indicator Component
 * 
 * Visual indicators for process changes in the real-time monitoring UI:
 * - New process notifications with counts
 * - Terminated process indicators
 * - State change notifications
 * - Animated visual feedback
 * - Configurable display modes
 */

import React, { useEffect, useState, useMemo } from 'react';
import { cn } from '../../utils/cn';

interface ChangeDetectionIndicatorProps {
  newProcessCount?: number;
  terminatedProcessCount?: number;
  stateChangedCount?: number;
  showLabels?: boolean;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'detailed' | 'minimal';
  className?: string;
}

/**
 * Size configuration for different display contexts
 */
const SIZE_CONFIG = {
  sm: {
    indicator: 'w-4 h-4 text-xs',
    badge: 'px-1.5 py-0.5 text-xs',
    icon: 'text-sm',
    gap: 'gap-1'
  },
  md: {
    indicator: 'w-5 h-5 text-sm',
    badge: 'px-2 py-1 text-xs',
    icon: 'text-base',
    gap: 'gap-2'
  },
  lg: {
    indicator: 'w-6 h-6 text-base',
    badge: 'px-2.5 py-1 text-sm',
    icon: 'text-lg',
    gap: 'gap-3'
  }
} as const;

/**
 * Change type configuration
 */
const CHANGE_TYPE_CONFIG = {
  new: {
    icon: '🚀',
    label: 'New',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-700',
    animationClass: 'animate-bounce'
  },
  terminated: {
    icon: '⏹️',
    label: 'Stopped',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-700',
    animationClass: 'animate-pulse'
  },
  changed: {
    icon: '🔄',
    label: 'Changed',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    animationClass: 'animate-spin'
  }
} as const;

/**
 * Individual Change Indicator Component
 */
interface ChangeIndicatorProps {
  type: 'new' | 'terminated' | 'changed';
  count: number;
  showLabel: boolean;
  showAnimation: boolean;
  size: 'sm' | 'md' | 'lg';
  variant: 'compact' | 'detailed' | 'minimal';
}

const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({
  type,
  count,
  showLabel,
  showAnimation,
  size,
  variant
}) => {
  const [isAnimating, setIsAnimating] = useState(showAnimation);
  const config = CHANGE_TYPE_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  
  // Auto-stop animation after a few seconds
  useEffect(() => {
    if (showAnimation && count > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [count, showAnimation]);
  
  if (count === 0) return null;
  
  if (variant === 'minimal') {
    return (
      <div className={cn(
        'relative inline-flex items-center justify-center rounded-full',
        config.bgColor,
        sizeConfig.indicator
      )}>
        <span className={cn(
          sizeConfig.icon,
          isAnimating && config.animationClass
        )}>
          {config.icon}
        </span>
        {count > 1 && (
          <span className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center',
            'w-4 h-4 text-xs font-bold rounded-full',
            'bg-primary text-primary-foreground min-w-0'
          )}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>
    );
  }
  
  if (variant === 'compact') {
    return (
      <div className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bgColor,
        config.color,
        config.borderColor,
        sizeConfig.badge,
        sizeConfig.gap
      )}>
        <span className={cn(
          sizeConfig.icon,
          isAnimating && config.animationClass
        )}>
          {config.icon}
        </span>
        <span className="font-semibold">{count}</span>
        {showLabel && size !== 'sm' && (
          <span className="ml-1">{config.label}</span>
        )}
      </div>
    );
  }
  
  // Detailed variant
  return (
    <div className={cn(
      'inline-flex items-center font-medium rounded-lg border p-2',
      config.bgColor,
      config.borderColor,
      sizeConfig.gap
    )}>
      <span className={cn(
        sizeConfig.icon,
        config.color,
        isAnimating && config.animationClass
      )}>
        {config.icon}
      </span>
      <div className="flex flex-col">
        <span className={cn('font-bold', config.color)}>
          {count}
        </span>
        {showLabel && (
          <span className="text-xs text-muted-foreground">
            {config.label}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Pulse Animation Wrapper for Active States
 */
interface PulseWrapperProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

const PulseWrapper: React.FC<PulseWrapperProps> = ({ isActive, children, className }) => {
  if (!isActive) return <>{children}</>;
  
  return (
    <div className={cn(
      'relative',
      className
    )}>
      {children}
      <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
    </div>
  );
};

/**
 * Summary Badge Component
 */
interface SummaryBadgeProps {
  totalChanges: number;
  size: 'sm' | 'md' | 'lg';
  showAnimation: boolean;
}

const SummaryBadge: React.FC<SummaryBadgeProps> = ({ totalChanges, size, showAnimation }) => {
  const sizeConfig = SIZE_CONFIG[size];
  
  if (totalChanges === 0) return null;
  
  return (
    <div className={cn(
      'inline-flex items-center font-medium rounded-full',
      'bg-primary text-primary-foreground',
      sizeConfig.badge,
      showAnimation && 'animate-pulse'
    )}>
      <span className={cn(sizeConfig.icon, 'mr-1')}>📊</span>
      <span className="font-semibold">{totalChanges}</span>
      <span className="ml-1 text-xs opacity-75">changes</span>
    </div>
  );
};

/**
 * Main ChangeDetectionIndicator Component
 */
export const ChangeDetectionIndicator: React.FC<ChangeDetectionIndicatorProps> = ({
  newProcessCount = 0,
  terminatedProcessCount = 0,
  stateChangedCount = 0,
  showLabels = true,
  showAnimation = true,
  size = 'md',
  variant = 'compact',
  className
}) => {
  const totalChanges = newProcessCount + terminatedProcessCount + stateChangedCount;
  const hasChanges = totalChanges > 0;
  const sizeConfig = SIZE_CONFIG[size];
  
  // Auto-clear animation state after a period
  const [showActiveAnimation, setShowActiveAnimation] = useState(false);
  
  useEffect(() => {
    if (hasChanges && showAnimation) {
      setShowActiveAnimation(true);
      const timer = setTimeout(() => {
        setShowActiveAnimation(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [totalChanges, showAnimation]);
  
  // Memoized change data for performance
  const changeData = useMemo(() => [
    { type: 'new' as const, count: newProcessCount },
    { type: 'terminated' as const, count: terminatedProcessCount },
    { type: 'changed' as const, count: stateChangedCount }
  ], [newProcessCount, terminatedProcessCount, stateChangedCount]);
  
  // Don't render anything if no changes
  if (!hasChanges) return null;
  
  // Summary view for high change counts
  if (totalChanges > 10 && variant !== 'detailed') {
    return (
      <PulseWrapper isActive={showActiveAnimation} className={className}>
        <SummaryBadge
          totalChanges={totalChanges}
          size={size}
          showAnimation={showActiveAnimation}
        />
      </PulseWrapper>
    );
  }
  
  return (
    <div className={cn(
      'inline-flex items-center',
      sizeConfig.gap,
      className
    )}>
      {changeData.map(({ type, count }) => (
        <PulseWrapper key={type} isActive={showActiveAnimation && count > 0}>
          <ChangeIndicator
            type={type}
            count={count}
            showLabel={showLabels}
            showAnimation={showActiveAnimation}
            size={size}
            variant={variant}
          />
        </PulseWrapper>
      ))}
    </div>
  );
};

/**
 * Compact version for tight spaces
 */
export const CompactChangeDetectionIndicator: React.FC<Omit<ChangeDetectionIndicatorProps, 'size' | 'variant'>> = (props) => (
  <ChangeDetectionIndicator {...props} size="sm" variant="compact" />
);

/**
 * Minimal version for status bars
 */
export const MinimalChangeDetectionIndicator: React.FC<Omit<ChangeDetectionIndicatorProps, 'size' | 'variant' | 'showLabels'>> = (props) => (
  <ChangeDetectionIndicator {...props} size="sm" variant="minimal" showLabels={false} />
);

/**
 * Detailed version for process monitoring panels
 */
export const DetailedChangeDetectionIndicator: React.FC<Omit<ChangeDetectionIndicatorProps, 'variant'>> = (props) => (
  <ChangeDetectionIndicator {...props} variant="detailed" />
);

export default ChangeDetectionIndicator;