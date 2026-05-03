"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  label: string;
  icon: string;
  activeIcon: string;
  badge?: boolean;
}

const TABS_LOGGED: Tab[] = [
  { href: "/", label: "Início", icon: "🏠", activeIcon: "🏡" },
  { href: "/bancas", label: "Produtores", icon: "🌱", activeIcon: "🌿" },
  { href: "/pedidos", label: "Pedidos", icon: "📋", activeIcon: "📋", badge: true },
  { href: "/minha-banca", label: "Vender", icon: "🌽", activeIcon: "🌽" },
  { href: "/perfil", label: "Perfil", icon: "👤", activeIcon: "👤" },
];

const TABS_GUEST: Tab[] = [
  { href: "/", label: "Início", icon: "🏠", activeIcon: "🏡" },
  { href: "/bancas", label: "Produtores", icon: "🌱", activeIcon: "🌿" },
  { href: "/login?redirect=%2Fminha-banca", label: "Vender", icon: "🌽", activeIcon: "🌽" },
  { href: "/login", label: "Entrar", icon: "🔑", activeIcon: "🔑" },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("terra_viva_token");
    setIsLoggedIn(!!token);
    if (token) {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";
      fetch(`${base}/producer/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data?.photo_url) setProfilePhoto(data.photo_url); })
        .catch(() => {});
    }
  }, [pathname]);

  // Poll notificações não lidas a cada 30s
  useEffect(() => {
    function fetchNotifs() {
      const token = localStorage.getItem("terra_viva_token");
      if (!token) { setUnreadCount(0); return; }
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";
      fetch(`${base}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : [])
        .then((data: unknown[]) => setUnreadCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    }
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(id);
  }, [isLoggedIn]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "terra_viva_token") setIsLoggedIn(!!e.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const tabs: Tab[] = mounted && isLoggedIn ? TABS_LOGGED : TABS_GUEST;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-lg shadow-tab md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom,0px)]">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const showBadge = tab.badge === true && unreadCount > 0 && !active;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-center transition-all ${
                active ? "text-primary scale-105" : "text-textSecondary hover:text-primary"
              }`}
            >
              <span className={`relative text-xl ${active ? "drop-shadow-sm" : ""}`}>
                {tab.href === "/perfil" && profilePhoto ? (
                  <Image src={profilePhoto} alt="Perfil" width={24} height={24} unoptimized
                    className="h-6 w-6 rounded-full object-cover border border-border" />
                ) : (
                  active ? tab.activeIcon : tab.icon
                )}
                {showBadge && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className={`text-xs font-semibold leading-tight ${active ? "font-bold" : ""}`}>
                {tab.label}
              </span>
              {active && <span className="mt-0.5 h-1 w-5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
