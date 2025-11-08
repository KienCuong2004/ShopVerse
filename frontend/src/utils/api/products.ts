import apiClient from "./api";
import {
  Product,
  ProductRequest,
  PaginatedResponse,
  ProductStatus,
} from "@/types";

export interface GetProductsParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  keyword?: string;
  categoryId?: string;
  status?: ProductStatus | "";
  lowStock?: boolean;
}

export const productsApi = {
  // Get all products with optional filters
  getAll: async (
    params?: GetProductsParams
  ): Promise<PaginatedResponse<Product>> => {
    const query = new URLSearchParams();
    if (params?.page !== undefined)
      query.append("page", params.page.toString());
    if (params?.size !== undefined)
      query.append("size", params.size.toString());
    if (params?.sortBy) query.append("sortBy", params.sortBy);
    if (params?.sortDir) query.append("sortDir", params.sortDir);
    if (params?.keyword) query.append("keyword", params.keyword);
    if (params?.categoryId) query.append("categoryId", params.categoryId);
    if (params?.status) query.append("status", params.status);
    if (params?.lowStock) query.append("lowStock", String(params.lowStock));

    const queryString = query.toString();
    return await apiClient.get<PaginatedResponse<Product>>(
      `/products${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get product by ID
  getById: async (id: string): Promise<Product> => {
    return await apiClient.get<Product>(`/products/${id}`);
  },

  // Search products (fallback helper)
  search: async (
    keyword: string,
    params?: Omit<GetProductsParams, "keyword">
  ): Promise<PaginatedResponse<Product>> => {
    return await productsApi.getAll({
      keyword,
      ...params,
    });
  },

  // Get available products (in stock)
  getAvailable: async (): Promise<Product[]> => {
    return await apiClient.get<Product[]>("/products/available");
  },

  // Create product (Admin only)
  create: async (data: ProductRequest): Promise<Product> => {
    return await apiClient.post<Product>("/products", data);
  },

  // Update product (Admin only)
  update: async (id: string, data: ProductRequest): Promise<Product> => {
    return await apiClient.put<Product>(`/products/${id}`, data);
  },

  // Delete product (Admin only)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/products/${id}`);
  },
};
