/**
 * Formata telefone para (48) 9 9999-9999 enquanto o usuário digita.
 * Remove qualquer caractere não-numérico antes de formatar.
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** Remove máscara e retorna apenas dígitos */
export function rawPhone(masked: string): string {
  return masked.replace(/\D/g, "");
}

/**
 * Converte string de preço (aceita vírgula ou ponto) para float.
 * Ex: "28,50" → 28.5   "R$ 28.50" → 28.5
 */
export function parsePrice(value: string): number {
  const clean = value.replace(/[^\d,\.]/g, "").replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/** Formata float para exibição "R$ 28,50" */
export function formatPrice(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return `rgba(42, 92, 46, ${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
