import apiClient from "./api";
import {
  Order,
  OrderStatus,
  PaymentStatus,
  PaginatedResponse,
  UpdateOrderPayload,
  OrderSummary,
} from "@/types";

export interface GetAdminOrdersParams {
  page?: number;
  size?: number;
  keyword?: string;
  customerId?: string;
  status?: OrderStatus | "";
  paymentStatus?: PaymentStatus | "";
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}

const buildSearchParams = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

export const ordersApi = {
  getAdminOrders: async (
    params: GetAdminOrdersParams = {}
  ): Promise<PaginatedResponse<Order>> => {
    const query = buildSearchParams({
      page: params.page?.toString(),
      size: params.size?.toString(),
      keyword: params.keyword,
      customerId: params.customerId,
      status: params.status,
      paymentStatus: params.paymentStatus,
      startDate: params.startDate,
      endDate: params.endDate,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    });

    return await apiClient.get<PaginatedResponse<Order>>(
      `/orders${query ? `?${query}` : ""}`
    );
  },

  getSummary: async (
    params: Omit<
      GetAdminOrdersParams,
      "page" | "size" | "sortBy" | "sortDir"
    > = {}
  ): Promise<OrderSummary> => {
    const query = buildSearchParams({
      keyword: params.keyword,
      customerId: params.customerId,
      status: params.status,
      paymentStatus: params.paymentStatus,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    return await apiClient.get<OrderSummary>(
      `/orders/summary${query ? `?${query}` : ""}`
    );
  },

  update: async (id: string, payload: UpdateOrderPayload): Promise<Order> => {
    return await apiClient.put<Order>(`/orders/${id}`, payload);
  },

  getById: async (id: string): Promise<Order> => {
    return await apiClient.get<Order>(`/orders/${id}`);
  },

  getByOrderNumber: async (orderNumber: string): Promise<Order> => {
    return await apiClient.get<Order>(`/orders/number/${orderNumber}`);
  },
};
