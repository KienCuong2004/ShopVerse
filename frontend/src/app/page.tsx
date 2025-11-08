"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        // Redirect admin to products management, others to products listing
        if (user?.role === UserRole.ADMIN) {
          router.push("/admin/products");
        } else {
          router.push("/products");
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}
