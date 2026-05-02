"use client";

import { useState } from "react";
import type { Banca } from "@/lib/types";
import { BancaCard } from "@/components/BancaCard";
import { CategoryChip, CATEGORIES } from "@/components/CategoryChip";

interface Props {
  bancas: Banca[];
}

export function BancaFilter({ bancas }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const filtered = active
    ? bancas.filter((b) => b.categories?.includes(active))
    : bancas;

  return (
    <>
      {/* Chips de categoria */}
      <div className="flex flex-wrap gap-2">
        <CategoryChip
          label="Todos"
          icon="🏪"
          active={active === null}
          onClick={() => setActive(null)}
        />
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.value}
            label={cat.label}
            icon={cat.icon}
            active={active === cat.value}
            onClick={() => setActive(active === cat.value ? null : cat.value)}
          />
        ))}
      </div>

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-textPrimary">
          {active ? CATEGORIES.find((c) => c.value === active)?.label : "Todas as Bancas"}
        </h2>
        <span className="text-sm text-textSecondary">
          {filtered.length} produtor{filtered.length !== 1 ? "es" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-5xl">🌱</span>
          <p className="text-textSecondary">
            {active ? "Nenhuma banca com essa categoria." : "Nenhuma banca encontrada ainda."}
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((banca) => (
            <BancaCard key={banca.id} banca={banca} />
          ))}
        </section>
      )}
    </>
  );
}
