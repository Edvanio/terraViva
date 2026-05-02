import type { Banca, FairConfig } from "@/lib/types";
import { BancaCard } from "@/components/BancaCard";
import { HomeActions } from "@/components/HomeActions";
import { BancaFilter } from "@/components/BancaFilter";
import { apiGet } from "@/lib/api";

export default async function HomePage() {
  const [bancas, fairConfig] = await Promise.all([
    apiGet<Banca[]>("/bancas").catch(() => []),
    apiGet<FairConfig>("/fair-config?city=Sao%20Ludgero").catch(() => null),
  ]);

  return (
    <div className="space-y-6">

      {/* CTAs principais + listas (componente client) */}
      <HomeActions />

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-textSecondary uppercase tracking-wider">Bancas da feira</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Filtros + lista de bancas */}
      <BancaFilter bancas={bancas} />
    </div>
  );
}
