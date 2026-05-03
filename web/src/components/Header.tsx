import Link from "next/link";

export async function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-surface/90 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-3 md:justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* Pétalas */}
              <ellipse cx="12" cy="5.5" rx="1.5" ry="2.8" fill="white" fillOpacity="0.85"/>
              <ellipse cx="12" cy="5.5" rx="1.5" ry="2.8" fill="white" fillOpacity="0.85" transform="rotate(45 12 12)"/>
              <ellipse cx="12" cy="5.5" rx="1.5" ry="2.8" fill="white" fillOpacity="0.85" transform="rotate(90 12 12)"/>
              <ellipse cx="12" cy="5.5" rx="1.5" ry="2.8" fill="white" fillOpacity="0.85" transform="rotate(135 12 12)"/>
              {/* Centro */}
              <circle cx="12" cy="12" r="3.5" fill="white"/>
              <circle cx="12" cy="12" r="2" fill="white" fillOpacity="0.5"/>
              {/* Caule */}
              <path d="M12 15.5V21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M12 18.5C12 18.5 9.5 17.5 9 15.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" fillOpacity="0.7"/>
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
          <Link href="/minha-banca" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">
            Minha banca
          </Link>
          <Link href="/perfil" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">
            Perfil
          </Link>
        </nav>
      </div>
    </header>
  );
}
