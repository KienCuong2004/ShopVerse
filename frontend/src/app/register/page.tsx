"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button, Input, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { RegisterRequest, UserRole } from "@/types";
import {
  FaEnvelope,
  FaLock,
  FaPhone,
  FaRegUser,
  FaUserShield,
  FaMapMarkerAlt,
} from "react-icons/fa";

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<RegisterRequest>({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phone: "",
    address: "",
    role: UserRole.USER,
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Tên đăng nhập là bắt buộc";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (formData.role === UserRole.ADMIN && !formData.fullName?.trim()) {
      newErrors.fullName =
        "Vui lòng cung cấp họ tên khi đăng ký tài khoản quản trị";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const createdUser = await register(formData);
      showToast("Đăng ký tài khoản thành công!", "success");

      setTimeout(() => {
        if (createdUser.role === UserRole.ADMIN) {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
        router.refresh();
      }, 100);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể đăng ký tài khoản, vui lòng thử lại.";
      showToast(message, "error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "role" ? (value as UserRole) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-10 px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative h-56 w-full lg:h-auto lg:min-h-[520px]">
              <Image
                src="/assets/images/Sign_up.png"
                alt="ShopVerse Đăng ký"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-gray-900/10" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-3">
                <h2 className="text-2xl font-bold">Tham gia ShopVerse</h2>
                <p className="text-sm text-gray-200">
                  Đăng ký tài khoản để quản lý đơn hàng, sản phẩm và chiến dịch
                  marketing hiệu quả hơn.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FaUserShield className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-500">
                    Đăng ký tài khoản
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Chọn loại tài khoản phù hợp với nhu cầu của bạn
                  </p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-300 mb-2">
                      Loại tài khoản
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={UserRole.USER}>Khách hàng</option>
                      <option value={UserRole.ADMIN}>Quản trị viên</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      Tài khoản quản trị viên có thể truy cập các trang quản lý
                      sản phẩm, đơn hàng và marketing.
                    </p>
                  </div>

                  <div>
                    <Input
                      label="Tên đăng nhập"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      error={errors.username}
                      leftIcon={<FaRegUser className="text-white" />}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Họ và tên"
                      name="fullName"
                      value={formData.fullName || ""}
                      onChange={handleChange}
                      error={errors.fullName}
                      leftIcon={<FaRegUser className="text-white" />}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      leftIcon={<FaEnvelope className="text-white" />}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Số điện thoại"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      error={errors.phone}
                      leftIcon={<FaPhone className="text-white" />}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Địa chỉ"
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      error={errors.address}
                      leftIcon={<FaMapMarkerAlt className="text-white" />}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Mật khẩu"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      leftIcon={<FaLock className="text-white" />}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Xác nhận mật khẩu"
                      type="password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        if (errors.confirmPassword) {
                          setErrors((prev) => ({
                            ...prev,
                            confirmPassword: "",
                          }));
                        }
                      }}
                      error={errors.confirmPassword}
                      leftIcon={<FaLock className="text-white" />}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  {!isLoading && <span>Đăng ký</span>}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Đã có tài khoản?{" "}
                  <Link
                    href="/login"
                    className="text-blue-500 font-medium hover:underline"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
