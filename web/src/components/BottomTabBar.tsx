"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS_LOGGED = [
  { href: "/", label: "In\u00edcio", icon: "\u{1F3E0}", activeIcon: "\u{1F3E1}" },
  { href: "/bancas", label: "Produtores", icon: "\u{1F331}", activeIcon: "\u{1F33F}" },
  { href: "/pedidos", label: "Pedidos", icon: "\u{1F4CB}", activeIcon: "\u{1F4CB}" },
  { href: "/minha-banca", label: "Vender", icon: "\u{1F33D}", activeIcon: "\u{1F33D}" },
  { href: "/perfil", label: "Perfil", icon: "\u{1F464}", activeIcon: "\u{1F464}" },
];

const TABS_GUEST = [
  { href: "/", label: "In\u00edcio", icon: "\u{1F3E0}", activeIcon: "\u{1F3E1}" },
  { href: "/bancas", label: "Produtores", icon: "\u{1F331}", activeIcon: "\u{1F33F}" },
  { href: "/login", label: "Entrar", icon: "\u{1F511}", activeIcon: "\u{1F511}" },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("terra_viva_token"));
  }, [pathname]);

  // Escuta mudanças no localStorage (logout em outra aba ou clearSession)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "terra_viva_token") {
        setIsLoggedIn(!!e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const tabs = isLoggedIn ? TABS_LOGGED : TABS_GUEST;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-lg shadow-tab md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom,0px)]">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-center transition-all ${
                active
                  ? "text-primary scale-105"
                  : "text-textSecondary hover:text-primary"
              }`}
            >
              <span className={`text-xl ${active ? "drop-shadow-sm" : ""}`}>
                {active ? tab.activeIcon : tab.icon}
              </span>
              <span className={`text-xs font-semibold leading-tight ${active ? "font-bold" : ""}`}>
                {tab.label}
              </span>
              {active && (
                <span className="mt-0.5 h-1 w-5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
