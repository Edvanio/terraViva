import Link from "next/link";
import { getAuthToken } from "@/lib/auth";

export async function Header() {
  const token = await getAuthToken();
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-surface/90 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-3 md:justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2d6a2d] to-[#1a4a1a] shadow-sm overflow-hidden">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* Sol */}
              <circle cx="16" cy="8" r="4" fill="#F5C842"/>
              {/* Raios do sol */}
              <line x1="16" y1="2" x2="16" y2="0.5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="20.5" y1="3.5" x2="21.5" y2="2.5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="22" y1="8" x2="23.5" y2="8" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="20.5" y1="12.5" x2="21.5" y2="13.5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="11.5" y1="3.5" x2="10.5" y2="2.5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="10" y1="8" x2="8.5" y2="8" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Caule */}
              <path d="M16 14 L16 28" stroke="#6DBF5A" strokeWidth="2" strokeLinecap="round"/>
              {/* Folha esquerda */}
              <path d="M16 22 C16 22 10 20 9 15 C9 15 14 15 16 20" fill="#6DBF5A"/>
              {/* Folha direita */}
              <path d="M16 19 C16 19 22 17 23 12 C23 12 18 12 16 17" fill="#52A63E"/>
            </svg>
          </div>
          <div className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight text-primary">Terra Viva</span>
            <span className="block text-[11px] font-medium text-textSecondary">Do produtor pra você</span>
          </div>
        </Link>

        {/* Nav desktop only */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <Link href="/" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">
            Início
          </Link>
          <Link href="/bancas" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">
            Bancas
          </Link>
          {token && (
            <Link href="/minha-banca" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">
              Minha banca
            </Link>
          )}
          {token ? (
            <Link href="/perfil" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">
              Perfil
            </Link>
          ) : (
            <Link href="/login" className="rounded-lg px-3 py-2 font-medium text-primary transition hover:bg-primary-subtle">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
