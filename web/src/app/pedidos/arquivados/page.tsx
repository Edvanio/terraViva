"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { clearSession } from "@/lib/clearSession";
import type { Reservation } from "@/lib/types";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getCategoryIcon } from "@/components/CategoryChip";

const ARCHIVE_HOURS = 24;

function isArchived(order: Reservation): boolean {
  if (order.status !== "collected" && order.status !== "cancelled") return false;
  const updated = new Date(order.updated_at).getTime();
  return Date.now() - updated > ARCHIVE_HOURS * 60 * 60 * 1000;
}

const fetcher = async (url: string): Promise<Reservation[]> => {
  const token = localStorage.getItem("terra_viva_token");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    clearSession();
    throw new Error("Sessão expirada");
  }
  if (!response.ok) throw new Error("Falha ao carregar pedidos");
  return response.json();
};

export default function PedidosArquivadosPage() {
  const { ready } = useAuthGuard();
  const { data, isLoading, error } = useSWR<Reservation[]>(
    ready ? `${process.env.NEXT_PUBLIC_API_URL}/reservations` : null,
    fetcher,
  );

  if (!ready) return null;
  if (isLoading) return <p className="p-4">Carregando...</p>;
  if (error) return <p className="p-4">Erro ao carregar.</p>;

  const archived = (data || []).filter((o) => isArchived(o));

  return (
    <section className="space-y-3 pb-4">
      <div className="flex items-center gap-3">
        <Link href="/pedidos" className="text-primary font-bold text-lg">← Voltar</Link>
        <h1 className="text-xl font-display font-bold text-textPrimary">Pedidos Arquivados</h1>
      </div>

      {archived.length === 0 && (
        <p className="text-center text-textSecondary py-12">Nenhum pedido arquivado.</p>
      )}

      {archived.map((order) => (
        <article key={order.id} className="overflow-hidden rounded-2xl bg-white shadow-card opacity-75">
          <div className="flex gap-3 p-4">
            {order.product_photo_url ? (
              <Image
                src={order.product_photo_url}
                alt={order.product_name}
                width={72}
                height={72}
                unoptimized
                className="h-[72px] w-[72px] flex-shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-3xl">
                {getCategoryIcon(order.product_category)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-textPrimary leading-tight truncate">{order.product_name}</h3>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-lg font-bold text-primary">
                R$ {order.total_price.toFixed(2)}
                <span className="ml-1.5 text-sm font-normal text-textSecondary">{order.quantity}x</span>
              </p>
              <p className="mt-1 text-xs text-textSecondary">
                {new Date(order.updated_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {order.producer_phone && (
            <div className="border-t border-border px-4 py-2">
              <a
                href={`https://wa.me/55${order.producer_phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 active:scale-[0.98] transition-all"
              >
                💬 Falar no WhatsApp
              </a>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
