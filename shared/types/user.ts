export type UserRole = "consumer" | "producer" | "admin";

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  name?: string | null;
  created_at?: string;
}
