"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  if (response.status === 401) { clearSession(); throw new Error("Sessão expirada"); }
  if (!response.ok) throw new Error("Falha ao carregar pedidos");
  return response.json();
};

interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  reservation_id: string | null;
}

const notifFetcher = async (url: string): Promise<AppNotification[]> => {
  const token = localStorage.getItem("terra_viva_token");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  return res.json();
};

export default function PedidosPage() {
  const { ready } = useAuthGuard();
  const { data, error, isLoading, mutate } = useSWR<Reservation[]>(
    ready ? `${process.env.NEXT_PUBLIC_API_URL}/reservations` : null,
    fetcher,
  );
  const { data: notifications, mutate: mutateNotifs } = useSWR<AppNotification[]>(
    ready ? `${process.env.NEXT_PUBLIC_API_URL}/notifications` : null,
    notifFetcher,
    { refreshInterval: 30_000 },
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [dismissedNotifs, setDismissedNotifs] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  // Marca notificações como lidas ao entrar na página
  useEffect(() => {
    if (!ready || !notifications?.length) return;
    const token = localStorage.getItem("terra_viva_token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => mutateNotifs([], false));
  }, [ready, notifications?.length]);

  if (!ready) return null;

  async function handleCancel(orderId: string) {
    if (!confirm("Cancelar este pedido?")) return;
    setCancellingId(orderId);
    try {
      const token = localStorage.getItem("terra_viva_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reservations/${orderId}/cancel`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error();
      await mutate();
    } catch {
      alert("Não foi possível cancelar. Tente novamente.");
    } finally {
      setCancellingId(null);
    }
  }

  const activeOrders = (data || []).filter((o) => !isArchived(o));
  const hasArchived = (data || []).some((o) => isArchived(o));
  const pendingNotifs = !dismissedNotifs && notifications && notifications.length > 0 ? notifications : [];

  async function handleSubmitReview(order: Reservation) {
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("terra_viva_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: order.id, rating: reviewRating, comment: reviewComment }),
      });
      if (!res.ok) throw new Error();
      setReviewedIds((prev) => new Set(prev).add(order.id));
      setReviewingId(null);
      setReviewComment("");
      setReviewRating(5);
    } catch {
      alert("Não foi possível enviar a avaliação. Tente novamente.");
    } finally {
      setSubmittingReview(false);
    }
  }

  if (isLoading) return <p>Carregando pedidos...</p>;
  if (error) return <p>Erro ao carregar pedidos.</p>;

  return (
    <section className="space-y-3 pb-4">
      <h1 className="text-2xl font-display font-bold text-primary">Meus Pedidos</h1>

      {/* Banners de notificação */}
      {pendingNotifs.map((n) => (
        <div key={n.id} className="flex items-start gap-3 rounded-2xl bg-green-50 border border-green-200 px-4 py-3 shadow-sm">
          <span className="text-2xl">🎉</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-green-800 text-sm">{n.title}</p>
            <p className="text-green-700 text-sm">{n.body}</p>
          </div>
          <button
            onClick={() => setDismissedNotifs(true)}
            className="text-green-500 hover:text-green-700 text-lg leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      ))}
      {activeOrders.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-5xl">🧺</span>
          <p className="font-medium text-textSecondary">Nenhum pedido ainda.</p>
          <p className="text-sm text-textSecondary">Explore os produtores e faça seu primeiro pedido!</p>
        </div>
      )}
      {activeOrders.map((order) => (
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
                R$ {order.total_price.toFixed(2)}{order.product_unit && <span className="text-sm font-semibold text-textSecondary">/{order.product_unit}</span>}
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
          {(order.producer_phone || order.status === "pending" || order.status === "collected") && (
            <div className="border-t border-border px-4 py-3 flex items-center gap-3">
              {order.producer_phone && (
                <a
                  href={(() => {
                    const pickup = { feira: "🏪 Na feira", produtor: "🏡 Buscar no produtor", entrega: "🚗 Entrega em casa" }[order.pickup_location] ?? order.pickup_location;
                    const payment = { cash: "💵 Dinheiro", pix: "📲 Pix", card: "💳 Cartão" }[order.payment_intent] ?? order.payment_intent;
                    const msg = [
                      `Olá! 👋`,
                      ``,
                      order.consumer_name
                        ? `Sou *${order.consumer_name}*, cliente do *Terra Viva*, e fiz um pedido pelo app:`
                        : `Sou cliente do *Terra Viva* e fiz um pedido pelo app:`,
                      ``,
                      `🛒 *${order.product_name}*`,
                      `📦 Quantidade: ${order.quantity}x`,
                      `💰 Total: *R$ ${order.total_price.toFixed(2).replace(".", ",")}*`,
                      `📍 Retirada: ${pickup}`,
                      `${payment}`,
                      ``,
                      `Gostaria de confirmar os detalhes. Obrigado! 🌿`,
                    ].join("\n");
                    return `https://wa.me/55${order.producer_phone!.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
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
              {order.status === "collected" && !reviewedIds.has(order.id) && (
                <button
                  onClick={() => { setReviewingId(order.id); setReviewRating(5); setReviewComment(""); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-all"
                >
                  ⭐ Avaliar produtor
                </button>
              )}
              {order.status === "collected" && reviewedIds.has(order.id) && (
                <p className="flex-1 text-center text-sm text-green-600 font-medium">✅ Avaliado! Obrigado</p>
              )}
            </div>
          )}

          {/* Modal de avaliação inline */}
          {reviewingId === order.id && (
            <div className="border-t border-border bg-primary-subtle/40 px-4 py-4 space-y-3">
              <p className="text-sm font-bold text-textPrimary">Como foi sua experiência com {order.producer_name || "o produtor"}?</p>
              {/* Estrelas */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)} className="text-2xl transition-transform hover:scale-110">
                    {star <= reviewRating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Deixe um comentário (opcional)..."
                rows={2}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmitReview(order)}
                  disabled={submittingReview}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-primary/90 transition-all"
                >
                  {submittingReview ? "Enviando…" : "Enviar avaliação"}
                </button>
                <button
                  onClick={() => setReviewingId(null)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-textSecondary hover:bg-background transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </article>
      ))}

      {hasArchived && (
        <Link
          href="/pedidos/arquivados"
          className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-textSecondary hover:bg-background transition-colors"
        >
          🌾 Arquivados
        </Link>
      )}
    </section>
  );
}
