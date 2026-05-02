import type { Product } from "@/lib/types";
import Link from "next/link";
import { Button } from "./ui/Button";

export function ProductCard({ product, bancaId }: { product: Product; bancaId: string }) {
  return (
    <article className="flex gap-4 rounded-xl bg-surface p-4 shadow-card transition hover:shadow-card-hover">
      {/* Thumb */}
      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-3xl">
        🧀
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-textPrimary leading-snug">{product.name}</h4>
            <strong className="flex-shrink-0 text-base font-bold text-primary">
              R$ {product.price.toFixed(2)}
            </strong>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-textSecondary">
            {product.description || "Produto fresco da semana"}
          </p>
        </div>
        <div className="mt-3">
          <Link href={`/banca/${bancaId}/reservar?productId=${product.id}&name=${encodeURIComponent(product.name)}&price=${product.price}`}>
            <Button size="sm" className="w-full">
              Reservar
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
