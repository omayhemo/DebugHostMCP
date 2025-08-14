import React, { useState } from 'react';
import { Play, Square, RotateCw, Pause, XCircle, Heart, Loader2 } from 'lucide-react';
import { useAppSelector } from '../../store';

interface LifecycleControlsProps {
  projectId?: string;
  onAction: (action: 'start' | 'stop' | 'restart' | 'pause' | 'health', projectId: string) => void;
  isLoading?: boolean;
}

const LifecycleControls: React.FC<LifecycleControlsProps> = ({ 
  projectId, 
  onAction, 
  isLoading = false 
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState<'force-stop' | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
  const servers = useAppSelector(state => state.servers.servers);
  const currentProject = projectId ? servers.find(s => s.id === projectId) : null;

  const handleAction = async (action: string) => {
    if (!projectId) return;
    
    setActionInProgress(action);
    
    if (action === 'force-stop') {
      setShowConfirmDialog('force-stop');
      return;
    }

    try {
      await onAction(action as any, projectId);
    } finally {
      setActionInProgress(null);
    }
  };

  const confirmForceStop = async () => {
    if (!projectId) return;
    
    setShowConfirmDialog(null);
    setActionInProgress('force-stop');
    
    try {
      const response = await fetch(`/api/projects/${projectId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });

      if (!response.ok) {
        throw new Error('Failed to force stop container');
      }
    } catch (error) {
      console.error('Force stop error:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'stopped': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const controls = [
    {
      id: 'start',
      label: 'Start',
      icon: Play,
      color: 'bg-green-500 hover:bg-green-600',
      disabled: currentProject?.status === 'running',
      action: () => handleAction('start')
    },
    {
      id: 'stop',
      label: 'Stop',
      icon: Square,
      color: 'bg-red-500 hover:bg-red-600',
      disabled: currentProject?.status === 'stopped',
      action: () => handleAction('stop')
    },
    {
      id: 'restart',
      label: 'Restart',
      icon: RotateCw,
      color: 'bg-blue-500 hover:bg-blue-600',
      disabled: currentProject?.status === 'stopped',
      action: () => handleAction('restart')
    },
    {
      id: 'pause',
      label: 'Pause',
      icon: Pause,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      disabled: currentProject?.status !== 'running',
      action: () => handleAction('pause')
    },
    {
      id: 'health',
      label: 'Health Check',
      icon: Heart,
      color: 'bg-purple-500 hover:bg-purple-600',
      disabled: currentProject?.status !== 'running',
      action: () => handleAction('health')
    }
  ];

  if (!projectId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Select a project to view lifecycle controls</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentProject?.name || 'Unknown Project'}
          </h3>
          <div className="flex items-center mt-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(currentProject?.status)}`}>
              {currentProject?.status?.toUpperCase() || 'UNKNOWN'}
            </span>
            {currentProject?.uptime && (
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                Uptime: {currentProject.uptime}
              </span>
            )}
          </div>
        </div>
        
        {currentProject?.status === 'error' && (
          <button
            onClick={() => handleAction('force-stop')}
            className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Force Stop
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {controls.map(({ id, label, icon: Icon, color, disabled, action }) => (
          <button
            key={id}
            onClick={action}
            disabled={disabled || isLoading || actionInProgress !== null}
            className={`
              relative flex flex-col items-center justify-center p-4 rounded-lg text-white
              transition-all duration-200 transform
              ${disabled || isLoading || actionInProgress !== null
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50' 
                : `${color} hover:scale-105 active:scale-95`
              }
            `}
            aria-label={`${label} container`}
          >
            {actionInProgress === id ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Icon className="h-6 w-6" />
            )}
            <span className="mt-2 text-sm font-medium">{label}</span>
            
            {actionInProgress === id && (
              <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {currentProject && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Container Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Container ID:</span>
              <p className="font-mono text-xs mt-1">{currentProject.containerId || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Port:</span>
              <p className="font-medium mt-1">{currentProject.port || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Image:</span>
              <p className="font-medium mt-1">{currentProject.image || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Last Action:</span>
              <p className="font-medium mt-1">{currentProject.lastAction || 'None'}</p>
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog === 'force-stop' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Force Stop
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Force stopping will immediately terminate the container without graceful shutdown. 
              This may result in data loss. Are you sure?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmForceStop}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Force Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LifecycleControls;