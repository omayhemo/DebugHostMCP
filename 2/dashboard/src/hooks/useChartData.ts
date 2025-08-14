import { useMemo } from 'react';
import { useAppSelector } from '../store';
import { ContainerMetrics } from '../store/slices/metricsSlice';

interface ChartDataPoint {
  x: number; // timestamp
  y: number; // value
}

export interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  borderColor: string;
  backgroundColor: string;
  fill: boolean;
  tension: number;
}

export interface ProcessedChartData {
  labels: string[];
  datasets: ChartDataset[];
}

const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

const sampleData = (data: ChartDataPoint[], maxPoints: number): ChartDataPoint[] => {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
};

export const useChartData = (maxDataPoints: number = 100) => {
  const { currentMetrics, selectedContainers, timeRange } = useAppSelector(state => state.metrics);

  // CPU Chart Data
  const cpuChartData = useMemo((): ProcessedChartData => {
    const containerData = new Map<string, ChartDataPoint[]>();

    // Process container CPU data from current metrics
    Object.values(currentMetrics).forEach(metric => {
      if (!selectedContainers.length || selectedContainers.includes(metric.containerId)) {
        if (!containerData.has(metric.containerName)) {
          containerData.set(metric.containerName, []);
        }
        containerData.get(metric.containerName)!.push({
          x: new Date(metric.timestamp).getTime(),
          y: metric.cpu.usage,
        });
      }
    });

    // No system data in current structure

    const datasets: ChartDataset[] = [];
    let colorIndex = 0;

    // Add container datasets
    containerData.forEach((data, containerName) => {
      const sampledData = sampleData(data, maxDataPoints);
      const color = COLORS[colorIndex % COLORS.length];
      
      datasets.push({
        label: `${containerName} CPU`,
        data: sampledData,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.4,
      });
      colorIndex++;
    });

    // System data not available in current structure

    const allTimestamps = Object.values(currentMetrics).map(m => new Date(m.timestamp).getTime());
    
    const labels = [...new Set(allTimestamps)]
      .sort()
      .slice(-maxDataPoints)
      .map(timestamp => formatTimestamp(timestamp));

    return { labels, datasets };
  }, [currentMetrics, selectedContainers, maxDataPoints]);

  // Memory Chart Data
  const memoryChartData = useMemo((): ProcessedChartData => {
    const containerData = new Map<string, ChartDataPoint[]>();

    Object.values(currentMetrics).forEach(metric => {
      if (!selectedContainers.length || selectedContainers.includes(metric.containerId)) {
        if (!containerData.has(metric.containerName)) {
          containerData.set(metric.containerName, []);
        }
        containerData.get(metric.containerName)!.push({
          x: new Date(metric.timestamp).getTime(),
          y: metric.memory.percentage,
        });
      }
    });

    const datasets: ChartDataset[] = [];
    let colorIndex = 0;

    containerData.forEach((data, containerName) => {
      const sampledData = sampleData(data, maxDataPoints);
      const color = COLORS[colorIndex % COLORS.length];
      
      datasets.push({
        label: `${containerName} Memory`,
        data: sampledData,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.4,
      });
      colorIndex++;
    });

    const allTimestamps = Object.values(currentMetrics).map(m => new Date(m.timestamp).getTime());
    
    const labels = [...new Set(allTimestamps)]
      .sort()
      .slice(-maxDataPoints)
      .map(timestamp => formatTimestamp(timestamp));

    return { labels, datasets };
  }, [currentMetrics, selectedContainers, maxDataPoints]);

  // Network Chart Data
  const networkChartData = useMemo((): ProcessedChartData => {
    const containerInData = new Map<string, ChartDataPoint[]>();
    const containerOutData = new Map<string, ChartDataPoint[]>();

    Object.values(currentMetrics).forEach(metric => {
      if (!selectedContainers.length || selectedContainers.includes(metric.containerId)) {
        const containerName = metric.containerName;
        
        if (!containerInData.has(containerName)) {
          containerInData.set(containerName, []);
          containerOutData.set(containerName, []);
        }
        
        containerInData.get(containerName)!.push({
          x: new Date(metric.timestamp).getTime(),
          y: metric.network.bytesIn / 1024 / 1024, // Convert to MB
        });
        
        containerOutData.get(containerName)!.push({
          x: new Date(metric.timestamp).getTime(),
          y: metric.network.bytesOut / 1024 / 1024, // Convert to MB
        });
      }
    });

    const datasets: ChartDataset[] = [];
    let colorIndex = 0;

    containerInData.forEach((data, containerName) => {
      const color = COLORS[colorIndex % COLORS.length];
      const sampledData = sampleData(data, maxDataPoints);
      
      datasets.push({
        label: `${containerName} In`,
        data: sampledData,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.4,
      });
      colorIndex++;
    });

    containerOutData.forEach((data, containerName) => {
      const color = COLORS[colorIndex % COLORS.length];
      const sampledData = sampleData(data, maxDataPoints);
      
      datasets.push({
        label: `${containerName} Out`,
        data: sampledData,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.4,
      });
      colorIndex++;
    });

    const allTimestamps = Object.values(currentMetrics).map(m => new Date(m.timestamp).getTime());
    
    const labels = [...new Set(allTimestamps)]
      .sort()
      .slice(-maxDataPoints)
      .map(timestamp => formatTimestamp(timestamp));

    return { labels, datasets };
  }, [currentMetrics, selectedContainers, maxDataPoints]);

  // Disk Chart Data  
  const diskChartData = useMemo((): ProcessedChartData => {
    const containerReadData = new Map<string, ChartDataPoint[]>();
    const containerWriteData = new Map<string, ChartDataPoint[]>();

    Object.values(currentMetrics).forEach(metric => {
      if (!selectedContainers.length || selectedContainers.includes(metric.containerId)) {
        const containerName = metric.containerName;
        
        if (!containerReadData.has(containerName)) {
          containerReadData.set(containerName, []);
          containerWriteData.set(containerName, []);
        }
        
        // Note: Current structure doesn't have readBytes/writeBytes, using disk usage as placeholder
        containerReadData.get(containerName)!.push({
          x: new Date(metric.timestamp).getTime(),
          y: metric.disk.usage / 1024 / 1024, // Convert to MB
        });
        
        containerWriteData.get(containerName)!.push({
          x: new Date(metric.timestamp).getTime(),
          y: metric.disk.available / 1024 / 1024, // Convert to MB  
        });
      }
    });

    const datasets: ChartDataset[] = [];
    let colorIndex = 0;

    containerReadData.forEach((data, containerName) => {
      const color = COLORS[colorIndex % COLORS.length];
      const sampledData = sampleData(data, maxDataPoints);
      
      datasets.push({
        label: `${containerName} Usage`,
        data: sampledData,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.4,
      });
      colorIndex++;
    });

    containerWriteData.forEach((data, containerName) => {
      const color = COLORS[colorIndex % COLORS.length];
      const sampledData = sampleData(data, maxDataPoints);
      
      datasets.push({
        label: `${containerName} Available`,
        data: sampledData,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.4,
      });
      colorIndex++;
    });

    const allTimestamps = Object.values(currentMetrics).map(m => new Date(m.timestamp).getTime());
    
    const labels = [...new Set(allTimestamps)]
      .sort()
      .slice(-maxDataPoints)
      .map(timestamp => formatTimestamp(timestamp));

    return { labels, datasets };
  }, [currentMetrics, selectedContainers, maxDataPoints]);

  return {
    cpuChartData,
    memoryChartData,
    networkChartData,
    diskChartData,
  };
};