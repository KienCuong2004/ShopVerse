import apiClient from "./api";
import { Category } from "@/types";

export const categoriesApi = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    return await apiClient.get<Category[]>("/categories");
  },

  // Get main categories (categories without parent)
  getMainCategories: async (): Promise<Category[]> => {
    return await apiClient.get<Category[]>("/categories/main");
  },

  // Get category by ID
  getById: async (id: string): Promise<Category> => {
    return await apiClient.get<Category>(`/categories/${id}`);
  },

  // Get subcategories
  getSubCategories: async (parentId: string): Promise<Category[]> => {
    return await apiClient.get<Category[]>(
      `/categories/${parentId}/subcategories`
    );
  },

  // Get category by name
  getByName: async (name: string): Promise<Category> => {
    return await apiClient.get<Category>(
      `/categories/name/${encodeURIComponent(name)}`
    );
  },
};
