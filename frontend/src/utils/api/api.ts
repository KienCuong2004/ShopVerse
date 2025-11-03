import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add JWT token to headers
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized - Token expired or invalid
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Clear token and redirect to login
          this.clearToken();

          // Only redirect if we're in the browser
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: "An unexpected error occurred",
      status: error.response?.status || 500,
    };

    if (error.response?.data) {
      const data = error.response.data as any;

      if (data.message) {
        apiError.message = data.message;
      }

      if (data.timestamp) {
        apiError.timestamp = data.timestamp;
      }

      if (data.errors) {
        apiError.errors = data.errors;
      } else if (data.message && typeof data.message === "string") {
        apiError.message = data.message;
      }
    } else if (error.message) {
      apiError.message = error.message;
    }

    return apiError;
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  private setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  private clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  public setAuthToken(token: string): void {
    this.setToken(token);
  }

  public clearAuthToken(): void {
    this.clearToken();
  }

  public isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // HTTP Methods
  public async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
