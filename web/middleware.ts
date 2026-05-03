import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/pedidos", "/perfil", "/minha-banca"];
const PROTECTED_PATTERNS = [/^\/banca\/[^/]+\/reservar/];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("terra_viva_token")?.value;

  const isProtected =
    PROTECTED.some((p) => pathname.startsWith(p)) ||
    PROTECTED_PATTERNS.some((re) => re.test(pathname));

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Injeta pathname para Server Components lerem via headers()
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
