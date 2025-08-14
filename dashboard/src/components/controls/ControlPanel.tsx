import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  startOperation, 
  completeOperation,
  clearProjectSelection,
  setOfflineMode
} from '../../store/slices/projectControlsSlice';
import LifecycleControls from './LifecycleControls';
import ConfigurationManager from './ConfigurationManager';
import BatchOperations from './BatchOperations';
import OperationHistory from './OperationHistory';
import { AlertTriangle, Activity, Settings, History } from 'lucide-react';

interface ControlPanelProps {
  projectId?: string;
  className?: string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ projectId, className = '' }) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'config' | 'batch' | 'history'>('lifecycle');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  const { 
    activeOperations, 
    selectedProjects, 
    isOfflineMode,
    queuedActions 
  } = useAppSelector(state => state.projectControls);
  
  const servers = useAppSelector(state => state.servers.servers);
  const currentProject = projectId ? servers.find(s => s.id === projectId) : null;

  useEffect(() => {
    const checkConnection = () => {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2603/api';
      const healthUrl = apiUrl.replace('/api', '/health');
      fetch(healthUrl)
        .then(() => {
          setConnectionStatus('connected');
          if (isOfflineMode) {
            dispatch(setOfflineMode(false));
          }
        })
        .catch(() => {
          setConnectionStatus('disconnected');
          dispatch(setOfflineMode(true));
        });
    };

    const interval = setInterval(checkConnection, 5000);
    checkConnection();

    return () => clearInterval(interval);
  }, [dispatch, isOfflineMode]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 's':
            e.preventDefault();
            if (currentProject) {
              handleLifecycleAction('start', currentProject.id);
            }
            break;
          case 'x':
            e.preventDefault();
            if (currentProject) {
              handleLifecycleAction('stop', currentProject.id);
            }
            break;
          case 'r':
            e.preventDefault();
            if (currentProject) {
              handleLifecycleAction('restart', currentProject.id);
            }
            break;
          case 'a':
            e.preventDefault();
            dispatch(clearProjectSelection());
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentProject, dispatch]);

  const handleLifecycleAction = async (action: 'start' | 'stop' | 'restart', targetProjectId: string) => {
    const operation = {
      id: `op-${Date.now()}`,
      projectId: targetProjectId,
      type: action as any,
      status: 'pending' as const,
      timestamp: Date.now()
    };

    dispatch(startOperation(operation));

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2603/api';
      const response = await fetch(`${apiUrl}/servers/${targetProjectId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Check if this is a Docker failure with fallback available
        if (errorData.fallbackAvailable && errorData.mode === 'docker') {
          const tryNative = window.confirm(
            `Docker failed: ${errorData.error}\n\n` +
            `Suggestion: ${errorData.suggestion}\n\n` +
            `Would you like to try starting in native mode instead?`
          );
          
          if (tryNative) {
            // Retry with native mode
            const nativeResponse = await fetch(`${apiUrl}/servers/${targetProjectId}/${action}?native=true`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (nativeResponse.ok) {
              const result = await nativeResponse.json();
              dispatch(completeOperation({ 
                projectId: targetProjectId, 
                status: 'completed' 
              }));
              
              // Refresh and show success
              setTimeout(async () => {
                try {
                  const serverService = await import('../../services/serverService');
                  const { setServers } = await import('../../store/slices/serversSlice');
                  const updatedServers = await serverService.default.listServers();
                  dispatch(setServers(updatedServers));
                } catch (e) {
                  console.error('Failed to refresh servers:', e);
                }
              }, 1000);
              
              alert(`Started successfully in native mode!\n\nNote: Docker mode failed, using native process instead.`);
              return;
            }
          }
        }
        
        // Show detailed error with suggestion if available
        const errorMessage = errorData.suggestion 
          ? `${errorData.error}\n\nSuggestion: ${errorData.suggestion}`
          : errorData.error || `Failed to ${action} project`;
          
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      dispatch(completeOperation({ 
        projectId: targetProjectId, 
        status: 'completed' 
      }));
      
      // Refresh server list after successful action
      setTimeout(async () => {
        try {
          const serverService = await import('../../services/serverService');
          const { setServers } = await import('../../store/slices/serversSlice');
          const updatedServers = await serverService.default.listServers();
          dispatch(setServers(updatedServers));
        } catch (e) {
          console.error('Failed to refresh servers:', e);
        }
      }, 1000); // Wait a second for the server to actually start/stop
      
      // Show success notification (if we had a toast system)
      console.log(`Successfully ${action}ed ${targetProjectId}:`, result);
    } catch (error) {
      dispatch(completeOperation({ 
        projectId: targetProjectId, 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      
      // Show error notification
      console.error(`Failed to ${action} ${targetProjectId}:`, error);
      alert(`Failed to ${action} server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const tabButtons = [
    { id: 'lifecycle', label: 'Lifecycle', icon: Activity },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'batch', label: 'Batch Operations', icon: Activity },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {isOfflineMode && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Offline Mode Active
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-300">
                {queuedActions.length} actions queued. They will be executed when connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 p-2">
          {tabButtons.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`
                flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTab === id 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              aria-label={`Switch to ${label} tab`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'lifecycle' && (
          <LifecycleControls
            projectId={projectId}
            onAction={handleLifecycleAction}
            isLoading={!!projectId && !!activeOperations[projectId]}
          />
        )}

        {activeTab === 'config' && projectId && (
          <ConfigurationManager
            projectId={projectId}
          />
        )}

        {activeTab === 'batch' && (
          <BatchOperations
            selectedProjects={selectedProjects}
            onExecute={(action, projectIds) => {
              projectIds.forEach(id => handleLifecycleAction(action, id));
            }}
          />
        )}

        {activeTab === 'history' && (
          <OperationHistory />
        )}
      </div>

      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            <span>{connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'reconnecting' ? 'Reconnecting...' : 
                   'Disconnected'}</span>
          </div>
          <div>
            Keyboard shortcuts: Ctrl+S (Start), Ctrl+X (Stop), Ctrl+R (Restart)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;