import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import ChartContainer from './ChartContainer';
import { useChartData } from '../../hooks/useChartData';
import { useAppSelector } from '../../store';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface MemoryChartProps {
  className?: string;
  height?: string;
}

const MemoryChart: React.FC<MemoryChartProps> = ({ className, height = 'h-64' }) => {
  const { memoryChartData } = useChartData(100);
  const { loading, error, connection, data } = useAppSelector(state => state.metrics);
  const theme = useAppSelector(state => state.ui.theme);

  const isDark = theme === 'dark';

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#e5e7eb' : '#374151',
        borderColor: isDark ? '#374151' : '#d1d5db',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          },
          afterLabel: function(context: any) {
            // Try to show actual memory usage if available
            const containerName = context.dataset.label.replace(' Memory', '');
            const currentData = data?.containers.find(c => c.containerName === containerName);
            if (currentData) {
              const used = formatBytes(currentData.memory.used);
              const total = formatBytes(currentData.memory.total);
              return `Used: ${used} / ${total}`;
            }
            return '';
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
          },
        },
        title: {
          display: true,
          text: 'Time',
          color: isDark ? '#9ca3af' : '#6b7280',
          font: {
            size: 11,
          },
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
        },
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Memory Usage (%)',
          color: isDark ? '#9ca3af' : '#6b7280',
          font: {
            size: 11,
          },
        },
        min: 0,
        max: 100,
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
          callback: function(value: any) {
            return value + '%';
          },
        },
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
        },
      },
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 4,
      },
      line: {
        borderWidth: 2,
      },
    },
    animation: {
      duration: 750,
    },
  };

  const chartData = {
    labels: memoryChartData.labels,
    datasets: memoryChartData.datasets.map(dataset => ({
      ...dataset,
      pointBackgroundColor: dataset.borderColor,
      pointBorderColor: dataset.borderColor,
      pointHoverBackgroundColor: dataset.borderColor,
      pointHoverBorderColor: '#ffffff',
    })),
  };

  const hasData = memoryChartData.datasets.length > 0 && memoryChartData.datasets.some(d => d.data.length > 0);

  return (
    <ChartContainer
      title="Memory Usage"
      loading={loading}
      error={error}
      className={className}
      height={height}
    >
      {hasData ? (
        <Line data={chartData} options={options} />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-2xl mb-2">🧠</div>
            <p className="text-sm">No memory data available</p>
            <p className="text-xs mt-1">
              {!connection.connected 
                ? 'Connect to start collecting metrics' 
                : 'Waiting for data...'}
            </p>
          </div>
        </div>
      )}
    </ChartContainer>
  );
};

export default MemoryChart;