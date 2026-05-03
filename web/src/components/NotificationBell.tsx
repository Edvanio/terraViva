"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    function fetch() {
      const token = localStorage.getItem("terra_viva_token");
      if (!token) { setUnread(0); return; }
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";
      window
        .fetch(`${base}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: unknown[]) => setUnread(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    }

    fetch();
    const id = setInterval(fetch, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  return (
    <Link
      href="/notificacoes"
      aria-label="Notificações"
      className="relative flex items-center justify-center rounded-lg p-2 text-textSecondary transition hover:bg-primary-subtle hover:text-primary"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
