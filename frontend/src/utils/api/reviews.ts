import apiClient from "./api";
import { Review, ReviewRequest, PaginatedResponse } from "@/types";

export const reviewsApi = {
  // Get reviews by product ID
  getByProduct: async (
    productId: string,
    page = 0,
    size = 20,
    sort?: string
  ): Promise<PaginatedResponse<Review>> => {
    const params = new URLSearchParams({
      productId,
      page: page.toString(),
      size: size.toString(),
    });
    if (sort) {
      params.append("sort", sort);
    }
    return await apiClient.get<PaginatedResponse<Review>>(
      `/reviews/product?${params.toString()}`
    );
  },

  // Get approved reviews by product ID
  getApprovedByProduct: async (
    productId: string,
    page = 0,
    size = 20,
    sort?: string
  ): Promise<PaginatedResponse<Review>> => {
    const params = new URLSearchParams({
      productId,
      page: page.toString(),
      size: size.toString(),
    });
    if (sort) {
      params.append("sort", sort);
    }
    return await apiClient.get<PaginatedResponse<Review>>(
      `/reviews/product/${productId}/approved?${params.toString()}`
    );
  },

  // Get user's reviews
  getUserReviews: async (
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<Review>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    return await apiClient.get<PaginatedResponse<Review>>(
      `/reviews/user?${params.toString()}`
    );
  },

  // Get review by ID
  getById: async (id: string): Promise<Review> => {
    return await apiClient.get<Review>(`/reviews/${id}`);
  },

  // Create review
  create: async (data: ReviewRequest): Promise<Review> => {
    return await apiClient.post<Review>("/reviews", data);
  },

  // Update review
  update: async (id: string, data: Partial<ReviewRequest>): Promise<Review> => {
    return await apiClient.put<Review>(`/reviews/${id}`, data);
  },

  // Delete review
  delete: async (id: string): Promise<void> => {
    return await apiClient.delete<void>(`/reviews/${id}`);
  },
};
