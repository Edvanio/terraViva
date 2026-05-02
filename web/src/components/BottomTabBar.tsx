"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Início", icon: "🏠", activeIcon: "🏡" },
  { href: "/bancas", label: "Produtores", icon: "🌱", activeIcon: "🌿" },
  { href: "/pedidos", label: "Pedidos", icon: "📋", activeIcon: "📋" },
  { href: "/minha-banca", label: "Vender", icon: "🌽", activeIcon: "🌽" },
  { href: "/perfil", label: "Perfil", icon: "👤", activeIcon: "👤" },
];

export function BottomTabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-lg shadow-tab md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom,0px)]">
        {TABS.map((tab) => {
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
              <span className={`text-[10px] font-semibold leading-tight ${active ? "font-bold" : ""}`}>
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
