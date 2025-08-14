import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2601/api';
const API_TIMEOUT = 30000; // 30 seconds

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
      code: error.code,
      details: error.response?.data,
    };

    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any;
      apiError.message = data?.error || data?.message || `HTTP ${error.response.status}`;
      apiError.status = error.response.status;
    } else if (error.request) {
      // Request was made but no response received
      apiError.message = 'Network error - please check your connection';
    } else {
      // Something else happened
      apiError.message = error.message || 'Request setup failed';
    }

    return apiError;
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  // Set base URL dynamically
  setBaseURL(baseURL: string) {
    this.client.defaults.baseURL = baseURL;
  }

  // Set timeout dynamically
  setTimeout(timeout: number) {
    this.client.defaults.timeout = timeout;
  }

  // Metrics endpoints
  async getContainerMetrics(containerId: string, params?: {
    start?: string;
    end?: string;
    interval?: string;
  }): Promise<any> {
    return this.get(`/containers/${containerId}/metrics`, params);
  }

  async getMetricsStream(containerId: string): Promise<EventSource> {
    const token = localStorage.getItem('token');
    const url = new URL(`${API_BASE_URL}/containers/${containerId}/metrics/stream`);
    if (token) {
      url.searchParams.append('token', token);
    }
    return new EventSource(url.toString());
  }

  async getAllContainersMetrics(params?: {
    start?: string;
    end?: string;
    interval?: string;
    containers?: string[];
  }): Promise<any> {
    return this.get('/metrics', params);
  }

  async getMetricsByType(metricType: string, params?: {
    start?: string;
    end?: string;
    interval?: string;
    containers?: string[];
  }): Promise<any> {
    return this.get(`/metrics/${metricType}`, params);
  }

  async exportMetrics(params: {
    format: 'json' | 'csv' | 'prometheus';
    start: string;
    end: string;
    containers?: string[];
    metrics?: string[];
  }): Promise<Blob> {
    const response = await this.client.get('/metrics/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  async getMetricsHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: Record<string, boolean>;
    timestamp: string;
  }> {
    return this.get('/metrics/health');
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;