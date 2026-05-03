"use client";

import { useState } from "react";

interface Props {
  name: string;
  shortCode: string;
  className?: string;
}

export function ShareButton({ name, shortCode, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/banca/${shortCode}`;
    const text = `Veja a banca de ${name} na feira Terra Viva 🌱`;

    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url });
        return;
      } catch {
        // usuário cancelou ou navegador não suportou — cai para clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: selecionar texto manualmente não é necessário para este contexto
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary-subtle px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 active:scale-95 ${className}`}
    >
      {copied ? (
        <>
          <span>✅</span>
          <span>Link copiado!</span>
        </>
      ) : (
        <>
          <span>🔗</span>
          <span>Compartilhar</span>
        </>
      )}
    </button>
  );
}
