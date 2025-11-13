"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Loading, Modal, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  Banner,
  BannerPayload,
  Coupon,
  CouponDiscountType,
  CouponPayload,
  CouponStatus,
  CustomerSegment,
  UserRole,
} from "@/types";
import { marketingApi } from "@/utils/api";
import {
  FaAd,
  FaCalendarAlt,
  FaCheck,
  FaEdit,
  FaGift,
  FaListUl,
  FaPlus,
  FaRedo,
  FaSync,
  FaTrash,
} from "react-icons/fa";
import { formatCurrency } from "@/utils/format";

type FormMode = "create" | "edit";
type ActiveTab = "banners" | "coupons";

const defaultBannerForm: BannerPayload = {
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  buttonText: "",
  buttonLink: "",
  active: true,
  scheduleStart: null,
  scheduleEnd: null,
};

const defaultCouponForm: CouponPayload = {
  code: "",
  name: "",
  description: "",
  discountType: CouponDiscountType.FIXED_AMOUNT,
  discountValue: 0,
  maxDiscountValue: undefined,
  minimumOrderValue: undefined,
  usageLimit: undefined,
  perUserLimit: undefined,
  active: true,
  segment: CustomerSegment.ALL,
  startAt: null,
  endAt: null,
};

const segmentLabels: Record<CustomerSegment, string> = {
  [CustomerSegment.ALL]: "Tất cả khách hàng",
  [CustomerSegment.NEW_CUSTOMER]: "Khách hàng mới",
  [CustomerSegment.RETURNING_CUSTOMER]: "Khách hàng thân thiết",
  [CustomerSegment.VIP_CUSTOMER]: "Khách hàng VIP",
};

const statusColors: Record<CouponStatus, string> = {
  ACTIVE: "text-green-400 bg-green-500/10 border border-green-400/30",
  UPCOMING: "text-blue-300 bg-blue-500/10 border border-blue-400/30",
  EXPIRED: "text-red-300 bg-red-500/10 border border-red-400/30",
  INACTIVE: "text-gray-300 bg-gray-700/30 border border-gray-600/40",
};

const discountTypeOptions = [
  { label: "Giảm theo số tiền", value: CouponDiscountType.FIXED_AMOUNT },
  { label: "Giảm theo %", value: CouponDiscountType.PERCENTAGE },
];

const MarketingManagementPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>("banners");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [banners, setBanners] = useState<Banner[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerFormMode, setBannerFormMode] = useState<FormMode>("create");
  const [bannerForm, setBannerForm] = useState<BannerPayload>({
    ...defaultBannerForm,
  });
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [isDeletingBanner, setIsDeletingBanner] = useState(false);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponFormMode, setCouponFormMode] = useState<FormMode>("create");
  const [couponForm, setCouponForm] = useState<CouponPayload>({
    ...defaultCouponForm,
  });
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [isDeletingCoupon, setIsDeletingCoupon] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [bannerList, couponList] = await Promise.all([
        marketingApi.getBanners(),
        marketingApi.getCoupons(),
      ]);
      setBanners(bannerList);
      setCoupons(couponList);
    } catch (error) {
      console.error("[FETCH_MARKETING_DATA_ERROR]", error);
      showToast(
        "Không thể tải dữ liệu. Vui lòng kiểm tra kết nối hoặc thử lại sau ít phút.",
        "error"
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
        router.push("/");
        return;
      }
      fetchData().catch((error) => console.error(error));
    }
  }, [authLoading, isAuthenticated, user, router, fetchData]);

  const openCreateBannerModal = () => {
    setBannerFormMode("create");
    setEditingBannerId(null);
    setBannerForm({ ...defaultBannerForm, active: true });
    setIsBannerModalOpen(true);
  };

  const openEditBannerModal = (banner: Banner) => {
    setBannerFormMode("edit");
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      description: banner.description ?? "",
      imageUrl: banner.imageUrl,
      buttonText: banner.buttonText ?? "",
      buttonLink: banner.buttonLink ?? "",
      active: banner.active,
      scheduleStart: banner.scheduleStart ?? null,
      scheduleEnd: banner.scheduleEnd ?? null,
    });
    setIsBannerModalOpen(true);
  };

  const closeBannerModal = () => {
    setIsBannerModalOpen(false);
    setEditingBannerId(null);
  };

  const openCreateCouponModal = () => {
    setCouponFormMode("create");
    setEditingCouponId(null);
    setCouponForm({
      ...defaultCouponForm,
      discountType: CouponDiscountType.FIXED_AMOUNT,
      segment: CustomerSegment.ALL,
      active: true,
    });
    setIsCouponModalOpen(true);
  };

  const openEditCouponModal = (coupon: Coupon) => {
    setCouponFormMode("edit");
    setEditingCouponId(coupon.id);
    setCouponForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountValue: coupon.maxDiscountValue,
      minimumOrderValue: coupon.minimumOrderValue,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      active: coupon.active,
      segment: coupon.segment,
      startAt: coupon.startAt ?? null,
      endAt: coupon.endAt ?? null,
    });
    setIsCouponModalOpen(true);
  };

  const closeCouponModal = () => {
    setIsCouponModalOpen(false);
    setEditingCouponId(null);
  };

  const handleBannerInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.currentTarget;
    setBannerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBannerScheduleChange =
    (field: "scheduleStart" | "scheduleEnd") => (value: string) => {
      setBannerForm((prev) => ({
        ...prev,
        [field]: value ? toIsoString(value) : null,
      }));
    };

  const handleCouponInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = event.currentTarget;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === "number") {
      setCouponForm((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : Number(value),
      }));
      return;
    }

    setCouponForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCouponScheduleChange =
    (field: "startAt" | "endAt") => (value: string) => {
      setCouponForm((prev) => ({
        ...prev,
        [field]: value ? toIsoString(value) : null,
      }));
    };

  const handleDiscountTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value as CouponDiscountType;
    setCouponForm((prev) => ({
      ...prev,
      discountType: value,
      maxDiscountValue:
        value === CouponDiscountType.PERCENTAGE
          ? (prev.maxDiscountValue ?? 0)
          : prev.maxDiscountValue,
    }));
  };

  const saveBanner = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingBanner(true);
    try {
      const payload: BannerPayload = {
        ...bannerForm,
        subtitle: bannerForm.subtitle?.trim() || undefined,
        description: bannerForm.description?.trim() || undefined,
        buttonText: bannerForm.buttonText?.trim() || undefined,
        buttonLink: bannerForm.buttonLink?.trim() || undefined,
        imageUrl: bannerForm.imageUrl.trim(),
      };

      let result: Banner;
      if (bannerFormMode === "create") {
        result = await marketingApi.createBanner(payload);
        setBanners((prev) =>
          [...prev, result].sort((a, b) => a.displayOrder - b.displayOrder)
        );
        showToast(
          "Tạo banner thành công. Banner mới sẽ hiển thị theo lịch đã chọn.",
          "success"
        );
      } else if (editingBannerId) {
        result = await marketingApi.updateBanner(editingBannerId, payload);
        setBanners((prev) =>
          prev
            .map((item) => (item.id === result.id ? result : item))
            .sort((a, b) => a.displayOrder - b.displayOrder)
        );
        showToast("Cập nhật banner thành công.", "success");
      }
      closeBannerModal();
    } catch (error) {
      console.error("[SAVE_BANNER_ERROR]", error);
      showToast(
        "Không thể lưu banner. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.",
        "error"
      );
    } finally {
      setIsSavingBanner(false);
    }
  };

  const confirmDeleteBanner = async () => {
    if (!bannerToDelete) {
      return;
    }
    setIsDeletingBanner(true);
    try {
      await marketingApi.deleteBanner(bannerToDelete.id);
      setBanners((prev) =>
        prev
          .filter((item) => item.id !== bannerToDelete.id)
          .map((item, index) => ({ ...item, displayOrder: index }))
      );
      showToast("Đã xoá banner.", "success");
    } catch (error) {
      console.error("[DELETE_BANNER_ERROR]", error);
      showToast("Không thể xoá banner. Vui lòng thử lại sau ít phút.", "error");
    } finally {
      setIsDeletingBanner(false);
      setBannerToDelete(null);
    }
  };

  const moveBanner = (bannerId: string, direction: "up" | "down") => {
    setBanners((prev) => {
      const index = prev.findIndex((item) => item.id === bannerId);
      if (index === -1) {
        return prev;
      }
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) {
        return prev;
      }
      const reordered = [...prev];
      const [removed] = reordered.splice(index, 1);
      reordered.splice(newIndex, 0, removed);
      const orderedIds = reordered.map((item) => item.id);

      marketingApi.reorderBanners(orderedIds).catch((error) => {
        console.error("[REORDER_BANNER_ERROR]", error);
        showToast(
          "Không thể cập nhật thứ tự banner. Trang sẽ tải lại dữ liệu mới nhất.",
          "error"
        );
        fetchData().catch((fetchError) => console.error(fetchError));
      });

      return reordered.map((item, idx) => ({
        ...item,
        displayOrder: idx,
      }));
    });
  };

  const saveCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingCoupon(true);
    try {
      const payload: CouponPayload = {
        ...couponForm,
        code: couponForm.code.trim(),
        name: couponForm.name.trim(),
        description: couponForm.description?.trim() || undefined,
        discountValue: Number(couponForm.discountValue),
        maxDiscountValue:
          couponForm.discountType === CouponDiscountType.PERCENTAGE
            ? Number(couponForm.maxDiscountValue ?? 0)
            : (couponForm.maxDiscountValue ?? undefined),
        minimumOrderValue: couponForm.minimumOrderValue
          ? Number(couponForm.minimumOrderValue)
          : undefined,
        usageLimit: couponForm.usageLimit
          ? Number(couponForm.usageLimit)
          : undefined,
        perUserLimit: couponForm.perUserLimit
          ? Number(couponForm.perUserLimit)
          : undefined,
        startAt: couponForm.startAt ?? null,
        endAt: couponForm.endAt ?? null,
      };

      let result: Coupon;
      if (couponFormMode === "create") {
        result = await marketingApi.createCoupon(payload);
        setCoupons((prev) => [...prev, result]);
        showToast(
          `Tạo mã giảm giá thành công. Mã ${result.code} đã sẵn sàng áp dụng.`,
          "success"
        );
      } else if (editingCouponId) {
        result = await marketingApi.updateCoupon(editingCouponId, payload);
        setCoupons((prev) =>
          prev.map((item) => (item.id === result.id ? result : item))
        );
        showToast("Cập nhật mã giảm giá thành công.", "success");
      }
      closeCouponModal();
    } catch (error) {
      console.error("[SAVE_COUPON_ERROR]", error);
      showToast(
        "Không thể lưu mã giảm giá. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.",
        "error"
      );
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) {
      return;
    }
    setIsDeletingCoupon(true);
    try {
      await marketingApi.deleteCoupon(couponToDelete.id);
      setCoupons((prev) =>
        prev.filter((item) => item.id !== couponToDelete.id)
      );
      showToast("Đã xoá mã giảm giá.", "success");
    } catch (error) {
      console.error("[DELETE_COUPON_ERROR]", error);
      showToast(
        "Không thể xoá mã giảm giá. Vui lòng thử lại sau ít phút.",
        "error"
      );
    } finally {
      setIsDeletingCoupon(false);
      setCouponToDelete(null);
    }
  };

  const couponStats = useMemo(() => {
    const totalActive = coupons.filter(
      (coupon) => coupon.status === "ACTIVE"
    ).length;
    const totalUpcoming = coupons.filter(
      (coupon) => coupon.status === "UPCOMING"
    ).length;
    const totalExpired = coupons.filter(
      (coupon) => coupon.status === "EXPIRED"
    ).length;
    return {
      total: coupons.length,
      active: totalActive,
      upcoming: totalUpcoming,
      expired: totalExpired,
    };
  }, [coupons]);

  const bannerStats = useMemo(() => {
    const totalActive = banners.filter((banner) => banner.active).length;
    const totalScheduled = banners.filter(
      (banner) =>
        banner.scheduleStart &&
        new Date(banner.scheduleStart).getTime() > Date.now()
    ).length;
    return {
      total: banners.length,
      active: totalActive,
      scheduled: totalScheduled,
    };
  }, [banners]);

  if (authLoading || isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FaAd className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Quản lý banner & khuyến mãi
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                Kiểm soát nội dung hiển thị trên trang chủ và các chương trình
                ưu đãi.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
              onClick={() => fetchData()}
              disabled={isRefreshing}
            >
              <FaSync
                className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Button
              onClick={
                activeTab === "banners"
                  ? openCreateBannerModal
                  : openCreateCouponModal
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FaPlus className="mr-2" />
              {activeTab === "banners" ? "Thêm banner" : "Tạo mã giảm giá"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gray-900/70 border border-gray-800 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Tổng banner</span>
              <FaListUl className="text-blue-400" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">
              {bannerStats.total}
            </p>
          </Card>
          <Card className="bg-gray-900/70 border border-gray-800 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Banner đang hiển thị
              </span>
              <FaCheck className="text-green-400" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">
              {bannerStats.active}
            </p>
          </Card>
          <Card className="bg-gray-900/70 border border-gray-800 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Banner sắp hiển thị</span>
              <FaCalendarAlt className="text-amber-400" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">
              {bannerStats.scheduled}
            </p>
          </Card>
          <Card className="bg-gray-900/70 border border-gray-800 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Mã giảm giá hoạt động
              </span>
              <FaGift className="text-pink-400" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">
              {couponStats.active}
            </p>
          </Card>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-2 flex">
          <button
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "banners"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("banners")}
          >
            Banner trang chủ
          </button>
          <button
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
              activeTab === "coupons"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("coupons")}
          >
            Mã giảm giá
          </button>
        </div>

        {activeTab === "banners" ? (
          <Card className="bg-gray-900/60 border border-gray-800">
            <div className="p-6 space-y-6">
              {banners.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  Chưa có banner nào. Hãy nhấn{" "}
                  <span className="text-white font-semibold">
                    "Thêm banner"
                  </span>{" "}
                  để tạo banner đầu tiên.
                </div>
              ) : (
                <div className="space-y-4">
                  {banners
                    .slice()
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((banner, index) => (
                      <div
                        key={banner.id}
                        className="border border-gray-800 rounded-xl bg-gray-900/70 p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              #{index + 1}
                            </span>
                            <h3 className="text-lg font-semibold text-white">
                              {banner.title}
                            </h3>
                            {banner.active ? (
                              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-400/30">
                                Đang bật
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-700/30 text-gray-300 border border-gray-600/40">
                                Đang tắt
                              </span>
                            )}
                          </div>
                          {banner.subtitle && (
                            <p className="text-sm text-blue-200">
                              {banner.subtitle}
                            </p>
                          )}
                          {banner.description && (
                            <p className="text-sm text-gray-400">
                              {banner.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="text-gray-500" />
                              <span>
                                {renderScheduleRange(
                                  banner.scheduleStart,
                                  banner.scheduleEnd
                                )}
                              </span>
                            </div>
                            {banner.buttonText && banner.buttonLink && (
                              <div className="flex items-center gap-2">
                                <FaRedo className="text-blue-400" />
                                <span>{banner.buttonText}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
                            onClick={() => moveBanner(banner.id, "up")}
                            disabled={index === 0}
                          >
                            Lên
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
                            onClick={() => moveBanner(banner.id, "down")}
                            disabled={index === banners.length - 1}
                          >
                            Xuống
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
                            onClick={() => openEditBannerModal(banner)}
                          >
                            <FaEdit className="mr-2" />
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => setBannerToDelete(banner)}
                          >
                            <FaTrash className="mr-2" />
                            Xoá
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="bg-gray-900/60 border border-gray-800">
            <div className="p-6 space-y-6">
              {coupons.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  Chưa có mã giảm giá. Hãy nhấn{" "}
                  <span className="text-white font-semibold">
                    "Tạo mã giảm giá"
                  </span>{" "}
                  để bắt đầu.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead>
                      <tr className="text-sm text-gray-400">
                        <th className="px-4 py-3 text-left">Mã</th>
                        <th className="px-4 py-3 text-left">
                          Tên chương trình
                        </th>
                        <th className="px-4 py-3 text-left">Phân khúc</th>
                        <th className="px-4 py-3 text-left">Giá trị</th>
                        <th className="px-4 py-3 text-left">Hiệu lực</th>
                        <th className="px-4 py-3 text-left">Tình trạng</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {coupons.map((coupon) => (
                        <tr key={coupon.id} className="text-sm text-gray-300">
                          <td className="px-4 py-4 font-semibold text-white">
                            {coupon.code}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-white">
                                {coupon.name}
                              </span>
                              {coupon.description && (
                                <span className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {coupon.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {segmentLabels[coupon.segment]}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-white">
                                {renderDiscountValue(coupon)}
                              </span>
                              {coupon.minimumOrderValue && (
                                <span className="text-xs text-gray-500">
                                  Đơn tối thiểu{" "}
                                  {formatCurrency(coupon.minimumOrderValue)}
                                </span>
                              )}
                              {coupon.usageLimit && (
                                <span className="text-xs text-gray-500">
                                  {coupon.usageCount}/{coupon.usageLimit} lượt
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-400">
                            {renderScheduleRange(coupon.startAt, coupon.endAt)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[coupon.status]}`}
                            >
                              {renderCouponStatus(coupon)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
                                onClick={() => openEditCouponModal(coupon)}
                              >
                                <FaEdit className="mr-2" />
                                Sửa
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => setCouponToDelete(coupon)}
                              >
                                <FaTrash className="mr-2" />
                                Xoá
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isBannerModalOpen}
        onClose={closeBannerModal}
        title={
          bannerFormMode === "create" ? "Thêm banner mới" : "Chỉnh sửa banner"
        }
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
              onClick={closeBannerModal}
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={saveBanner}
              isLoading={isSavingBanner}
            >
              {bannerFormMode === "create" ? "Tạo banner" : "Lưu thay đổi"}
            </Button>
          </div>
        }
      >
        <form onSubmit={saveBanner} className="space-y-4">
          <Input
            label="Tiêu đề"
            name="title"
            value={bannerForm.title}
            onChange={handleBannerInputChange}
            required
            className="bg-gray-900 border-gray-700 text-white"
          />
          <Input
            label="Phụ đề"
            name="subtitle"
            value={bannerForm.subtitle ?? ""}
            onChange={handleBannerInputChange}
            className="bg-gray-900 border-gray-700 text-white"
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              value={bannerForm.description ?? ""}
              onChange={handleBannerInputChange}
              rows={3}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 text-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Input
            label="Đường dẫn ảnh"
            name="imageUrl"
            value={bannerForm.imageUrl}
            onChange={handleBannerInputChange}
            required
            placeholder="/assets/images/banners/homepage.jpg"
            className="bg-gray-900 border-gray-700 text-white"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nội dung nút"
              name="buttonText"
              value={bannerForm.buttonText ?? ""}
              onChange={handleBannerInputChange}
              className="bg-gray-900 border-gray-700 text-white"
            />
            <Input
              label="Liên kết nút"
              name="buttonLink"
              value={bannerForm.buttonLink ?? ""}
              onChange={handleBannerInputChange}
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bắt đầu hiển thị
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(bannerForm.scheduleStart)}
                onChange={(event) =>
                  handleBannerScheduleChange("scheduleStart")(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-900 text-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Kết thúc hiển thị
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(bannerForm.scheduleEnd)}
                onChange={(event) =>
                  handleBannerScheduleChange("scheduleEnd")(event.target.value)
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-900 text-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              name="active"
              checked={bannerForm.active}
              onChange={(event) =>
                setBannerForm((prev) => ({
                  ...prev,
                  active: event.currentTarget.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
            />
            Kích hoạt banner ngay
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={!!bannerToDelete}
        onClose={() => setBannerToDelete(null)}
        title="Xoá banner"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
              onClick={() => setBannerToDelete(null)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteBanner}
              isLoading={isDeletingBanner}
            >
              Xoá
            </Button>
          </div>
        }
      >
        <p className="text-gray-300">
          Bạn chắc chắn muốn xoá banner{" "}
          <span className="font-semibold text-white">
            {bannerToDelete?.title}
          </span>
          ? Thao tác này sẽ gỡ banner khỏi trang chủ.
        </p>
      </Modal>

      <Modal
        isOpen={isCouponModalOpen}
        onClose={closeCouponModal}
        title={
          couponFormMode === "create"
            ? "Tạo mã giảm giá"
            : "Chỉnh sửa mã giảm giá"
        }
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
              onClick={closeCouponModal}
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={saveCoupon}
              isLoading={isSavingCoupon}
            >
              {couponFormMode === "create" ? "Tạo mã giảm giá" : "Lưu thay đổi"}
            </Button>
          </div>
        }
      >
        <form onSubmit={saveCoupon} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Mã giảm giá"
              name="code"
              value={couponForm.code}
              onChange={handleCouponInputChange}
              className="bg-gray-900 border-gray-700 text-white uppercase"
              required
            />
            <Input
              label="Tên chương trình"
              name="name"
              value={couponForm.name}
              onChange={handleCouponInputChange}
              className="bg-gray-900 border-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              value={couponForm.description ?? ""}
              onChange={handleCouponInputChange}
              rows={3}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 text-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Loại giảm giá
              </label>
              <select
                name="discountType"
                value={couponForm.discountType}
                onChange={handleDiscountTypeChange}
                className="w-full h-12 rounded-lg border border-gray-700 bg-gray-900 px-4 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {discountTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={
                couponForm.discountType === CouponDiscountType.PERCENTAGE
                  ? "Giảm (%)"
                  : "Giảm (VNĐ)"
              }
              type="number"
              name="discountValue"
              value={couponForm.discountValue}
              onChange={handleCouponInputChange}
              className="bg-gray-900 border-gray-700 text-white"
              min={0}
              step={
                couponForm.discountType === CouponDiscountType.PERCENTAGE
                  ? 1
                  : 1000
              }
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Giảm tối đa (VNĐ)"
              type="number"
              name="maxDiscountValue"
              value={
                couponForm.maxDiscountValue !== undefined
                  ? couponForm.maxDiscountValue
                  : ""
              }
              onChange={handleCouponInputChange}
              className="bg-gray-900 border-gray-700 text-white"
              disabled={
                couponForm.discountType === CouponDiscountType.FIXED_AMOUNT
              }
              min={0}
              step={1000}
              helperText={
                couponForm.discountType === CouponDiscountType.PERCENTAGE
                  ? "Bắt buộc khi giảm theo % để giới hạn số tiền giảm tối đa."
                  : "Tuỳ chọn, bỏ trống nếu không cần."
              }
            />
            <Input
              label="Đơn hàng tối thiểu (VNĐ)"
              type="number"
              name="minimumOrderValue"
              value={
                couponForm.minimumOrderValue !== undefined
                  ? couponForm.minimumOrderValue
                  : ""
              }
              onChange={handleCouponInputChange}
              className="bg-gray-900 border-gray-700 text-white"
              min={0}
              step={1000}
              helperText="Tuỳ chọn, để trống nếu áp dụng cho mọi giá trị đơn hàng."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Giới hạn lượt sử dụng"
              type="number"
              name="usageLimit"
              value={
                couponForm.usageLimit !== undefined ? couponForm.usageLimit : ""
              }
              onChange={handleCouponInputChange}
              className="bg-gray-900 border-gray-700 text-white"
              min={1}
              helperText="Tuỳ chọn, để trống nếu không giới hạn tổng lượt sử dụng."
            />
            <Input
              label="Giới hạn mỗi khách hàng"
              type="number"
              name="perUserLimit"
              value={
                couponForm.perUserLimit !== undefined
                  ? couponForm.perUserLimit
                  : ""
              }
              onChange={handleCouponInputChange}
              className="bg-gray-900 border-gray-700 text-white"
              min={1}
              helperText="Tuỳ chọn, để trống nếu mỗi khách có thể dùng nhiều lần."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Áp dụng cho phân khúc
              </label>
              <select
                name="segment"
                value={couponForm.segment}
                onChange={handleCouponInputChange}
                className="w-full h-12 rounded-lg border border-gray-700 bg-gray-900 px-4 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(CustomerSegment).map((segment) => (
                  <option key={segment} value={segment}>
                    {segmentLabels[segment]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-300 mt-6 md:mt-0">
              <input
                type="checkbox"
                name="active"
                checked={couponForm.active}
                onChange={(event) =>
                  setCouponForm((prev) => ({
                    ...prev,
                    active: event.currentTarget.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
              />
              Kích hoạt mã ngay
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bắt đầu áp dụng
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(couponForm.startAt)}
                onChange={(event) =>
                  handleCouponScheduleChange("startAt")(event.target.value)
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-900 text-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Kết thúc áp dụng
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(couponForm.endAt)}
                onChange={(event) =>
                  handleCouponScheduleChange("endAt")(event.target.value)
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-900 text-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!couponToDelete}
        onClose={() => setCouponToDelete(null)}
        title="Xoá mã giảm giá"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
              onClick={() => setCouponToDelete(null)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteCoupon}
              isLoading={isDeletingCoupon}
            >
              Xoá
            </Button>
          </div>
        }
      >
        <p className="text-gray-300">
          Bạn chắc chắn muốn xoá mã{" "}
          <span className="font-semibold text-white">
            {couponToDelete?.code}
          </span>
          ? Khách hàng sẽ không thể sử dụng mã này nữa.
        </p>
      </Modal>
    </div>
  );
};

const toIsoString = (value: string): string => {
  const date = new Date(value);
  return date.toISOString();
};

const toDateTimeLocal = (iso?: string | null): string => {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const localValue = new Date(date.getTime() - offset * 60000);
  return localValue.toISOString().slice(0, 16);
};

const renderScheduleRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) {
    return "Hiển thị mọi lúc";
  }

  const format = (value: string | null | undefined) => {
    if (!value) {
      return null;
    }
    try {
      return new Date(value).toLocaleString("vi-VN", {
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return value;
    }
  };

  const startLabel = format(start);
  const endLabel = format(end);

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }
  if (startLabel) {
    return `Từ ${startLabel}`;
  }
  if (endLabel) {
    return `Đến ${endLabel}`;
  }
  return "Hiển thị mọi lúc";
};

const renderDiscountValue = (coupon: Coupon) => {
  if (coupon.discountType === CouponDiscountType.PERCENTAGE) {
    return (
      `${coupon.discountValue}%` +
      (coupon.maxDiscountValue
        ? ` (tối đa ${formatCurrency(coupon.maxDiscountValue)})`
        : "")
    );
  }
  return formatCurrency(coupon.discountValue);
};

const renderCouponStatus = (coupon: Coupon) => {
  switch (coupon.status) {
    case "ACTIVE":
      return "Đang áp dụng";
    case "UPCOMING":
      return "Sắp diễn ra";
    case "EXPIRED":
      return "Đã hết hạn";
    case "INACTIVE":
      return "Đang tắt";
    default:
      return coupon.status;
  }
};

export default MarketingManagementPage;
