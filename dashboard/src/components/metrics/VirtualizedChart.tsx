import React, { useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ChartSeries } from './OptimizedChart';
import { lttbDownsample, DataPoint } from '../../utils/lttb';
import { useTheme } from '../../hooks/useTheme';

export interface VirtualizedChartProps {
  series: ChartSeries[];
  width?: number;
  height?: number;
  itemHeight?: number;
  maxDataPoints?: number;
  showMiniChart?: boolean;
  enableSelection?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  onSeriesToggle?: (seriesId: string, visible: boolean) => void;
  onDataPointSelect?: (point: DataPoint, series: ChartSeries) => void;
}

interface SeriesItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    series: ChartSeries[];
    width: number;
    itemHeight: number;
    showMiniChart: boolean;
    theme: string;
    onToggle?: (seriesId: string, visible: boolean) => void;
    onSelect?: (point: DataPoint, series: ChartSeries) => void;
  };
}

// Mini chart component for each series row
const MiniChart: React.FC<{
  data: DataPoint[];
  width: number;
  height: number;
  color: string;
  theme: string;
}> = ({ data, width, height, color, theme }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find data bounds
    const minX = Math.min(...data.map(d => d.x));
    const maxX = Math.max(...data.map(d => d.x));
    const minY = Math.min(...data.map(d => d.y));
    const maxY = Math.max(...data.map(d => d.y));

    // Downsample data for mini chart
    const sampledData = lttbDownsample(data, Math.min(data.length, 100));

    // Draw background
    ctx.fillStyle = theme === 'dark' ? '#374151' : '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    sampledData.forEach((point, index) => {
      const x = ((point.x - minX) / (maxX - minX)) * width;
      const y = height - ((point.y - minY) / (maxY - minY)) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw area fill
    ctx.fillStyle = color + '20'; // Add transparency
    ctx.beginPath();
    
    sampledData.forEach((point, index) => {
      const x = ((point.x - minX) / (maxX - minX)) * width;
      const y = height - ((point.y - minY) / (maxY - minY)) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Close the area
    if (sampledData.length > 0) {
      const lastX = ((sampledData[sampledData.length - 1].x - minX) / (maxX - minX)) * width;
      const firstX = ((sampledData[0].x - minX) / (maxX - minX)) * width;
      ctx.lineTo(lastX, height);
      ctx.lineTo(firstX, height);
    }
    
    ctx.fill();
  }, [data, width, height, color, theme]);

  return <canvas ref={canvasRef} className="rounded" />;
};

// Series row component
const SeriesItem: React.FC<SeriesItemProps> = ({ index, style, data }) => {
  const series = data.series[index];
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = useCallback(() => {
    data.onToggle?.(series.id, !series.visible);
  }, [series.id, series.visible, data.onToggle]);

  const getLatestValue = () => {
    if (series.data.length === 0) return 'N/A';
    const latest = series.data[series.data.length - 1];
    return `${latest.y.toFixed(2)} ${series.unit || ''}`;
  };

  const getStats = () => {
    if (series.data.length === 0) {
      return { min: 'N/A', max: 'N/A', avg: 'N/A' };
    }

    const values = series.data.map(d => d.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2)
    };
  };

  const stats = getStats();
  const isDark = data.theme === 'dark';

  return (
    <div
      style={style}
      className={`
        flex items-center gap-4 px-4 border-b transition-colors
        ${isDark 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
        }
        ${isHovered ? 'shadow-md' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visibility toggle */}
      <div className="flex items-center">
        <button
          onClick={handleToggle}
          className={`
            w-4 h-4 rounded border-2 flex items-center justify-center
            ${series.visible !== false
              ? `bg-current border-current`
              : `border-gray-400 dark:border-gray-500`
            }
          `}
          style={{ 
            color: series.visible !== false ? series.color : 'transparent'
          }}
        >
          {series.visible !== false && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Color indicator */}
      <div 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: series.color }}
      />

      {/* Series info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={`font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {series.name}
          </h4>
          <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {series.data.length} points
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="hidden sm:flex items-center gap-4 text-sm">
        <div className="text-center">
          <div className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {getLatestValue()}
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Current
          </div>
        </div>
        <div className="text-center">
          <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Min: {stats.min}
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Max: {stats.max}
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Avg: {stats.avg}
          </div>
        </div>
      </div>

      {/* Mini chart */}
      {data.showMiniChart && series.data.length > 0 && (
        <div className="hidden md:block">
          <MiniChart
            data={series.data.slice(-200)} // Last 200 points for mini chart
            width={120}
            height={data.itemHeight - 20}
            color={series.color}
            theme={data.theme}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isHovered && (
          <>
            <button
              className={`
                p-1 rounded hover:bg-opacity-20 hover:bg-current
                ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}
              `}
              title="Export series data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              className={`
                p-1 rounded hover:bg-opacity-20 hover:bg-current
                ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}
              `}
              title="Series settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const VirtualizedChart: React.FC<VirtualizedChartProps> = ({
  series,
  width = 800,
  height = 400,
  itemHeight = 80,
  maxDataPoints = 1000,
  showMiniChart = true,
  enableSelection = true,
  theme = 'auto',
  className = '',
  onSeriesToggle,
  onDataPointSelect
}) => {
  const resolvedTheme = useTheme(theme);

  // Process series data
  const processedSeries = useMemo(() => {
    return series.map(s => ({
      ...s,
      data: s.data.length > maxDataPoints 
        ? lttbDownsample(s.data, maxDataPoints)
        : s.data
    }));
  }, [series, maxDataPoints]);

  const itemData = useMemo(() => ({
    series: processedSeries,
    width: width - 40, // Account for scrollbar
    itemHeight,
    showMiniChart,
    theme: resolvedTheme,
    onToggle: onSeriesToggle,
    onSelect: onDataPointSelect
  }), [
    processedSeries,
    width,
    itemHeight,
    showMiniChart,
    resolvedTheme,
    onSeriesToggle,
    onDataPointSelect
  ]);

  const visibleSeriesCount = processedSeries.filter(s => s.visible !== false).length;

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className={`
        flex items-center justify-between px-4 py-3 border-b
        ${resolvedTheme === 'dark' 
          ? 'bg-gray-800 border-gray-700 text-gray-100' 
          : 'bg-gray-50 border-gray-200 text-gray-900'
        }
      `}>
        <div>
          <h3 className="font-medium">
            Metrics Overview
          </h3>
          <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {visibleSeriesCount} of {processedSeries.length} series visible
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              processedSeries.forEach(s => {
                onSeriesToggle?.(s.id, true);
              });
            }}
            className={`
              px-3 py-1 text-sm rounded border transition-colors
              ${resolvedTheme === 'dark'
                ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }
            `}
          >
            Show All
          </button>
          <button
            onClick={() => {
              processedSeries.forEach(s => {
                onSeriesToggle?.(s.id, false);
              });
            }}
            className={`
              px-3 py-1 text-sm rounded border transition-colors
              ${resolvedTheme === 'dark'
                ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }
            `}
          >
            Hide All
          </button>
        </div>
      </div>

      {/* Virtualized list */}
      <div className={`
        border rounded-b-lg overflow-hidden
        ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
      `}>
        <List
          height={height}
          itemCount={processedSeries.length}
          itemSize={itemHeight}
          itemData={itemData}
          width={width}
        >
          {SeriesItem}
        </List>
      </div>

      {/* Footer stats */}
      <div className={`
        flex items-center justify-between px-4 py-2 text-sm border-t
        ${resolvedTheme === 'dark'
          ? 'bg-gray-800 border-gray-700 text-gray-400'
          : 'bg-gray-50 border-gray-200 text-gray-600'
        }
      `}>
        <div>
          Total data points: {processedSeries.reduce((sum, s) => sum + s.data.length, 0).toLocaleString()}
        </div>
        <div>
          Memory usage: ~{Math.round(processedSeries.reduce((sum, s) => sum + s.data.length * 24, 0) / 1024)}KB
        </div>
      </div>
    </div>
  );
};

export default VirtualizedChart;