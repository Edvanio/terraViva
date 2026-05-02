import type { Banca } from "@/lib/types";
import { BancaFilter } from "@/components/BancaFilter";
import { apiGet } from "@/lib/api";

export default async function BancasPage() {
  const bancas = await apiGet<Banca[]>("/bancas").catch(() => []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-textPrimary">Nossos Produtores</h1>
        <p className="mt-1 text-sm text-textSecondary">Escolha um produtor e peça o que precisar</p>
      </div>

      <BancaFilter bancas={bancas} />
    </div>
  );
}
