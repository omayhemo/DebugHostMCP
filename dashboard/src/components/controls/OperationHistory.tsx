import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { clearOperationHistory } from '../../store/slices/projectControlsSlice';
import { CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';

const OperationHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const operationHistory = useAppSelector(state => state.projectControls.operationHistory);
  const servers = useAppSelector(state => state.servers.servers);

  const getProjectName = (projectId: string) => {
    const server = servers.find(s => s.id === projectId);
    return server?.name || 'Unknown Project';
  };

  const getOperationIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getOperationColor = (type: string) => {
    switch(type) {
      case 'start':
        return 'text-green-600 bg-green-100';
      case 'stop':
        return 'text-red-600 bg-red-100';
      case 'restart':
        return 'text-blue-600 bg-blue-100';
      case 'configure':
        return 'text-purple-600 bg-purple-100';
      case 'health':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear the operation history?')) {
      dispatch(clearOperationHistory());
    }
  };

  if (operationHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No operations in history</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Operations will appear here as you interact with your projects
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Operation History
        </h3>
        <button
          onClick={handleClearHistory}
          className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear History
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {operationHistory.slice().reverse().map((operation) => (
          <div
            key={operation.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {getOperationIcon(operation.status)}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getProjectName(operation.projectId)}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getOperationColor(operation.type)}`}>
                    {operation.type.toUpperCase()}
                  </span>
                </div>
                {operation.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Error: {operation.error}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimestamp(operation.timestamp)}
              </p>
              {operation.progress !== undefined && operation.progress < 100 && (
                <div className="mt-1 w-20">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full"
                      style={{ width: `${operation.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {operationHistory.filter(op => op.status === 'completed').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Successful</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {operationHistory.filter(op => op.status === 'failed').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">
              {operationHistory.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationHistory;