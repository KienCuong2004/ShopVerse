"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button, Input, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { LoginRequest, ApiError } from "@/types";
import { FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login, isLoading, user } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<LoginRequest>({
    usernameOrEmail: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = "Email hoặc tên đăng nhập là bắt buộc";
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await login(formData);
      showToast("Đăng nhập thành công!", "success");
      // Wait a bit for user state to update
      setTimeout(() => {
        // Redirect admin to users management page, others to home
        // User state will be updated by AuthContext after login
        router.push("/");
        router.refresh();
      }, 100);
    } catch (error) {
      const apiError = error as ApiError;
      showToast(
        apiError.message || "Đăng nhập thất bại. Vui lòng thử lại.",
        "error"
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-10 px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Image */}
            <div className="relative h-56 w-full lg:h-auto lg:min-h-[520px]">
              <Image
                src="/assets/images/Sign_in.png"
                alt="ShopVerse Đăng nhập"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Right Side - Login Form */}
            <div className="p-6 sm:p-8 space-y-8 flex flex-col justify-center">
              {/* Header with Icon and Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <HiArrowRight className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">
                    Đăng nhập
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Truy cập hệ thống quản trị ShopVerse
                  </p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email Input */}
                <div>
                  <Input
                    label=""
                    type="email"
                    name="usernameOrEmail"
                    value={formData.usernameOrEmail}
                    onChange={handleChange}
                    error={errors.usernameOrEmail}
                    required
                    leftIcon={<FaEnvelope className="w-5 h-5 text-white" />}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="email"
                    placeholder="Email"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <Input
                    label=""
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                    leftIcon={<FaLock className="w-5 h-5 text-white" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPassword(!showPassword);
                        }}
                        className="text-gray-400 hover:text-white transition-colors focus:outline-none"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <FaEyeSlash className="w-5 h-5" />
                        ) : (
                          <FaEye className="w-5 h-5" />
                        )}
                      </button>
                    }
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="current-password"
                    placeholder="Mật khẩu"
                  />
                </div>

                {/* Forgot Password */}
                <div className="text-left">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                {/* Login Button */}
                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    isLoading={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    {!isLoading && <span>Đăng nhập</span>}
                  </Button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">hoặc</span>
                </div>
              </div>

              {/* Google Login Button */}
              <div>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white rounded-lg px-4 py-3 font-medium transition-all duration-200"
                >
                  <FcGoogle className="w-5 h-5" />
                  <span>Đăng nhập bằng Google</span>
                </button>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Chưa có tài khoản?{" "}
                  <span className="text-blue-600 font-medium">
                    Liên hệ quản trị viên
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
