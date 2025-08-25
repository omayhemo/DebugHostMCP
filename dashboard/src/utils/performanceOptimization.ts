/**
 * Performance Optimization Utilities
 * 
 * Utilities for optimizing real-time update performance:
 * - Debouncing and throttling
 * - Virtual scrolling optimization
 * - Memory management
 * - DOM update batching
 * - Animation performance
 */

/**
 * Debounce function for reducing frequent calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(null, args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(null, args);
  };
}

/**
 * Throttle function for limiting call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * RAF-based throttle for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  
  return (...args: Parameters<T>) => {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(null, args);
        rafId = null;
      });
    }
  };
}

/**
 * Batch DOM updates for better performance
 */
export class DOMBatcher {
  private updates: Array<() => void> = [];
  private scheduled = false;
  
  add(update: () => void): void {
    this.updates.push(update);
    
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }
  
  private flush(): void {
    const updates = this.updates.slice();
    this.updates = [];
    this.scheduled = false;
    
    // Group updates by type for better performance
    const reads: Array<() => void> = [];
    const writes: Array<() => void> = [];
    
    updates.forEach(update => {
      // Simple heuristic: if update name contains 'read', 'get', 'measure'
      if (update.name && /read|get|measure/i.test(update.name)) {
        reads.push(update);
      } else {
        writes.push(update);
      }
    });
    
    // Execute all reads first, then all writes to minimize layout thrashing
    reads.forEach(read => read());
    writes.forEach(write => write());
  }
  
  clear(): void {
    this.updates = [];
    this.scheduled = false;
  }
}

/**
 * Memory-efficient event history manager
 */
export class EventHistoryManager<T> {
  private events: T[] = [];
  private maxSize: number;
  private cleanupThreshold: number;
  
  constructor(maxSize = 200, cleanupThreshold = 0.8) {
    this.maxSize = maxSize;
    this.cleanupThreshold = cleanupThreshold;
  }
  
  add(event: T): void {
    this.events.unshift(event);
    
    // Cleanup when we reach threshold
    if (this.events.length > this.maxSize * this.cleanupThreshold) {
      this.cleanup();
    }
  }
  
  addBatch(events: T[]): void {
    this.events.unshift(...events);
    
    if (this.events.length > this.maxSize * this.cleanupThreshold) {
      this.cleanup();
    }
  }
  
  private cleanup(): void {
    // Keep only the most recent events
    this.events = this.events.slice(0, this.maxSize);
  }
  
  getEvents(count?: number): T[] {
    return count ? this.events.slice(0, count) : this.events;
  }
  
  getSize(): number {
    return this.events.length;
  }
  
  clear(): void {
    this.events = [];
  }
  
  // Get events within time range for efficient filtering
  getEventsInRange(startTime: Date, endTime: Date, getTimestamp: (event: T) => Date): T[] {
    const start = startTime.getTime();
    const end = endTime.getTime();
    
    return this.events.filter(event => {
      const timestamp = getTimestamp(event).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }
}

/**
 * Efficient diff calculator for process changes
 */
export class ProcessDiffer<T extends { [key: string]: any }> {
  private cache = new Map<string, T>();
  
  diff(id: string, current: T): { changed: boolean; changes: Partial<T> } {
    const previous = this.cache.get(id);
    
    if (!previous) {
      this.cache.set(id, { ...current });
      return { changed: true, changes: current };
    }
    
    const changes: Partial<T> = {};
    let hasChanges = false;
    
    // Compare only specific fields that we care about for performance
    const watchedFields = ['status', 'category', 'workspace', 'health', 'port'];
    
    for (const field of watchedFields) {
      if (field in current && current[field] !== previous[field]) {
        changes[field as keyof T] = current[field];
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      this.cache.set(id, { ...current });
    }
    
    return { changed: hasChanges, changes };
  }
  
  remove(id: string): boolean {
    return this.cache.delete(id);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

/**
 * Virtual scrolling helper for large lists
 */
export class VirtualScrollManager {
  private containerHeight: number;
  private itemHeight: number;
  private totalItems: number;
  private scrollTop: number = 0;
  private overscan: number;
  
  constructor(containerHeight: number, itemHeight: number, overscan = 5) {
    this.containerHeight = containerHeight;
    this.itemHeight = itemHeight;
    this.overscan = overscan;
    this.totalItems = 0;
  }
  
  updateDimensions(containerHeight: number, itemHeight: number, totalItems: number): void {
    this.containerHeight = containerHeight;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
  }
  
  updateScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }
  
  getVisibleRange(): { start: number; end: number; offsetY: number; totalHeight: number } {
    const visibleItemCount = Math.ceil(this.containerHeight / this.itemHeight);
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    
    const start = Math.max(0, startIndex - this.overscan);
    const end = Math.min(
      this.totalItems - 1,
      startIndex + visibleItemCount + this.overscan
    );
    
    const offsetY = start * this.itemHeight;
    const totalHeight = this.totalItems * this.itemHeight;
    
    return { start, end, offsetY, totalHeight };
  }
  
  getItemTop(index: number): number {
    return index * this.itemHeight;
  }
  
  isVisible(index: number): boolean {
    const { start, end } = this.getVisibleRange();
    return index >= start && index <= end;
  }
}

/**
 * Animation frame scheduler for smooth updates
 */
export class AnimationScheduler {
  private callbacks: Array<{ callback: () => void; priority: number }> = [];
  private scheduled = false;
  
  schedule(callback: () => void, priority = 0): void {
    this.callbacks.push({ callback, priority });
    
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }
  
  private flush(): void {
    // Sort by priority (higher priority first)
    this.callbacks.sort((a, b) => b.priority - a.priority);
    
    const startTime = performance.now();
    const maxFrameTime = 16; // ~60fps
    
    let i = 0;
    while (i < this.callbacks.length && (performance.now() - startTime) < maxFrameTime) {
      try {
        this.callbacks[i].callback();
      } catch (error) {
        console.error('Animation callback error:', error);
      }
      i++;
    }
    
    // If we didn't finish all callbacks, schedule the rest for next frame
    if (i < this.callbacks.length) {
      this.callbacks = this.callbacks.slice(i);
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    } else {
      this.callbacks = [];
      this.scheduled = false;
    }
  }
  
  clear(): void {
    this.callbacks = [];
    this.scheduled = false;
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  private measurements: Array<{ timestamp: number; used: number }> = [];
  private maxMeasurements = 50;
  
  measure(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize;
      
      this.measurements.push({
        timestamp: Date.now(),
        used
      });
      
      // Keep only recent measurements
      if (this.measurements.length > this.maxMeasurements) {
        this.measurements = this.measurements.slice(-this.maxMeasurements);
      }
      
      return used;
    }
    
    return 0;
  }
  
  getUsage(): { current: number; trend: 'increasing' | 'decreasing' | 'stable' } {
    const current = this.measure();
    
    if (this.measurements.length < 3) {
      return { current, trend: 'stable' };
    }
    
    const recent = this.measurements.slice(-3);
    const first = recent[0].used;
    const last = recent[recent.length - 1].used;
    const threshold = 1024 * 1024; // 1MB
    
    if (last - first > threshold) {
      return { current, trend: 'increasing' };
    } else if (first - last > threshold) {
      return { current, trend: 'decreasing' };
    } else {
      return { current, trend: 'stable' };
    }
  }
  
  clear(): void {
    this.measurements = [];
  }
}

/**
 * Create singleton instances for global use
 */
export const domBatcher = new DOMBatcher();
export const animationScheduler = new AnimationScheduler();
export const memoryMonitor = new MemoryMonitor();

/**
 * Performance hooks for React components
 */
export function usePerformanceMonitor(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) { // Log slow components
        console.warn(`Slow component ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

// Import React for the hook
import React from 'react';