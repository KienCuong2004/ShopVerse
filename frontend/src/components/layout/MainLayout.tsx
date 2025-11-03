"use client";

import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { ToastProvider } from "@/components/ui";

interface MainLayoutProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
  username?: string;
  cartItemCount?: number;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isAuthenticated = false,
  username,
  cartItemCount = 0,
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        isAuthenticated={isAuthenticated}
        username={username}
        cartItemCount={cartItemCount}
      />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
