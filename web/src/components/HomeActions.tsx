"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Reservation } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { getCategoryIcon } from "@/components/CategoryChip";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("terra_viva_token");
}

async function fetchReservations(path: string, token: string): Promise<Reservation[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export function HomeActions() {
  const [myOrders, setMyOrders] = useState<Reservation[]>([]);
  const [requests, setRequests] = useState<Reservation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoaded(true); return; }

    Promise.all([
      fetchReservations("/reservations", token),
      fetchReservations("/reservations/producer", token),
    ]).then(([orders, reqs]) => {
      setMyOrders(orders);
      setRequests(reqs);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* CTAs */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/bancas"
          className="group relative flex flex-col gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02]"
        >
          <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-125" />
          <span className="relative text-4xl">🧺</span>
          <div className="relative">
            <p className="text-base font-bold leading-tight">Quero comprar</p>
            <p className="mt-1 text-sm text-white/80 leading-tight">Veja o que tem de bom</p>
          </div>
        </Link>

        <Link
          href="/minha-banca"
          className="group relative flex flex-col gap-3 overflow-hidden rounded-3xl border-2 border-earth bg-gradient-to-br from-earth-subtle to-surface p-5 text-earth shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02]"
        >
          <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-earth/5 transition-transform duration-300 group-hover:scale-125" />
          <span className="relative text-4xl">🌽</span>
          <div className="relative">
            <p className="text-base font-bold leading-tight text-earth">Quero vender</p>
            <p className="mt-1 text-sm text-textSecondary leading-tight">Gerencie seus produtos</p>
          </div>
        </Link>
      </div>

      {/* Minhas Reservas */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-textPrimary">Meus pedidos</h2>
          <Link href="/pedidos" className="text-sm font-bold text-primary hover:underline">
            Ver todos →
          </Link>
        </div>

        {!loaded ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-border/40 animate-pulse" />)}</div>
        ) : myOrders.length === 0 ? (
          <p className="text-sm text-textSecondary">Tudo tranquilo por aqui! 🌿 Sua primeira compra aparece aqui.</p>
        ) : (
          <div className="space-y-2">
            {myOrders.slice(0, 3).map((order) => (
              <article key={order.id} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card">
                {order.product_photo_url ? (
                  <Image src={order.product_photo_url} alt="" width={36} height={36} unoptimized className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-lg flex-shrink-0">{getCategoryIcon(order.product_category)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-textPrimary truncate">{order.product_name}</p>
                  <p className="text-sm text-textSecondary truncate">
                    {order.quantity}x · R$ {order.total_price.toFixed(2)}{order.producer_name ? ` · ${order.producer_name}` : ""}
                  </p>
                </div>
                <Badge status={order.status} />
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Solicitações */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-textPrimary">Pedidos que recebi</h2>
          {requests.length > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
              {requests.length}
            </span>
          )}
        </div>

        {!loaded ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-border/40 animate-pulse" />)}</div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-textSecondary">Nenhum pedido recebido ainda. Quando alguém pedir, aparece aqui. 🌿</p>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 3).map((req) => (
              <article key={req.id} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card">
                {req.product_photo_url ? (
                  <Image src={req.product_photo_url} alt="" width={36} height={36} unoptimized className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-lg flex-shrink-0">{getCategoryIcon(req.product_category)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-textPrimary truncate">{req.product_name}</p>
                  <p className="text-sm text-textSecondary truncate">
                    {req.quantity}x{req.consumer_name ? ` · ${req.consumer_name}` : ""}
                  </p>
                </div>
                <Badge status={req.status} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
