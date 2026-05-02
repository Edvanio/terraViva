export interface Product {
  id: string;
  producer_id: string;
  name: string;
  price: number;
  description?: string | null;
  photo_url?: string | null;
  category?: string | null;
  is_active: boolean;
}

export interface Banca {
  id: string;
  user_id: string;
  bio: string;
  city: string;
  payment_methods: string[];
  photo_url?: string | null;
  cover_url?: string | null;
  categories?: string[];
  gallery?: string[];
  address?: string | null;
  pix_key?: string | null;
  products?: Product[];
}

export interface FairConfig {
  id: string;
  name: string;
  city: string;
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  fair_day: string;
  fair_start_time: string;
  fair_end_time: string;
  fair_location: string;
  order_window_open: string;
  order_window_close: string;
  active: boolean;
}

export interface Reservation {
  id: string;
  consumer_id: string;
  producer_id: string;
  product_id: string;
  product_name: string;
  product_photo_url?: string | null;
  product_description?: string | null;
  product_category?: string | null;
  consumer_name?: string | null;
  consumer_phone?: string | null;
  producer_name?: string | null;
  producer_photo_url?: string | null;
  quantity: number;
  total_price: number;
  pickup_location: "feira" | "produtor";
  payment_intent: "cash" | "pix" | "card";
  status: "pending" | "confirmed" | "collected" | "cancelled";
  created_at: string;
  updated_at: string;
}
