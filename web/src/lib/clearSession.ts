"use client";

/**
 * Limpa token do localStorage e cookie do servidor.
 * Redireciona para /login se `redirect` for true (padrão).
 */
export async function clearSession(redirect = true) {
  localStorage.removeItem("terra_viva_token");
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    // ignora erro de rede
  }
  if (redirect) {
    const current = window.location.pathname + window.location.search;
    window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
  }
}

/**
 * Verifica se a resposta é 401 e limpa sessão automaticamente.
 * Retorna true se foi 401 (chamador deve abortar fluxo).
 */
export function handleApiError(res: Response): boolean {
  if (res.status === 401) {
    clearSession();
    return true;
  }
  return false;
}
