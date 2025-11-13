// Enums
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum CouponDiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
}

export enum CustomerSegment {
  ALL = "ALL",
  NEW_CUSTOMER = "NEW_CUSTOMER",
  RETURNING_CUSTOMER = "RETURNING_CUSTOMER",
  VIP_CUSTOMER = "VIP_CUSTOMER",
}

export type CouponStatus = "ACTIVE" | "UPCOMING" | "EXPIRED" | "INACTIVE";

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  address?: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  user: User;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  parentName?: string;
  displayOrder?: number;
  productCount?: number;
  totalProductCount?: number;
  subCategories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  parentName?: string;
  displayOrder?: number;
  productCount: number;
  totalProductCount: number;
  depth: number;
  createdAt: string;
  updatedAt: string;
  children: CategoryTreeNode[];
}

export interface CategoryImageOption {
  value: string;
  label: string;
  filename: string;
}

export interface CategoryPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  displayOrder: number;
  active: boolean;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BannerPayload {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  active: boolean;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountValue?: number;
  minimumOrderValue?: number;
  usageLimit?: number;
  perUserLimit?: number;
  usageCount: number;
  active: boolean;
  segment: CustomerSegment;
  status: CouponStatus;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CouponPayload {
  code: string;
  name: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountValue?: number;
  minimumOrderValue?: number;
  usageLimit?: number;
  perUserLimit?: number;
  active: boolean;
  segment: CustomerSegment;
  startAt?: string | null;
  endAt?: string | null;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  sku?: string;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
  imageUrls?: string[];
  status: ProductStatus;
  rating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  sku?: string;
  categoryId: string;
  imageUrl?: string;
  imageUrls?: string[];
  status?: ProductStatus;
}

// Cart Types
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  productPrice: number;
  discountPrice?: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  totalDiscount: number;
  finalAmount: number;
}

// Order Types
export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  productImageUrl?: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  username?: string;
  orderNumber: string;
  totalAmount: number;
  shippingAddress: string;
  shippingPhone: string;
  shippingName: string;
  status: OrderStatus;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  notes?: string;
  adminNotes?: string;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderRequest {
  shippingAddress: string;
  shippingPhone: string;
  shippingName: string;
  paymentMethod?: string;
  notes?: string;
  cartItemIds: string[];
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  adminNotes?: string;
}

export interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  shippingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  username?: string;
  productId: string;
  productName?: string;
  orderId?: string;
  rating: number;
  comment?: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequest {
  productId: string;
  orderId?: string;
  rating: number;
  comment?: string;
}

// API Response Types
export interface ApiError {
  message: string;
  status: number;
  timestamp?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
