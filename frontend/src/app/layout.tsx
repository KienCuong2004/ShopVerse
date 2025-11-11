import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: "ShopVerse - E-commerce Platform",
  description: "Your trusted online marketplace for quality products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
