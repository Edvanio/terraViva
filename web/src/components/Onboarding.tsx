"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const SLIDES = [
  {
    emoji: "🌿",
    title: "Bem-vindo ao Terra Viva",
    desc: "A feira digital da colônia.\nCompre direto do produtor, sem intermediário.",
  },
  {
    emoji: "🛒",
    title: "Como comprar",
    desc: "Escolha uma banca, reserve o produto e retire na feira de sábado.",
  },
  {
    emoji: "🌽",
    title: "Como vender",
    desc: "Cadastre seus produtos e receba pedidos no celular — bem simples.",
  },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem("onboarding_done");
    if (!done) setVisible(true);
  }, []);

  function next() {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1);
    } else {
      localStorage.setItem("onboarding_done", "1");
      setVisible(false);
    }
  }

  if (!visible) return null;

  const s = SLIDES[slide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-surface px-8 py-10 shadow-card text-center space-y-5">
        <span className="text-6xl block">{s.emoji}</span>
        <h2 className="text-2xl font-bold text-textPrimary">{s.title}</h2>
        <p className="text-base text-textSecondary whitespace-pre-line leading-relaxed">{s.desc}</p>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all ${
                i === slide ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-border"
              }`}
            />
          ))}
        </div>

        <Button size="lg" className="w-full" onClick={next}>
          {slide < SLIDES.length - 1 ? "Próximo →" : "Começar 🌿"}
        </Button>

        {slide > 0 && (
          <button
            className="text-sm text-textSecondary hover:text-textPrimary"
            onClick={() => setSlide(slide - 1)}
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
}
