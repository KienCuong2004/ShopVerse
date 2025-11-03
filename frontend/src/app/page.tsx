"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { Loading } from "@/components/ui";
import { FaTruck, FaLock, FaStar } from "react-icons/fa";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <MainLayout
      isAuthenticated={isAuthenticated}
      username={user?.username}
      cartItemCount={0}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Welcome to ShopVerse
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Your trusted online marketplace for quality products
              </p>
              {!isAuthenticated ? (
                <div className="flex justify-center gap-4">
                  <Link href="/register">
                    <Button variant="primary" size="lg">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-gray-100"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex justify-center gap-4">
                  <Link href="/products">
                    <Button variant="primary" size="lg">
                      Browse Products
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-gray-100"
                    >
                      View Cart
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Why Choose ShopVerse?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <div className="flex justify-center mb-4">
                  <FaTruck className="text-4xl text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">
                  Quick and reliable shipping to your doorstep
                </p>
              </Card>
              <Card className="text-center p-6">
                <div className="flex justify-center mb-4">
                  <FaLock className="text-4xl text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
                <p className="text-gray-600">
                  Your transactions are safe and secure
                </p>
              </Card>
              <Card className="text-center p-6">
                <div className="flex justify-center mb-4">
                  <FaStar className="text-4xl text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
                <p className="text-gray-600">
                  Only the best products from trusted sellers
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Ready to start shopping?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Explore our wide range of products and find what you need
            </p>
            <Link href={isAuthenticated ? "/products" : "/register"}>
              <Button variant="primary" size="lg">
                {isAuthenticated ? "Browse Products" : "Create Account"}
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
