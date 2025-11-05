"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        router.push("/products");
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}
