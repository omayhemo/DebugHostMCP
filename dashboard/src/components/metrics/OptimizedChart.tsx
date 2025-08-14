import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { DataPoint } from '../../utils/lttb';
import { useTheme } from '../../hooks/useTheme';

export interface ChartSeries {
  id: string;
  name: string;
  data: DataPoint[];
  color: string;
  unit?: string;
  visible?: boolean;
}

export interface ChartTheme {
  background: string;
  gridColor: string;
  textColor: string;
  axisColor: string;
  tooltipBackground: string;
  tooltipText: string;
}

export interface OptimizedChartProps {
  series: ChartSeries[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  throttleMs?: number;
  maxDataPoints?: number;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  onDataPointClick?: (point: DataPoint, series: ChartSeries) => void;
  onZoom?: (startTime: number, endTime: number) => void;
}

interface CanvasState {
  isDragging: boolean;
  lastX: number;
  lastY: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  hoveredPoint?: { point: DataPoint; series: ChartSeries; x: number; y: number };
}

export const OptimizedChart: React.FC<OptimizedChartProps> = ({
  series,
  width = 800,
  height = 400,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  enableZoom = true,
  enablePan = true,
  throttleMs = 16, // 60fps
  maxDataPoints = 5000,
  theme = 'auto',
  className = '',
  onDataPointClick,
  onZoom
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastRenderRef = useRef<number>(0);
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    offsetX: 0,
    offsetY: 0,
    scale: 1
  });

  // Get theme colors with background, gridColor, textColor support
  const currentTheme = useTheme(theme);
  const themeColors: ChartTheme = useMemo(() => {
    if (currentTheme === 'dark') {
      return {
        background: '#1f2937',
        gridColor: '#374151',
        textColor: '#f3f4f6',
        axisColor: '#6b7280',
        tooltipBackground: '#111827',
        tooltipText: '#f9fafb'
      };
    }
    return {
      background: '#ffffff',
      gridColor: '#e5e7eb',
      textColor: '#111827',
      axisColor: '#6b7280',
      tooltipBackground: '#ffffff',
      tooltipText: '#111827'
    };
  }, [currentTheme]);

  // Process and optimize data
  const processedSeries = useMemo(() => {
    return series.map(s => ({
      ...s,
      data: s.data.slice(-maxDataPoints) // Limit data points for performance
    })).filter(s => s.visible !== false);
  }, [series, maxDataPoints]);

  // Calculate chart bounds and scales
  const chartBounds = useMemo(() => {
    if (processedSeries.length === 0) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    processedSeries.forEach(s => {
      s.data.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });

    // Add padding
    const xPadding = (maxX - minX) * 0.05;
    const yPadding = (maxY - minY) * 0.1;

    return {
      minX: minX - xPadding,
      maxX: maxX + xPadding,
      minY: minY - yPadding,
      maxY: maxY + yPadding
    };
  }, [processedSeries]);

  // Convert data coordinates to canvas coordinates
  const dataToCanvas = useCallback((x: number, y: number) => {
    const padding = 60; // Space for axes
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const canvasX = padding + ((x - chartBounds.minX) / (chartBounds.maxX - chartBounds.minX)) * chartWidth;
    const canvasY = padding + chartHeight - ((y - chartBounds.minY) / (chartBounds.maxY - chartBounds.minY)) * chartHeight;

    // Apply transformations
    return {
      x: (canvasX + canvasState.offsetX) * canvasState.scale,
      y: (canvasY + canvasState.offsetY) * canvasState.scale
    };
  }, [width, height, chartBounds, canvasState]);

  // Convert canvas coordinates to data coordinates
  const canvasToData = useCallback((canvasX: number, canvasY: number) => {
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Reverse transformations
    const x = (canvasX / canvasState.scale - canvasState.offsetX - padding) / chartWidth;
    const y = 1 - (canvasY / canvasState.scale - canvasState.offsetY - padding) / chartHeight;

    return {
      x: chartBounds.minX + x * (chartBounds.maxX - chartBounds.minX),
      y: chartBounds.minY + y * (chartBounds.maxY - chartBounds.minY)
    };
  }, [width, height, chartBounds, canvasState]);

  // Throttled render function
  const render = useCallback(() => {
    const now = performance.now();
    if (now - lastRenderRef.current < throttleMs) {
      return;
    }
    lastRenderRef.current = now;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = themeColors.background;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    if (showGrid) {
      drawGrid(ctx);
    }

    // Draw axes
    drawAxes(ctx);

    // Draw data series
    processedSeries.forEach(series => {
      drawSeries(ctx, series);
    });

    // Draw legend
    if (showLegend) {
      drawLegend(ctx);
    }
  }, [
    width, height, throttleMs, themeColors, showGrid, processedSeries,
    showLegend, dataToCanvas, chartBounds
  ]);

  // Draw functions
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.strokeStyle = themeColors.gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = padding + (i / 8) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }, [width, height, themeColors]);

  const drawAxes = useCallback((ctx: CanvasRenderingContext2D) => {
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.strokeStyle = themeColors.axisColor;
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();

    // Labels
    ctx.fillStyle = themeColors.textColor;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';

    // X-axis labels (time)
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * chartWidth;
      const dataX = chartBounds.minX + (i / 5) * (chartBounds.maxX - chartBounds.minX);
      const label = new Date(dataX).toLocaleTimeString();
      ctx.fillText(label, x, padding + chartHeight + 20);
    }

    // Y-axis labels (values)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 8; i++) {
      const y = padding + chartHeight - (i / 8) * chartHeight;
      const dataY = chartBounds.minY + (i / 8) * (chartBounds.maxY - chartBounds.minY);
      const label = dataY.toFixed(1);
      ctx.fillText(label, padding - 10, y + 4);
    }
  }, [width, height, themeColors, chartBounds]);

  const drawSeries = useCallback((ctx: CanvasRenderingContext2D, series: ChartSeries) => {
    if (series.data.length === 0) return;

    ctx.strokeStyle = series.color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    
    let first = true;
    for (const point of series.data) {
      const { x, y } = dataToCanvas(point.x, point.y);
      
      // Skip points outside visible area for performance
      if (x < -10 || x > width + 10 || y < -10 || y > height + 10) {
        continue;
      }

      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw data points if zoomed in enough
    if (canvasState.scale > 2 && series.data.length < 500) {
      ctx.fillStyle = series.color;
      for (const point of series.data) {
        const { x, y } = dataToCanvas(point.x, point.y);
        if (x >= 0 && x <= width && y >= 0 && y <= height) {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  }, [dataToCanvas, width, height, canvasState.scale]);

  const drawLegend = useCallback((ctx: CanvasRenderingContext2D) => {
    const legendY = 20;
    let legendX = width - 200;

    ctx.fillStyle = themeColors.tooltipBackground;
    ctx.strokeStyle = themeColors.gridColor;
    ctx.lineWidth = 1;

    // Legend background
    const legendHeight = processedSeries.length * 25 + 20;
    ctx.fillRect(legendX - 10, legendY - 10, 190, legendHeight);
    ctx.strokeRect(legendX - 10, legendY - 10, 190, legendHeight);

    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';

    processedSeries.forEach((series, index) => {
      const y = legendY + index * 25;
      
      // Color indicator
      ctx.fillStyle = series.color;
      ctx.fillRect(legendX, y, 12, 12);
      
      // Series name
      ctx.fillStyle = themeColors.textColor;
      ctx.fillText(series.name, legendX + 20, y + 9);
    });
  }, [width, themeColors, processedSeries]);

  // Find nearest data point to mouse position
  const findNearestPoint = useCallback((mouseX: number, mouseY: number) => {
    let nearestPoint: { point: DataPoint; series: ChartSeries; distance: number } | null = null;

    processedSeries.forEach(series => {
      series.data.forEach(point => {
        const { x, y } = dataToCanvas(point.x, point.y);
        const distance = Math.sqrt(Math.pow(x - mouseX, 2) + Math.pow(y - mouseY, 2));
        
        if (distance < 20 && (!nearestPoint || distance < nearestPoint.distance)) {
          nearestPoint = { point, series, distance };
        }
      });
    });

    return nearestPoint;
  }, [processedSeries, dataToCanvas]);

  // Mouse event handlers
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (canvasState.isDragging && enablePan) {
      const deltaX = mouseX - canvasState.lastX;
      const deltaY = mouseY - canvasState.lastY;
      
      setCanvasState(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
        lastX: mouseX,
        lastY: mouseY
      }));
    } else if (showTooltip) {
      const nearest = findNearestPoint(mouseX, mouseY);
      
      setCanvasState(prev => ({
        ...prev,
        hoveredPoint: nearest ? {
          point: nearest.point,
          series: nearest.series,
          x: mouseX,
          y: mouseY
        } : undefined
      }));
    }
  }, [canvasState, enablePan, showTooltip, findNearestPoint]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!enablePan) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    setCanvasState(prev => ({
      ...prev,
      isDragging: true,
      lastX: mouseX,
      lastY: mouseY
    }));
  }, [enablePan]);

  const handleMouseUp = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!enableZoom) return;

    event.preventDefault();
    
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, canvasState.scale * delta));
    
    setCanvasState(prev => ({
      ...prev,
      scale: newScale
    }));
  }, [enableZoom, canvasState.scale]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!onDataPointClick) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const nearest = findNearestPoint(mouseX, mouseY);
    
    if (nearest) {
      onDataPointClick(nearest.point, nearest.series);
    }
  }, [onDataPointClick, findNearestPoint]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Render tooltip overlay
  const renderTooltip = () => {
    if (!showTooltip || !canvasState.hoveredPoint) return null;

    const { point, series, x, y } = canvasState.hoveredPoint;
    
    return (
      <div
        className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg shadow-lg border"
        style={{
          left: x + 10,
          top: y - 50,
          backgroundColor: themeColors.tooltipBackground,
          color: themeColors.tooltipText,
          borderColor: themeColors.gridColor
        }}
      >
        <div className="text-sm font-medium">{series.name}</div>
        <div className="text-xs opacity-75">
          {new Date(point.x).toLocaleString()}
        </div>
        <div className="text-sm">
          {point.y.toFixed(2)} {series.unit || ''}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />
      {renderTooltip()}
    </div>
  );
};

export default OptimizedChart;