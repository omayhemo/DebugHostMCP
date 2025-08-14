import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../store';
import LogViewer from '../components/logs/LogViewer';
import LogViewerErrorBoundary from '../components/logs/LogViewerErrorBoundary';
import { Server, X, Plus, ChevronDown } from 'lucide-react';
import { serverService } from '../services/serverService';
import { cn } from '../utils/cn';

interface ServerOption {
  sessionId: string;
  name: string;
  status: string;
}

const LogsPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [selectedServer, setSelectedServer] = useState<ServerOption | null>(null);
  const [availableServers, setAvailableServers] = useState<ServerOption[]>([]);
  const [showServerSelect, setShowServerSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available servers
  useEffect(() => {
    const loadServers = async () => {
      try {
        setLoading(true);
        setError(null);
        const servers = await serverService.getServerStatus();
        const serverOptions: ServerOption[] = servers.map(server => ({
          sessionId: server.sessionId,
          name: server.name || server.sessionId,
          status: server.status
        }));
        setAvailableServers(serverOptions);
        
        // Auto-select first running server if none selected
        if (!selectedServer && serverOptions.length > 0) {
          const runningServer = serverOptions.find(s => s.status === 'running');
          if (runningServer) {
            setSelectedServer(runningServer);
          } else {
            setSelectedServer(serverOptions[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load servers:', error);
        setError(error instanceof Error ? error.message : 'Failed to load servers');
      } finally {
        setLoading(false);
      }
    };

    loadServers();
    
    // Refresh server list every 30 seconds
    const interval = setInterval(loadServers, 30000);
    return () => clearInterval(interval);
  }, [selectedServer]);

  const handleServerSelect = (server: ServerOption) => {
    setSelectedServer(server);
    setShowServerSelect(false);
  };

  // Get project ID for the current user/session
  const projectId = user?.id || 'default-project';

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logs</h1>
            <p className="text-muted-foreground">
              Real-time log viewing and analysis
            </p>
          </div>

          {/* Server selector */}
          <div className="flex items-center space-x-4">
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowServerSelect(!showServerSelect)}
                disabled={loading}
                className={cn(
                  'inline-flex items-center px-3 py-2 border border-border rounded-md shadow-sm text-sm font-medium bg-background text-foreground hover:bg-muted transition-colors',
                  loading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Server className="h-4 w-4 mr-2" />
                {loading ? (
                  'Loading...'
                ) : selectedServer ? (
                  <>
                    {selectedServer.name}
                    <span className={cn(
                      'ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      selectedServer.status === 'running' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                    )}>
                      {selectedServer.status}
                    </span>
                  </>
                ) : (
                  'Select Server'
                )}
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>

              {showServerSelect && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowServerSelect(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-md shadow-lg z-50">
                    <div className="p-2">
                      <div className="text-xs text-muted-foreground mb-2 px-2">
                        Available Servers ({availableServers.length})
                      </div>
                      
                      {availableServers.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No servers available
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {availableServers.map((server) => (
                            <button
                              key={server.sessionId}
                              onClick={() => handleServerSelect(server)}
                              className={cn(
                                'w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors',
                                selectedServer?.sessionId === server.sessionId && 'bg-primary/10 text-primary'
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {server.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {server.sessionId}
                                  </div>
                                </div>
                                <span className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                  server.status === 'running' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                )}>
                                  {server.status}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log Viewer */}
      <div className="flex-1 min-h-0">
        {selectedServer ? (
          <LogViewerErrorBoundary>
            <LogViewer
              projectId={projectId}
              containerName={selectedServer.sessionId}
              height={window.innerHeight - 200}
              className="h-full"
            />
          </LogViewerErrorBoundary>
        ) : (
          <div className="h-full flex items-center justify-center bg-card border border-border rounded-lg">
            <div className="text-center space-y-4">
              <Server className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  {availableServers.length === 0 ? 'No Servers Available' : 'Select a Server'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {availableServers.length === 0 
                    ? 'Start a server to view its logs'
                    : 'Choose a server from the dropdown to view its logs'
                  }
                </p>
              </div>
              {availableServers.length === 0 && (
                <button
                  onClick={() => window.location.href = '/servers'}
                  className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium bg-background text-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Server
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPage;