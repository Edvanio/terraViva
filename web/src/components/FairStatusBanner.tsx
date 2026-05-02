import type { FairConfig } from "@/lib/types";

export function FairStatusBanner({ fairConfig }: { fairConfig?: FairConfig | null }) {
  if (!fairConfig) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-4">
        <span className="text-xl">📅</span>
        <p className="text-sm text-textSecondary">Nenhuma agenda configurada para esta cidade.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-md">
      {/* Blobs decorativos */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-6 right-14 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between gap-4">
        {/* Status */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-300" />
            <span className="text-sm font-semibold">Aceitando pedidos</span>
          </div>
          <p className="mt-1 text-xs text-white/65">
            Pedidos até {fairConfig.order_window_close}
          </p>
        </div>

        {/* Data / horário / local */}
        <div className="text-right">
          <p className="text-sm font-bold capitalize">{fairConfig.fair_day}</p>
          <p className="text-xs text-white/70">
            {fairConfig.fair_start_time}–{fairConfig.fair_end_time}
          </p>
          <p className="mt-0.5 text-xs text-white/60">📍 {fairConfig.fair_location}</p>
        </div>
      </div>
    </div>
  );
}
