"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, Modal, Loading, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/utils/api";
import { UpdateUserRequest } from "@/utils/api/users";
import { User, UserRole } from "@/types";
import {
  FaUsers,
  FaSearch,
  FaUserShield,
  FaUser,
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { HiArrowLeft } from "react-icons/hi";

const UsersManagementPage: React.FC = () => {
  const router = useRouter();
  const {
    user: currentUser,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateUserRequest>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 5;

  // Check authentication and admin role
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      if (currentUser?.role !== UserRole.ADMIN) {
        router.push("/");
        showToast("Bạn không có quyền truy cập trang này", "error");
        return;
      }
    }
  }, [isAuthenticated, authLoading, currentUser, router, showToast]);

  // Fetch users with pagination
  useEffect(() => {
    if (isAuthenticated && currentUser?.role === UserRole.ADMIN) {
      fetchUsers(currentPage);
    }
  }, [isAuthenticated, currentUser, currentPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    if (isAuthenticated && currentUser?.role === UserRole.ADMIN) {
      setCurrentPage(0);
      fetchUsers(0);
    }
  }, [searchTerm]);

  const fetchUsers = async (page: number) => {
    const showFullScreenLoader = !hasLoaded && users.length === 0;
    if (showFullScreenLoader) {
      setIsLoading(true);
    }
    try {
      const response = await usersApi.getAllUsers({
        page,
        size: pageSize,
        sortBy: "createdAt",
        sortDir: "DESC",
      });
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      if (!hasLoaded) {
        setHasLoaded(true);
      }
    } catch (error: any) {
      showToast(error.message || "Không thể tải danh sách người dùng", "error");
    } finally {
      if (showFullScreenLoader) {
        setIsLoading(false);
      }
    }
  };

  // Filter users based on search term (client-side filtering)
  const filteredUsers = users.filter((user) => {
    if (searchTerm.trim() === "") return true;
    const term = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.fullName?.toLowerCase().includes(term) ||
      user.phone?.includes(searchTerm)
    );
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      fullName: user.fullName || "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role,
      enabled: user.enabled,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      const updatedUser = await usersApi.updateUser(
        selectedUser.id,
        editFormData
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      setIsEditModalOpen(false);
      setSelectedUser(null);
      showToast("Cập nhật người dùng thành công!", "success");
      // Refresh current page
      fetchUsers(currentPage);
    } catch (error: any) {
      showToast(error.message || "Không thể cập nhật người dùng", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await usersApi.deleteUser(userToDelete.id);
      showToast("Đã xóa người dùng thành công!", "success");

      const nextTotal = totalElements - 1;
      const maxPageIndex = Math.max(
        Math.ceil(Math.max(nextTotal, 0) / pageSize) - 1,
        0
      );
      const nextPage = Math.min(currentPage, maxPageIndex);

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        fetchUsers(currentPage);
      }
    } catch (error: any) {
      showToast(error.message || "Không thể xóa người dùng", "error");
    } finally {
      setUserToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    if (user.role === UserRole.ADMIN) {
      showToast("Không thể xóa tài khoản quản trị viên", "error");
      return;
    }

    if (user.username === currentUser?.username) {
      showToast("Bạn không thể tự xóa tài khoản của mình", "error");
      return;
    }

    setUserToDelete(user);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated || currentUser?.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Quay lại"
              >
                <HiArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Quản lý người dùng
                  </h1>
                  <p className="text-gray-400 mt-1 text-sm sm:text-base">
                    Quản lý tất cả người dùng trong hệ thống
                  </p>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-gray-400">Tổng số người dùng</p>
              <p className="text-2xl font-bold text-white">{totalElements}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-full md:max-w-md">
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<FaSearch className="w-5 h-5 text-gray-400" />}
              className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 rounded-2xl"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="bg-gray-800 border-gray-700 rounded-2xl overflow-hidden shadow-lg">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Tên đăng nhập
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Họ tên
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Số điện thoại
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Vai trò
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      {searchTerm
                        ? "Không tìm thấy người dùng nào"
                        : "Chưa có người dùng nào"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{user.email}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {user.fullName || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {user.phone || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === UserRole.ADMIN
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {user.role === UserRole.ADMIN ? (
                            <FaUserShield className="w-4 h-4" />
                          ) : (
                            <FaUser className="w-4 h-4" />
                          )}
                          {user.role === UserRole.ADMIN
                            ? "Quản trị viên"
                            : "Người dùng"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            user.enabled
                              ? "bg-green-500/20 text-green-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {user.enabled ? (
                            <>
                              <FaCheck className="w-4 h-4" />
                              Hoạt động
                            </>
                          ) : (
                            <>
                              <FaTimes className="w-4 h-4" />
                              Vô hiệu hóa
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                            className="border border-blue-500/40 bg-transparent text-blue-300 hover:bg-blue-600/20"
                          >
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              user.role === UserRole.ADMIN ||
                              user.username === currentUser?.username
                                ? "secondary"
                                : "danger"
                            }
                            disabled={
                              user.role === UserRole.ADMIN ||
                              user.username === currentUser?.username
                            }
                            onClick={() => handleDeleteClick(user)}
                            className={`${
                              user.role === UserRole.ADMIN ||
                              user.username === currentUser?.username
                                ? "bg-gray-700 text-gray-400 hover:bg-gray-700 cursor-not-allowed"
                                : "bg-red-600/80 hover:bg-red-500 text-white"
                            }`}
                            title={
                              user.role === UserRole.ADMIN ||
                              user.username === currentUser?.username
                                ? "Không thể xóa tài khoản quản trị viên hoặc tài khoản của bạn"
                                : undefined
                            }
                          >
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden">
            {filteredUsers.length === 0 ? (
              <div className="px-4 py-10 text-center text-gray-400">
                {searchTerm
                  ? "Không tìm thấy người dùng nào"
                  : "Chưa có người dùng nào"}
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-white font-semibold text-lg">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-400 break-words">
                            {user.email}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium self-start ${
                            user.role === UserRole.ADMIN
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {user.role === UserRole.ADMIN ? (
                            <FaUserShield className="w-4 h-4" />
                          ) : (
                            <FaUser className="w-4 h-4" />
                          )}
                          {user.role === UserRole.ADMIN
                            ? "Quản trị viên"
                            : "Người dùng"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
                        <div>
                          <p className="text-gray-400">Họ tên</p>
                          <p className="font-medium text-white">
                            {user.fullName || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Số điện thoại</p>
                          <p className="font-medium text-white">
                            {user.phone || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Trạng thái</p>
                          <span
                            className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                              user.enabled
                                ? "bg-green-500/20 text-green-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {user.enabled ? (
                              <>
                                <FaCheck className="w-4 h-4" />
                                Hoạt động
                              </>
                            ) : (
                              <>
                                <FaTimes className="w-4 h-4" />
                                Vô hiệu hóa
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                      <Button
                        onClick={() => handleEdit(user)}
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto border border-blue-500/40 bg-transparent text-blue-300 hover:bg-blue-600/20"
                      >
                        Sửa
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(user)}
                        size="sm"
                        variant={
                          user.role === UserRole.ADMIN ||
                          user.username === currentUser?.username
                            ? "secondary"
                            : "danger"
                        }
                        disabled={
                          user.role === UserRole.ADMIN ||
                          user.username === currentUser?.username
                        }
                        className={`w-full sm:w-auto ${
                          user.role === UserRole.ADMIN ||
                          user.username === currentUser?.username
                            ? "bg-gray-700 text-gray-400 hover:bg-gray-700 cursor-not-allowed"
                            : "bg-red-600/80 hover:bg-red-500 text-white"
                        }`}
                        title={
                          user.role === UserRole.ADMIN ||
                          user.username === currentUser?.username
                            ? "Không thể xóa tài khoản quản trị viên hoặc tài khoản của bạn"
                            : undefined
                        }
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 px-4 py-4 border-t border-gray-700 md:flex-row md:items-center md:justify-between md:px-6">
              <div className="text-sm text-gray-400 text-center md:text-left">
                Hiển thị {currentPage * pageSize + 1} -{" "}
                {Math.min((currentPage + 1) * pageSize, totalElements)} trong
                tổng số {totalElements} người dùng
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
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={`p-2 rounded-xl transition-colors ${
                    currentPage === 0
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-white hover:bg-gray-600"
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
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

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
            setEditFormData({});
          }}
          title="Chỉnh sửa người dùng"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tên đăng nhập
              </label>
              <Input
                type="text"
                value={selectedUser?.username || ""}
                disabled
                className="bg-gray-700 border-gray-600 text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={selectedUser?.email || ""}
                disabled
                className="bg-gray-700 border-gray-600 text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Họ tên
              </label>
              <Input
                type="text"
                value={editFormData.fullName || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, fullName: e.target.value })
                }
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Số điện thoại
              </label>
              <Input
                type="text"
                value={editFormData.phone || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Địa chỉ
              </label>
              <Input
                type="text"
                value={editFormData.address || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, address: e.target.value })
                }
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vai trò
              </label>
              <select
                value={editFormData.role || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, role: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={UserRole.USER}>Người dùng</option>
                <option value={UserRole.ADMIN}>Quản trị viên</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.enabled ?? true}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      enabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">
                  Kích hoạt tài khoản
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                onClick={handleUpdate}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Cập nhật
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                  setEditFormData({});
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
              >
                Hủy
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={Boolean(userToDelete)}
          onClose={() => {
            if (!isDeleting) {
              setUserToDelete(null);
            }
          }}
          title="Xác nhận xóa người dùng"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-300">
              Bạn có chắc chắn muốn xóa người dùng{" "}
              <span className="font-semibold text-white">
                {userToDelete ? `"${userToDelete.username}"` : ""}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => !isDeleting && setUserToDelete(null)}
                disabled={isDeleting}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                Xóa người dùng
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default UsersManagementPage;
