import apiClient from "./api";
import { Cart, CartItem } from "@/types";

export const cartApi = {
  // Get user's cart
  getCart: async (): Promise<Cart> => {
    return await apiClient.get<Cart>("/cart");
  },

  // Add item to cart
  addItem: async (productId: string, quantity: number): Promise<CartItem> => {
    return await apiClient.post<CartItem>("/cart/items", {
      productId,
      quantity,
    });
  },

  // Update cart item quantity
  updateItem: async (itemId: string, quantity: number): Promise<CartItem> => {
    return await apiClient.put<CartItem>(`/cart/items/${itemId}`, { quantity });
  },

  // Remove item from cart
  removeItem: async (itemId: string): Promise<void> => {
    return await apiClient.delete<void>(`/cart/items/${itemId}`);
  },

  // Clear cart
  clearCart: async (): Promise<void> => {
    return await apiClient.delete<void>("/cart");
  },
};
