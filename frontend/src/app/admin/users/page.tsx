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
  FaEdit,
  FaTrash,
  FaSearch,
  FaUserShield,
  FaUser,
  FaCheck,
  FaTimes,
  FaLock,
  FaUnlock,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateUserRequest>({});

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
    try {
      setIsLoading(true);
      const response = await usersApi.getAllUsers({
        page,
        size: pageSize,
        sortBy: "createdAt",
        sortDir: "DESC",
      });
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      showToast(error.message || "Không thể tải danh sách người dùng", "error");
    } finally {
      setIsLoading(false);
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

  const handleToggleEnabled = async (user: User) => {
    try {
      const updatedUser = await usersApi.updateUser(user.id, {
        enabled: !user.enabled,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      showToast(
        `Đã ${updatedUser.enabled ? "kích hoạt" : "vô hiệu hóa"} người dùng`,
        "success"
      );
      // Refresh current page
      fetchUsers(currentPage);
    } catch (error: any) {
      showToast(
        error.message || "Không thể thay đổi trạng thái người dùng",
        "error"
      );
    }
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <HiArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Quản lý người dùng
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Quản lý tất cả người dùng trong hệ thống
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Tổng số người dùng</p>
              <p className="text-2xl font-bold text-white">{totalElements}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<FaSearch className="w-5 h-5 text-gray-400" />}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="bg-gray-800 border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-colors"
                            title="Chỉnh sửa"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleEnabled(user)}
                            className={`p-2 rounded-xl transition-colors ${
                              user.enabled
                                ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                : "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            }`}
                            title={user.enabled ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            {user.enabled ? (
                              <FaLock className="w-4 h-4" />
                            ) : (
                              <FaUnlock className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Hiển thị {currentPage * pageSize + 1} -{" "}
                {Math.min((currentPage + 1) * pageSize, totalElements)} trong
                tổng số {totalElements} người dùng
              </div>
              <div className="flex items-center gap-2">
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
                className="flex-1 bg-gray-700 hover:bg-gray-600"
              >
                Hủy
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default UsersManagementPage;
