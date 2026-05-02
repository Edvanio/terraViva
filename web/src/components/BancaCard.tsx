import Image from "next/image";
import Link from "next/link";
import type { Banca } from "@/lib/types";

export function BancaCard({ banca }: { banca: Banca }) {
  const initial = banca.city?.charAt(0).toUpperCase() ?? "B";
  const productCount = banca.products?.length ?? 0;
  const hasPhoto = !!banca.photo_url;

  return (
    <Link
      href={`/banca/${banca.id}`}
      className="group block overflow-hidden rounded-3xl bg-surface shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.01] border border-border"
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-primary to-primary-medium overflow-hidden">
        {banca.cover_url && (
          <Image
            src={banca.cover_url}
            alt="Capa"
            fill
            unoptimized
            className="object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          {hasPhoto ? (
            <Image
              src={banca.photo_url!}
              alt={banca.city}
              width={60}
              height={60}
              unoptimized
              className="h-15 w-15 rounded-full border-4 border-surface object-cover shadow-md"
            />
          ) : (
            <div className="flex h-15 w-15 items-center justify-center rounded-full border-4 border-surface bg-gradient-to-br from-primary to-primary-dark text-xl font-bold text-white shadow-md">
              {initial}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-5 pt-11">
        <h3 className="truncate font-display text-lg font-bold text-textPrimary group-hover:text-primary transition-colors">
          {banca.city}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-textSecondary leading-relaxed">
          {banca.bio || "Produtos frescos direto da terra 🌱"}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-textSecondary">
            <span className="text-amber">&#9733;</span>
            <span className="font-bold text-textPrimary">4.9</span>
            <span>· {productCount} produto{productCount !== 1 ? "s" : ""}</span>
          </div>
          {banca.payment_methods?.length > 0 && (
            <span className="rounded-full bg-earth-subtle px-2.5 py-0.5 text-xs font-bold text-earth">
              {banca.payment_methods[0] === "cash" ? "💵" : banca.payment_methods[0] === "pix" ? "📲" : "💳"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
