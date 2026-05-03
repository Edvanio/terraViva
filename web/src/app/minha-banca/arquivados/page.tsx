"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { getCategoryIcon } from "@/components/CategoryChip";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { handleApiError } from "@/lib/clearSession";

interface Order {
  id: string;
  product_name: string;
  product_photo_url?: string | null;
  product_category?: string | null;
  consumer_name?: string | null;
  consumer_phone?: string | null;
  quantity: number;
  total_price: number;
  status: "pending" | "confirmed" | "collected" | "cancelled";
  updated_at: string;
}

const ARCHIVE_HOURS = 24;
function isArchived(order: Order): boolean {
  if (order.status !== "collected" && order.status !== "cancelled") return false;
  const updated = new Date(order.updated_at).getTime();
  return Date.now() - updated > ARCHIVE_HOURS * 60 * 60 * 1000;
}

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

export default function MinhaBancaArquivadosPage() {
  const { ready } = useAuthGuard();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    const token = localStorage.getItem("terra_viva_token");
    fetch(`${base}/reservations/producer`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        handleApiError(r);
        return r.json();
      })
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return null;
  if (loading) return <p className="p-4">Carregando...</p>;

  const archived = orders.filter((o) => isArchived(o));

  return (
    <section className="space-y-3 pb-4">
      <div className="flex items-center gap-3">
        <Link href="/minha-banca" className="text-primary font-bold text-lg">← Voltar</Link>
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
                <Badge status={order.status} />
              </div>
              <p className="mt-1 text-lg font-bold text-primary">
                R$ {order.total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                <span className="ml-1.5 text-sm font-normal text-textSecondary">{order.quantity}x</span>
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-textSecondary">
                {order.consumer_name && <span>🧑‍🌾 {order.consumer_name}</span>}
                <span>{new Date(order.updated_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>

          {order.consumer_phone && (
            <div className="border-t border-border px-4 py-2">
              <a
                href={`https://wa.me/55${order.consumer_phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-2.5 text-sm font-bold text-green-700 hover:bg-green-100 active:scale-[0.98] transition-all"
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
