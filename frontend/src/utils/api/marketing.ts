import apiClient from "./api";
import { Banner, BannerPayload, Coupon, CouponPayload } from "@/types";

export const marketingApi = {
  // Banners
  getBanners: async (): Promise<Banner[]> => {
    return await apiClient.get<Banner[]>("/admin/banners");
  },

  createBanner: async (payload: BannerPayload): Promise<Banner> => {
    return await apiClient.post<Banner>("/admin/banners", payload);
  },

  updateBanner: async (id: string, payload: BannerPayload): Promise<Banner> => {
    return await apiClient.put<Banner>(`/admin/banners/${id}`, payload);
  },

  deleteBanner: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/admin/banners/${id}`);
  },

  reorderBanners: async (orderedBannerIds: string[]): Promise<void> => {
    await apiClient.post("/admin/banners/reorder", { orderedBannerIds });
  },

  getActiveBanners: async (): Promise<Banner[]> => {
    return await apiClient.get<Banner[]>("/banners/active");
  },

  // Coupons
  getCoupons: async (): Promise<Coupon[]> => {
    return await apiClient.get<Coupon[]>("/admin/coupons");
  },

  createCoupon: async (payload: CouponPayload): Promise<Coupon> => {
    return await apiClient.post<Coupon>("/admin/coupons", payload);
  },

  updateCoupon: async (id: string, payload: CouponPayload): Promise<Coupon> => {
    return await apiClient.put<Coupon>(`/admin/coupons/${id}`, payload);
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/admin/coupons/${id}`);
  },
};
