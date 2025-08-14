/**
 * Circular Buffer Implementation
 * Memory-efficient data structure for handling streaming metrics data
 * Automatically overwrites old data when capacity is reached
 */

export interface CircularBufferOptions<T> {
  capacity: number;
  onOverflow?: (overwrittenItem: T) => void;
  onCapacityReached?: () => void;
}

export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;
  private readonly capacity: number;
  private readonly onOverflow?: (overwrittenItem: T) => void;
  private readonly onCapacityReached?: () => void;

  constructor(options: CircularBufferOptions<T>) {
    this.capacity = Math.max(1, options.capacity);
    this.buffer = new Array(this.capacity);
    this.onOverflow = options.onOverflow;
    this.onCapacityReached = options.onCapacityReached;
  }

  /**
   * Add an item to the buffer
   */
  push(item: T): void {
    const wasAtCapacity = this.size === this.capacity;
    
    if (wasAtCapacity && this.buffer[this.tail] !== undefined) {
      this.onOverflow?.(this.buffer[this.tail] as T);
    }

    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (wasAtCapacity) {
      this.head = (this.head + 1) % this.capacity;
    } else {
      this.size++;
      if (this.size === this.capacity) {
        this.onCapacityReached?.();
      }
    }
  }

  /**
   * Add multiple items to the buffer
   */
  pushMany(items: T[]): void {
    for (const item of items) {
      this.push(item);
    }
  }

  /**
   * Get the most recent item without removing it
   */
  peek(): T | undefined {
    if (this.size === 0) return undefined;
    const lastIndex = this.tail === 0 ? this.capacity - 1 : this.tail - 1;
    return this.buffer[lastIndex];
  }

  /**
   * Get the oldest item without removing it
   */
  peekOldest(): T | undefined {
    if (this.size === 0) return undefined;
    return this.buffer[this.head];
  }

  /**
   * Remove and return the oldest item
   */
  shift(): T | undefined {
    if (this.size === 0) return undefined;

    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.size--;

    return item;
  }

  /**
   * Get all items in chronological order (oldest first)
   */
  toArray(): T[] {
    if (this.size === 0) return [];

    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const index = (this.head + i) % this.capacity;
      const item = this.buffer[index];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Get the most recent N items in reverse chronological order (newest first)
   */
  getRecent(count: number): T[] {
    const actualCount = Math.min(count, this.size);
    if (actualCount === 0) return [];

    const result: T[] = [];
    for (let i = 0; i < actualCount; i++) {
      const index = (this.tail - 1 - i + this.capacity) % this.capacity;
      const item = this.buffer[index];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Get items within a specific range (by index from oldest)
   */
  getRange(start: number, end: number): T[] {
    const actualStart = Math.max(0, Math.min(start, this.size));
    const actualEnd = Math.max(actualStart, Math.min(end, this.size));
    
    const result: T[] = [];
    for (let i = actualStart; i < actualEnd; i++) {
      const index = (this.head + i) % this.capacity;
      const item = this.buffer[index];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Clear all items from the buffer
   */
  clear(): void {
    this.buffer.fill(undefined);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Check if buffer is at capacity
   */
  isFull(): boolean {
    return this.size === this.capacity;
  }

  /**
   * Get current number of items
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Get buffer capacity
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Get memory usage estimate in bytes (rough approximation)
   */
  getMemoryUsage(): number {
    // Rough estimate: 
    // - Array overhead: ~100 bytes
    // - Each slot: ~8 bytes (pointer) + estimated item size
    // This is a simplified calculation
    const arrayOverhead = 100;
    const pointerSize = 8;
    const estimatedItemSize = 50; // Rough estimate for typical metric data
    
    return arrayOverhead + (this.capacity * (pointerSize + estimatedItemSize));
  }

  /**
   * Iterator support for for...of loops
   */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this.size; i++) {
      const index = (this.head + i) % this.capacity;
      const item = this.buffer[index];
      if (item !== undefined) {
        yield item;
      }
    }
  }
}

/**
 * Time-based circular buffer that automatically removes old entries
 */
export interface TimeBasedEntry<T> {
  data: T;
  timestamp: number;
}

export class TimeBasedCircularBuffer<T> extends CircularBuffer<TimeBasedEntry<T>> {
  private readonly maxAge: number; // in milliseconds

  constructor(capacity: number, maxAge: number) {
    super({ capacity });
    this.maxAge = maxAge;
  }

  /**
   * Add data with current timestamp
   */
  addData(data: T): void {
    this.cleanup();
    this.push({
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get all valid (non-expired) data
   */
  getValidData(): T[] {
    this.cleanup();
    return this.toArray().map(entry => entry.data);
  }

  /**
   * Get data within a time range
   */
  getDataInRange(startTime: number, endTime: number): T[] {
    this.cleanup();
    return this.toArray()
      .filter(entry => entry.timestamp >= startTime && entry.timestamp <= endTime)
      .map(entry => entry.data);
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.maxAge;

    while (!this.isEmpty()) {
      const oldest = this.peekOldest();
      if (oldest && oldest.timestamp < cutoff) {
        this.shift();
      } else {
        break;
      }
    }
  }
}

/**
 * Metrics-specific circular buffer with aggregation capabilities
 */
export interface MetricPoint {
  timestamp: number;
  value: number;
  containerId?: string;
  metricType?: string;
}

export class MetricsCircularBuffer extends CircularBuffer<MetricPoint> {
  constructor(capacity: number = 10000) {
    super({ 
      capacity,
      onCapacityReached: () => {
        console.debug(`Metrics buffer reached capacity: ${capacity}`);
      }
    });
  }

  /**
   * Add a metric point
   */
  addMetric(timestamp: number, value: number, containerId?: string, metricType?: string): void {
    this.push({
      timestamp,
      value,
      containerId,
      metricType
    });
  }

  /**
   * Get metrics within a time range
   */
  getMetricsInRange(startTime: number, endTime: number): MetricPoint[] {
    return this.toArray().filter(point => 
      point.timestamp >= startTime && point.timestamp <= endTime
    );
  }

  /**
   * Get metrics for a specific container
   */
  getContainerMetrics(containerId: string): MetricPoint[] {
    return this.toArray().filter(point => point.containerId === containerId);
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(metricType: string): MetricPoint[] {
    return this.toArray().filter(point => point.metricType === metricType);
  }

  /**
   * Calculate average value over time range
   */
  getAverageInRange(startTime: number, endTime: number, containerId?: string): number {
    const metrics = this.getMetricsInRange(startTime, endTime);
    const filtered = containerId 
      ? metrics.filter(m => m.containerId === containerId)
      : metrics;
    
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, point) => acc + point.value, 0);
    return sum / filtered.length;
  }

  /**
   * Get min/max values in range
   */
  getMinMaxInRange(startTime: number, endTime: number, containerId?: string): { min: number; max: number } {
    const metrics = this.getMetricsInRange(startTime, endTime);
    const filtered = containerId 
      ? metrics.filter(m => m.containerId === containerId)
      : metrics;
    
    if (filtered.length === 0) return { min: 0, max: 0 };
    
    const values = filtered.map(m => m.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  /**
   * Get data points suitable for LTTB downsampling
   */
  getDataPointsForSampling(): { x: number; y: number }[] {
    return this.toArray().map(point => ({
      x: point.timestamp,
      y: point.value
    }));
  }
}