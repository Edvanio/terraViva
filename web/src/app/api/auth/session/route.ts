import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "terra_viva_token";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.token) {
    return NextResponse.json({ message: "token ausente" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, body.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias — igual ao JWT do backend
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
