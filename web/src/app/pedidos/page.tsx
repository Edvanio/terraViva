"use client";

import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";
import type { Reservation } from "@/lib/types";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getCategoryIcon } from "@/components/CategoryChip";

const fetcher = async (url: string): Promise<Reservation[]> => {
  const token = localStorage.getItem("terra_viva_token");
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Falha ao carregar pedidos");
  }
  return response.json();
};

export default function PedidosPage() {
  const { data, error, isLoading, mutate } = useSWR<Reservation[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/reservations`,
    fetcher,
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCancel(orderId: string) {
    if (!confirm("Cancelar esta reserva?")) return;
    setCancellingId(orderId);
    try {
      const token = localStorage.getItem("terra_viva_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reservations/${orderId}/cancel`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error();
      await mutate();
    } catch {
      alert("Não foi possível cancelar. Tente novamente.");
    } finally {
      setCancellingId(null);
    }
  }

  if (isLoading) return <p>Carregando pedidos...</p>;
  if (error) return <p>Erro ao carregar pedidos.</p>;

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold text-primary">Meus Pedidos</h1>
      {(data || []).map((order) => (
        <article key={order.id} className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            {/* Foto do produto */}
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
              <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-xl bg-background text-3xl">
                {getCategoryIcon(order.product_category)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Título + status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-textPrimary truncate">{order.product_name}</h3>
                  {order.product_description && (
                    <p className="line-clamp-1 text-xs text-textSecondary">{order.product_description}</p>
                  )}
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              {/* Qtd e valor */}
              <p className="mt-1 text-sm font-medium text-textPrimary">
                {order.quantity}x · R$ {order.total_price.toFixed(2)}
              </p>

              {/* Produtor */}
              <div className="mt-1.5 flex items-center gap-1.5">
                {order.producer_photo_url ? (
                  <Image
                    src={order.producer_photo_url}
                    alt={order.producer_name || "Produtor"}
                    width={20}
                    height={20}
                    unoptimized
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                    {(order.producer_name || "P")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-textSecondary">
                  {order.producer_name || "Produtor"}
                </span>
              </div>

              {/* Cancelar (só pending) */}
              {order.status === "pending" && (
                <button
                  onClick={() => handleCancel(order.id)}
                  disabled={cancellingId === order.id}
                  className="mt-2 text-xs text-red-500 underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
                >
                  {cancellingId === order.id ? "Cancelando…" : "Cancelar reserva"}
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
