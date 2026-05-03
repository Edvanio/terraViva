"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const SLIDES = [
  {
    emoji: "🌿",
    title: "Bem-vindo ao Terra Viva",
    desc: "Compre direto de quem produz.\nFresquinho, sem intermediário, do jeito da colônia.",
    bg: "bg-surface",
  },
  {
    emoji: "🧺",
    title: "Como funciona",
    desc: "Escolha o produtor, peça o que quiser.\nRetire na feira, busque na propriedade\nou receba em casa!",
    bg: "bg-surface",
  },
  {
    emoji: "🌽",
    title: "Quer vender?",
    desc: "Tire a foto do produto e a IA faz o resto.\nReceba pedidos no celular — bem fácil!",
    bg: "bg-surface",
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className={`w-full max-w-sm rounded-3xl ${s.bg} px-8 py-10 shadow-card-hover text-center space-y-5 border border-border`}>
        <span className="text-7xl block drop-shadow-sm">{s.emoji}</span>
        <h2 className="font-display text-2xl font-bold text-textPrimary">{s.title}</h2>
        <p className="text-base text-textSecondary whitespace-pre-line leading-relaxed">{s.desc}</p>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all ${
                i === slide ? "w-7 h-2.5 bg-primary" : "w-2.5 h-2.5 bg-border"
              }`}
            />
          ))}
        </div>

        <Button size="lg" className="w-full rounded-2xl text-base" onClick={next}>
          {slide < SLIDES.length - 1 ? "Próximo →" : "Começar 🌿"}
        </Button>

        {slide > 0 && (
          <button
            className="text-sm font-medium text-textSecondary hover:text-textPrimary"
            onClick={() => setSlide(slide - 1)}
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
}
