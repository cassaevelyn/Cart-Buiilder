export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_seller: boolean;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  order: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image?: string;
  images: ProductImage[];
  store_name: string;
  seller_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  primary_image?: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  total_price: string;
  added_at: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_amount: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price_at_time: string;
  total_price: string;
  seller_name: string;
}

export interface Order {
  id: number;
  buyer: number;
  buyer_name: string;
  total_amount: string;
  status: string;
  shipping_address: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}