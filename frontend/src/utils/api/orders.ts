import apiClient from "./api";
import { Order, OrderRequest, PaginatedResponse } from "@/types";

export const ordersApi = {
  // Get user's orders with pagination
  getOrders: async (
    page = 0,
    size = 20,
    sort?: string
  ): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (sort) {
      params.append("sort", sort);
    }
    return await apiClient.get<PaginatedResponse<Order>>(
      `/orders?${params.toString()}`
    );
  },

  // Get order by ID
  getById: async (id: string): Promise<Order> => {
    return await apiClient.get<Order>(`/orders/${id}`);
  },

  // Get order by order number
  getByOrderNumber: async (orderNumber: string): Promise<Order> => {
    return await apiClient.get<Order>(`/orders/number/${orderNumber}`);
  },

  // Create order
  create: async (data: OrderRequest): Promise<Order> => {
    return await apiClient.post<Order>("/orders", data);
  },

  // Cancel order
  cancel: async (id: string): Promise<Order> => {
    return await apiClient.put<Order>(`/orders/${id}/cancel`);
  },
};
