export type ReservationStatus = "pending" | "confirmed" | "collected" | "cancelled";

export interface Reservation {
  id: string;
  consumer_id: string;
  producer_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  pickup_location: "feira" | "produtor";
  payment_intent: "cash" | "pix" | "card";
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}
