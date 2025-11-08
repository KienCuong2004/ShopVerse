"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Card, Input, Loading, Modal, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  Category,
  Product,
  ProductRequest,
  ProductStatus,
  UserRole,
} from "@/types";
import { categoriesApi, productsApi } from "@/utils/api";
import {
  FaBoxOpen,
  FaBoxes,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaLayerGroup,
  FaImage,
  FaPlus,
  FaTags,
  FaTimes,
} from "react-icons/fa";

const STOCK_WARNING_THRESHOLD = 5;
const PAGE_SIZE = 10;

const defaultProductForm: ProductRequest = {
  name: "",
  description: "",
  price: 0,
  discountPrice: undefined,
  stockQuantity: 0,
  sku: "",
  categoryId: "",
  imageUrl: "",
  imageUrls: [],
  status: ProductStatus.ACTIVE,
};

type FormMode = "create" | "edit";

const statusLabels: Record<ProductStatus, string> = {
  [ProductStatus.ACTIVE]: "Đang bán",
  [ProductStatus.INACTIVE]: "Tạm dừng",
  [ProductStatus.OUT_OF_STOCK]: "Hết hàng",
};

const statusStyles: Record<ProductStatus, string> = {
  [ProductStatus.ACTIVE]: "bg-green-500/20 text-green-300",
  [ProductStatus.INACTIVE]: "bg-gray-500/20 text-gray-300",
  [ProductStatus.OUT_OF_STOCK]: "bg-red-500/20 text-red-300",
};

const formatCurrency = (value?: number | null) => {
  const amount = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  const hasDecimal = Math.abs(amount % 1) > Number.EPSILON;

  const formatted = new Intl.NumberFormat("vi-VN", {
    style: "decimal",
    useGrouping: true,
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: hasDecimal ? 2 : 0,
  }).format(amount);

  return `${formatted} ₫`;
};

const ProductsManagementPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | "">("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [createForm, setCreateForm] = useState<ProductRequest>({
    ...defaultProductForm,
  });
  const [editForm, setEditForm] = useState<ProductRequest | null>(null);

  const [createImages, setCreateImages] = useState<string[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newCreateImageUrl, setNewCreateImageUrl] = useState("");
  const [newEditImageUrl, setNewEditImageUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));
  }, [categories]);

  const resolveErrorMessage = useCallback(
    (error: unknown, fallback: string) => {
      if (error instanceof Error && error.message) {
        return error.message;
      }
      if (typeof error === "string") {
        return error;
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
      ) {
        return (error as { message: string }).message;
      }
      return fallback;
    },
    []
  );

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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchInput.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    categoriesApi
      .getAll()
      .then(setCategories)
      .catch(() => showToast("Không thể tải danh mục sản phẩm", "error"));
  }, [showToast]);

  const loadProducts = useCallback(
    async (page: number, withFullScreenLoader = false) => {
      if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
        return;
      }

      if (!hasLoaded || withFullScreenLoader) {
        setIsLoading(true);
      } else {
        setIsFetching(true);
      }

      try {
        const response = await productsApi.getAll({
          page,
          size: PAGE_SIZE,
          sortBy: "createdAt",
          sortDir: "DESC",
          keyword: debouncedSearchTerm || undefined,
          categoryId: selectedCategory || undefined,
          status: selectedStatus || undefined,
          lowStock: lowStockOnly || undefined,
        });

        setProducts(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        if (!hasLoaded) {
          setHasLoaded(true);
        }
      } catch (error) {
        showToast(
          resolveErrorMessage(error, "Không thể tải danh sách sản phẩm"),
          "error"
        );
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    },
    [
      debouncedSearchTerm,
      hasLoaded,
      isAuthenticated,
      lowStockOnly,
      selectedCategory,
      selectedStatus,
      showToast,
      resolveErrorMessage,
      user,
    ]
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm, selectedCategory, selectedStatus, lowStockOnly]);

  useEffect(() => {
    if (isAuthenticated && user?.role === UserRole.ADMIN) {
      loadProducts(currentPage);
    }
  }, [isAuthenticated, user, currentPage, loadProducts]);

  const resetCreateForm = () => {
    setCreateForm({ ...defaultProductForm });
    setCreateImages([]);
    setNewCreateImageUrl("");
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice,
      stockQuantity: product.stockQuantity,
      sku: product.sku,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      imageUrls: product.imageUrls || [],
      status: product.status,
    });
    const images =
      product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : product.imageUrl
          ? [product.imageUrl]
          : [];
    setEditImages(images);
    setNewEditImageUrl("");
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    setEditForm(null);
    setEditImages([]);
    setNewEditImageUrl("");
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedProduct(null);
    setIsDeleteModalOpen(false);
  };

  const handleNumericChange = (
    value: string,
    formType: FormMode,
    field: keyof ProductRequest
  ) => {
    let parsedValue: number | undefined;

    if (value === "") {
      parsedValue = field === "discountPrice" ? undefined : 0;
    } else {
      const numeric = Number(value);
      if (Number.isNaN(numeric) || numeric < 0) {
        showToast("Giá trị không hợp lệ", "warning");
        return;
      }
      parsedValue = numeric;
    }

    const nextValue =
      field === "discountPrice" ? parsedValue : (parsedValue ?? 0);

    if (field !== "discountPrice" && typeof nextValue !== "number") {
      return;
    }

    if (formType === "create") {
      setCreateForm((prev) => ({
        ...prev,
        [field]: nextValue,
      }));
    } else if (formType === "edit" && editForm) {
      setEditForm({
        ...editForm,
        [field]: nextValue,
      });
    }
  };

  const handleTextChange = (
    value: string,
    formType: FormMode,
    field: keyof ProductRequest
  ) => {
    if (formType === "create") {
      setCreateForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else if (formType === "edit" && editForm) {
      setEditForm({
        ...editForm,
        [field]: value,
      });
    }
  };

  const handleStatusChange = (value: string, formType: FormMode) => {
    const statusValue = value as ProductStatus;
    if (formType === "create") {
      setCreateForm((prev) => ({
        ...prev,
        status: statusValue,
      }));
    } else if (formType === "edit" && editForm) {
      setEditForm({
        ...editForm,
        status: statusValue,
      });
    }
  };

  const handleAddImageUrl = (formType: FormMode) => {
    const rawValue =
      formType === "create" ? newCreateImageUrl.trim() : newEditImageUrl.trim();

    if (!rawValue) {
      showToast("Vui lòng nhập đường dẫn hình ảnh hợp lệ", "warning");
      return;
    }

    const isValidUrl = /^https?:\/\/.+/i.test(rawValue);
    if (!isValidUrl) {
      showToast(
        "Đường dẫn hình ảnh phải bắt đầu bằng http hoặc https",
        "error"
      );
      return;
    }

    if (formType === "create") {
      setCreateImages((prev) => {
        if (prev.includes(rawValue)) {
          showToast("Hình ảnh này đã được thêm vào", "info");
          return prev;
        }
        const updated = [...prev, rawValue];
        setCreateForm((form) => ({
          ...form,
          imageUrl: form.imageUrl || rawValue,
          imageUrls: updated,
        }));
        return updated;
      });
      setNewCreateImageUrl("");
    } else if (formType === "edit") {
      setEditImages((prev) => {
        if (prev.includes(rawValue)) {
          showToast("Hình ảnh này đã được thêm vào", "info");
          return prev;
        }
        const updated = [...prev, rawValue];
        setEditForm((form) =>
          form
            ? {
                ...form,
                imageUrl: form.imageUrl || rawValue,
                imageUrls: updated,
              }
            : form
        );
        return updated;
      });
      setNewEditImageUrl("");
    }
  };

  const handleRemoveImage = (index: number, formType: FormMode) => {
    if (formType === "create") {
      setCreateImages((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        setCreateForm((form) => ({
          ...form,
          imageUrl: updated[0] || "",
          imageUrls: updated,
        }));
        return updated;
      });
    } else if (formType === "edit") {
      setEditImages((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        setEditForm((form) =>
          form
            ? {
                ...form,
                imageUrl: updated[0] || "",
                imageUrls: updated,
              }
            : form
        );
        return updated;
      });
    }
  };

  const validateForm = (form: ProductRequest): boolean => {
    if (!form.name.trim()) {
      showToast("Tên sản phẩm là bắt buộc", "error");
      return false;
    }

    if (!form.categoryId) {
      showToast("Vui lòng chọn danh mục", "error");
      return false;
    }

    if (form.price <= 0) {
      showToast("Giá sản phẩm phải lớn hơn 0", "error");
      return false;
    }

    if (form.stockQuantity < 0) {
      showToast("Tồn kho phải lớn hơn hoặc bằng 0", "error");
      return false;
    }

    return true;
  };

  const handleCreateProduct = async () => {
    if (!validateForm(createForm)) {
      return;
    }

    setIsSaving(true);
    try {
      const payload: ProductRequest = {
        ...createForm,
        imageUrl: createImages[0] || createForm.imageUrl,
        imageUrls: createImages,
      };

      await productsApi.create(payload);
      showToast("Thêm sản phẩm thành công!", "success");
      closeCreateModal();
      setCurrentPage(0);
      await loadProducts(0, true);
    } catch (error) {
      showToast(
        resolveErrorMessage(error, "Không thể thêm sản phẩm mới"),
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct || !editForm) {
      return;
    }

    if (!validateForm(editForm)) {
      return;
    }

    setIsSaving(true);
    try {
      const payload: ProductRequest = {
        ...editForm,
        imageUrl: editImages[0] || editForm.imageUrl,
        imageUrls: editImages,
      };
      await productsApi.update(selectedProduct.id, payload);
      showToast("Cập nhật sản phẩm thành công!", "success");
      closeEditModal();
      await loadProducts(currentPage, true);
    } catch (error) {
      showToast(
        resolveErrorMessage(error, "Không thể cập nhật sản phẩm"),
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) {
      return;
    }

    setIsDeleting(true);
    try {
      await productsApi.delete(selectedProduct.id);
      showToast("Đã xóa sản phẩm thành công!", "success");
      closeDeleteModal();

      const nextTotal = totalElements - 1;
      const maxPageIndex = Math.max(
        Math.ceil(Math.max(nextTotal, 0) / PAGE_SIZE) - 1,
        0
      );
      const nextPage = Math.min(currentPage, maxPageIndex);

      setCurrentPage(nextPage);
      await loadProducts(nextPage, true);
    } catch (error) {
      showToast(resolveErrorMessage(error, "Không thể xóa sản phẩm"), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderImagesPreview = (images: string[], formType: FormMode) => {
    if (images.length === 0) {
      return (
        <p className="text-sm text-gray-400">Chưa có hình ảnh nào được chọn.</p>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative group rounded-xl overflow-hidden border border-gray-700"
          >
            <Image
              src={url}
              alt={`Sản phẩm ${index + 1}`}
              width={400}
              height={400}
              className="h-32 w-full object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(index, formType)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Xóa ảnh"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
    return null;
  }

  const startItem = totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const endItem =
    totalElements === 0
      ? 0
      : Math.min((currentPage + 1) * PAGE_SIZE, totalElements);

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Quay lại"
            >
              <FaBoxOpen className="w-6 h-6" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <FaBoxes className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Quản lý sản phẩm
                </h1>
                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                  Theo dõi và cập nhật danh sách sản phẩm của ShopVerse
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-400">Tổng số sản phẩm</p>
              <p className="text-2xl font-bold text-white">{totalElements}</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 rounded-xl"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        <Card className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:gap-6 w-full">
              <div className="w-full xl:w-1/3">
                <label className="block text-sm text-gray-400 mb-2">
                  Tìm kiếm
                </label>
                <Input
                  type="text"
                  placeholder="Tìm theo tên, SKU hoặc mô tả..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  leftIcon={<FaFilter className="w-5 h-5 text-gray-400" />}
                  className="bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 rounded-2xl h-12"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 xl:gap-8 w-full xl:w-auto">
                <div className="w-full sm:w-56 xl:w-48">
                  <label className="block text-sm text-gray-400 mb-2">
                    Danh mục
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-56 xl:w-48">
                  <label className="block text-sm text-gray-400 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(e.target.value as ProductStatus | "")
                    }
                    className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả trạng thái</option>
                    {Object.values(ProductStatus).map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <label className="flex h-12 items-center gap-3 bg-red-600/15 px-4 rounded-xl border border-red-500 text-red-200 cursor-pointer transition-colors w-full sm:w-auto hover:bg-red-600/25">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm font-medium leading-none">
                Sản phẩm sắp hết hàng
              </span>
            </label>
          </div>
        </Card>

        <Card className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Danh mục
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Giá bán
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Tồn kho
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-gray-400"
                    >
                      <Loading />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-gray-400"
                    >
                      {debouncedSearchTerm || selectedCategory || selectedStatus
                        ? "Không tìm thấy sản phẩm nào phù hợp."
                        : "Chưa có sản phẩm nào trong hệ thống."}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const isLowStock =
                      product.stockQuantity <= STOCK_WARNING_THRESHOLD;
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-700 bg-gray-900">
                              {product.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-900">
                                  <FaBoxOpen className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-semibold">
                                {product.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                SKU: {product.sku || "Không có"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {product.categoryName || "Không có"}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          <div className="flex flex-col">
                            <span className="text-white font-semibold">
                              {formatCurrency(product.price)}
                            </span>
                            {product.discountPrice ? (
                              <span className="text-sm text-emerald-300">
                                Giá khuyến mãi:{" "}
                                {formatCurrency(product.discountPrice)}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                isLowStock
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-blue-500/20 text-blue-200"
                              }`}
                            >
                              <FaTags className="w-4 h-4" />
                              {product.stockQuantity}
                            </span>
                            {isLowStock && (
                              <span className="text-xs text-amber-300">
                                Sắp hết hàng
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                              statusStyles[product.status]
                            }`}
                          >
                            <FaCheck className="w-4 h-4" />
                            {statusLabels[product.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(product)}
                              className="border border-blue-500/40 bg-transparent text-blue-300 hover:bg-blue-600/20"
                            >
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => openDeleteModal(product)}
                              className="bg-red-600/80 hover:bg-red-500 text-white"
                            >
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden">
            {isFetching ? (
              <div className="px-4 py-10 text-center text-gray-400">
                <Loading />
              </div>
            ) : products.length === 0 ? (
              <div className="px-4 py-10 text-center text-gray-400">
                {debouncedSearchTerm || selectedCategory || selectedStatus
                  ? "Không tìm thấy sản phẩm nào phù hợp."
                  : "Chưa có sản phẩm nào trong hệ thống."}
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {products.map((product) => {
                  const isLowStock =
                    product.stockQuantity <= STOCK_WARNING_THRESHOLD;
                  return (
                    <div key={product.id} className="p-4 space-y-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-700 bg-gray-900">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-900">
                              <FaBoxOpen className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-white font-semibold text-lg">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-400">
                              SKU: {product.sku || "Không có"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200">
                              <FaLayerGroup className="w-4 h-4" />
                              {product.categoryName || "Không có"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                                statusStyles[product.status]
                              }`}
                            >
                              <FaCheck className="w-4 h-4" />
                              {statusLabels[product.status]}
                            </span>
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                                isLowStock
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-blue-500/20 text-blue-200"
                              }`}
                            >
                              <FaTags className="w-4 h-4" />
                              {product.stockQuantity} tồn kho
                            </span>
                          </div>
                          <div className="text-white font-semibold">
                            {formatCurrency(product.price)}
                            {product.discountPrice ? (
                              <span className="ml-2 text-sm text-emerald-300">
                                {formatCurrency(product.discountPrice)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                        <Button
                          onClick={() => openEditModal(product)}
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto border border-blue-500/40 bg-transparent text-blue-300 hover:bg-blue-600/20"
                        >
                          Sửa
                        </Button>
                        <Button
                          onClick={() => openDeleteModal(product)}
                          size="sm"
                          variant="danger"
                          className="w-full sm:w-auto bg-red-600/80 hover:bg-red-500 text-white"
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-4 px-4 py-4 border-t border-gray-700 lg:flex-row lg:items-center lg:justify-between lg:px-6">
              <div className="text-sm text-gray-400 text-center lg:text-left">
                Hiển thị {startItem} - {endItem} trong tổng số {totalElements}{" "}
                sản phẩm
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    currentPage === 0
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  Đầu
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 0))
                  }
                  disabled={currentPage === 0}
                  className={`p-2 rounded-xl transition-colors ${
                    currentPage === 0
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageIndex: number;
                    if (totalPages <= 5) {
                      pageIndex = i;
                    } else if (currentPage < 3) {
                      pageIndex = i;
                    } else if (currentPage > totalPages - 4) {
                      pageIndex = totalPages - 5 + i;
                    } else {
                      pageIndex = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageIndex}
                        onClick={() => setCurrentPage(pageIndex)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          currentPage === pageIndex
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-white hover:bg-gray-600"
                        }`}
                      >
                        {pageIndex + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className={`p-2 rounded-xl transition-colors ${
                    currentPage >= totalPages - 1
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    currentPage >= totalPages - 1
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  Cuối
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Create Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Thêm sản phẩm mới"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tên sản phẩm"
              value={createForm.name}
              onChange={(e) =>
                handleTextChange(e.target.value, "create", "name")
              }
              required
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
            />
            <Input
              label="SKU (Mã sản phẩm)"
              value={createForm.sku}
              onChange={(e) =>
                handleTextChange(e.target.value, "create", "sku")
              }
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
            />
            <Input
              label="Giá bán (VNĐ)"
              type="number"
              min={0}
              value={createForm.price.toString()}
              onChange={(e) =>
                handleNumericChange(e.target.value, "create", "price")
              }
              required
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
            />
            <Input
              label="Giá khuyến mãi (VNĐ)"
              type="number"
              min={0}
              value={createForm.discountPrice?.toString() || ""}
              onChange={(e) =>
                handleNumericChange(e.target.value, "create", "discountPrice")
              }
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
            />
            <Input
              label="Tồn kho"
              type="number"
              min={0}
              value={createForm.stockQuantity.toString()}
              onChange={(e) =>
                handleNumericChange(e.target.value, "create", "stockQuantity")
              }
              required
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
            />
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Danh mục
              </label>
              <select
                value={createForm.categoryId}
                onChange={(e) =>
                  handleTextChange(e.target.value, "create", "categoryId")
                }
                className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn danh mục</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Trạng thái
              </label>
              <select
                value={createForm.status}
                onChange={(e) => handleStatusChange(e.target.value, "create")}
                className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(ProductStatus).map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">
                Mô tả chi tiết
              </label>
              <textarea
                value={createForm.description || ""}
                onChange={(e) =>
                  handleTextChange(e.target.value, "create", "description")
                }
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mô tả chi tiết cho sản phẩm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Hình ảnh sản phẩm
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="https://domain.com/hinh-anh.jpg"
                  value={newCreateImageUrl}
                  onChange={(e) => setNewCreateImageUrl(e.target.value)}
                  leftIcon={<FaImage className="w-5 h-5 text-gray-400" />}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                />
              </div>
              <Button
                onClick={() => handleAddImageUrl("create")}
                disabled={!newCreateImageUrl.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl w-full sm:w-auto"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Thêm ảnh
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Sử dụng đường dẫn hình ảnh công khai (CDN hoặc lưu trữ tĩnh). Ảnh
              đầu tiên sẽ được chọn làm ảnh đại diện.
            </p>
            {renderImagesPreview(createImages, "create")}
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={closeCreateModal}
              disabled={isSaving}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateProduct}
              isLoading={isSaving}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Lưu sản phẩm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Chỉnh sửa sản phẩm"
        size="lg"
      >
        {editForm ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tên sản phẩm"
                value={editForm.name}
                onChange={(e) =>
                  handleTextChange(e.target.value, "edit", "name")
                }
                required
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
              />
              <Input
                label="SKU (Mã sản phẩm)"
                value={editForm.sku}
                onChange={(e) =>
                  handleTextChange(e.target.value, "edit", "sku")
                }
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
              />
              <Input
                label="Giá bán (VNĐ)"
                type="number"
                min={0}
                value={editForm.price.toString()}
                onChange={(e) =>
                  handleNumericChange(e.target.value, "edit", "price")
                }
                required
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
              />
              <Input
                label="Giá khuyến mãi (VNĐ)"
                type="number"
                min={0}
                value={editForm.discountPrice?.toString() || ""}
                onChange={(e) =>
                  handleNumericChange(e.target.value, "edit", "discountPrice")
                }
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
              />
              <Input
                label="Tồn kho"
                type="number"
                min={0}
                value={editForm.stockQuantity.toString()}
                onChange={(e) =>
                  handleNumericChange(e.target.value, "edit", "stockQuantity")
                }
                required
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
              />
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Danh mục
                </label>
                <select
                  value={editForm.categoryId}
                  onChange={(e) =>
                    handleTextChange(e.target.value, "edit", "categoryId")
                  }
                  className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Trạng thái
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => handleStatusChange(e.target.value, "edit")}
                  className="w-full h-12 px-4 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(ProductStatus).map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">
                  Mô tả chi tiết
                </label>
                <textarea
                  value={editForm.description || ""}
                  onChange={(e) =>
                    handleTextChange(e.target.value, "edit", "description")
                  }
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mô tả chi tiết cho sản phẩm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">
                Hình ảnh sản phẩm
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="url"
                    placeholder="https://domain.com/hinh-anh.jpg"
                    value={newEditImageUrl}
                    onChange={(e) => setNewEditImageUrl(e.target.value)}
                    leftIcon={<FaImage className="w-5 h-5 text-gray-400" />}
                    className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                  />
                </div>
                <Button
                  onClick={() => handleAddImageUrl("edit")}
                  disabled={!newEditImageUrl.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl w-full sm:w-auto"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Thêm ảnh
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Dán đường dẫn hình ảnh từ nguồn lưu trữ đáng tin cậy. Ảnh đầu
                tiên sẽ được hiển thị làm ảnh chính.
              </p>
              {renderImagesPreview(editImages, "edit")}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={closeEditModal}
                disabled={isSaving}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateProduct}
                isLoading={isSaving}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Cập nhật sản phẩm
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-400">
            Đang tải dữ liệu sản phẩm...
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            closeDeleteModal();
          }
        }}
        title="Xác nhận xóa sản phẩm"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Bạn có chắc chắn muốn xóa sản phẩm{" "}
            <span className="font-semibold text-white">
              {selectedProduct?.name}
            </span>
            ? Hành động này không thể hoàn tác.
          </p>
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => !isDeleting && closeDeleteModal()}
              disabled={isDeleting}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteProduct}
              isLoading={isDeleting}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Xóa sản phẩm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsManagementPage;
