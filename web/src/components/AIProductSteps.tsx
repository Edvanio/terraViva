"use client";

const STEPS = [
  { icon: "📤", label: "Foto importada" },
  { icon: "🔍", label: "Identificando o produto..." },
  { icon: "✍️", label: "Gerando nome e descricao..." },
  { icon: "🏷️", label: "Escolhendo a categoria..." },
  { icon: "🎨", label: "Definindo identidade visual..." },
  { icon: "📸", label: "Melhorando a foto..." },
  { icon: "💰", label: "Sugerindo preco para sua regiao..." },
];

export function AIProductSteps({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="space-y-2">
      {STEPS.map((step, index) => {
        const done = index < stepIndex;
        const running = index === stepIndex;
        return (
          <div
            key={step.label}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
              done
                ? "bg-primary/10 border border-primary/20"
                : running
                  ? "bg-accent/10 border border-accent/30"
                  : "bg-background border border-border"
            }`}
          >
            <span className={`text-lg ${running ? "animate-pulse" : ""}`}>
              {done ? "✅" : running ? "⚡" : step.icon}
            </span>
            <span className={`text-sm font-medium ${
              done ? "text-primary" : running ? "text-accent" : "text-textSecondary"
            }`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
