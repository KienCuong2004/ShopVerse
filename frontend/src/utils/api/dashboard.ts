import apiClient from "./api";
import {
  AdminDashboardOverviewResponse,
  AdminDashboardSummary,
  RecentOrderSummary,
  RevenueTrendPoint,
} from "@/types";

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const normalizeSummary = (
  summary: AdminDashboardSummary
): AdminDashboardSummary => ({
  ...summary,
  totalRevenue: toNumber(summary.totalRevenue),
  revenue30Days: toNumber(summary.revenue30Days),
  totalOrders: toNumber(summary.totalOrders),
  pendingOrders: toNumber(summary.pendingOrders),
  deliveredOrders: toNumber(summary.deliveredOrders),
  totalCustomers: toNumber(summary.totalCustomers),
  newCustomers: toNumber(summary.newCustomers),
  totalProducts: toNumber(summary.totalProducts),
  lowStockProducts: toNumber(summary.lowStockProducts),
  activeBanners: toNumber(summary.activeBanners),
  activeCoupons: toNumber(summary.activeCoupons),
});

const normalizeTrend = (
  trend: RevenueTrendPoint[]
): RevenueTrendPoint[] =>
  trend.map((point) => ({
    ...point,
    revenue: toNumber(point.revenue),
    orderCount: toNumber(point.orderCount),
  }));

const normalizeRecentOrders = (
  orders: RecentOrderSummary[]
): RecentOrderSummary[] =>
  orders.map((order) => ({
    ...order,
    totalAmount: toNumber(order.totalAmount),
  }));

export const dashboardApi = {
  getOverview: async (): Promise<AdminDashboardOverviewResponse> => {
    const response = await apiClient.get<AdminDashboardOverviewResponse>(
      "/admin/dashboard/overview"
    );

    return {
      summary: normalizeSummary(response.summary),
      revenueTrend: normalizeTrend(response.revenueTrend),
      recentOrders: normalizeRecentOrders(response.recentOrders),
    };
  },
};

export default dashboardApi;

