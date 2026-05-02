import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/pedidos", "/perfil", "/minha-banca"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("terra_viva_token")?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
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
