import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { ControlPanel } from '../components/controls';
import { Server, Activity, AlertCircle } from 'lucide-react';

const ServersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const servers = useAppSelector(state => state.servers.servers);

  useEffect(() => {
    if (servers.length > 0 && !selectedProjectId) {
      setSelectedProjectId(servers[0].id);
    }
  }, [servers, selectedProjectId]);

  const getStatusIndicator = (status?: string) => {
    switch(status) {
      case 'running':
        return <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />;
      case 'stopped':
        return <div className="h-2 w-2 bg-gray-400 rounded-full" />;
      case 'error':
        return <div className="h-2 w-2 bg-red-500 rounded-full" />;
      default:
        return <div className="h-2 w-2 bg-yellow-500 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Controls</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced controls to manage your containerized projects
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Projects
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {servers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No projects registered</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {servers.map(server => (
                    <button
                      key={server.id}
                      onClick={() => setSelectedProjectId(server.id)}
                      className={`
                        w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                        ${selectedProjectId === server.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            {getStatusIndicator(server.status)}
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {server.name}
                            </span>
                          </div>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>Port: {server.port}</span>
                            {server.type && (
                              <>
                                <span className="mx-1">•</span>
                                <span>{server.type}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {server.status === 'running' && (
                          <Activity className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total Projects</span>
                <span className="font-medium text-gray-900 dark:text-white">{servers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Running</span>
                <span className="font-medium text-green-600">
                  {servers.filter(s => s.status === 'running').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Stopped</span>
                <span className="font-medium text-gray-600">
                  {servers.filter(s => s.status === 'stopped').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Errors</span>
                <span className="font-medium text-red-600">
                  {servers.filter(s => s.status === 'error').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <ControlPanel 
            projectId={selectedProjectId}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ServersPage;