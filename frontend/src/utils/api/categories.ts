import apiClient from "./api";
import {
  Category,
  CategoryImageOption,
  CategoryPayload,
  CategoryTreeNode,
} from "@/types";

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

  // Admin: get category tree with product counts
  getAdminTree: async (): Promise<CategoryTreeNode[]> => {
    return await apiClient.get<CategoryTreeNode[]>("/admin/categories/tree");
  },

  // Admin: create category
  create: async (payload: CategoryPayload): Promise<Category> => {
    return await apiClient.post<Category>("/admin/categories", payload);
  },

  // Admin: update category
  update: async (id: string, payload: CategoryPayload): Promise<Category> => {
    return await apiClient.put<Category>(`/admin/categories/${id}`, payload);
  },

  // Admin: delete category
  remove: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/admin/categories/${id}`);
  },

  // Admin: reorder categories
  reorder: async (payload: {
    parentId?: string | null;
    orderedCategoryIds: string[];
  }): Promise<void> => {
    await apiClient.post<void>("/admin/categories/reorder", payload);
  },

  // Admin: fetch available category images from Next.js API route
  getImageOptions: async (): Promise<CategoryImageOption[]> => {
    const response = await fetch("/api/categories/images", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Không thể tải danh sách ảnh danh mục");
    }

    const data = (await response.json()) as {
      images?: CategoryImageOption[];
    };

    return data.images ?? [];
  },
};
