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
    console.log('🔍 [MultiTechService] Making API call to /processes/discovery with request:', request);
    
    const response = await apiService.post('/processes/discovery', {
      techStacks: request.techStacks || ['nodejs', 'php', 'python', 'static', 'docker'],
      forceRefresh: request.forceRefresh || false,
      includeCorrelation: request.includeCorrelation !== false,
      timeout: request.timeout || 2000
    });
    
    console.log('🔍 [MultiTechService] Received API response:', response);
    console.log('🔍 [MultiTechService] Response structure check:');
    console.log('  - success:', response.success);
    console.log('  - totalProcesses:', response.totalProcesses);
    console.log('  - processesFound length:', response.processesFound?.length || 0);
    console.log('  - techStackResults keys:', response.techStackResults ? Object.keys(response.techStackResults) : 'none');
    console.log('  - first process:', response.processesFound?.[0] || 'none');
    
    return response;
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    return await apiService.get('/processes/system-health');
  }

  /**
   * Execute bulk operations on processes
   */
  async executeBulkAction(request: BulkActionRequest): Promise<BulkActionResult> {
    return await apiService.post('/processes/bulk-action', request);
  }

  /**
   * Get real-time process updates via Server-Sent Events
   */
  createRealTimeConnection(): EventSource {
    const baseUrl = apiService['client'].defaults.baseURL || 'http://localhost:2603/api';
    const url = `${baseUrl}/processes/realtime`;
    return new EventSource(url);
  }

  /**
   * Terminate a specific process
   */
  async terminateProcess(processId: string, options: {
    force?: boolean;
    reason?: string;
  } = {}): Promise<{ success: boolean; message: string }> {
    return await apiService.post(`/processes/${processId}/terminate`, options);
  }

  /**
   * Associate a rogue process with a workspace
   */
  async associateProcess(processId: string, workspace: string): Promise<{ success: boolean; message: string }> {
    return await apiService.post(`/processes/${processId}/associate`, { workspace });
  }

  /**
   * Clean up orphaned process entries
   */
  async cleanupOrphaned(processIds: string[]): Promise<{ success: boolean; cleanedCount: number }> {
    return await apiService.post('/processes/cleanup-orphaned', { processIds });
  }

}

// Create and export singleton instance
export const multiTechService = new MultiTechService();
export default multiTechService;