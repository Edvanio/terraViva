"use client";

import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";
import { useAuthGuard } from "@/lib/useAuthGuard";
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
  const { ready } = useAuthGuard();
  const { data, error, isLoading, mutate } = useSWR<Reservation[]>(
    ready ? `${process.env.NEXT_PUBLIC_API_URL}/reservations` : null,
    fetcher,
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (!ready) return null;

  async function handleCancel(orderId: string) {
    if (!confirm("Cancelar este pedido?")) return;
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
    <section className="space-y-3 pb-4">
      <h1 className="text-2xl font-display font-bold text-primary">Meus Pedidos</h1>
      {(data || []).length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-5xl">🧺</span>
          <p className="font-medium text-textSecondary">Nenhum pedido ainda.</p>
          <p className="text-sm text-textSecondary">Explore os produtores e faça seu primeiro pedido!</p>
        </div>
      )}
      {(data || []).map((order) => (
        <article key={order.id} className="overflow-hidden rounded-2xl bg-white shadow-card">
          {/* Topo: foto + info */}
          <div className="flex gap-3 p-4">
            {/* Foto */}
            {order.product_photo_url ? (
              <Image
                src={order.product_photo_url}
                alt={order.product_name}
                width={88}
                height={88}
                unoptimized
                className="h-[88px] w-[88px] flex-shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-[88px] w-[88px] flex-shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-4xl">
                {getCategoryIcon(order.product_category)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Status */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-textPrimary leading-tight truncate">{order.product_name}</h3>
                <OrderStatusBadge status={order.status} />
              </div>

              {order.product_description && (
                <p className="mt-0.5 line-clamp-1 text-sm text-textSecondary">{order.product_description}</p>
              )}

              {/* Preço destaque */}
              <p className="mt-2 text-xl font-bold text-primary">
                R$ {order.total_price.toFixed(2)}
                <span className="ml-1.5 text-sm font-normal text-textSecondary">{order.quantity}x</span>
              </p>

              {/* Produtor */}
              <div className="mt-1.5 flex items-center gap-1.5">
                {order.producer_photo_url ? (
                  <Image
                    src={order.producer_photo_url}
                    alt={order.producer_name || "Produtor"}
                    width={18}
                    height={18}
                    unoptimized
                    className="h-[18px] w-[18px] rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary">
                    {(order.producer_name || "P")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-textSecondary">{order.producer_name || "Produtor"}</span>
              </div>
            </div>
          </div>

          {/* Rodapé de ações */}
          {(order.producer_phone || order.status === "pending") && (
            <div className="border-t border-border px-4 py-3 flex items-center gap-3">
              {order.producer_phone && (
                <a
                  href={(() => {
                    const pickup = { feira: "\u{1F3EA} Na feira", produtor: "\u{1F3E1} Buscar no produtor", entrega: "\u{1F697} Entrega em casa" }[order.pickup_location] ?? order.pickup_location;
                    const payment = { cash: "\u{1F4B5} Dinheiro", pix: "\u{1F4F2} Pix", card: "\u{1F4B3} Cart\u00e3o" }[order.payment_intent] ?? order.payment_intent;
                    const msg = [
                      `Ol\u00e1! \u{1F44B}`,
                      ``,
                      `Sou cliente do *Terra Viva* e fiz um pedido pelo app:`,
                      ``,
                      `\u{1F6D2} *${order.product_name}*`,
                      `\u{1F4E6} Quantidade: ${order.quantity}x`,
                      `\u{1F4B0} Total: *R$ ${order.total_price.toFixed(2).replace(".", ",")}*`,
                      `\u{1F4CD} Retirada: ${pickup}`,
                      `${payment}`,
                      ``,
                      `Gostaria de confirmar os detalhes. Obrigado! \u{1F33F}`,
                    ].join("\n");
                    return `https://wa.me/55${order.producer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 active:scale-[0.98] transition-all"
                >
                  💬 Falar no WhatsApp
                </a>
              )}
              {order.status === "pending" && (
                <button
                  onClick={() => handleCancel(order.id)}
                  disabled={cancellingId === order.id}
                  className="text-sm text-red-500 font-medium hover:text-red-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {cancellingId === order.id ? "Cancelando…" : "Cancelar"}
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
