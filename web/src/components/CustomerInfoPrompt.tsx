"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CustomerInfoPromptProps {
  /** Fields already filled (won't be asked again) */
  currentName?: string | null;
  currentCity?: string | null;
  /** Called when user finishes the flow */
  onComplete: (data: { name: string; city?: string }) => void;
  /** If true, city step is shown after name */
  askCity?: boolean;
}

/**
 * Simple card-based prompt to collect customer info (name, city).
 * Reusable wherever we need basic user data before an action.
 */
export function CustomerInfoPrompt({
  currentName,
  currentCity,
  onComplete,
  askCity = true,
}: CustomerInfoPromptProps) {
  const needsName = !currentName;
  const needsCity = askCity && !currentCity;

  const [step, setStep] = useState<"name" | "city">(needsName ? "name" : "city");
  const [name, setName] = useState(currentName || "");
  const [city, setCity] = useState(currentCity || "");

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (needsCity) {
      setStep("city");
    } else {
      onComplete({ name: name.trim(), city: city.trim() || undefined });
    }
  }

  function handleCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    onComplete({ name: name.trim(), city: city.trim() || undefined });
  }

  if (step === "name") {
    return (
      <form
        onSubmit={handleNameSubmit}
        className="mx-auto max-w-sm space-y-4 rounded-2xl bg-surface p-6 shadow-card animate-fade-in"
      >
        <div className="text-center">
          <span className="text-4xl">👋</span>
          <h2 className="mt-2 text-lg font-bold text-textPrimary">Qual o seu nome?</h2>
          <p className="mt-1 text-sm text-textSecondary">
            Assim o produtor sabe quem fez o pedido
          </p>
        </div>
        <Input
          placeholder="Seu nome (ex: Maria)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
          className="text-center text-lg"
        />
        <Button type="submit" size="lg" className="w-full" disabled={!name.trim()}>
          Continuar →
        </Button>
      </form>
    );
  }

  if (step === "city") {
    return (
      <form
        onSubmit={handleCitySubmit}
        className="mx-auto max-w-sm space-y-4 rounded-2xl bg-surface p-6 shadow-card animate-fade-in"
      >
        <div className="text-center">
          <span className="text-4xl">📍</span>
          <h2 className="mt-2 text-lg font-bold text-textPrimary">Onde você mora?</h2>
          <p className="mt-1 text-sm text-textSecondary">
            Ajuda a combinar a entrega
          </p>
        </div>
        <Input
          placeholder="Cidade ou bairro (ex: Centro, Floripa)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          autoFocus
          className="text-center text-lg"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => onComplete({ name: name.trim() })}
          >
            Pular
          </Button>
          <Button type="submit" size="lg" className="flex-1">
            Pronto ✓
          </Button>
        </div>
      </form>
    );
  }

  return null;
}
