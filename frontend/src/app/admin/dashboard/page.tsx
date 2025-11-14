"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaBoxOpen,
  FaBoxes,
  FaChartLine,
  FaCheck,
  FaClock,
  FaImages,
  FaMoneyBillWave,
  FaRedo,
  FaTicketAlt,
  FaUsers,
  FaUserPlus,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Button, Card, Loading, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  AdminDashboardOverviewResponse,
  AdminDashboardSummary,
  RecentOrderSummary,
  RevenueTrendPoint,
  UserRole,
  OrderStatus,
  PaymentStatus,
} from "@/types";
import { dashboardApi } from "@/utils/api";
import { formatCurrency } from "@/utils/format";

interface SummaryItem {
  key: keyof AdminDashboardSummary;
  label: string;
  icon: React.ReactNode;
  value: string;
  description?: string;
  tone: "primary" | "success" | "warning" | "neutral";
}

const LOW_STOCK_THRESHOLD = 5;

const statusStyles: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "bg-yellow-100 text-yellow-700",
  [OrderStatus.CONFIRMED]: "bg-blue-100 text-blue-700",
  [OrderStatus.PROCESSING]: "bg-purple-100 text-purple-700",
  [OrderStatus.SHIPPED]: "bg-sky-100 text-sky-700",
  [OrderStatus.DELIVERED]: "bg-green-100 text-green-700",
  [OrderStatus.CANCELLED]: "bg-red-100 text-red-700",
  [OrderStatus.REFUNDED]: "bg-amber-100 text-amber-700",
};

const paymentStyles: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "text-yellow-500",
  [PaymentStatus.PAID]: "text-green-500",
  [PaymentStatus.FAILED]: "text-red-500",
  [PaymentStatus.REFUNDED]: "text-amber-500",
};

const formatDateTime = (input: string) => {
  const date = new Date(input);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [overview, setOverview] =
    useState<AdminDashboardOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== UserRole.ADMIN) {
        router.push("/");
        showToast("Bạn không có quyền truy cập trang này", "error");
      }
    }
  }, [authLoading, isAuthenticated, user, router, showToast]);

  const fetchOverview = useCallback(
    async (withFullScreenLoader = false) => {
      if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
        return;
      }

      if (withFullScreenLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await dashboardApi.getOverview();
        setOverview(response);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu tổng quan dashboard";
        showToast(message, "error");
      } finally {
        if (withFullScreenLoader) {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [isAuthenticated, user, showToast]
  );

  useEffect(() => {
    if (isAuthenticated && user?.role === UserRole.ADMIN) {
      fetchOverview(true);
    }
  }, [isAuthenticated, user, fetchOverview]);

  const summaryItems = useMemo<SummaryItem[]>(() => {
    if (!overview) return [];

    const summary = overview.summary;
    return [
      {
        key: "totalRevenue",
        label: "Tổng doanh thu",
        icon: (
          <FaMoneyBillWave className="h-5 w-5 text-white" aria-hidden="true" />
        ),
        value: formatCurrency(summary.totalRevenue),
        description: "Tổng doanh thu đã ghi nhận (đơn đã thanh toán)",
        tone: "primary",
      },
      {
        key: "revenue30Days",
        label: "Doanh thu 30 ngày",
        icon: <FaChartLine className="h-5 w-5 text-white" aria-hidden="true" />,
        value: formatCurrency(summary.revenue30Days),
        description: "Doanh thu của 30 ngày gần nhất",
        tone: "primary",
      },
      {
        key: "totalOrders",
        label: "Tổng đơn hàng",
        icon: <FaBoxes className="h-5 w-5 text-white" aria-hidden="true" />,
        value: summary.totalOrders.toLocaleString("vi-VN"),
        description: "Tổng số đơn hàng phát sinh",
        tone: "neutral",
      },
      {
        key: "pendingOrders",
        label: "Đơn chờ xử lý",
        icon: <FaClock className="h-5 w-5 text-white" aria-hidden="true" />,
        value: summary.pendingOrders.toLocaleString("vi-VN"),
        description: "Đơn hàng đang chờ xác nhận",
        tone: "warning",
      },
      {
        key: "deliveredOrders",
        label: "Đơn hoàn tất",
        icon: <FaCheck className="h-5 w-5 text-white" aria-hidden="true" />,
        value: summary.deliveredOrders.toLocaleString("vi-VN"),
        description: "Đơn hàng giao thành công",
        tone: "success",
      },
      {
        key: "totalCustomers",
        label: "Khách hàng",
        icon: <FaUsers className="h-5 w-5 text-white" aria-hidden="true" />,
        value: summary.totalCustomers.toLocaleString("vi-VN"),
        description: "Tổng số khách hàng hệ thống",
        tone: "neutral",
      },
      {
        key: "newCustomers",
        label: "Khách hàng mới (30 ngày)",
        icon: <FaUserPlus className="h-5 w-5 text-white" aria-hidden="true" />,
        value: summary.newCustomers.toLocaleString("vi-VN"),
        description: "Khách hàng đăng ký trong 30 ngày",
        tone: "success",
      },
      {
        key: "totalProducts",
        label: "Sản phẩm",
        icon: <FaBoxOpen className="h-5 w-5 text-white" aria-hidden="true" />,
        value: summary.totalProducts.toLocaleString("vi-VN"),
        description: "Tổng số sản phẩm được đăng",
        tone: "neutral",
      },
      {
        key: "lowStockProducts",
        label: "Cảnh báo tồn kho",
        icon: (
          <FaExclamationTriangle
            className="h-5 w-5 text-white"
            aria-hidden="true"
          />
        ),
        value: summary.lowStockProducts.toLocaleString("vi-VN"),
        description: `Sản phẩm có tồn kho ≤ ${LOW_STOCK_THRESHOLD}`,
        tone: "warning",
      },
      {
        key: "activeBanners",
        label: "Banner đang chạy",
        icon: <FaImages className="h-5 w-5 text-white" aria-hidden="true" />,
        value: summary.activeBanners.toLocaleString("vi-VN"),
        description: "Banner hiển thị trên trang chủ",
        tone: "neutral",
      },
      {
        key: "activeCoupons",
        label: "Mã giảm giá đang bật",
        icon: <FaTicketAlt className="h-5 w-5 text-white" aria-hidden="true" />,
        value: summary.activeCoupons.toLocaleString("vi-VN"),
        description: "Mã giảm giá đang kích hoạt",
        tone: "neutral",
      },
    ];
  }, [overview]);

  const maxRevenue = useMemo(() => {
    if (!overview) return 0;
    return (
      overview.revenueTrend.reduce(
        (max, point) => Math.max(max, point.revenue),
        0
      ) || 0
    );
  }, [overview]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loading text="Đang tải dashboard..." />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
    return null;
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
        <Card className="max-w-md text-center bg-gray-800 border-gray-700">
          <p className="text-lg font-semibold mb-4">
            Không thể tải dữ liệu dashboard
          </p>
          <Button onClick={() => fetchOverview(true)}>Thử lại</Button>
        </Card>
      </div>
    );
  }

  const renderSummaryTone = (tone: SummaryItem["tone"]) => {
    switch (tone) {
      case "primary":
        return "bg-blue-600";
      case "success":
        return "bg-emerald-600";
      case "warning":
        return "bg-amber-500";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Tổng quan bán hàng
            </h1>
            <p className="mt-2 text-gray-400 max-w-2xl">
              Theo dõi hiệu suất kinh doanh, tình trạng đơn hàng và các chỉ số
              chính của chiến dịch marketing.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-gray-600 text-gray-200 hover:bg-gray-800"
            onClick={() => fetchOverview()}
            isLoading={isRefreshing}
          >
            {!isRefreshing && (
              <>
                <FaRedo className="mr-2 h-4 w-4" />
                Làm mới
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <Card
              key={item.key}
              className="bg-gray-800 border border-gray-700 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {item.value}
                  </p>
                  {item.description && (
                    <p className="mt-2 text-xs text-gray-500">
                      {item.description}
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${renderSummaryTone(
                    item.tone
                  )}`}
                >
                  {item.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-gray-800 border border-gray-700 shadow-lg">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Doanh thu 7 ngày gần nhất
                  </h2>
                  <p className="text-sm text-gray-400">
                    Bao gồm các đơn hàng đã thanh toán
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-60 flex items-end gap-3">
                  {overview.revenueTrend.map((point) => {
                    const ratio =
                      maxRevenue > 0
                        ? Math.max((point.revenue / maxRevenue) * 100, 6)
                        : 0;
                    return (
                      <div
                        key={point.date}
                        className="flex-1 flex flex-col justify-end items-center group"
                      >
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-emerald-400 rounded-t-xl transition-all duration-300 group-hover:from-blue-400 group-hover:to-emerald-300"
                          style={{ height: `${ratio}%` }}
                        ></div>
                        <p className="mt-3 text-xs font-medium text-gray-300">
                          {new Intl.DateTimeFormat("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                          }).format(new Date(point.date))}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {overview.revenueTrend.map((point) => (
                    <div
                      key={`${point.date}-summary`}
                      className="rounded-lg bg-gray-900/70 px-4 py-3 border border-gray-700"
                    >
                      <p className="text-sm text-gray-400">
                        {new Intl.DateTimeFormat("vi-VN", {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                        }).format(new Date(point.date))}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {formatCurrency(point.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {point.orderCount.toLocaleString("vi-VN")} đơn hàng
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-800 border border-gray-700 shadow-lg">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Đơn hàng mới nhất
                </h2>
                <p className="text-sm text-gray-400">
                  Danh sách 5 đơn hàng vừa được tạo gần đây
                </p>
              </div>
              <div className="space-y-4">
                {overview.recentOrders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/50 p-6 text-center text-gray-400">
                    Chưa có đơn hàng nào.
                  </div>
                ) : (
                  overview.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 hover:border-blue-500 transition-all duration-200"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm text-gray-400">
                            #{order.orderNumber}
                          </p>
                          <p className="text-lg font-semibold text-white mt-1">
                            {order.customerName || "Khách hàng ẩn danh"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                          <span className="text-lg font-semibold text-emerald-400">
                            {formatCurrency(order.totalAmount)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                            >
                              {order.status}
                            </span>
                            <span
                              className={`text-xs font-semibold ${paymentStyles[order.paymentStatus]}`}
                            >
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
