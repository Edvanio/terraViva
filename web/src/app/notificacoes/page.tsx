"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  reservation_id: string | null;
  read: boolean;
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("terra_viva_token");
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export default function NotificacoesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  async function load() {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    const token = getToken();
    if (!token) return;
    setMarking(true);
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems([]);
    } finally {
      setMarking(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-textPrimary">🔔 Notificações</h1>
        {items.length > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
          >
            {marking ? "Marcando..." : "Marcar tudo como lido"}
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-border/30" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-textSecondary">
          <span className="text-4xl">🎉</span>
          <p className="font-medium">Nenhuma notificação não lida</p>
          <p className="text-sm">Você está em dia!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                className="w-full rounded-2xl border border-border/50 bg-surface p-4 text-left shadow-sm transition hover:bg-primary-subtle/30"
                onClick={async () => {
                  const token = getToken();
                  if (token) {
                    await fetch(`${API}/notifications/${n.id}/read`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                    }).catch(() => {});
                  }
                  if (n.reservation_id) {
                    router.push("/pedidos");
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-textPrimary text-sm">{n.title}</p>
                    <p className="mt-0.5 text-textSecondary text-sm leading-snug">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-textSecondary">{timeAgo(n.created_at)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
