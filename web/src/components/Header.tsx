import Link from "next/link";
import { cookies, headers } from "next/headers";

export async function Header() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const isLoggedIn = !!cookieStore.get("terra_viva_token")?.value;
  const pathname = headerStore.get("x-pathname") ?? "/";

  const isConsumer = pathname.startsWith("/bancas") || pathname.startsWith("/pedidos");
  const isProducer = pathname.startsWith("/minha-banca");

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-sm">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M14 3C14 3 6 8 6 16a8 8 0 0016 0C22 8 14 3 14 3Z" fill="white" fillOpacity="0.95"/>
              <path d="M14 10v12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.7"/>
              <path d="M14 14c0 0-3-3-5-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6"/>
              <path d="M14 17c0 0 2-2 4-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6"/>
            </svg>
          </div>
          <div className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-textPrimary">Terra Viva</span>
            <span className="block text-[10px] text-textSecondary">Da colônia para sua mesa</span>
          </div>
        </Link>

        {/* Nav contextual */}
        <nav className="flex items-center gap-0.5 text-sm">
          <Link href="/" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">
            Início
          </Link>

          {isConsumer && (
            <>
              <Link href="/bancas" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">Bancas</Link>
              <Link href="/pedidos" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">Pedidos</Link>
            </>
          )}

          {isProducer && (
            <>
              <Link href="/minha-banca" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">Minha banca</Link>
              <Link href="/perfil" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">Perfil</Link>
            </>
          )}

          {isLoggedIn ? (
            <>
              {!isConsumer && !isProducer && (
                <Link href="/perfil" className="rounded-lg px-3 py-2 font-medium text-textSecondary transition hover:bg-primary-subtle hover:text-primary">Perfil</Link>
              )}
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="ml-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-textSecondary transition hover:border-primary/40 hover:bg-primary-subtle hover:text-primary"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-xl bg-primary px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-primary-medium"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
