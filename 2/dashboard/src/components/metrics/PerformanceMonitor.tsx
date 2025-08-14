import React, { useEffect, useState } from 'react';
import {
  Monitor,
  Gauge,
  Clock,
  Database,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export interface PerformanceMetrics {
  updateLatency: number;
  renderTime: number;
  dataPoints: number;
  memoryUsage?: number;
}

export interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  onClose: () => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  metrics,
  onClose,
}) => {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<{
    timestamps: string[];
    latency: number[];
    renderTime: number[];
    memory: number[];
  }>({
    timestamps: [],
    latency: [],
    renderTime: [],
    memory: [],
  });

  // Update performance history
  useEffect(() => {
    const now = new Date().toISOString();
    const currentMemory = (performance as any)?.memory?.usedJSHeapSize / 1024 / 1024 || 0;

    setPerformanceHistory(prev => {
      const newHistory = {
        timestamps: [...prev.timestamps, now].slice(-30), // Keep last 30 entries
        latency: [...prev.latency, metrics.updateLatency].slice(-30),
        renderTime: [...prev.renderTime, metrics.renderTime].slice(-30),
        memory: [...prev.memory, currentMemory].slice(-30),
      };
      return newHistory;
    });
  }, [metrics]);

  // Get browser memory information
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory as MemoryInfo);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMs = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
    if (value <= thresholds.warning) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
  };

  const getTrend = (values: number[]): 'up' | 'down' | 'stable' => {
    if (values.length < 5) return 'stable';
    
    const recent = values.slice(-5);
    const earlier = values.slice(-10, -5);
    
    if (earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    const change = (recentAvg - earlierAvg) / earlierAvg;
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  };

  const latencyStatus = getPerformanceStatus(metrics.updateLatency, { good: 50, warning: 100 });
  const renderStatus = getPerformanceStatus(metrics.renderTime, { good: 16, warning: 33 }); // 60fps = 16ms, 30fps = 33ms

  const latencyTrend = getTrend(performanceHistory.latency);
  const renderTrend = getTrend(performanceHistory.renderTime);
  const memoryTrend = getTrend(performanceHistory.memory);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <div className="h-4 w-4" />; // Placeholder for stable
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Monitor className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Performance Monitor</h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Update Latency */}
        <div className={`p-4 rounded-lg border ${latencyStatus.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className={`h-4 w-4 ${latencyStatus.color}`} />
              <span className="text-sm font-medium text-foreground">Update Latency</span>
            </div>
            <TrendIcon trend={latencyTrend} />
          </div>
          <p className={`text-2xl font-bold ${latencyStatus.color} mt-2`}>
            {formatMs(metrics.updateLatency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {latencyStatus.status === 'good' ? 'Excellent' : 
             latencyStatus.status === 'warning' ? 'Fair' : 'Poor'}
          </p>
        </div>

        {/* Render Time */}
        <div className={`p-4 rounded-lg border ${renderStatus.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gauge className={`h-4 w-4 ${renderStatus.color}`} />
              <span className="text-sm font-medium text-foreground">Render Time</span>
            </div>
            <TrendIcon trend={renderTrend} />
          </div>
          <p className={`text-2xl font-bold ${renderStatus.color} mt-2`}>
            {formatMs(metrics.renderTime)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.renderTime <= 16 ? '60+ FPS' :
             metrics.renderTime <= 33 ? '30-60 FPS' : '<30 FPS'}
          </p>
        </div>

        {/* Data Points */}
        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-foreground">Data Points</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {metrics.dataPoints.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Active metrics
          </p>
        </div>

        {/* Memory Usage */}
        <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-foreground">Memory Usage</span>
            </div>
            <TrendIcon trend={memoryTrend} />
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {memoryInfo ? formatBytes(memoryInfo.usedJSHeapSize) : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JS heap size
          </p>
        </div>
      </div>

      {/* Detailed Memory Information */}
      {memoryInfo && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-semibold text-foreground mb-3">Detailed Memory Info</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Used Heap:</span>
              <p className="font-mono text-foreground">{formatBytes(memoryInfo.usedJSHeapSize)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Total Heap:</span>
              <p className="font-mono text-foreground">{formatBytes(memoryInfo.totalJSHeapSize)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Heap Limit:</span>
              <p className="font-mono text-foreground">{formatBytes(memoryInfo.jsHeapSizeLimit)}</p>
            </div>
          </div>
          
          {/* Memory Usage Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Memory Utilization</span>
              <span>
                {((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted-foreground/20 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) > 0.8
                    ? 'bg-red-500'
                    : (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) > 0.6
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{
                  width: `${(memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Performance Recommendations */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-semibold text-foreground mb-3">Performance Recommendations</h4>
        <div className="space-y-2 text-sm">
          {metrics.updateLatency > 100 && (
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                High update latency detected. Consider reducing the number of active containers or increasing the refresh interval.
              </p>
            </div>
          )}
          
          {metrics.renderTime > 33 && (
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                Rendering performance is below 30 FPS. Consider switching to grid view or disabling animations.
              </p>
            </div>
          )}
          
          {memoryInfo && (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) > 0.8 && (
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                Memory usage is high ({'>'}80%). Consider refreshing the page or reducing the number of monitored containers.
              </p>
            </div>
          )}
          
          {/* Show positive feedback when performance is good */}
          {metrics.updateLatency <= 50 && metrics.renderTime <= 16 && (
            <div className="flex items-start space-x-2">
              <Monitor className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                Excellent performance! All metrics are within optimal ranges.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;