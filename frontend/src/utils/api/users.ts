import apiClient from "./api";
import { User, PaginatedResponse } from "@/types";

export interface UpdateUserRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  role?: string;
  enabled?: boolean;
}

export interface GetUsersParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}

export const usersApi = {
  // Get all users with pagination
  getAllUsers: async (
    params?: GetUsersParams
  ): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined)
      queryParams.append("page", params.page.toString());
    if (params?.size !== undefined)
      queryParams.append("size", params.size.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortDir) queryParams.append("sortDir", params.sortDir);

    const queryString = queryParams.toString();
    const url = `/users${queryString ? `?${queryString}` : ""}`;
    return await apiClient.get<PaginatedResponse<User>>(url);
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    return await apiClient.get<User>(`/users/${id}`);
  },

  // Get user by username
  getUserByUsername: async (username: string): Promise<User> => {
    return await apiClient.get<User>(`/users/username/${username}`);
  },

  // Update user
  updateUser: async (id: string, data: UpdateUserRequest): Promise<User> => {
    return await apiClient.put<User>(`/users/${id}`, data);
  },
};
