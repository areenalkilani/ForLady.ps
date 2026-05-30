export type ProductStatus = 'active' | 'draft' | 'hidden' | 'sold_out';
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  region: string;
  city: string;
  town: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  image: string;
  order: number;
  visible: boolean;
}

export interface ProductInventory {
  size: string;
  quantity: number;
  available: boolean;
}

export interface ProductColor {
  id?: string;
  name: string;
  hex: string;
  soldOut?: boolean;
  images: string[];
  videos?: string[];
  sizes?: ProductInventory[];
}

export interface EditableProductColor extends ProductColor {
  imageFiles?: File[];
  videoFiles?: File[];
}

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  category: string;
  categoryName?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  videos?: string[];
  colors: ProductColor[];
  sizes: ProductInventory[];
  sku: string;
  tags: string[];
  status: ProductStatus;
  featured?: boolean;
  bestseller?: boolean;
  createdAt: string;
}

export interface OrderProduct {
  productId: string;
  productName: string;
  productImage: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  region: string;
  city: string;
  village?: string;
  address: string;
  products: OrderProduct[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRegion {
  id: string;
  name: string;
  price: number;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  order: number;
  visible: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface StoreSettings {
  whatsappUrl: string;
  instagramUrl: string;
  facebookUrl: string;
}
