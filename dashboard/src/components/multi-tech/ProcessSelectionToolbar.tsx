/**
 * Process Selection Toolbar Component
 * 
 * Sprint 7 - Story 3.9: Bulk Operations & Safety Controls
 * 
 * Advanced selection toolbar for bulk operations with:
 * - Smart selection filters by category, tech stack, workspace
 * - Batch selection controls (select all, clear all, invert)
 * - Quick selection presets (rogue only, running only, etc.)
 * - Selection statistics and summary
 * - Integration with safety framework
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  DiscoveredProcess, 
  TechStack, 
  ProcessCategory 
} from '../../types';
import { cn } from '../../utils/cn';

interface ProcessSelectionToolbarProps {
  processes: DiscoveredProcess[];
  selectedProcesses: string[];
  techStack: TechStack | 'all';
  onProcessSelectAll: (processIds: string[]) => void;
  onProcessSelect: (processId: string) => void;
  onClearSelection: () => void;
  className?: string;
}

/**
 * Selection Filter Types
 */
type SelectionFilter = 
  | 'all'
  | 'running'
  | 'stopped'
  | 'rogue'
  | 'registered'
  | 'discovered'
  | 'orphaned'
  | 'high_cpu'
  | 'high_memory'
  | 'recent'
  | 'workspace_linked'
  | 'workspace_unlinked';

/**
 * Quick Selection Presets
 */
const SELECTION_PRESETS: {
  filter: SelectionFilter;
  label: string;
  description: string;
  icon: string;
  predicate: (process: DiscoveredProcess) => boolean;
}[] = [
  {
    filter: 'all',
    label: 'All Processes',
    description: 'Select all visible processes',
    icon: '🔍',
    predicate: () => true
  },
  {
    filter: 'running',
    label: 'Running Only',
    description: 'Select only processes that are currently running',
    icon: '▶️',
    predicate: (p) => p.status === 'running'
  },
  {
    filter: 'stopped',
    label: 'Stopped Only',
    description: 'Select only processes that are stopped',
    icon: '⏹️',
    predicate: (p) => p.status === 'stopped'
  },
  {
    filter: 'rogue',
    label: 'Rogue Only',
    description: 'Select rogue processes requiring attention',
    icon: '⚠️',
    predicate: (p) => p.category === 'rogue'
  },
  {
    filter: 'registered',
    label: 'Registered Only',
    description: 'Select registered processes',
    icon: '✅',
    predicate: (p) => p.category === 'registered'
  },
  {
    filter: 'discovered',
    label: 'Discovered Only',
    description: 'Select discovered processes',
    icon: '🔍',
    predicate: (p) => p.category === 'discovered'
  },
  {
    filter: 'orphaned',
    label: 'Orphaned Only',
    description: 'Select orphaned processes',
    icon: '🧹',
    predicate: (p) => p.category === 'orphaned'
  },
  {
    filter: 'high_cpu',
    label: 'High CPU',
    description: 'Select processes with high CPU usage (>50%)',
    icon: '🔥',
    predicate: (p) => (p.cpuUsage || 0) > 50
  },
  {
    filter: 'high_memory',
    label: 'High Memory',
    description: 'Select processes with high memory usage (>100MB)',
    icon: '💾',
    predicate: (p) => (p.memoryUsage || 0) > 100 * 1024 * 1024
  },
  {
    filter: 'recent',
    label: 'Recently Started',
    description: 'Select processes started in the last hour',
    icon: '🕒',
    predicate: (p) => {
      if (!p.startTime) return false;
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      return new Date(p.startTime).getTime() > oneHourAgo;
    }
  },
  {
    filter: 'workspace_linked',
    label: 'Workspace Linked',
    description: 'Select processes linked to workspaces',
    icon: '🔗',
    predicate: (p) => !!p.workspace
  },
  {
    filter: 'workspace_unlinked',
    label: 'No Workspace',
    description: 'Select processes not linked to workspaces',
    icon: '❓',
    predicate: (p) => !p.workspace
  }
];

/**
 * Main Process Selection Toolbar Component
 */
export const ProcessSelectionToolbar: React.FC<ProcessSelectionToolbarProps> = ({
  processes,
  selectedProcesses,
  techStack,
  onProcessSelectAll,
  onProcessSelect,
  onClearSelection,
  className
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activePresets, setActivePresets] = useState<Set<SelectionFilter>>(new Set());

  // Calculate selection statistics
  const selectionStats = useMemo(() => {
    const selectedProcessData = processes.filter(p => 
      selectedProcesses.includes(`${p.pid}`)
    );

    const stats = {
      total: selectedProcesses.length,
      running: selectedProcessData.filter(p => p.status === 'running').length,
      rogue: selectedProcessData.filter(p => p.category === 'rogue').length,
      registered: selectedProcessData.filter(p => p.category === 'registered').length,
      discovered: selectedProcessData.filter(p => p.category === 'discovered').length,
      orphaned: selectedProcessData.filter(p => p.category === 'orphaned').length,
      workspaces: new Set(selectedProcessData.filter(p => p.workspace).map(p => p.workspace)).size,
      estimatedMemory: selectedProcessData.reduce((sum, p) => sum + (p.memoryUsage || 0), 0),
      estimatedCpu: selectedProcessData.reduce((sum, p) => sum + (p.cpuUsage || 0), 0)
    };

    return stats;
  }, [processes, selectedProcesses]);

  // Calculate available filters based on current processes
  const availablePresets = useMemo(() => {
    return SELECTION_PRESETS.filter(preset => {
      const matchingProcesses = processes.filter(preset.predicate);
      return matchingProcesses.length > 0;
    }).map(preset => ({
      ...preset,
      count: processes.filter(preset.predicate).length,
      selectedCount: processes.filter(p => 
        preset.predicate(p) && selectedProcesses.includes(`${p.pid}`)
      ).length
    }));
  }, [processes, selectedProcesses]);

  /**
   * Apply selection filter
   */
  const applySelectionFilter = useCallback((filter: SelectionFilter, additive: boolean = false) => {
    const preset = SELECTION_PRESETS.find(p => p.filter === filter);
    if (!preset) return;

    const matchingProcesses = processes.filter(preset.predicate);
    const matchingProcessIds = matchingProcesses.map(p => `${p.pid}`);

    if (additive) {
      // Add to existing selection
      const newSelection = Array.from(new Set([...selectedProcesses, ...matchingProcessIds]));
      onProcessSelectAll(newSelection);
      setActivePresets(prev => new Set([...prev, filter]));
    } else {
      // Replace selection
      onProcessSelectAll(matchingProcessIds);
      setActivePresets(new Set([filter]));
    }
  }, [processes, selectedProcesses, onProcessSelectAll]);

  /**
   * Invert current selection
   */
  const invertSelection = useCallback(() => {
    const allProcessIds = processes.map(p => `${p.pid}`);
    const unselectedProcessIds = allProcessIds.filter(id => !selectedProcesses.includes(id));
    onProcessSelectAll(unselectedProcessIds);
    setActivePresets(new Set());
  }, [processes, selectedProcesses, onProcessSelectAll]);

  /**
   * Clear all selections
   */
  const clearAllSelections = useCallback(() => {
    onClearSelection();
    setActivePresets(new Set());
  }, [onClearSelection]);

  if (processes.length === 0) return null;

  return (
    <div className={cn(
      'bg-card border border-border rounded-lg shadow-sm',
      'transition-all duration-200',
      className
    )}>
      {/* Main Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-4">
          {/* Selection Summary */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {selectedProcesses.length > 0 ? (
                <>
                  {selectedProcesses.length} of {processes.length} selected
                </>
              ) : (
                <>
                  {processes.length} processes available
                </>
              )}
            </span>
            
            {selectedProcesses.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {selectionStats.running > 0 && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                    {selectionStats.running} running
                  </span>
                )}
                {selectionStats.rogue > 0 && (
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded">
                    {selectionStats.rogue} rogue
                  </span>
                )}
                {selectionStats.workspaces > 0 && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                    {selectionStats.workspaces} workspaces
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          {selectedProcesses.length > 0 && (
            <>
              <button
                onClick={invertSelection}
                className="px-3 py-1.5 text-sm bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
                title="Invert selection"
              >
                🔄 Invert
              </button>
              
              <button
                onClick={clearAllSelections}
                className="px-3 py-1.5 text-sm bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
                title="Clear all selections"
              >
                ✕ Clear All
              </button>
            </>
          )}

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors font-medium',
              showAdvancedFilters
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            🔧 {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="p-4 space-y-4">
          {/* Quick Selection Presets */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quick Selection Presets
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {availablePresets.map(preset => {
                const isActive = activePresets.has(preset.filter);
                const allSelected = preset.selectedCount === preset.count && preset.count > 0;
                const someSelected = preset.selectedCount > 0 && preset.selectedCount < preset.count;
                
                return (
                  <button
                    key={preset.filter}
                    onClick={(e) => applySelectionFilter(preset.filter, e.shiftKey)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-md border text-center transition-colors',
                      'hover:bg-muted/50',
                      allSelected && 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20',
                      someSelected && !allSelected && 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20',
                      !someSelected && !allSelected && 'border-border'
                    )}
                    title={`${preset.description} (${preset.count} available, ${preset.selectedCount} selected)`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-base">{preset.icon}</span>
                      {allSelected && <span className="text-green-600 dark:text-green-400 text-xs">✓</span>}
                      {someSelected && !allSelected && <span className="text-orange-600 dark:text-orange-400 text-xs">◐</span>}
                    </div>
                    
                    <div className="text-xs font-medium text-foreground">
                      {preset.label}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {preset.selectedCount}/{preset.count}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              💡 Hold Shift while clicking to add to current selection instead of replacing
            </div>
          </div>

          {/* Selection Statistics */}
          {selectedProcesses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Selection Statistics
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Category Breakdown */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Categories</div>
                  <div className="space-y-1 text-xs">
                    {selectionStats.registered > 0 && (
                      <div className="flex justify-between">
                        <span>Registered:</span>
                        <span className="font-medium">{selectionStats.registered}</span>
                      </div>
                    )}
                    {selectionStats.discovered > 0 && (
                      <div className="flex justify-between">
                        <span>Discovered:</span>
                        <span className="font-medium">{selectionStats.discovered}</span>
                      </div>
                    )}
                    {selectionStats.rogue > 0 && (
                      <div className="flex justify-between">
                        <span>Rogue:</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          {selectionStats.rogue}
                        </span>
                      </div>
                    )}
                    {selectionStats.orphaned > 0 && (
                      <div className="flex justify-between">
                        <span>Orphaned:</span>
                        <span className="font-medium">{selectionStats.orphaned}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Running:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {selectionStats.running}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stopped:</span>
                      <span className="font-medium">
                        {selectionStats.total - selectionStats.running}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resource Usage */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Resources</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span className="font-medium">
                        {selectionStats.estimatedMemory > 0 
                          ? `${Math.round(selectionStats.estimatedMemory / 1024 / 1024)}MB`
                          : 'Unknown'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPU:</span>
                      <span className="font-medium">
                        {selectionStats.estimatedCpu > 0 
                          ? `~${Math.round(selectionStats.estimatedCpu)}%`
                          : 'Unknown'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workspace Info */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Workspaces</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Linked:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {selectionStats.workspaces}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tech Stack:</span>
                      <span className="font-medium">
                        {techStack === 'all' ? 'All' : techStack.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessSelectionToolbar;