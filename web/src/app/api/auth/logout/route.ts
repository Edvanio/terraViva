import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("terra_viva_token");

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"), {
    status: 303,
  });
}
