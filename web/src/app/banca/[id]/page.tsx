import Image from "next/image";
import type { Banca } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { apiGet } from "@/lib/api";

export default async function BancaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const banca = await apiGet<Banca>(`/bancas/${id}`);
  const initial = banca.city?.charAt(0).toUpperCase() ?? "B";

  return (
    <div className="space-y-6">
      {/* Perfil do Produtor */}
      <section className="overflow-hidden rounded-2xl bg-surface shadow-card">
        {/* Cover */}
        <div className="relative h-36 bg-gradient-to-br from-primary to-primary-light">
          {banca.cover_url && (
            <Image
              src={banca.cover_url}
              alt="Capa"
              fill
              unoptimized
              className="object-cover"
            />
          )}
          <div className="absolute bottom-0 left-6 translate-y-1/2">
            {banca.photo_url ? (
              <Image
                src={banca.photo_url}
                alt={banca.city}
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-full border-4 border-surface object-cover shadow-card"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-surface bg-primary-medium text-3xl font-bold text-white shadow-card">
                {initial}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pb-6 pt-14">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-textPrimary">{banca.city}</h1>
              <p className="mt-1 text-sm text-textSecondary">{banca.bio || "Produtos frescos da colônia"}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 text-sm">
              <span className="text-amber text-lg">&#9733;</span>
              <span className="font-bold text-textPrimary">4.9</span>
              <span className="text-textSecondary">(127)</span>
            </div>
          </div>

          {/* Pagamentos */}
          {banca.payment_methods?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-medium text-textSecondary">Aceita:</span>
              {banca.payment_methods.map((method: string) => (
                <span
                  key={method}
                  className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary"
                >
                  {method}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Produtos */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-textPrimary">Produtos da Banca</h2>
        <span className="text-sm text-textSecondary">{(banca.products || []).length} iten{(banca.products || []).length !== 1 ? "s" : ""}</span>
      </div>

      {(banca.products || []).length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-5xl">📦</span>
          <p className="text-textSecondary">Nenhum produto cadastrado ainda.</p>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {(banca.products || []).map((product) => (
            <ProductCard key={product.id} product={product} bancaId={banca.id} />
          ))}
        </section>
      )}
    </div>
  );
}
