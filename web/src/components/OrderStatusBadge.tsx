import { Badge } from "./ui/Badge";

export function OrderStatusBadge({ status }: { status: "pending" | "confirmed" | "collected" | "cancelled" }) {
  return <Badge status={status} />;
}
