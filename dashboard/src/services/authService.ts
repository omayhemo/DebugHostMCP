import { apiService } from './api';
import { User } from '../store/slices/authSlice';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  token: string;
  expiresIn: number;
}

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/login', credentials);
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  // Refresh token
  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return apiService.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/auth/me');
  }

  // Register user (if supported)
  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    return apiService.post<LoginResponse>('/auth/register', userData);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Check if token is expired (basic JWT check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Store tokens
  storeTokens(token: string, refreshToken?: string): void {
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  // Clear stored tokens
  clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}

export const authService = new AuthService();
export default authService;