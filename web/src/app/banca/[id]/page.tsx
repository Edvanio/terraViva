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
      <section className="overflow-hidden rounded-3xl bg-surface shadow-card">
        {/* Cover */}
        <div className="relative h-40 bg-gradient-to-br from-primary to-primary-medium">
          {banca.cover_url && (
            <Image
              src={banca.cover_url}
              alt="Capa"
              fill
              unoptimized
              className="object-cover"
            />
          )}
          {/* Overlay verde suave */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-0 left-6 translate-y-1/2">
            {banca.photo_url ? (
              <Image
                src={banca.photo_url}
                alt={banca.city}
                width={88}
                height={88}
                unoptimized
                className="h-22 w-22 rounded-full border-4 border-surface object-cover shadow-card"
              />
            ) : (
              <div className="flex h-22 w-22 items-center justify-center rounded-full border-4 border-surface bg-gradient-to-br from-primary to-primary-dark text-3xl font-bold text-white shadow-card">
                {initial}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pb-6 pt-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-textPrimary">{banca.city}</h1>
              <p className="mt-1 text-sm text-textSecondary leading-relaxed">{banca.bio || "Produtos frescos direto da nossa terra pra você 🌱"}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-amber-light px-3 py-1.5">
              <span className="text-amber text-base">&#9733;</span>
              <span className="font-bold text-textPrimary text-sm">4.9</span>
            </div>
          </div>

          {/* Pagamentos */}
          {banca.payment_methods?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-textSecondary">Aceita:</span>
              {banca.payment_methods.map((method: string) => (
                <span
                  key={method}
                  className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-bold text-primary"
                >
                  {method === "cash" ? "💵 Dinheiro" : method === "pix" ? "📲 Pix" : method === "card" ? "💳 Cartão" : method}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Galeria da Propriedade */}
      {banca.gallery && banca.gallery.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-textPrimary">
            <span>📸</span> Nossa propriedade
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {banca.gallery.map((url: string, i: number) => (
              <div key={i} className="relative h-32 w-44 flex-shrink-0 overflow-hidden rounded-2xl shadow-card">
                <Image
                  src={url}
                  alt={`Foto ${i + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Produtos */}
      <div className="flex items-baseline justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-textPrimary">
          <span>🌿</span> Produtos disponíveis
        </h2>
        <span className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-bold text-primary">
          {(banca.products || []).length} iten{(banca.products || []).length !== 1 ? "s" : ""}
        </span>
      </div>

      {(banca.products || []).length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-5xl">🌱</span>
          <p className="text-lg font-medium text-textSecondary">Nenhum produto cadastrado ainda.</p>
          <p className="text-sm text-textSecondary">Em breve teremos novidades fresquinhas!</p>
        </div>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2">
          {(banca.products || []).map((product) => (
            <ProductCard key={product.id} product={product} bancaId={banca.id} />
          ))}
        </section>
      )}
    </div>
  );
}
