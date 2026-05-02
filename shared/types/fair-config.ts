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
