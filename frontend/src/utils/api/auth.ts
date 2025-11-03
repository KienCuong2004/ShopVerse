import apiClient from "./api";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types";

export const authApi = {
  // Register a new user
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    // Store token after successful registration
    if (response.token) {
      apiClient.setAuthToken(response.token);
    }
    return response;
  },

  // Login user
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    // Store token after successful login
    if (response.token) {
      apiClient.setAuthToken(response.token);
    }
    return response;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    return await apiClient.get<User>("/auth/me");
  },

  // Logout (client-side only, clears token)
  logout: (): void => {
    apiClient.clearAuthToken();
  },
};
