import { apiService } from './api';

export interface MCPServerInfo {
  name: string;
  version: string;
  capabilities: string[];
  status: 'connected' | 'disconnected' | 'error';
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

class MCPService {
  // Get MCP server information
  async getServerInfo(): Promise<MCPServerInfo> {
    return apiService.get<MCPServerInfo>('/mcp/info');
  }

  // List available MCP tools
  async listTools(): Promise<MCPTool[]> {
    return apiService.get<MCPTool[]>('/mcp/tools');
  }

  // Execute MCP tool
  async executeTool(toolName: string, parameters: Record<string, any>): Promise<any> {
    return apiService.post(`/mcp/tools/${toolName}/execute`, parameters);
  }

  // Get MCP server status
  async getStatus(): Promise<{ status: string; uptime: number }> {
    return apiService.get('/mcp/status');
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; timestamp: string }> {
    return apiService.get('/mcp/health');
  }
}

export const mcpService = new MCPService();
export default mcpService;