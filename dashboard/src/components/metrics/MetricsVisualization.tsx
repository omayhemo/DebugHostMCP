import React from 'react';
import { useAppSelector } from '../../store';
import MetricsControls from './MetricsControls';
import CPUChart from './CPUChart';
import MemoryChart from './MemoryChart';
import NetworkChart from './NetworkChart';
import DiskChart from './DiskChart';
import { cn } from '../../utils/cn';

interface MetricsVisualizationProps {
  className?: string;
}

const MetricsVisualization: React.FC<MetricsVisualizationProps> = ({ className }) => {
  const { connectionStatus, currentMetrics, selectedContainers } = useAppSelector(state => state.metrics);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Controls */}
      <MetricsControls />

      {/* Connection Status Banner */}
      {!connectionStatus.connected && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {connectionStatus.reconnecting ? 'Reconnecting...' : 'Not Connected'}
              </h3>
              <div className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Enable auto-refresh to start collecting metrics
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <CPUChart height="h-80" />

        {/* Memory Chart */}
        <MemoryChart height="h-80" />

        {/* Network Chart */}
        <NetworkChart height="h-80" />

        {/* Disk Chart */}
        <DiskChart height="h-80" />
      </div>

      {/* Summary Stats */}
      {Object.keys(currentMetrics).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Current Stats
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Container Count */}
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Object.keys(currentMetrics).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Active Containers
              </div>
            </div>
            
            {/* Selected Count */}
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {selectedContainers.length || Object.keys(currentMetrics).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Selected Containers
              </div>
            </div>
            
            {/* Average CPU */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Object.values(currentMetrics).length > 0 ? 
                  (Object.values(currentMetrics).reduce((acc, m) => acc + m.cpu.usage, 0) / Object.values(currentMetrics).length).toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Average CPU
              </div>
            </div>
            
            {/* Average Memory */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Object.values(currentMetrics).length > 0 ? 
                  (Object.values(currentMetrics).reduce((acc, m) => acc + m.memory.percentage, 0) / Object.values(currentMetrics).length).toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Average Memory
              </div>
            </div>
          </div>

          {/* Container Details */}
          {Object.keys(currentMetrics).length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Container Details
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Container
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        CPU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Memory
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Network I/O
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Disk Usage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.values(currentMetrics)
                      .filter(container => 
                        !selectedContainers.length || 
                        selectedContainers.includes(container.containerId)
                      )
                      .map(container => (
                        <tr key={container.containerId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {container.containerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {container.cpu.usage.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {container.memory.percentage.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ↑{(container.network.bytesIn / 1024 / 1024).toFixed(1)}MB/s
                            ↓{(container.network.bytesOut / 1024 / 1024).toFixed(1)}MB/s
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {container.disk.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsVisualization;