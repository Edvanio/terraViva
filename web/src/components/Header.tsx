import Link from "next/link";

export async function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-surface/90 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-3 md:justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 21V11" stroke="white" strokeWidth="1.9" strokeLinecap="round"/>
              <path d="M12 15C12 15 7.5 13.5 7 9C7 9 12 9.5 12 15Z" fill="white" fillOpacity="0.9"/>
              <path d="M12 11.5C12 11.5 16.5 9.5 17 5.5C17 5.5 12 6.5 12 11.5Z" fill="white" fillOpacity="0.75"/>
              <path d="M8 21Q12 19.5 16 21" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.5"/>
              <circle cx="7.5" cy="6.5" r="1.6" fill="white" fillOpacity="0.6"/>
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
