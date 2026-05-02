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
      className="group block overflow-hidden rounded-2xl bg-surface shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02]"
    >
      {/* Cover */}
      <div className="relative h-28 bg-gradient-to-br from-primary to-primary-dark overflow-hidden">
        {banca.cover_url && (
          <Image
            src={banca.cover_url}
            alt="Capa"
            fill
            unoptimized
            className="object-cover"
          />
        )}
        {/* Blob decorativo */}
        <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          {hasPhoto ? (
            <Image
              src={banca.photo_url!}
              alt={banca.city}
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 rounded-full border-4 border-surface object-cover shadow-md"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-surface bg-gradient-to-br from-primary-medium to-primary-dark text-xl font-bold text-white shadow-md">
              {initial}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 pt-10">
        <h3 className="truncate text-base font-bold text-textPrimary group-hover:text-primary transition-colors">
          {banca.city}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-textSecondary">
          {banca.bio || "Produtos frescos da colônia"}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-textSecondary">
            <span className="text-amber">&#9733;</span>
            <span className="font-semibold text-textPrimary">4.9</span>
            <span>· {productCount} produto{productCount !== 1 ? "s" : ""}</span>
          </div>
          {banca.payment_methods?.length > 0 && (
            <span className="rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-medium text-primary">
              {banca.payment_methods[0]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
