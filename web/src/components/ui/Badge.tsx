interface Props {
  status: "pending" | "confirmed" | "collected" | "cancelled";
}

const MAP: Record<string, { cls: string; label: string }> = {
  pending:   { cls: "bg-yellow-100 text-yellow-800", label: "Aguardando" },
  confirmed: { cls: "bg-emerald-100 text-emerald-800", label: "Confirmado" },
  collected: { cls: "bg-green-100 text-green-900",   label: "Retirado" },
  cancelled: { cls: "bg-red-100 text-red-800",       label: "Cancelado" },
};

export function Badge({ status }: Props) {
  const { cls, label } = MAP[status] ?? { cls: "bg-gray-100 text-gray-700", label: status };
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}
