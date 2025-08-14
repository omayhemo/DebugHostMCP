import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import MetricsVisualization from '../MetricsVisualization';
import metricsSlice from '../../../store/slices/metricsSlice';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      metrics: metricsSlice,
    },
    preloadedState: {
      metrics: {
        currentMetrics: {
          'container-1': {
            containerId: 'container-1',
            containerName: 'test-container',
            cpu: { usage: 45.5, cores: 2 },
            memory: { usage: 1024 * 1024 * 512, limit: 1024 * 1024 * 1024, percentage: 50 },
            disk: { usage: 1024 * 1024 * 1024 * 10, available: 1024 * 1024 * 1024 * 40, percentage: 20 },
            network: { bytesIn: 1024 * 100, bytesOut: 1024 * 150, packetsIn: 100, packetsOut: 150 },
            timestamp: new Date().toISOString(),
          },
        },
        historicalMetrics: {
          'container-1-cpu': [
            { timestamp: new Date(Date.now() - 60000).toISOString(), value: 40, unit: '%' },
            { timestamp: new Date(Date.now() - 30000).toISOString(), value: 45, unit: '%' },
            { timestamp: new Date().toISOString(), value: 45.5, unit: '%' },
          ],
        },
        connectionStatus: {
          connected: true,
          reconnecting: false,
          lastPing: new Date().toISOString(),
          retryAttempts: 0,
          maxRetryAttempts: 10,
        },
        loading: false,
        error: null,
        filters: {
          containers: [],
          metrics: ['cpu', 'memory', 'disk', 'network'],
          timeRange: {
            start: new Date(Date.now() - 3600000).toISOString(),
            end: new Date().toISOString(),
            interval: '1m',
          },
        },
        autoRefresh: true,
        refreshInterval: 30,
        chartConfigs: {
          cpu: {
            type: 'line',
            colors: ['#3b82f6', '#ef4444'],
            yAxisMin: 0,
            yAxisMax: 100,
          },
          memory: {
            type: 'area',
            colors: ['#10b981', '#f59e0b'],
            yAxisMin: 0,
          },
          disk: {
            type: 'bar',
            colors: ['#8b5cf6', '#06b6d4'],
            yAxisMin: 0,
          },
          network: {
            type: 'line',
            colors: ['#f97316', '#84cc16'],
            yAxisMin: 0,
          },
        },
        performanceMetrics: {
          updateLatency: 25,
          renderTime: 12,
          dataPoints: 100,
          memoryUsage: 45,
        },
        alertThresholds: {
          cpu: 85,
          memory: 90,
          disk: 95,
        },
        selectedContainers: [],
        timeRange: {
          start: new Date(Date.now() - 3600000).toISOString(),
          end: new Date().toISOString(),
          interval: '1m',
        },
        ...initialState,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('MetricsVisualization', () => {
  describe('Rendering', () => {
    it('renders CPU metrics chart', () => {
      renderWithProvider(
        <MetricsVisualization metricType="cpu" timeRange="realtime" />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders memory metrics chart', () => {
      renderWithProvider(
        <MetricsVisualization metricType="memory" timeRange="1h" />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders disk metrics as bar chart', () => {
      renderWithProvider(
        <MetricsVisualization metricType="disk" timeRange="1h" />
      );

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('renders network metrics chart', () => {
      renderWithProvider(
        <MetricsVisualization metricType="network" timeRange="realtime" />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Chart Configuration', () => {
    it('applies correct chart options for CPU metrics', () => {
      renderWithProvider(
        <MetricsVisualization metricType="cpu" timeRange="realtime" />
      );

      const chartOptions = screen.getByTestId('chart-options');
      const options = JSON.parse(chartOptions.textContent || '{}');
      
      expect(options.plugins.title.text).toBe('CPU Usage');
      expect(options.scales.y.title.text).toBe('Usage (%)');
      expect(options.scales.y.min).toBe(0);
      expect(options.scales.y.max).toBe(100);
    });

    it('applies correct chart options for memory metrics', () => {
      renderWithProvider(
        <MetricsVisualization metricType="memory" timeRange="1h" />
      );

      const chartOptions = screen.getByTestId('chart-options');
      const options = JSON.parse(chartOptions.textContent || '{}');
      
      expect(options.plugins.title.text).toBe('Memory Usage');
      expect(options.scales.y.title.text).toBe('Usage (MB)');
    });

    it('applies correct chart options for disk metrics', () => {
      renderWithProvider(
        <MetricsVisualization metricType="disk" timeRange="24h" />
      );

      const chartOptions = screen.getByTestId('chart-options');
      const options = JSON.parse(chartOptions.textContent || '{}');
      
      expect(options.plugins.title.text).toBe('Disk Usage');
      expect(options.scales.y.title.text).toBe('Usage (GB)');
    });
  });

  describe('Data Processing', () => {
    it('processes historical data correctly', () => {
      renderWithProvider(
        <MetricsVisualization 
          containerId="container-1" 
          metricType="cpu" 
          timeRange="1h" 
        />
      );

      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      
      expect(data.datasets).toHaveLength(1);
      expect(data.datasets[0].label).toBe('test-container CPU');
      expect(data.datasets[0].data).toEqual([40, 45, 45.5]);
    });

    it('handles real-time data correctly', () => {
      renderWithProvider(
        <MetricsVisualization 
          containerId="container-1" 
          metricType="cpu" 
          timeRange="realtime" 
        />
      );

      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      
      expect(data.datasets).toHaveLength(1);
      expect(data.datasets[0].pointRadius).toBe(0); // Real-time should have no point radius
    });

    it('handles multiple containers', () => {
      const store = createMockStore({
        currentMetrics: {
          'container-1': {
            containerId: 'container-1',
            containerName: 'container-1',
            cpu: { usage: 45.5, cores: 2 },
            memory: { usage: 1024 * 1024 * 512, limit: 1024 * 1024 * 1024, percentage: 50 },
            disk: { usage: 1024 * 1024 * 1024 * 10, available: 1024 * 1024 * 1024 * 40, percentage: 20 },
            network: { bytesIn: 1024 * 100, bytesOut: 1024 * 150, packetsIn: 100, packetsOut: 150 },
            timestamp: new Date().toISOString(),
          },
          'container-2': {
            containerId: 'container-2',
            containerName: 'container-2',
            cpu: { usage: 30.2, cores: 1 },
            memory: { usage: 1024 * 1024 * 256, limit: 1024 * 1024 * 512, percentage: 50 },
            disk: { usage: 1024 * 1024 * 1024 * 5, available: 1024 * 1024 * 1024 * 45, percentage: 10 },
            network: { bytesIn: 1024 * 50, bytesOut: 1024 * 75, packetsIn: 50, packetsOut: 75 },
            timestamp: new Date().toISOString(),
          },
        },
        selectedContainers: ['container-1', 'container-2'],
      });

      renderWithProvider(
        <MetricsVisualization metricType="cpu" timeRange="realtime" />,
        store
      );

      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      
      expect(data.datasets).toHaveLength(2);
      expect(data.datasets[0].label).toBe('container-1 CPU');
      expect(data.datasets[1].label).toBe('container-2 CPU');
    });
  });

  describe('Props and Configuration', () => {
    it('respects custom height prop', () => {
      const { container } = renderWithProvider(
        <MetricsVisualization metricType="cpu" timeRange="realtime" height={400} />
      );

      const chartContainer = container.querySelector('.bg-card');
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });

    it('shows/hides legend based on prop', () => {
      renderWithProvider(
        <MetricsVisualization 
          metricType="cpu" 
          timeRange="realtime" 
          showLegend={false} 
        />
      );

      const chartOptions = screen.getByTestId('chart-options');
      const options = JSON.parse(chartOptions.textContent || '{}');
      
      expect(options.plugins.legend.display).toBe(false);
    });

    it('shows/hides grid based on prop', () => {
      renderWithProvider(
        <MetricsVisualization 
          metricType="cpu" 
          timeRange="realtime" 
          showGrid={false} 
        />
      );

      const chartOptions = screen.getByTestId('chart-options');
      const options = JSON.parse(chartOptions.textContent || '{}');
      
      expect(options.scales.x.grid.display).toBe(false);
      expect(options.scales.y.grid.display).toBe(false);
    });

    it('enables/disables animation based on prop', () => {
      renderWithProvider(
        <MetricsVisualization 
          metricType="cpu" 
          timeRange="1h" 
          animated={false} 
        />
      );

      const chartOptions = screen.getByTestId('chart-options');
      const options = JSON.parse(chartOptions.textContent || '{}');
      
      expect(options.animation).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty metrics data', () => {
      const store = createMockStore({
        currentMetrics: {},
        historicalMetrics: {},
      });

      renderWithProvider(
        <MetricsVisualization metricType="cpu" timeRange="realtime" />,
        store
      );

      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      
      expect(data.datasets).toHaveLength(0);
      expect(data.labels).toHaveLength(0);
    });

    it('handles missing historical data', () => {
      const store = createMockStore({
        historicalMetrics: {},
      });

      renderWithProvider(
        <MetricsVisualization 
          containerId="container-1" 
          metricType="cpu" 
          timeRange="1h" 
        />,
        store
      );

      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      
      expect(data.datasets).toHaveLength(1);
      expect(data.datasets[0].data).toHaveLength(0);
    });

    it('handles invalid container ID', () => {
      renderWithProvider(
        <MetricsVisualization 
          containerId="non-existent" 
          metricType="cpu" 
          timeRange="realtime" 
        />
      );

      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      
      expect(data.datasets).toHaveLength(0);
    });
  });

  describe('Data Formatting', () => {
    it('formats memory data in MB', () => {
      renderWithProvider(
        <MetricsVisualization 
          containerId="container-1" 
          metricType="memory" 
          timeRange="realtime" 
        />
      );

      const chartOptions = screen.getByTestId('chart-options');
      const options = JSON.parse(chartOptions.textContent || '{}');
      
      expect(options.plugins.tooltip.callbacks.label).toBeDefined();
    });

    it('formats disk data in GB', () => {
      renderWithProvider(
        <MetricsVisualization 
          containerId="container-1" 
          metricType="disk" 
          timeRange="realtime" 
        />
      );

      const chartOptions = screen.getByTestId('chart-options');
      const options = JSON.parse(chartOptions.textContent || '{}');
      
      expect(options.plugins.tooltip.callbacks.label).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('limits data points for performance', () => {
      const largeHistoricalData = Array.from({ length: 2000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        value: Math.random() * 100,
        unit: '%',
      }));

      const store = createMockStore({
        historicalMetrics: {
          'container-1-cpu': largeHistoricalData,
        },
      });

      renderWithProvider(
        <MetricsVisualization 
          containerId="container-1" 
          metricType="cpu" 
          timeRange="realtime" 
        />,
        store
      );

      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      
      // Should limit to last 60 points for real-time
      expect(data.datasets[0].data.length).toBeLessThanOrEqual(60);
    });
  });
});

// Integration tests
describe('MetricsVisualization Integration', () => {
  it('integrates with Redux store correctly', async () => {
    const store = createMockStore();
    
    renderWithProvider(
      <MetricsVisualization metricType="cpu" timeRange="realtime" />,
      store
    );

    // Verify the component reads from the store
    await waitFor(() => {
      const chartData = screen.getByTestId('chart-data');
      expect(chartData).toBeInTheDocument();
    });
  });

  it('updates when store data changes', async () => {
    const store = createMockStore();
    
    const { rerender } = renderWithProvider(
      <MetricsVisualization metricType="cpu" timeRange="realtime" />,
      store
    );

    // Update the store
    store.dispatch({
      type: 'metrics/updateCurrentMetrics',
      payload: [{
        containerId: 'new-container',
        containerName: 'new-container',
        cpu: { usage: 75, cores: 4 },
        memory: { usage: 1024 * 1024 * 1024, limit: 1024 * 1024 * 1024 * 2, percentage: 50 },
        disk: { usage: 1024 * 1024 * 1024 * 20, available: 1024 * 1024 * 1024 * 30, percentage: 40 },
        network: { bytesIn: 1024 * 200, bytesOut: 1024 * 300, packetsIn: 200, packetsOut: 300 },
        timestamp: new Date().toISOString(),
      }],
    });

    rerender(
      <Provider store={store}>
        <MetricsVisualization metricType="cpu" timeRange="realtime" />
      </Provider>
    );

    await waitFor(() => {
      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      expect(data.datasets.some((dataset: any) => dataset.label.includes('new-container'))).toBe(true);
    });
  });
});