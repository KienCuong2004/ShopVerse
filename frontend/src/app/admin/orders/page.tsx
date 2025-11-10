"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Loading, Modal, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  Order,
  OrderStatus,
  PaymentStatus,
  UpdateOrderPayload,
  OrderSummary,
  UserRole,
} from "@/types";
import { ordersApi, GetAdminOrdersParams } from "@/utils/api/orders";
import {
  FaClipboardList,
  FaFilter,
  FaMoneyBillWave,
  FaShippingFast,
  FaTimes,
  FaTruck,
  FaCheckCircle,
} from "react-icons/fa";

const PAGE_SIZE = 5;

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Chờ xử lý",
  [OrderStatus.CONFIRMED]: "Đã xác nhận",
  [OrderStatus.PROCESSING]: "Đang chuẩn bị",
  [OrderStatus.SHIPPED]: "Đang giao",
  [OrderStatus.DELIVERED]: "Hoàn thành",
  [OrderStatus.CANCELLED]: "Đã hủy",
  [OrderStatus.REFUNDED]: "Đã hoàn tiền",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "Chờ thanh toán",
  [PaymentStatus.PAID]: "Đã thanh toán",
  [PaymentStatus.FAILED]: "Thanh toán lỗi",
  [PaymentStatus.REFUNDED]: "Đã hoàn tiền",
};

const statusBadgeClasses: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:
    "bg-yellow-500/10 text-yellow-400 border border-yellow-400/30",
  [OrderStatus.CONFIRMED]:
    "bg-blue-500/10 text-blue-300 border border-blue-400/30",
  [OrderStatus.PROCESSING]:
    "bg-indigo-500/10 text-indigo-300 border border-indigo-400/30",
  [OrderStatus.SHIPPED]:
    "bg-cyan-500/10 text-cyan-300 border border-cyan-400/30",
  [OrderStatus.DELIVERED]:
    "bg-green-500/10 text-green-300 border border-green-400/30",
  [OrderStatus.CANCELLED]:
    "bg-red-500/10 text-red-300 border border-red-400/30",
  [OrderStatus.REFUNDED]:
    "bg-amber-500/10 text-amber-300 border border-amber-400/30",
};

const paymentBadgeClasses: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]:
    "bg-yellow-500/10 text-yellow-400 border border-yellow-400/30",
  [PaymentStatus.PAID]:
    "bg-green-500/10 text-green-300 border border-green-400/30",
  [PaymentStatus.FAILED]: "bg-red-500/10 text-red-300 border border-red-400/30",
  [PaymentStatus.REFUNDED]:
    "bg-amber-500/10 text-amber-300 border border-amber-400/30",
};

const formatCurrency = (value?: number | null) => {
  const amount = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString("vi-VN", {
      hour12: false,
    });
  } catch (error) {
    return value;
  }
};

const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  PaymentStatus.PENDING,
  PaymentStatus.PAID,
  PaymentStatus.FAILED,
  PaymentStatus.REFUNDED,
];

const summaryCards: Array<{
  key: keyof OrderSummary;
  title: string;
  icon: React.ReactNode;
  accent: string;
  formatter?: (value: number) => string;
}> = [
  {
    key: "totalOrders",
    title: "Tổng đơn",
    icon: <FaClipboardList className="w-5 h-5 text-blue-400" />,
    accent: "bg-blue-500/10 border-blue-500/40",
  },
  {
    key: "pendingOrders",
    title: "Chờ xử lý",
    icon: <FaFilter className="w-5 h-5 text-yellow-400" />,
    accent: "bg-yellow-500/10 border-yellow-500/40",
  },
  {
    key: "shippingOrders",
    title: "Đang giao",
    icon: <FaTruck className="w-5 h-5 text-cyan-400" />,
    accent: "bg-cyan-500/10 border-cyan-500/40",
  },
  {
    key: "completedOrders",
    title: "Hoàn thành",
    icon: <FaCheckCircle className="w-5 h-5 text-green-400" />,
    accent: "bg-green-500/10 border-green-500/40",
  },
  {
    key: "cancelledOrders",
    title: "Đã hủy",
    icon: <FaTimes className="w-5 h-5 text-red-400" />,
    accent: "bg-red-500/10 border-red-500/40",
  },
  {
    key: "totalRevenue",
    title: "Doanh thu",
    icon: <FaMoneyBillWave className="w-5 h-5 text-emerald-400" />,
    accent: "bg-emerald-500/10 border-emerald-500/40",
    formatter: (value: number) => formatCurrency(value),
  },
];

const OrderManagementPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<
    PaymentStatus | ""
  >("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusDraft, setStatusDraft] = useState<OrderStatus | "">("");
  const [paymentStatusDraft, setPaymentStatusDraft] = useState<
    PaymentStatus | ""
  >("");
  const [adminNotesDraft, setAdminNotesDraft] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const buildQueryParams = useCallback((): GetAdminOrdersParams => {
    return {
      keyword: debouncedSearchTerm || undefined,
      status: selectedStatus || undefined,
      paymentStatus: selectedPaymentStatus || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy: "createdAt",
      sortDir: "DESC",
    };
  }, [
    debouncedSearchTerm,
    selectedStatus,
    selectedPaymentStatus,
    startDate,
    endDate,
  ]);

  const validateDateRange = useCallback(() => {
    if (startDate && endDate && startDate > endDate) {
      showToast("Ngày bắt đầu không được lớn hơn ngày kết thúc", "warning");
      return false;
    }
    return true;
  }, [startDate, endDate, showToast]);

  const loadOrders = useCallback(
    async (page: number = 0) => {
      if (!validateDateRange()) {
        return;
      }

      setIsLoading(page === 0);
      setIsFetching(page !== 0);

      try {
        const response = await ordersApi.getAdminOrders({
          ...buildQueryParams(),
          page,
          size: PAGE_SIZE,
        });

        setOrders(response.content);
        setCurrentPage(response.number);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      } catch (error) {
        showToast("Không thể tải danh sách đơn hàng", "error");
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    },
    [buildQueryParams, showToast, validateDateRange]
  );

  const loadSummary = useCallback(async () => {
    if (!validateDateRange()) {
      return;
    }
    setIsSummaryLoading(true);
    try {
      const response = await ordersApi.getSummary(buildQueryParams());
      setSummary(response);
    } catch (error) {
      showToast("Không thể tải thống kê đơn hàng", "error");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [buildQueryParams, showToast, validateDateRange]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== UserRole.ADMIN) {
      router.push("/");
      showToast("Bạn không có quyền truy cập trang này", "error");
    }
  }, [authLoading, isAuthenticated, user, router, showToast]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role !== UserRole.ADMIN) {
      return;
    }
    loadSummary();
    loadOrders(0);
  }, [
    authLoading,
    isAuthenticated,
    user,
    loadOrders,
    loadSummary,
    debouncedSearchTerm,
    selectedStatus,
    selectedPaymentStatus,
    startDate,
    endDate,
  ]);

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setStatusDraft(order.status);
    setPaymentStatusDraft(order.paymentStatus ?? PaymentStatus.PENDING);
    setAdminNotesDraft(order.adminNotes ?? "");
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    if (isUpdating) return;
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
    setStatusDraft("");
    setPaymentStatusDraft("");
    setAdminNotesDraft("");
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    const payload: UpdateOrderPayload = {};

    if (statusDraft && statusDraft !== selectedOrder.status) {
      payload.status = statusDraft;
    }
    if (
      paymentStatusDraft &&
      paymentStatusDraft !==
        (selectedOrder.paymentStatus ?? PaymentStatus.PENDING)
    ) {
      payload.paymentStatus = paymentStatusDraft;
    }

    if (adminNotesDraft.trim() !== (selectedOrder.adminNotes ?? "").trim()) {
      payload.adminNotes = adminNotesDraft.trim();
    }

    if (
      payload.status === undefined &&
      payload.paymentStatus === undefined &&
      payload.adminNotes === undefined
    ) {
      showToast("Không có thay đổi nào để cập nhật", "info");
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await ordersApi.update(selectedOrder.id, payload);
      showToast("Cập nhật đơn hàng thành công", "success");
      setOrders((prev) =>
        prev.map((order) => (order.id === updated.id ? updated : order))
      );
      closeDetailModal();
      loadSummary();
    } catch (error) {
      showToast("Không thể cập nhật đơn hàng", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedPaymentStatus("");
    setStartDate("");
    setEndDate("");
    setDebouncedSearchTerm("");
  };

  const totalRangeLabel = useMemo(() => {
    if (totalElements === 0) {
      return "Không có đơn hàng";
    }
    const startIndex = currentPage * PAGE_SIZE + 1;
    const endIndex = Math.min((currentPage + 1) * PAGE_SIZE, totalElements);
    return `Hiển thị ${startIndex} - ${endIndex} trong tổng số ${totalElements} đơn hàng`;
  }, [currentPage, totalElements]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loading text="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white"
            >
              <FaShippingFast className="w-5 h-5 mr-2" />
              Trang chủ
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Quản lý đơn hàng
              </h1>
              <p className="text-gray-400 mt-1">
                Theo dõi, cập nhật trạng thái và ghi chú xử lý đơn hàng của
                ShopVerse
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Đặt lại bộ lọc
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <Card
              key={card.key}
              className={`bg-gray-800 border border-gray-700 rounded-2xl shadow-md overflow-hidden ${card.accent}`}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="p-3 rounded-xl bg-gray-900/60 border border-white/5">
                  {card.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-400">{card.title}</p>
                  <p className="text-2xl font-semibold text-white">
                    {isSummaryLoading || !summary
                      ? "..."
                      : card.formatter
                        ? card.formatter(summary[card.key] as unknown as number)
                        : summary[card.key]}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <div className="xl:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">
                  Tìm kiếm
                </label>
                <Input
                  type="text"
                  placeholder="Tìm theo mã đơn, tên khách hàng, số điện thoại..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  leftIcon={<FaFilter className="w-5 h-5 text-gray-400" />}
                  className="bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 rounded-xl h-12"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Trạng thái đơn
                </label>
                <select
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value as OrderStatus | "")
                  }
                  className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  {ORDER_STATUS_FLOW.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Trạng thái thanh toán
                </label>
                <select
                  value={selectedPaymentStatus}
                  onChange={(event) =>
                    setSelectedPaymentStatus(
                      event.target.value as PaymentStatus | ""
                    )
                  }
                  className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  {PAYMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {paymentStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Từ ngày
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="bg-gray-900 border border-gray-700 text-white focus:border-blue-500 rounded-xl h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Đến ngày
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="bg-gray-900 border border-gray-700 text-white focus:border-blue-500 rounded-xl h-12"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg">
          <div className="p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">
                Danh sách đơn hàng
              </h2>
              <span className="text-sm text-gray-400">{totalRangeLabel}</span>
            </div>

            {isFetching && (
              <div className="flex items-center gap-2 text-sm text-blue-300">
                <Loading size="sm" />
                <span>Đang tải dữ liệu...</span>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Đơn hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Thanh toán
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900/40 divide-y divide-gray-800">
                  {orders.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        Không có đơn hàng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}

                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-800/60">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-white font-medium">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-400">
                            {order.orderItems?.length ?? 0} sản phẩm
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-white font-medium">
                            {order.shippingName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {order.shippingPhone || "Không có số"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-semibold">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${statusBadgeClasses[order.status]}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${paymentBadgeClasses[order.paymentStatus ?? PaymentStatus.PENDING]}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                          {
                            paymentStatusLabels[
                              order.paymentStatus ?? PaymentStatus.PENDING
                            ]
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => openDetailModal(order)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                        >
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-400">
                  Trang {currentPage + 1} / {totalPages}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => loadOrders(Math.max(currentPage - 1, 0))}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Trước
                  </Button>
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <Button
                      key={index}
                      variant={index === currentPage ? "primary" : "outline"}
                      size="sm"
                      onClick={() => loadOrders(index)}
                      className={
                        index === currentPage
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-gray-700 text-gray-300 hover:bg-gray-800"
                      }
                    >
                      {index + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage + 1 >= totalPages}
                    onClick={() =>
                      loadOrders(Math.min(currentPage + 1, totalPages - 1))
                    }
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        title="Chi tiết đơn hàng"
        size="lg"
      >
        {selectedOrder ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Thông tin đơn hàng
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Mã đơn:</span>
                    <span className="font-medium text-white">
                      {selectedOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngày tạo:</span>
                    <span>{formatDateTime(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phương thức:</span>
                    <span>{selectedOrder.paymentMethod || "Không có"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng tiền:</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </Card>
              <Card className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Giao nhận
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Khách hàng:</span>
                    <span className="text-white font-medium">
                      {selectedOrder.shippingName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SĐT:</span>
                    <span>{selectedOrder.shippingPhone || "Không có"}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-1">Địa chỉ:</span>
                    <p className="text-white text-sm">
                      {selectedOrder.shippingAddress}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
              <div className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Trạng thái & ghi chú
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Trạng thái đơn hàng
                    </label>
                    <select
                      value={statusDraft}
                      onChange={(event) =>
                        setStatusDraft(event.target.value as OrderStatus)
                      }
                      className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ORDER_STATUS_FLOW.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Trạng thái thanh toán
                    </label>
                    <select
                      value={paymentStatusDraft}
                      onChange={(event) =>
                        setPaymentStatusDraft(
                          event.target.value as PaymentStatus
                        )
                      }
                      className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PAYMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {paymentStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Ghi chú từ khách
                    </label>
                    <p className="text-sm text-gray-300 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2 min-h-[48px]">
                      {selectedOrder.notes || "Không có ghi chú"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Ghi chú nội bộ
                  </label>
                  <textarea
                    value={adminNotesDraft}
                    onChange={(event) => setAdminNotesDraft(event.target.value)}
                    rows={4}
                    placeholder="Nhập ghi chú xử lý cho đội vận hành..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Sản phẩm ({selectedOrder.orderItems?.length ?? 0})
                </h3>
                <div className="space-y-3">
                  {(selectedOrder.orderItems ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-800/50 px-4 py-3"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {item.productName}
                        </p>
                        <p className="text-sm text-gray-400">
                          Số lượng: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-300">
                          {formatCurrency(item.productPrice)}
                        </p>
                        <p className="text-sm text-white font-semibold">
                          Thành tiền: {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={closeDetailModal}
                disabled={isUpdating}
                className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateOrder}
                isLoading={isUpdating}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Cập nhật đơn hàng
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-400">
            Đang tải thông tin đơn hàng...
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagementPage;
