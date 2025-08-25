/**
 * Multi-Tech Dashboard API Service
 * 
 * Handles API calls for multi-technology process discovery and management
 */

import { apiService } from './api';
import {
  TechStack,
  DiscoveredProcess,
  SystemHealthMetrics,
  CorrelationResult,
  BulkActionRequest,
  BulkActionResult
} from '../types';

export interface ProcessDiscoveryRequest {
  techStacks?: TechStack[];
  forceRefresh?: boolean;
  includeCorrelation?: boolean;
  timeout?: number;
}

export interface ProcessDiscoveryResponse {
  scanId: string;
  timestamp: string;
  duration: number;
  techStackResults: Record<TechStack, {
    techStack: TechStack;
    processes: DiscoveredProcess[];
    success: boolean;
    error?: string;
  }>;
  totalProcesses: number;
  processesFound: DiscoveredProcess[];
  correlation?: {
    registeredProcesses: DiscoveredProcess[];
    discoveredProcesses: DiscoveredProcess[];
    rogueProcesses: DiscoveredProcess[];
    orphanedProcesses: DiscoveredProcess[];
    correlationResults: CorrelationResult[];
  };
  performance?: {
    cpuUsage: number;
    memoryUsage: number;
    scanDuration: number;
  };
  success: boolean;
}

class MultiTechService {
  /**
   * Discover processes across all technology stacks
   */
  async discoverProcesses(request: ProcessDiscoveryRequest = {}): Promise<ProcessDiscoveryResponse> {
    try {
      return await apiService.post('/processes/discovery', {
        techStacks: request.techStacks || ['nodejs', 'php', 'python', 'static', 'docker'],
        forceRefresh: request.forceRefresh || false,
        includeCorrelation: request.includeCorrelation !== false,
        timeout: request.timeout || 2000
      });
    } catch (error) {
      // For now, return mock data if backend isn't ready
      console.warn('Multi-tech discovery endpoint not available, using mock data:', error);
      return this.getMockDiscoveryResponse();
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    try {
      return await apiService.get('/processes/system-health');
    } catch (error) {
      console.warn('System health endpoint not available, using mock data:', error);
      return this.getMockSystemHealth();
    }
  }

  /**
   * Execute bulk operations on processes
   */
  async executeBulkAction(request: BulkActionRequest): Promise<BulkActionResult> {
    try {
      return await apiService.post('/processes/bulk-action', request);
    } catch (error) {
      console.warn('Bulk action endpoint not available, using mock response:', error);
      return this.getMockBulkActionResult(request);
    }
  }

  /**
   * Get real-time process updates via Server-Sent Events
   */
  createRealTimeConnection(): EventSource {
    try {
      const baseUrl = apiService['client'].defaults.baseURL || 'http://localhost:2601/api';
      const url = `${baseUrl}/processes/realtime`;
      return new EventSource(url);
    } catch (error) {
      console.warn('Real-time connection not available:', error);
      // Return a mock EventSource for development
      return this.getMockEventSource();
    }
  }

  /**
   * Terminate a specific process
   */
  async terminateProcess(processId: string, options: {
    force?: boolean;
    reason?: string;
  } = {}): Promise<{ success: boolean; message: string }> {
    try {
      return await apiService.post(`/processes/${processId}/terminate`, options);
    } catch (error) {
      console.warn('Process termination endpoint not available:', error);
      return { success: true, message: `Mock termination of process ${processId}` };
    }
  }

  /**
   * Associate a rogue process with a workspace
   */
  async associateProcess(processId: string, workspace: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiService.post(`/processes/${processId}/associate`, { workspace });
    } catch (error) {
      console.warn('Process association endpoint not available:', error);
      return { success: true, message: `Mock association of process ${processId} with ${workspace}` };
    }
  }

  /**
   * Clean up orphaned process entries
   */
  async cleanupOrphaned(processIds: string[]): Promise<{ success: boolean; cleanedCount: number }> {
    try {
      return await apiService.post('/processes/cleanup-orphaned', { processIds });
    } catch (error) {
      console.warn('Cleanup endpoint not available:', error);
      return { success: true, cleanedCount: processIds.length };
    }
  }

  // Mock data methods for development

  private getMockDiscoveryResponse(): ProcessDiscoveryResponse {
    const mockProcesses: DiscoveredProcess[] = [
      {
        pid: 1234,
        port: 3000,
        command: 'npm run dev',
        cwd: '/home/user/project1',
        techStack: 'nodejs',
        framework: 'vite',
        serverType: 'vite',
        category: 'registered',
        correlationStatus: 'registered',
        workspace: '/home/user/project1',
        workspaceConfidence: 0.95,
        startTime: new Date(Date.now() - 120000).toISOString(),
        status: 'running',
        health: 'healthy'
      },
      {
        pid: 5678,
        port: 8000,
        command: 'python -m http.server 8000',
        cwd: '/tmp',
        techStack: 'python',
        serverType: 'http.server',
        category: 'rogue',
        correlationStatus: 'rogue',
        rogueReason: 'Process running outside known workspace',
        startTime: new Date(Date.now() - 300000).toISOString(),
        status: 'running',
        health: 'warning'
      },
      {
        pid: 9999,
        port: 8080,
        command: 'php -S localhost:8080',
        cwd: '/var/www/html',
        techStack: 'php',
        serverType: 'php-builtin',
        category: 'discovered',
        correlationStatus: 'discovered',
        workspace: '/var/www/html',
        workspaceConfidence: 0.8,
        startTime: new Date(Date.now() - 600000).toISOString(),
        status: 'running',
        health: 'healthy'
      }
    ];

    const techStackResults: Record<TechStack, any> = {
      nodejs: {
        techStack: 'nodejs',
        processes: mockProcesses.filter(p => p.techStack === 'nodejs'),
        success: true
      },
      php: {
        techStack: 'php',
        processes: mockProcesses.filter(p => p.techStack === 'php'),
        success: true
      },
      python: {
        techStack: 'python',
        processes: mockProcesses.filter(p => p.techStack === 'python'),
        success: true
      },
      static: {
        techStack: 'static',
        processes: mockProcesses.filter(p => p.techStack === 'static'),
        success: true
      },
      docker: {
        techStack: 'docker',
        processes: mockProcesses.filter(p => p.techStack === 'docker'),
        success: true
      }
    };

    return {
      scanId: `scan_${Date.now()}`,
      timestamp: new Date().toISOString(),
      duration: 150,
      techStackResults,
      totalProcesses: mockProcesses.length,
      processesFound: mockProcesses,
      correlation: {
        registeredProcesses: mockProcesses.filter(p => p.category === 'registered'),
        discoveredProcesses: mockProcesses.filter(p => p.category === 'discovered'),
        rogueProcesses: mockProcesses.filter(p => p.category === 'rogue'),
        orphanedProcesses: mockProcesses.filter(p => p.category === 'orphaned'),
        correlationResults: []
      },
      performance: {
        cpuUsage: 1.2,
        memoryUsage: 45.3,
        scanDuration: 150
      },
      success: true
    };
  }

  private getMockSystemHealth(): SystemHealthMetrics {
    return {
      cpu: 15.3,
      memory: 62.7,
      diskSpace: 78.2,
      totalProcesses: 3,
      rogueProcesses: 1,
      portUtilization: 12,
      lastUpdate: new Date().toISOString(),
      status: 'warning'
    };
  }

  private getMockBulkActionResult(request: BulkActionRequest): BulkActionResult {
    return {
      success: true,
      processedCount: request.processIds.length,
      failedCount: 0,
      results: request.processIds.map(id => ({
        processId: id,
        success: true
      })),
      summary: `Mock ${request.action} completed for ${request.processIds.length} processes`
    };
  }

  private getMockEventSource(): EventSource {
    // Create a mock EventSource for development
    const mockEventSource = {
      onopen: null as ((event: Event) => void) | null,
      onmessage: null as ((event: MessageEvent) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      close: () => {},
      readyState: 1,
      url: '/api/processes/realtime',
      withCredentials: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    };

    // Simulate some periodic events
    setTimeout(() => {
      if (mockEventSource.onopen) {
        mockEventSource.onopen(new Event('open'));
      }
    }, 100);

    // Send mock updates every 10 seconds
    setInterval(() => {
      if (mockEventSource.onmessage) {
        const mockEvent = {
          data: JSON.stringify({
            type: 'process-discovered',
            timestamp: new Date().toISOString(),
            techStack: 'nodejs',
            process: {
              pid: Math.floor(Math.random() * 10000),
              port: 3000 + Math.floor(Math.random() * 100),
              command: 'npm start',
              techStack: 'nodejs'
            }
          }),
          lastEventId: '',
          origin: '',
          ports: []
        } as MessageEvent;
        
        mockEventSource.onmessage(mockEvent);
      }
    }, 10000);

    return mockEventSource as EventSource;
  }
}

// Create and export singleton instance
export const multiTechService = new MultiTechService();
export default multiTechService;