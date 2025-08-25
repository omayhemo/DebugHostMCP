/**
 * Technology Stack Tab Navigation Component
 * 
 * Provides tab navigation for different technology stacks with:
 * - Technology-specific icons and labels
 * - Process counts per technology
 * - Health indicators for each tech stack
 * - Visual feedback for active tab
 */

import React from 'react';
import { TechStack, TechStackSummary } from '../../types';
import { cn } from '../../utils/cn';

interface TechStackTabsProps {
  activeTab: TechStack | 'all';
  techStackSummaries: Record<TechStack, TechStackSummary>;
  onTabChange: (tab: TechStack | 'all') => void;
  className?: string;
}

/**
 * Technology stack configuration with icons and metadata
 */
const TECH_STACK_CONFIG = {
  nodejs: {
    label: 'Node.js',
    icon: '📦',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700',
    description: 'Node.js development servers'
  },
  php: {
    label: 'PHP',
    icon: '🐘',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    borderColor: 'border-blue-300 dark:border-blue-700',
    description: 'PHP web servers and applications'
  },
  python: {
    label: 'Python',
    icon: '🐍',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    description: 'Python web frameworks and applications'
  },
  static: {
    label: 'Static Sites',
    icon: '📄',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    borderColor: 'border-purple-300 dark:border-purple-700',
    description: 'Static file servers and build tools'
  },
  docker: {
    label: 'Docker',
    icon: '🐳',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
    description: 'Docker containers and services'
  }
} as const;

/**
 * Individual Tab Button Component
 */
interface TabButtonProps {
  techStack: TechStack;
  summary: TechStackSummary;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ techStack, summary, isActive, onClick }) => {
  const config = TECH_STACK_CONFIG[techStack];
  const hasRogueProcesses = summary.rogueProcesses > 0;
  const hasOrphanedProcesses = summary.orphanedProcesses > 0;
  const hasIssues = hasRogueProcesses || hasOrphanedProcesses || !summary.health.healthy;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-w-0',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        {
          // Active state
          'bg-primary text-primary-foreground shadow-sm': isActive,
          
          // Inactive state
          'bg-card border border-border hover:bg-accent hover:text-accent-foreground': !isActive,
          
          // Issue indicators
          'ring-2 ring-orange-500/20': hasIssues && !isActive,
          'border-orange-300 dark:border-orange-700': hasIssues && !isActive
        }
      )}
      title={config.description}
    >
      {/* Technology Icon */}
      <span className="text-xl flex-shrink-0" role="img" aria-label={config.label}>
        {config.icon}
      </span>
      
      {/* Tab Content */}
      <div className="flex flex-col items-start min-w-0">
        {/* Technology Label */}
        <span className="font-medium text-sm truncate">
          {config.label}
        </span>
        
        {/* Process Count */}
        <span className={cn(
          'text-xs opacity-75',
          isActive ? 'text-primary-foreground/75' : 'text-muted-foreground'
        )}>
          {summary.totalProcesses} processes
        </span>
      </div>
      
      {/* Health and Issue Indicators */}
      <div className="flex flex-col items-end gap-1 ml-auto">
        {/* Health Status Indicator */}
        {summary.totalProcesses > 0 && (
          <div className="flex items-center gap-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              summary.health.healthy ? 'bg-green-500' : 'bg-orange-500'
            )} />
          </div>
        )}
        
        {/* Issue Indicators */}
        {hasRogueProcesses && (
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full font-medium',
            isActive 
              ? 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
          )}>
            {summary.rogueProcesses} rogue
          </span>
        )}
        
        {hasOrphanedProcesses && (
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full font-medium',
            isActive
              ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
          )}>
            {summary.orphanedProcesses} orphaned
          </span>
        )}
      </div>
    </button>
  );
};

/**
 * All Processes Tab Button
 */
interface AllTabButtonProps {
  techStackSummaries: Record<TechStack, TechStackSummary>;
  isActive: boolean;
  onClick: () => void;
}

const AllTabButton: React.FC<AllTabButtonProps> = ({ techStackSummaries, isActive, onClick }) => {
  // Calculate totals across all tech stacks
  const totals = Object.values(techStackSummaries).reduce(
    (acc, summary) => ({
      totalProcesses: acc.totalProcesses + summary.totalProcesses,
      runningProcesses: acc.runningProcesses + summary.runningProcesses,
      rogueProcesses: acc.rogueProcesses + summary.rogueProcesses,
      orphanedProcesses: acc.orphanedProcesses + summary.orphanedProcesses,
      hasIssues: acc.hasIssues || !summary.health.healthy
    }),
    {
      totalProcesses: 0,
      runningProcesses: 0,
      rogueProcesses: 0,
      orphanedProcesses: 0,
      hasIssues: false
    }
  );
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-w-0',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        {
          // Active state
          'bg-primary text-primary-foreground shadow-sm': isActive,
          
          // Inactive state
          'bg-card border border-border hover:bg-accent hover:text-accent-foreground': !isActive,
          
          // Issue indicators
          'ring-2 ring-orange-500/20': totals.hasIssues && !isActive
        }
      )}
      title="View all processes across all technology stacks"
    >
      {/* All Processes Icon */}
      <span className="text-xl flex-shrink-0" role="img" aria-label="All Processes">
        🔍
      </span>
      
      {/* Tab Content */}
      <div className="flex flex-col items-start min-w-0">
        {/* Label */}
        <span className="font-medium text-sm">
          All Processes
        </span>
        
        {/* Total Count */}
        <span className={cn(
          'text-xs opacity-75',
          isActive ? 'text-primary-foreground/75' : 'text-muted-foreground'
        )}>
          {totals.totalProcesses} total
        </span>
      </div>
      
      {/* Status Summary */}
      <div className="flex flex-col items-end gap-1 ml-auto">
        {/* Running Indicator */}
        {totals.totalProcesses > 0 && (
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full font-medium',
            isActive
              ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
          )}>
            {totals.runningProcesses} running
          </span>
        )}
        
        {/* Issue Summary */}
        {(totals.rogueProcesses > 0 || totals.orphanedProcesses > 0) && (
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full font-medium',
            isActive
              ? 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
          )}>
            {totals.rogueProcesses + totals.orphanedProcesses} issues
          </span>
        )}
      </div>
    </button>
  );
};

/**
 * Main TechStackTabs Component
 */
export const TechStackTabs: React.FC<TechStackTabsProps> = ({
  activeTab,
  techStackSummaries,
  onTabChange,
  className
}) => {
  const techStacks: TechStack[] = ['nodejs', 'php', 'python', 'static', 'docker'];
  
  return (
    <div className={cn('bg-background', className)}>
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-4 border-b border-border">
        {/* All Processes Tab */}
        <AllTabButton
          techStackSummaries={techStackSummaries}
          isActive={activeTab === 'all'}
          onClick={() => onTabChange('all')}
        />
        
        {/* Technology Stack Tabs */}
        {techStacks.map(techStack => (
          <TabButton
            key={techStack}
            techStack={techStack}
            summary={techStackSummaries[techStack]}
            isActive={activeTab === techStack}
            onClick={() => onTabChange(techStack)}
          />
        ))}
      </div>
      
      {/* Active Tab Summary */}
      {activeTab !== 'all' && (
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg" role="img">
                {TECH_STACK_CONFIG[activeTab].icon}
              </span>
              <div>
                <h3 className="font-medium text-sm">
                  {TECH_STACK_CONFIG[activeTab].label} Processes
                </h3>
                <p className="text-xs text-muted-foreground">
                  {TECH_STACK_CONFIG[activeTab].description}
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">
                  {techStackSummaries[activeTab].runningProcesses}
                </strong> running
              </span>
              <span>
                <strong className="text-foreground">
                  {techStackSummaries[activeTab].registeredProcesses}
                </strong> registered
              </span>
              {techStackSummaries[activeTab].rogueProcesses > 0 && (
                <span className="text-orange-600">
                  <strong>{techStackSummaries[activeTab].rogueProcesses}</strong> rogue
                </span>
              )}
              {techStackSummaries[activeTab].orphanedProcesses > 0 && (
                <span className="text-red-600">
                  <strong>{techStackSummaries[activeTab].orphanedProcesses}</strong> orphaned
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechStackTabs;