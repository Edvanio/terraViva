"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Verifica se o token existe no localStorage.
 * Enquanto verifica: retorna `{ ready: false }` → página renderiza nada (sem flash).
 * Se não tiver token: redireciona para /login.
 * Se tiver: retorna `{ ready: true }`.
 */
export function useAuthGuard(redirectTo = "/login"): { ready: boolean } {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("terra_viva_token");
    if (!token) {
      const current = window.location.pathname + window.location.search;
      router.replace(`${redirectTo}?redirect=${encodeURIComponent(current)}`);
    } else {
      setReady(true);
    }
  }, [router, redirectTo]);

  return { ready };
}
