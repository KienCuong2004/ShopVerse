import apiClient from "./api";
import { Product, ProductRequest, PaginatedResponse } from "@/types";

export const productsApi = {
  // Get all products with pagination
  getAll: async (
    page = 0,
    size = 20,
    sort?: string
  ): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (sort) {
      params.append("sort", sort);
    }
    return await apiClient.get<PaginatedResponse<Product>>(
      `/products?${params.toString()}`
    );
  },

  // Get product by ID
  getById: async (id: string): Promise<Product> => {
    return await apiClient.get<Product>(`/products/${id}`);
  },

  // Search products
  search: async (
    query: string,
    page = 0,
    size = 20,
    sort?: string
  ): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
    });
    if (sort) {
      params.append("sort", sort);
    }
    return await apiClient.get<PaginatedResponse<Product>>(
      `/products/search?${params.toString()}`
    );
  },

  // Get products by category
  getByCategory: async (
    categoryId: string,
    page = 0,
    size = 20,
    sort?: string
  ): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams({
      categoryId,
      page: page.toString(),
      size: size.toString(),
    });
    if (sort) {
      params.append("sort", sort);
    }
    return await apiClient.get<PaginatedResponse<Product>>(
      `/products/category?${params.toString()}`
    );
  },

  // Get products by price range
  getByPriceRange: async (
    minPrice?: number,
    maxPrice?: number,
    page = 0,
    size = 20,
    sort?: string
  ): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (minPrice !== undefined) {
      params.append("minPrice", minPrice.toString());
    }
    if (maxPrice !== undefined) {
      params.append("maxPrice", maxPrice.toString());
    }
    if (sort) {
      params.append("sort", sort);
    }
    return await apiClient.get<PaginatedResponse<Product>>(
      `/products/price?${params.toString()}`
    );
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
    return await apiClient.delete<void>(`/products/${id}`);
  },
};
