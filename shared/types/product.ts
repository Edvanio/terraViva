export interface Product {
  id: string;
  producer_id: string;
  name: string;
  price: number;
  description?: string | null;
  photo_url?: string | null;
  category?: string | null;
  color_primary?: string | null;
  color_accent?: string | null;
  is_active: boolean;
}
