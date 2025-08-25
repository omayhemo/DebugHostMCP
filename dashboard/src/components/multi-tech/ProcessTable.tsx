/**
 * Process Table Component
 * 
 * Technology-specific process lists with:
 * - Process categorization grouping
 * - Sortable columns
 * - Multi-select for bulk operations
 * - Process action menus
 * - Virtual scrolling for performance
 * - Real-time updates
 */

import React, { useMemo, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { 
  DiscoveredProcess, 
  TechStack, 
  ProcessCategory, 
  ProcessSort,
  ProcessFilter 
} from '../../types';
import { ProcessStatusBadge } from './ProcessStatusBadge';
import { cn } from '../../utils/cn';

interface ProcessTableProps {
  techStack?: TechStack | 'all';
  processes: DiscoveredProcess[];
  selectedProcesses: string[];
  onProcessSelect: (processId: string) => void;
  onProcessSelectAll: (processIds: string[]) => void;
  onProcessAction: (action: string, process: DiscoveredProcess) => void;
  onBulkAction: (action: string, processIds: string[]) => void;
  sort: ProcessSort;
  onSortChange: (sort: ProcessSort) => void;
  filter: ProcessFilter;
  enableVirtualization?: boolean;
  className?: string;
}

/**
 * Process categories for grouping
 */
const PROCESS_CATEGORIES: { 
  category: ProcessCategory; 
  label: string; 
  description: string;
  priority: number;
}[] = [
  {
    category: 'registered',
    label: 'Registered Processes',
    description: 'Processes matching static port allocations',
    priority: 1
  },
  {
    category: 'discovered',
    label: 'Discovered Processes',
    description: 'Found processes not in static registry',
    priority: 2
  },
  {
    category: 'rogue',
    label: 'Rogue Processes',
    description: 'Processes outside known workspaces - require attention',
    priority: 3
  },
  {
    category: 'orphaned',
    label: 'Orphaned Processes',
    description: 'Static allocations with no running process',
    priority: 4
  }
];

/**
 * Table column configuration
 */
const TABLE_COLUMNS = [
  {
    key: 'status',
    label: 'Status',
    width: '200px',
    sortable: false
  },
  {
    key: 'pid',
    label: 'PID',
    width: '80px',
    sortable: true
  },
  {
    key: 'port',
    label: 'Port',
    width: '80px',
    sortable: true
  },
  {
    key: 'command',
    label: 'Command',
    width: 'auto',
    sortable: true
  },
  {
    key: 'workspace',
    label: 'Workspace',
    width: '200px',
    sortable: true
  },
  {
    key: 'serverType',
    label: 'Server Type',
    width: '120px',
    sortable: true
  },
  {
    key: 'uptime',
    label: 'Uptime',
    width: '100px',
    sortable: true
  },
  {
    key: 'actions',
    label: 'Actions',
    width: '120px',
    sortable: false
  }
] as const;

/**
 * Process Group Header Component
 */
interface ProcessGroupHeaderProps {
  category: ProcessCategory;
  count: number;
  selectedCount: number;
  onSelectAll: (processIds: string[]) => void;
  onDeselectAll: () => void;
  processes: DiscoveredProcess[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const ProcessGroupHeader: React.FC<ProcessGroupHeaderProps> = ({
  category,
  count,
  selectedCount,
  onSelectAll,
  onDeselectAll,
  processes,
  isExpanded,
  onToggleExpand
}) => {
  const categoryConfig = PROCESS_CATEGORIES.find(c => c.category === category);
  const processIds = processes.map(p => `${p.pid}`);
  
  const allSelected = selectedCount === count && count > 0;
  const someSelected = selectedCount > 0 && selectedCount < count;
  
  const handleSelectToggle = useCallback(() => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll(processIds);
    }
  }, [allSelected, onDeselectAll, onSelectAll, processIds]);
  
  if (!categoryConfig || count === 0) return null;
  
  return (
    <div className={cn(
      'flex items-center justify-between p-3 bg-muted/30 border-b border-border',
      'hover:bg-muted/40 transition-colors duration-200'
    )}>
      <div className="flex items-center gap-3">
        {/* Expand/Collapse Button */}
        <button
          onClick={onToggleExpand}
          className="p-1 hover:bg-background rounded transition-colors"
          title={isExpanded ? 'Collapse group' : 'Expand group'}
        >
          <span className="text-sm transition-transform duration-200" style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>
            ▶️
          </span>
        </button>
        
        {/* Group Selection Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            ref={input => {
              if (input) input.indeterminate = someSelected && !allSelected;
            }}
            onChange={handleSelectToggle}
            className="rounded border-border"
          />
          <div>
            <h3 className="font-medium text-sm text-foreground">
              {categoryConfig.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {categoryConfig.description}
            </p>
          </div>
        </label>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {selectedCount > 0 && (
          <span className="text-primary font-medium">
            {selectedCount} selected
          </span>
        )}
        <span>
          {count} {count === 1 ? 'process' : 'processes'}
        </span>
      </div>
    </div>
  );
};

/**
 * Process Row Component
 */
interface ProcessRowProps {
  process: DiscoveredProcess;
  isSelected: boolean;
  onSelect: (processId: string) => void;
  onAction: (action: string, process: DiscoveredProcess) => void;
  style?: React.CSSProperties;
}

const ProcessRow: React.FC<ProcessRowProps> = ({
  process,
  isSelected,
  onSelect,
  onAction,
  style
}) => {
  const processId = `${process.pid}`;
  const uptime = process.startTime 
    ? Math.floor((Date.now() - new Date(process.startTime).getTime()) / 1000 / 60)
    : null;
  
  const handleSelect = useCallback(() => {
    onSelect(processId);
  }, [onSelect, processId]);
  
  const handleAction = useCallback((action: string) => {
    onAction(action, process);
  }, [onAction, process]);
  
  return (
    <div
      style={style}
      className={cn(
        'flex items-center gap-4 px-4 py-3 border-b border-border hover:bg-muted/30',
        'transition-colors duration-200',
        isSelected && 'bg-primary/5 border-primary/20'
      )}
    >
      {/* Selection Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleSelect}
        className="rounded border-border"
      />
      
      {/* Status Badge */}
      <div className="w-48">
        <ProcessStatusBadge process={process} size="sm" />
      </div>
      
      {/* PID */}
      <div className="w-20 text-sm font-mono">
        {process.pid}
      </div>
      
      {/* Port */}
      <div className="w-20 text-sm font-mono">
        {process.port || '-'}
      </div>
      
      {/* Command */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-mono truncate" title={process.command}>
          {process.command}
        </div>
        {process.cwd && (
          <div className="text-xs text-muted-foreground truncate" title={process.cwd}>
            {process.cwd}
          </div>
        )}
      </div>
      
      {/* Workspace */}
      <div className="w-48 min-w-0">
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
      </div>
      
      {/* Server Type */}
      <div className="w-30 text-sm">
        {process.serverType || process.framework || '-'}
      </div>
      
      {/* Uptime */}
      <div className="w-24 text-sm text-muted-foreground">
        {uptime !== null ? `${uptime}m` : '-'}
      </div>
      
      {/* Actions */}
      <div className="w-30 flex items-center gap-1">
        <button
          onClick={() => handleAction('view-details')}
          className="p-1 hover:bg-background rounded transition-colors"
          title="View details"
        >
          🔍
        </button>
        
        {process.category === 'rogue' && (
          <>
            <button
              onClick={() => handleAction('associate')}
              className="p-1 hover:bg-background rounded transition-colors"
              title="Associate with workspace"
            >
              🔗
            </button>
            <button
              onClick={() => handleAction('terminate')}
              className="p-1 hover:bg-background rounded transition-colors text-orange-600"
              title="Terminate process"
            >
              ⚠️
            </button>
          </>
        )}
        
        {process.category === 'registered' && (
          <>
            <button
              onClick={() => handleAction('restart')}
              className="p-1 hover:bg-background rounded transition-colors"
              title="Restart process"
            >
              🔄
            </button>
            <button
              onClick={() => handleAction('stop')}
              className="p-1 hover:bg-background rounded transition-colors"
              title="Stop process"
            >
              ⏹️
            </button>
          </>
        )}
        
        {process.category === 'orphaned' && (
          <button
            onClick={() => handleAction('cleanup')}
            className="p-1 hover:bg-background rounded transition-colors text-red-600"
            title="Clean up orphaned entry"
          >
            🧹
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Table Header Component
 */
interface TableHeaderProps {
  sort: ProcessSort;
  onSortChange: (sort: ProcessSort) => void;
  totalProcesses: number;
  selectedProcesses: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  sort,
  onSortChange,
  totalProcesses,
  selectedProcesses,
  onSelectAll,
  onDeselectAll
}) => {
  const allSelected = selectedProcesses === totalProcesses && totalProcesses > 0;
  const someSelected = selectedProcesses > 0 && selectedProcesses < totalProcesses;
  
  const handleSortClick = useCallback((field: keyof DiscoveredProcess) => {
    if (sort.field === field) {
      onSortChange({
        field,
        direction: sort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      onSortChange({ field, direction: 'asc' });
    }
  }, [sort, onSortChange]);
  
  const handleSelectAllToggle = useCallback(() => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  }, [allSelected, onSelectAll, onDeselectAll]);
  
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-muted/20 border-b border-border text-sm font-medium">
      {/* Master Checkbox */}
      <input
        type="checkbox"
        checked={allSelected}
        ref={input => {
          if (input) input.indeterminate = someSelected && !allSelected;
        }}
        onChange={handleSelectAllToggle}
        className="rounded border-border"
      />
      
      {/* Column Headers */}
      {TABLE_COLUMNS.map(column => (
        <div
          key={column.key}
          className={cn(
            column.width === 'auto' ? 'flex-1' : '',
            column.width !== 'auto' ? `w-${column.width.replace('px', '')}` : '',
            column.sortable && 'cursor-pointer hover:text-foreground',
            'flex items-center gap-1'
          )}
          style={{ width: column.width === 'auto' ? undefined : column.width }}
          onClick={column.sortable ? () => handleSortClick(column.key as keyof DiscoveredProcess) : undefined}
        >
          <span>{column.label}</span>
          {column.sortable && sort.field === column.key && (
            <span className="text-xs">
              {sort.direction === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Virtualized Row Component for React Window
 */
interface VirtualRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    processes: DiscoveredProcess[];
    selectedProcesses: string[];
    onProcessSelect: (processId: string) => void;
    onProcessAction: (action: string, process: DiscoveredProcess) => void;
  };
}

const VirtualRow: React.FC<VirtualRowProps> = ({ index, style, data }) => {
  const { processes, selectedProcesses, onProcessSelect, onProcessAction } = data;
  const process = processes[index];
  const isSelected = selectedProcesses.includes(`${process.pid}`);
  
  return (
    <ProcessRow
      style={style}
      process={process}
      isSelected={isSelected}
      onSelect={onProcessSelect}
      onAction={onProcessAction}
    />
  );
};

/**
 * Main ProcessTable Component
 */
export const ProcessTable: React.FC<ProcessTableProps> = ({
  techStack,
  processes,
  selectedProcesses,
  onProcessSelect,
  onProcessSelectAll,
  onProcessAction,
  onBulkAction,
  sort,
  onSortChange,
  filter,
  enableVirtualization = true,
  className
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<ProcessCategory>>(
    new Set(['registered', 'discovered', 'rogue', 'orphaned'])
  );
  
  // Group and sort processes
  const processGroups = useMemo(() => {
    // Group processes by category
    const grouped = PROCESS_CATEGORIES.map(categoryConfig => {
      const categoryProcesses = processes.filter(p => p.category === categoryConfig.category);
      
      // Sort processes within the group
      const sorted = [...categoryProcesses].sort((a, b) => {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sort.direction === 'asc' ? comparison : -comparison;
      });
      
      return {
        ...categoryConfig,
        processes: sorted,
        selectedCount: sorted.filter(p => selectedProcesses.includes(`${p.pid}`)).length
      };
    }).filter(group => group.processes.length > 0);
    
    return grouped;
  }, [processes, sort, selectedProcesses]);
  
  const toggleGroupExpansion = useCallback((category: ProcessCategory) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);
  
  const handleSelectAll = useCallback(() => {
    const allProcessIds = processes.map(p => `${p.pid}`);
    onProcessSelectAll(allProcessIds);
  }, [processes, onProcessSelectAll]);
  
  const handleDeselectAll = useCallback(() => {
    onProcessSelectAll([]);
  }, [onProcessSelectAll]);
  
  const handleGroupSelectAll = useCallback((processIds: string[]) => {
    const newSelected = [...new Set([...selectedProcesses, ...processIds])];
    onProcessSelectAll(newSelected);
  }, [selectedProcesses, onProcessSelectAll]);
  
  const handleGroupDeselectAll = useCallback((processIds: string[]) => {
    const newSelected = selectedProcesses.filter(id => !processIds.includes(id));
    onProcessSelectAll(newSelected);
  }, [selectedProcesses, onProcessSelectAll]);
  
  // Render empty state
  if (processes.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No processes found
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {techStack && techStack !== 'all' 
            ? `No ${techStack.toUpperCase()} processes are currently running or registered.`
            : 'No processes are currently running or registered across any technology stack.'
          }
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Table Header */}
      <TableHeader
        sort={sort}
        onSortChange={onSortChange}
        totalProcesses={processes.length}
        selectedProcesses={selectedProcesses.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />
      
      {/* Process Groups */}
      <div className="flex-1 overflow-auto">
        {processGroups.map(group => (
          <div key={group.category}>
            {/* Group Header */}
            <ProcessGroupHeader
              category={group.category}
              count={group.processes.length}
              selectedCount={group.selectedCount}
              onSelectAll={handleGroupSelectAll}
              onDeselectAll={() => handleGroupDeselectAll(group.processes.map(p => `${p.pid}`))}
              processes={group.processes}
              isExpanded={expandedGroups.has(group.category)}
              onToggleExpand={() => toggleGroupExpansion(group.category)}
            />
            
            {/* Group Processes */}
            {expandedGroups.has(group.category) && (
              <div>
                {enableVirtualization && group.processes.length > 20 ? (
                  <List
                    height={Math.min(600, group.processes.length * 70)}
                    itemCount={group.processes.length}
                    itemSize={70}
                    itemData={{
                      processes: group.processes,
                      selectedProcesses,
                      onProcessSelect,
                      onProcessAction
                    }}
                  >
                    {VirtualRow}
                  </List>
                ) : (
                  group.processes.map(process => (
                    <ProcessRow
                      key={process.pid}
                      process={process}
                      isSelected={selectedProcesses.includes(`${process.pid}`)}
                      onSelect={onProcessSelect}
                      onAction={onProcessAction}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessTable;