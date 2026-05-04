import Image from "next/image";
import { notFound } from "next/navigation";
import type { Banca, Review } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ShareButton } from "@/components/ShareButton";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function BancaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [banca, reviews] = await Promise.all([
    apiGet<Banca>(`/bancas/${id}`).catch(() => null),
    apiGet<Review[]>(`/reviews/banca/${id}`).catch(() => [] as Review[]),
  ]);
  if (!banca) return notFound();
  const displayName = banca.name || banca.city || "Banca";
  const initial = displayName.charAt(0).toUpperCase();

  const ratingCount = reviews.length;
  const ratingAvg = ratingCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount
    : null;

  return (
    <div className="space-y-6">
      {/* Perfil do Produtor */}
      <section className="overflow-hidden rounded-3xl bg-surface shadow-card">
        {/* Cover */}
        <div className="relative h-40">
          {banca.cover_url ? (
            <Image
              src={banca.cover_url}
              alt="Capa"
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#2d6b4f] via-[#3a7d5c] to-[#8fbc8f]">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.3),transparent_50%),radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_50%)]" />
            </div>
          )}
          {/* Overlay verde suave */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Share button - canto superior direito */}
          {banca.short_code && (
            <div className="absolute top-3 right-3 z-10">
              <ShareButton
                name={displayName}
                shortCode={banca.short_code}
                className="bg-white/90 border-white/50 shadow-md backdrop-blur-sm"
                storyData={{
                  city: banca.city,
                  bio: banca.bio,
                  photoUrl: banca.photo_url,
                  colorPrimary: (banca as { color_primary?: string | null }).color_primary,
                  products: (banca.products || [])
                    .filter((p) => p.is_active)
                    .slice(0, 6)
                    .map((p) => ({ name: p.name, price: p.price, photoUrl: p.photo_url })),
                }}
              />
            </div>
          )}
          <div className="absolute bottom-0 left-6 translate-y-1/2">
            {banca.photo_url ? (
              <Image
                src={banca.photo_url}
                alt={displayName}
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
              <h1 className="font-display text-2xl font-bold text-textPrimary">{displayName}</h1>
              {banca.city && (
                <p className="mt-0.5 text-sm text-textSecondary">📍 {banca.city}</p>
              )}
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-2">
              {ratingAvg !== null && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-light px-3 py-1.5">
                  <span className="text-amber text-base">&#9733;</span>
                  <span className="font-bold text-textPrimary text-sm">{ratingAvg.toFixed(1)}</span>
                  <span className="text-xs text-textSecondary">({ratingCount})</span>
                </div>
              )}
            </div>
          </div>

          {/* Badges / Selos */}
          {banca.badges && banca.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {banca.badges.map((badge: string) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-xs font-bold text-primary"
                >
                  {badge === "organico" && "🌿 Orgânico"}
                  {badge === "agroecologico" && "🌎 Agroecológico"}
                  {badge === "familiar" && "👨‍👩‍👧 Agricultura Familiar"}
                  {badge === "sem_agrotoxicos" && "🚫 Sem Agrotóxicos"}
                  {badge === "artesanal" && "🧶 Artesanal"}
                  {badge === "colonial" && "🏡 Colonial"}
                </span>
              ))}
            </div>
          )}

          {/* Pagamentos */}
          {banca.payment_methods?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm font-semibold text-textSecondary">Aceita:</span>
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

      {/* Nossa História — destaque */}
      {banca.bio && (
        <section className="rounded-2xl border border-primary/10 bg-primary-subtle/30 p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-bold text-textPrimary">
            <span>📖</span> Nossa História
          </h2>
          <p className="mt-2 text-base leading-relaxed text-textSecondary whitespace-pre-line">{banca.bio}</p>
        </section>
      )}

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

      {/* Avaliações reais */}
      {reviews.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-textPrimary">
            <span>⭐</span> Avaliações ({ratingCount})
          </h2>
          <div className="space-y-3">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="rounded-2xl bg-surface px-4 py-3 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-textPrimary">{review.consumer_name || "Consumidor"}</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < review.rating ? "text-amber" : "text-gray-300"}>★</span>
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-1.5 text-sm text-textSecondary leading-relaxed">{review.comment}</p>
                )}
                <p className="mt-1 text-xs text-textSecondary/60">
                  {new Date(review.created_at).toLocaleDateString("pt-BR")}
                </p>
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
        <span className="rounded-full bg-primary-subtle px-3 py-1 text-sm font-bold text-primary">
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
            <ProductCard key={product.id} product={product} bancaId={banca.id} hasFair={Boolean(banca.fair_location)} />
          ))}
        </section>
      )}
    </div>
  );
}
