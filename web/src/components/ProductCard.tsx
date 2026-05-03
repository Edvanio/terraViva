import type { Product } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { getCategoryIcon } from "./CategoryChip";
import { hexToRgba } from "@/lib/format";

export function ProductCard({ product, bancaId }: { product: Product; bancaId: string }) {
  const hasPhoto = Boolean(product.photo_url && product.photo_url.trim());

  const cardStyle = product.color_primary
    ? {
        borderColor: hexToRgba(product.color_primary, 0.3),
      }
    : undefined;

  const categoryStyle = product.color_accent
    ? {
        backgroundColor: hexToRgba(product.color_accent, 0.12),
        color: product.color_accent,
      }
    : undefined;

  return (
    <Link
      href={`/banca/${bancaId}/reservar?productId=${product.id}&name=${encodeURIComponent(product.name)}&price=${product.price}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
      style={cardStyle}
    >
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
            <strong className="flex-shrink-0 rounded-lg bg-primary-subtle px-2 py-0.5 text-lg font-extrabold text-primary">
              R$ {product.price.toFixed(2)}
            </strong>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-textSecondary">
            {product.description || "Produto fresquinho, direto da terra"}
          </p>
        </div>
        <div className="mt-4">
          <span className="flex w-full items-center justify-center rounded-xl bg-primary py-2 text-sm font-bold text-white group-hover:bg-primary-dark transition-colors">
            🌿 Pedir
          </span>
        </div>
      </div>
    </Link>
  );
}
