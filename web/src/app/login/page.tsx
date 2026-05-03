"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPhone, rawPhone } from "@/lib/format";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: rawPhone(phoneDisplay) }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("Não foi possível enviar o código. Tente novamente.");
      return;
    }

    const data = await response.json();
    setDevCode(data.dev_code ?? null);
    setStep("otp");
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: rawPhone(phoneDisplay), code }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("Código inválido. Verifique e tente novamente.");
      return;
    }

    const data = await response.json();
    localStorage.setItem("terra_viva_token", data.access_token);

    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: data.access_token }),
    });

    // window.location garante reload completo do Server Component (header)
    const redirect = searchParams.get("redirect");
    window.location.href = redirect ?? "/";
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <section className="w-full max-w-md space-y-6 rounded-2xl bg-surface p-8 shadow-card">
        {/* Logo / título */}
        <div className="text-center">
          <div className="mx-auto mb-1 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2d6a2d] to-[#1a4a1a] shadow-md overflow-hidden">
            <svg width="38" height="38" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="16" cy="8" r="4" fill="#F5C842"/>
              <line x1="16" y1="2" x2="16" y2="0.5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="20.5" y1="3.5" x2="21.5" y2="2.5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="22" y1="8" x2="23.5" y2="8" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="20.5" y1="12.5" x2="21.5" y2="13.5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="11.5" y1="3.5" x2="10.5" y2="2.5" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="10" y1="8" x2="8.5" y2="8" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M16 14 L16 28" stroke="#6DBF5A" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 22 C16 22 10 20 9 15 C9 15 14 15 16 20" fill="#6DBF5A"/>
              <path d="M16 19 C16 19 22 17 23 12 C23 12 18 12 16 17" fill="#52A63E"/>
            </svg>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-textPrimary">
            {step === "phone" ? "Entrar no Terra Viva" : "Confirmar código"}
          </h1>
          <p className="mt-1 text-sm text-textSecondary">
            {step === "phone"
              ? "Digite seu número de WhatsApp para receber o código"
              : `Vamos confirmar o número ${phoneDisplay}`}
          </p>
        </div>

        {step === "phone" ? (
          <form className="space-y-4" onSubmit={requestOtp}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-textPrimary">
                Número de WhatsApp
              </label>
              <Input
                placeholder="(48) 9 9999-9999"
                value={phoneDisplay}
                onChange={(e) => setPhoneDisplay(formatPhone(e.target.value))}
                type="tel"
                inputMode="numeric"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Receber código"}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={verifyOtp}>
            {devCode && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-primary-subtle px-4 py-3">
                <span className="text-sm text-textSecondary">Código (dev):</span>
                <span className="text-xl font-bold tracking-widest text-primary">{devCode}</span>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-textPrimary">
                Código de 6 dígitos
              </label>
              <Input
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Verificando..." : "Confirmar e entrar"}
            </Button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setError(""); }}
              className="w-full text-sm text-textSecondary hover:text-primary"
            >
              ← Usar outro número
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
