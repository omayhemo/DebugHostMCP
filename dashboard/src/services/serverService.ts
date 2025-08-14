import { apiService, ApiResponse } from './api';
import { Server } from '../store/slices/serversSlice';

export interface CreateServerRequest {
  name: string;
  command: string;
  cwd: string;
  port?: number;
  env?: Record<string, string>;
}

export interface ServerStatusResponse {
  sessionId: string;
  status: string;
  pid?: number;
  startedAt?: string;
}

export interface ServerLogsResponse {
  logs: string[];
  hasMore: boolean;
}

class ServerService {
  // List all servers
  async listServers(): Promise<Server[]> {
    return apiService.get<Server[]>('/servers');
  }

  // Get server status
  async getServerStatus(sessionId?: string): Promise<Server[]> {
    const url = sessionId ? `/servers/${sessionId}/status` : '/servers/status';
    return apiService.get<Server[]>(url);
  }

  // Create a new server
  async createServer(serverData: CreateServerRequest): Promise<Server> {
    return apiService.post<Server>('/servers', serverData);
  }

  // Start a server
  async startServer(sessionId: string): Promise<ApiResponse> {
    return apiService.post<ApiResponse>(`/servers/${sessionId}/start`);
  }

  // Stop a server
  async stopServer(sessionId: string, force = false): Promise<ApiResponse> {
    return apiService.post<ApiResponse>(`/servers/${sessionId}/stop`, { force });
  }

  // Restart a server
  async restartServer(sessionId: string): Promise<ApiResponse> {
    return apiService.post<ApiResponse>(`/servers/${sessionId}/restart`);
  }

  // Delete a server
  async deleteServer(sessionId: string): Promise<ApiResponse> {
    return apiService.delete<ApiResponse>(`/servers/${sessionId}`);
  }

  // Get server logs
  async getServerLogs(
    sessionId: string,
    options?: {
      limit?: number;
      tail?: boolean;
      since?: string;
    }
  ): Promise<ServerLogsResponse> {
    return apiService.get<ServerLogsResponse>(`/servers/${sessionId}/logs`, options);
  }

  // Stream server logs (Server-Sent Events)
  createLogStream(sessionId: string): EventSource {
    const token = localStorage.getItem('token');
    const baseURL = apiService['client'].defaults.baseURL;
    const url = `${baseURL}/servers/${sessionId}/logs/stream?token=${encodeURIComponent(token || '')}`;
    return new EventSource(url);
  }

  // Get server metrics
  async getServerMetrics(sessionId: string): Promise<any> {
    return apiService.get(`/servers/${sessionId}/metrics`);
  }

  // Update server configuration
  async updateServer(sessionId: string, updates: Partial<CreateServerRequest>): Promise<Server> {
    return apiService.patch<Server>(`/servers/${sessionId}`, updates);
  }
}

export const serverService = new ServerService();
export default serverService;