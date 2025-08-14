/**
 * Largest Triangle Three Buckets (LTTB) Algorithm
 * Data sampling algorithm for downsampling time series data while preserving visual characteristics
 * 
 * Algorithm by Sveinn Steinarsson: https://github.com/sveinn-steinarsson/flot-downsample
 */

export interface DataPoint {
  x: number;
  y: number;
  timestamp?: number;
  id?: string;
}

export interface LTTBOptions {
  threshold: number;
  x?: string;
  y?: string;
}

/**
 * Calculate the area of a triangle formed by three points
 */
function triangleArea(
  pointA: DataPoint,
  pointB: DataPoint,
  pointC: DataPoint
): number {
  return Math.abs(
    (pointA.x - pointC.x) * (pointB.y - pointA.y) - 
    (pointA.x - pointB.x) * (pointC.y - pointA.y)
  ) * 0.5;
}

/**
 * LTTB downsample algorithm
 * Reduces data points while maintaining visual fidelity of the time series
 * 
 * @param data - Array of data points to downsample
 * @param threshold - Target number of data points
 * @returns Downsampled array of data points
 */
export function lttbDownsample(data: DataPoint[], threshold: number): DataPoint[] {
  if (data.length <= threshold) {
    return [...data];
  }

  if (threshold <= 2) {
    return data.length > 0 ? [data[0], data[data.length - 1]] : [];
  }

  // Calculate bucket size
  const bucketSize = (data.length - 2) / (threshold - 2);
  
  const sampled: DataPoint[] = [];
  
  // Always include the first point
  sampled.push(data[0]);
  
  let bucketStart = 0;
  let bucketCenter = Math.floor(bucketSize) + 1;
  
  for (let i = 0; i < threshold - 2; i++) {
    const bucketEnd = Math.floor((i + 2) * bucketSize) + 1;
    
    // Calculate average point of the next bucket for area calculation
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = bucketCenter;
    let avgRangeEnd = Math.min(bucketEnd, data.length);
    
    if (i === threshold - 3) {
      // Last bucket - use the last point
      avgRangeEnd = data.length;
    }
    
    const avgRangeLength = avgRangeEnd - avgRangeStart;
    
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }
    
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;
    
    const avgPoint: DataPoint = { x: avgX, y: avgY };
    
    // Get the range for this bucket
    const rangeOffs = Math.floor((i + 1) * bucketSize) + 1;
    const rangeTo = Math.min(bucketCenter, data.length - 1);
    
    // Point A (last selected point)
    const pointA = sampled[sampled.length - 1];
    
    let maxArea = -1;
    let maxAreaIndex = rangeOffs;
    
    // Find point with largest triangle area
    for (let j = rangeOffs; j < rangeTo; j++) {
      const area = triangleArea(pointA, data[j], avgPoint);
      
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }
    
    sampled.push(data[maxAreaIndex]);
    
    bucketStart = bucketCenter;
    bucketCenter = bucketEnd;
  }
  
  // Always include the last point
  sampled.push(data[data.length - 1]);
  
  return sampled;
}

/**
 * Adaptive LTTB that adjusts threshold based on data density and viewport
 */
export function adaptiveLTTB(
  data: DataPoint[], 
  viewportWidth: number = 1920,
  pixelRatio: number = 1,
  maxPoints: number = 10000
): DataPoint[] {
  // Calculate optimal threshold based on viewport width
  // Aim for ~2-3 points per pixel for smooth rendering
  const optimalThreshold = Math.min(
    Math.floor(viewportWidth * pixelRatio * 2.5),
    data.length,
    maxPoints
  );
  
  return lttbDownsample(data, optimalThreshold);
}

/**
 * Multi-resolution LTTB for different zoom levels
 */
export class MultiResolutionLTTB {
  private resolutions: Map<number, DataPoint[]> = new Map();
  
  constructor(private originalData: DataPoint[]) {}
  
  getResolution(threshold: number): DataPoint[] {
    if (!this.resolutions.has(threshold)) {
      this.resolutions.set(threshold, lttbDownsample(this.originalData, threshold));
    }
    return this.resolutions.get(threshold)!;
  }
  
  clearCache(): void {
    this.resolutions.clear();
  }
  
  updateData(newData: DataPoint[]): void {
    this.originalData = newData;
    this.clearCache();
  }
}

/**
 * Real-time LTTB for streaming data
 */
export class StreamingLTTB {
  private buffer: DataPoint[] = [];
  private sampled: DataPoint[] = [];
  private threshold: number;
  
  constructor(threshold: number = 1000) {
    this.threshold = threshold;
  }
  
  addPoint(point: DataPoint): DataPoint[] {
    this.buffer.push(point);
    
    // Resample when buffer exceeds threshold
    if (this.buffer.length > this.threshold * 1.5) {
      this.sampled = lttbDownsample(this.buffer, this.threshold);
      this.buffer = [...this.sampled];
    }
    
    return this.getSampled();
  }
  
  addPoints(points: DataPoint[]): DataPoint[] {
    this.buffer.push(...points);
    
    if (this.buffer.length > this.threshold * 1.5) {
      this.sampled = lttbDownsample(this.buffer, this.threshold);
      this.buffer = [...this.sampled];
    }
    
    return this.getSampled();
  }
  
  getSampled(): DataPoint[] {
    if (this.buffer.length <= this.threshold) {
      return this.buffer;
    }
    return lttbDownsample(this.buffer, this.threshold);
  }
  
  setThreshold(threshold: number): void {
    this.threshold = threshold;
    if (this.buffer.length > threshold * 1.5) {
      this.sampled = lttbDownsample(this.buffer, threshold);
      this.buffer = [...this.sampled];
    }
  }
  
  clear(): void {
    this.buffer = [];
    this.sampled = [];
  }
}