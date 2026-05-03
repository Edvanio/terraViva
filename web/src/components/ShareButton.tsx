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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          <span>Link copiado!</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/></svg>
          <span>Compartilhar</span>
        </>
      )}
    </button>
  );
}
