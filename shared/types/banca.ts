import type { Product } from "./product";

export interface Banca {
  id: string;
  user_id: string;
  bio: string;
  city: string;
  payment_methods: string[];
  photo_url?: string | null;
  gallery?: string[];
  address?: string | null;
  pix_key?: string | null;
  products?: Product[];
}
