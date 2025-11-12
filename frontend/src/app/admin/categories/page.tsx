"use client";

import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Loading, Modal, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { categoriesApi } from "@/utils/api";
import {
  ApiError,
  CategoryImageOption,
  CategoryPayload,
  CategoryTreeNode,
  UserRole,
} from "@/types";
import {
  FaBoxOpen,
  FaChevronDown,
  FaChevronRight,
  FaEdit,
  FaGripVertical,
  FaLayerGroup,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

type FormMode = "create" | "edit";

interface FormState {
  mode: FormMode;
  parentId: string | null;
  excludedIds: Set<string>;
}

const defaultFormState: FormState = {
  mode: "create",
  parentId: null,
  excludedIds: new Set(),
};

const defaultFormValues: CategoryPayload = {
  name: "",
  description: "",
  imageUrl: "",
  parentId: null,
};

const normalizeTree = (nodes: CategoryTreeNode[]): CategoryTreeNode[] =>
  nodes.map((node) => ({
    ...node,
    productCount: node.productCount ?? 0,
    totalProductCount:
      node.totalProductCount ??
      (node.productCount ?? 0) +
        (node.children?.reduce(
          (sum, child) => sum + (child.totalProductCount ?? 0),
          0
        ) ?? 0),
    children: node.children ? normalizeTree(node.children) : [],
  }));

const collectAllIds = (nodes: CategoryTreeNode[]): Set<string> => {
  const ids = new Set<string>();
  const stack = [...nodes];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    ids.add(current.id);
    if (current.children && current.children.length) {
      stack.push(...current.children);
    }
  }
  return ids;
};

const collectDescendantIds = (node: CategoryTreeNode | null): Set<string> => {
  if (!node) return new Set();
  const ids = new Set<string>([node.id]);
  const stack = [...(node.children ?? [])];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    ids.add(current.id);
    if (current.children && current.children.length) {
      stack.push(...current.children);
    }
  }
  return ids;
};

const cloneTree = (nodes: CategoryTreeNode[]): CategoryTreeNode[] =>
  nodes.map((node) => ({
    ...node,
    children: cloneTree(node.children ?? []),
  }));

const findNode = (
  nodes: CategoryTreeNode[],
  id: string
): CategoryTreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const childMatch = findNode(node.children ?? [], id);
    if (childMatch) {
      return childMatch;
    }
  }
  return null;
};

const reorderInTree = (
  nodes: CategoryTreeNode[],
  parentId: string | null,
  categoryId: string,
  targetIndex: number
): { tree: CategoryTreeNode[]; orderedIds: string[] } => {
  const cloned = cloneTree(nodes);
  const siblings = parentId
    ? (findNode(cloned, parentId)?.children ?? [])
    : cloned;

  const currentIndex = siblings.findIndex((item) => item.id === categoryId);
  if (currentIndex === -1) {
    return { tree: nodes, orderedIds: [] };
  }

  let insertIndex = targetIndex;
  if (insertIndex < 0) insertIndex = 0;
  if (insertIndex > siblings.length) insertIndex = siblings.length;

  const [moved] = siblings.splice(currentIndex, 1);
  if (currentIndex < targetIndex) {
    insertIndex = Math.max(0, insertIndex - 1);
  }

  siblings.splice(insertIndex, 0, moved);

  return {
    tree: cloned,
    orderedIds: siblings.map((item) => item.id),
  };
};

const flattenTree = (
  nodes: CategoryTreeNode[],
  depth = 0
): Array<{ id: string; name: string; depth: number }> => {
  const result: Array<{ id: string; name: string; depth: number }> = [];
  nodes.forEach((node) => {
    result.push({ id: node.id, name: node.name, depth });
    if (node.children && node.children.length) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  });
  return result;
};

const resolveErrorMessage = (error: unknown, fallback: string): string => {
  if (!error) return fallback;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const apiError = error as ApiError;
    if (apiError.message) return apiError.message;
  }
  return fallback;
};

const CategoryManagementPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [imageOptions, setImageOptions] = useState<CategoryImageOption[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [formValues, setFormValues] =
    useState<CategoryPayload>(defaultFormValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryTreeNode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dragState, setDragState] = useState<{
    id: string;
    parentId: string | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryTreeNode | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadImageOptions = useCallback(async () => {
    try {
      setIsLoadingImages(true);
      const options = await categoriesApi.getImageOptions();
      setImageOptions(options);
      setFormValues((prev) => ({
        ...prev,
        imageUrl:
          prev.imageUrl && prev.imageUrl.length > 0
            ? prev.imageUrl
            : (options[0]?.value ?? ""),
      }));
    } catch (error) {
      showToast("Không thể tải danh sách ảnh danh mục", "error");
    } finally {
      setIsLoadingImages(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadImageOptions();
  }, [loadImageOptions]);

  const loadCategories = useCallback(
    async (withFullLoader = false, expandIds: string[] = []) => {
      if (withFullLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await categoriesApi.getAdminTree();
        const normalized = normalizeTree(response ?? []);
        const allIds = collectAllIds(normalized);

        setCategories(normalized);
        setExpandedIds((prev) => {
          const next = new Set<string>();
          prev.forEach((id) => {
            if (allIds.has(id)) {
              next.add(id);
            }
          });

          if (next.size === 0) {
            normalized.forEach((node) => next.add(node.id));
          }

          expandIds.forEach((id) => {
            if (allIds.has(id)) {
              next.add(id);
            }
          });

          return next;
        });
      } catch (error) {
        showToast(
          resolveErrorMessage(error, "Không thể tải danh mục sản phẩm"),
          "error"
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== UserRole.ADMIN) {
        router.push("/");
        showToast("Bạn không có quyền truy cập trang này", "error");
      } else {
        loadCategories(true);
      }
    }
  }, [authLoading, isAuthenticated, user, router, showToast, loadCategories]);

  const flattenedOptions = useMemo(() => flattenTree(categories), [categories]);

  const combinedImageOptions = useMemo(() => {
    if (!formValues.imageUrl || formValues.imageUrl.length === 0) {
      return imageOptions;
    }

    const exists = imageOptions.some(
      (option) => option.value === formValues.imageUrl
    );

    if (exists) {
      return imageOptions;
    }

    return [
      ...imageOptions,
      {
        value: formValues.imageUrl,
        label: `Tuỳ chỉnh (${formValues.imageUrl})`,
        filename: formValues.imageUrl,
      },
    ];
  }, [imageOptions, formValues.imageUrl]);

  const selectedImageUrl =
    (formValues.imageUrl && formValues.imageUrl.length > 0
      ? formValues.imageUrl
      : imageOptions[0]?.value) ?? "";

  const summary = useMemo(() => {
    const totalIds = collectAllIds(categories);
    const totalProducts = categories.reduce(
      (sum, node) => sum + (node.totalProductCount ?? 0),
      0
    );
    const maxDepth = categories.reduce((max, node) => {
      return Math.max(max, node.depth ?? 0);
    }, 0);
    return {
      totalCategories: totalIds.size,
      rootCategories: categories.length,
      totalProducts,
      maxDepth,
    };
  }, [categories]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openCreateModal = (parentId: string | null = null) => {
    setFormState({
      mode: "create",
      parentId,
      excludedIds: new Set(),
    });
    setFormValues({
      name: "",
      description: "",
      imageUrl: imageOptions[0]?.value ?? "",
      parentId,
    });
    setFormErrors({});
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const openEditModal = (category: CategoryTreeNode) => {
    setFormState({
      mode: "edit",
      parentId: category.parentId ?? null,
      excludedIds: collectDescendantIds(category),
    });
    setFormValues({
      name: category.name,
      description: category.description ?? "",
      imageUrl:
        category.imageUrl && category.imageUrl.length > 0
          ? category.imageUrl
          : (imageOptions[0]?.value ?? ""),
      parentId: category.parentId ?? null,
    });
    setFormErrors({});
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setFormErrors({});
    setFormState(defaultFormState);
    setSelectedCategory(null);
    setFormValues(defaultFormValues);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formValues.name || !formValues.name.trim()) {
      errors.name = "Tên danh mục là bắt buộc";
    } else if (formValues.name.trim().length > 100) {
      errors.name = "Tên danh mục không được vượt quá 100 ký tự";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    const payload: CategoryPayload = {
      name: formValues.name.trim(),
      description: formValues.description
        ? formValues.description.trim()
        : undefined,
      imageUrl: formValues.imageUrl ? formValues.imageUrl.trim() : undefined,
      parentId: formValues.parentId ?? null,
    };

    setIsSaving(true);
    try {
      if (formState.mode === "create") {
        await categoriesApi.create(payload);
        showToast("Tạo danh mục thành công", "success");
        await loadCategories(false, payload.parentId ? [payload.parentId] : []);
      } else if (selectedCategory) {
        await categoriesApi.update(selectedCategory.id, payload);
        showToast("Cập nhật danh mục thành công", "success");
        await loadCategories(false, [
          selectedCategory.parentId ?? selectedCategory.id,
        ]);
      }
      closeFormModal();
    } catch (error) {
      showToast(resolveErrorMessage(error, "Không thể lưu danh mục"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (id: string, parentId: string | null) => {
    setDragState({ id, parentId });
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (
    event: React.DragEvent,
    parentId: string | null,
    targetIndex: number
  ) => {
    event.preventDefault();
    if (!dragState || dragState.parentId !== parentId) {
      return;
    }

    const { tree, orderedIds } = reorderInTree(
      categories,
      parentId,
      dragState.id,
      targetIndex
    );

    if (!orderedIds.length) {
      return;
    }

    setCategories(tree);
    setDragState(null);

    try {
      await categoriesApi.reorder({
        parentId,
        orderedCategoryIds: orderedIds,
      });
      showToast("Cập nhật thứ tự danh mục thành công", "success");
    } catch (error) {
      showToast(
        resolveErrorMessage(error, "Không thể cập nhật thứ tự danh mục"),
        "error"
      );
      await loadCategories(false);
    }
  };

  const openDeleteModal = (category: CategoryTreeNode) => {
    setDeleteTarget(category);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await categoriesApi.remove(deleteTarget.id);
      showToast("Xóa danh mục thành công", "success");
      const parentId = deleteTarget.parentId ?? null;
      await loadCategories(false, parentId ? [parentId] : []);
    } catch (error) {
      showToast(resolveErrorMessage(error, "Không thể xóa danh mục"), "error");
    } finally {
      closeDeleteModal();
    }
  };

  const renderDropZone = (
    parentId: string | null,
    targetIndex: number
  ): React.ReactNode => (
    <div
      className="h-3 rounded border border-dashed border-transparent transition-colors duration-150"
      onDragOver={handleDragOver}
      onDrop={(event) => handleDrop(event, parentId, targetIndex)}
      onDragEnter={(event) => {
        event.currentTarget.classList.add("border-blue-500/60");
        event.currentTarget.classList.add("bg-blue-500/10");
      }}
      onDragLeave={(event) => {
        event.currentTarget.classList.remove("border-blue-500/60");
        event.currentTarget.classList.remove("bg-blue-500/10");
      }}
    />
  );

  const renderCategoryRows = (
    nodes: CategoryTreeNode[],
    parentId: string | null = null
  ): React.ReactNode => {
    if (!nodes.length) {
      return null;
    }

    return (
      <div className="space-y-2">
        {nodes.map((node, index) => (
          <Fragment key={node.id}>
            {renderDropZone(parentId, index)}
            <div
              className={`flex items-center justify-between gap-3 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 shadow-sm transition-colors duration-150 ${
                dragState?.id === node.id
                  ? "border-blue-500/70 bg-blue-500/10"
                  : "hover:border-blue-500/40 hover:bg-blue-500/5"
              }`}
              draggable
              onDragStart={() => handleDragStart(node.id, parentId)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-gray-500">
                  <FaGripVertical />
                </span>
                <button
                  type="button"
                  onClick={() => toggleExpand(node.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 text-gray-300 transition-colors hover:border-blue-500 hover:text-white"
                >
                  {expandedIds.has(node.id) ? (
                    <FaChevronDown className="h-4 w-4" />
                  ) : (
                    <FaChevronRight className="h-4 w-4" />
                  )}
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    {node.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {node.totalProductCount ?? 0} sản phẩm tổng •{" "}
                    {node.productCount ?? 0} sản phẩm trực tiếp
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
                  onClick={() => openCreateModal(node.id)}
                >
                  <FaPlus className="mr-2 h-3 w-3" />
                  Thêm con
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
                  onClick={() => openEditModal(node)}
                >
                  <FaEdit className="mr-2 h-3 w-3" />
                  Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 bg-gray-800 text-red-300 hover:border-red-500 hover:bg-red-500/10"
                  onClick={() => openDeleteModal(node)}
                >
                  <FaTrash className="mr-2 h-3 w-3" />
                  Xóa
                </Button>
              </div>
            </div>
            {expandedIds.has(node.id) && node.children.length > 0 && (
              <div className="ml-8 border-l border-gray-800 pl-6">
                {renderCategoryRows(node.children, node.id)}
              </div>
            )}
          </Fragment>
        ))}
        {renderDropZone(parentId, nodes.length)}
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loading text="Đang tải danh mục..." />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Quản lý danh mục sản phẩm
            </h1>
            <p className="mt-2 text-gray-400">
              Tổ chức cấu trúc danh mục đa cấp, theo dõi số lượng sản phẩm và
              sắp xếp bằng thao tác kéo-thả.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
              onClick={() => {
                void loadImageOptions();
                void loadCategories(true);
              }}
            >
              Làm mới
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => openCreateModal(null)}
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Thêm danh mục gốc
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-800 bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tổng danh mục</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {summary.totalCategories}
                </p>
              </div>
              <div className="rounded-full bg-blue-600/10 p-3 text-blue-400">
                <FaLayerGroup className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Danh mục gốc</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {summary.rootCategories}
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-400">
                <FaPlus className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tổng sản phẩm</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {summary.totalProducts}
                </p>
              </div>
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-400">
                <FaBoxOpen className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Cấu trúc danh mục
            </h2>
            {isRefreshing && (
              <span className="text-sm text-gray-400">Đang cập nhật...</span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Kéo-thả để thay đổi thứ tự trong cùng một cấp độ. Nhấn "Thêm con" để
            tạo danh mục đa cấp.
          </p>
          <div className="mt-6">
            {categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-10 text-center text-gray-400">
                Chưa có danh mục nào. Hãy bắt đầu bằng cách thêm danh mục gốc.
              </div>
            ) : (
              renderCategoryRows(categories, null)
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={
          formState.mode === "create"
            ? "Thêm danh mục sản phẩm"
            : "Cập nhật danh mục sản phẩm"
        }
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-500 hover:bg-gray-700"
              onClick={closeFormModal}
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleFormSubmit}
              isLoading={isSaving}
            >
              {formState.mode === "create" ? "Tạo danh mục" : "Lưu thay đổi"}
            </Button>
          </div>
        }
      >
        <form className="space-y-5" onSubmit={handleFormSubmit}>
          <Input
            label="Tên danh mục"
            value={formValues.name}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                name: event.target.value,
              }))
            }
            required
            error={formErrors.name}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Danh mục cha
            </label>
            <select
              value={formValues.parentId ?? ""}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  parentId: event.target.value ? event.target.value : null,
                }))
              }
              className="h-12 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">(Danh mục gốc)</option>
              {flattenedOptions.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                  disabled={formState.excludedIds.has(option.id)}
                >
                  {`${"— ".repeat(option.depth)}${option.name}`}
                </option>
              ))}
            </select>
            {formState.mode === "edit" && formState.excludedIds.size > 0 && (
              <p className="text-xs text-gray-500">
                Không thể chọn chính danh mục này hoặc danh mục con làm danh mục
                cha.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Mô tả (tuỳ chọn)
            </label>
            <textarea
              value={formValues.description ?? ""}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả ngắn gọn về danh mục..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Ảnh đại diện
            </label>
            <select
              value={selectedImageUrl}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  imageUrl: event.target.value,
                }))
              }
              disabled={isLoadingImages || combinedImageOptions.length === 0}
              className="h-12 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingImages && <option>Đang tải...</option>}
              {!isLoadingImages && combinedImageOptions.length === 0 && (
                <option>Chưa có ảnh trong thư mục</option>
              )}
              {combinedImageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {!isLoadingImages && selectedImageUrl && (
              <div className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                <img
                  src={selectedImageUrl}
                  alt="Xem trước ảnh danh mục"
                  className="h-16 w-16 rounded-lg object-cover"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
                <span className="text-xs text-gray-400 break-all">
                  {selectedImageUrl}
                </span>
              </div>
            )}
            {!isLoadingImages && combinedImageOptions.length === 0 && (
              <p className="text-xs text-amber-400">
                Chưa có ảnh trong thư mục `public/assets/images/categories`. Hãy
                thêm ảnh mới (Git sẽ bỏ qua thư mục này) rồi nhấn "Làm mới" để
                tải lại.
              </p>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Xóa danh mục"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-500 hover:bg-gray-700"
              onClick={closeDeleteModal}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Xóa
            </Button>
          </div>
        }
      >
        <p className="text-gray-300">
          Bạn có chắc chắn muốn xóa danh mục{" "}
          <span className="font-semibold text-white">{deleteTarget?.name}</span>{" "}
          không? Thao tác này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
};

export default CategoryManagementPage;
