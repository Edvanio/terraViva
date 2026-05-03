"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "./clearSession";

/**
 * Verifica se o token existe no localStorage e se é válido (ping na API).
 * Enquanto verifica: retorna `{ ready: false }` → página renderiza nada (sem flash).
 * Se não tiver token ou for inválido: limpa sessão e redireciona para /login.
 * Se tiver e for válido: retorna `{ ready: true }`.
 */
export function useAuthGuard(redirectTo = "/login"): { ready: boolean } {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("terra_viva_token");
    if (!token) {
      const current = window.location.pathname + window.location.search;
      router.replace(`${redirectTo}?redirect=${encodeURIComponent(current)}`);
      return;
    }

    // Valida token com a API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/producer/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          clearSession();
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        // Erro de rede — assume token válido para não bloquear offline
        setReady(true);
      });
  }, [router, redirectTo]);

  return { ready };
}
