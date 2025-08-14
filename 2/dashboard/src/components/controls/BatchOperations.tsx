import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  toggleProjectSelection,
  selectAllProjects,
  clearProjectSelection,
  addBatchOperation,
  updateBatchOperation,
  completeBatchOperation
} from '../../store/slices/projectControlsSlice';
import { Play, Square, RotateCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface BatchOperationsProps {
  selectedProjects: string[];
  onExecute: (action: 'start' | 'stop' | 'restart', projectIds: string[]) => void;
}

const BatchOperations: React.FC<BatchOperationsProps> = ({ 
  selectedProjects, 
  onExecute 
}) => {
  const dispatch = useAppDispatch();
  const [executing, setExecuting] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  
  const servers = useAppSelector(state => state.servers.servers);
  const batchQueue = useAppSelector(state => state.projectControls.batchQueue);

  const handleSelectAll = () => {
    const allProjectIds = servers.map(s => s.id);
    dispatch(selectAllProjects(allProjectIds));
  };

  const handleClearSelection = () => {
    dispatch(clearProjectSelection());
  };

  const handleToggleProject = (projectId: string) => {
    dispatch(toggleProjectSelection(projectId));
  };

  const executeBatchOperation = async (action: 'start' | 'stop' | 'restart') => {
    if (selectedProjects.length === 0) return;

    setExecuting(true);
    setCurrentOperation(action);

    const batchOp = {
      id: `batch-${Date.now()}`,
      projectIds: selectedProjects,
      action,
      status: 'in_progress' as const,
      progress: 0,
      completed: [] as string[],
      failed: [] as string[],
      timestamp: Date.now()
    };

    dispatch(addBatchOperation(batchOp));

    const totalProjects = selectedProjects.length;
    let completedCount = 0;

    for (const projectId of selectedProjects) {
      try {
        const response = await fetch(`/api/projects/${projectId}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Failed to ${action} project ${projectId}`);
        }

        batchOp.completed.push(projectId);
      } catch (error) {
        console.error(`Batch operation error for ${projectId}:`, error);
        batchOp.failed.push(projectId);
      }

      completedCount++;
      const progress = Math.round((completedCount / totalProjects) * 100);
      
      dispatch(updateBatchOperation({
        id: batchOp.id,
        updates: {
          progress,
          completed: [...batchOp.completed],
          failed: [...batchOp.failed]
        }
      }));
    }

    const finalStatus = batchOp.failed.length === 0 ? 'completed' :
                       batchOp.completed.length === 0 ? 'failed' : 'partial';

    dispatch(updateBatchOperation({
      id: batchOp.id,
      updates: { status: finalStatus }
    }));

    setTimeout(() => {
      dispatch(completeBatchOperation(batchOp.id));
    }, 3000);

    setExecuting(false);
    setCurrentOperation(null);
    dispatch(clearProjectSelection());
  };

  const getProjectsByStatus = (status: string) => {
    return servers.filter(s => s.status === status);
  };

  const runningProjects = getProjectsByStatus('running');
  const stoppedProjects = getProjectsByStatus('stopped');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Batch Operations
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Select All
          </button>
          <button
            onClick={handleClearSelection}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Clear Selection
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
        {servers.map(server => (
          <div
            key={server.id}
            onClick={() => handleToggleProject(server.id)}
            className={`
              p-3 rounded-lg border-2 cursor-pointer transition-all
              ${selectedProjects.includes(server.id)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`
                  h-4 w-4 rounded border-2 mr-3 flex items-center justify-center
                  ${selectedProjects.includes(server.id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-400'
                  }
                `}>
                  {selectedProjects.includes(server.id) && (
                    <CheckCircle className="h-3 w-3 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {server.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Port: {server.port}
                  </p>
                </div>
              </div>
              <span className={`
                px-2 py-1 text-xs font-medium rounded-full
                ${server.status === 'running' ? 'bg-green-100 text-green-800' :
                  server.status === 'stopped' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {server.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => executeBatchOperation('start')}
          disabled={selectedProjects.length === 0 || executing}
          className={`
            flex flex-col items-center justify-center p-4 rounded-lg text-white transition-all
            ${selectedProjects.length === 0 || executing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
            }
          `}
        >
          {executing && currentOperation === 'start' ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Play className="h-6 w-6" />
          )}
          <span className="mt-2 text-sm font-medium">Start All</span>
        </button>

        <button
          onClick={() => executeBatchOperation('stop')}
          disabled={selectedProjects.length === 0 || executing}
          className={`
            flex flex-col items-center justify-center p-4 rounded-lg text-white transition-all
            ${selectedProjects.length === 0 || executing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600'
            }
          `}
        >
          {executing && currentOperation === 'stop' ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Square className="h-6 w-6" />
          )}
          <span className="mt-2 text-sm font-medium">Stop All</span>
        </button>

        <button
          onClick={() => executeBatchOperation('restart')}
          disabled={selectedProjects.length === 0 || executing}
          className={`
            flex flex-col items-center justify-center p-4 rounded-lg text-white transition-all
            ${selectedProjects.length === 0 || executing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
            }
          `}
        >
          {executing && currentOperation === 'restart' ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <RotateCw className="h-6 w-6" />
          )}
          <span className="mt-2 text-sm font-medium">Restart All</span>
        </button>
      </div>

      {batchQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active Batch Operations
          </h4>
          {batchQueue.map(op => (
            <div key={op.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium capitalize">{op.action} Operation</span>
                <span className="text-xs text-gray-500">
                  {op.progress}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    op.status === 'failed' ? 'bg-red-500' :
                    op.status === 'partial' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${op.progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-green-600">
                  {op.completed.length} Completed
                </span>
                {op.failed.length > 0 && (
                  <span className="text-red-600">
                    {op.failed.length} Failed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Running Projects</p>
          <p className="text-2xl font-bold text-green-600">{runningProjects.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Stopped Projects</p>
          <p className="text-2xl font-bold text-gray-600">{stoppedProjects.length}</p>
        </div>
      </div>
    </div>
  );
};

export default BatchOperations;