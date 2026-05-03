import type { Product } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { getCategoryIcon } from "./CategoryChip";
import { hexToRgba } from "@/lib/format";

export function ProductCard({ product, bancaId, hasFair }: { product: Product; bancaId: string; hasFair?: boolean }) {
  const hasPhoto = Boolean(product.photo_url && product.photo_url.trim());

  const cp = product.color_primary;
  const ca = product.color_accent;

  const cardStyle = cp
    ? { borderColor: hexToRgba(cp, 0.25) }
    : undefined;

  // Linha colorida no topo do card
  const topBarStyle = cp
    ? { background: cp }
    : undefined;

  const categoryStyle = ca
    ? { backgroundColor: hexToRgba(ca, 0.12), color: ca }
    : undefined;

  // CTA button usa color_primary ou fallback para a classe padrão
  const ctaBg = cp
    ? { backgroundColor: cp, color: "#fff" }
    : undefined;

  // Preço usa color_accent suave como fundo
  const priceStyle = ca
    ? { backgroundColor: hexToRgba(ca, 0.12), color: ca }
    : undefined;

  return (
    <Link
      href={`/banca/${bancaId}/reservar?productId=${product.id}&name=${encodeURIComponent(product.name)}&price=${product.price}${product.unit ? `&unit=${product.unit}` : ""}${hasFair ? "&hasFair=1" : ""}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
      style={cardStyle}
    >
      {/* Linha de cor no topo */}
      {topBarStyle && <span className="block h-1 w-full" style={topBarStyle} />}
      {/* Imagem grande em cima */}
      <div className="relative h-40 w-full overflow-hidden bg-earth-subtle">
        {hasPhoto ? (
          <Image
            src={product.photo_url!}
            alt={product.name}
            fill
            unoptimized
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-subtle text-5xl">
            {getCategoryIcon(product.category)}
          </div>
        )}
        {/* Badge de categoria sobre a imagem */}
        {product.category && (
          <span
            className="absolute left-3 top-3 inline-flex rounded-full bg-surface/90 px-2.5 py-1 text-xs font-bold backdrop-blur-sm"
            style={categoryStyle}
          >
            {getCategoryIcon(product.category)} {product.category}
          </span>
        )}
      </div>

      {/* Info embaixo */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-bold leading-tight text-textPrimary">{product.name}</h4>
            <strong
              className="flex-shrink-0 rounded-lg px-2 py-0.5 text-lg font-extrabold"
              style={priceStyle ?? { backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}
            >
              R$ {product.price.toFixed(2)}{product.unit && <span className="text-xs font-semibold opacity-70">/{product.unit}</span>}
            </strong>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-textSecondary">
            {product.description || "Produto fresquinho, direto da terra"}
          </p>
        </div>
        <div className="mt-4">
          <span
              className="flex w-full items-center justify-center rounded-xl py-3 text-base font-bold text-white transition-opacity group-hover:opacity-90"
              style={ctaBg ?? { backgroundColor: "var(--color-primary)" }}
            >
              🛒 Quero esse!
            </span>
        </div>
      </div>
    </Link>
  );
}
