"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const PICKUP_OPTS = [
  { value: "feira", label: "📍 Na feira de sábado" },
  { value: "produtor", label: "🏡 Na casa do produtor" },
];

const PAYMENT_OPTS = [
  { value: "cash", label: "💵 Dinheiro" },
  { value: "pix", label: "📲 Pix" },
  { value: "card", label: "💳 Cartão" },
];

export default function ReservarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const productId = useMemo(() => searchParams.get("productId") || "", [searchParams]);
  const productName = useMemo(() => searchParams.get("name") || "Produto", [searchParams]);
  const productPrice = useMemo(() => parseFloat(searchParams.get("price") || "0"), [searchParams]);

  const [quantity, setQuantity] = useState(1);
  const [pickupLocation, setPickupLocation] = useState<"feira" | "produtor">("feira");
  const [paymentIntent, setPaymentIntent] = useState<"cash" | "pix" | "card">("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const totalPrice = productPrice * quantity;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("terra_viva_token");
    if (!token) {
      router.push(
        `/login?redirect=/banca/${params.id}/reservar?productId=${productId}&name=${encodeURIComponent(productName)}&price=${productPrice}`
      );
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          quantity,
          pickup_location: pickupLocation,
          payment_intent: paymentIntent,
        }),
      });

      if (response.status === 401) {
        // Token expirado — limpa e redireciona para login
        localStorage.removeItem("terra_viva_token");
        router.push(
          `/login?redirect=/banca/${params.id}/reservar?productId=${productId}&name=${encodeURIComponent(productName)}&price=${productPrice}`
        );
        return;
      }
      if (!response.ok) throw new Error("Falha ao criar reserva");
      setSuccess(true);
    } catch {
      setError("Não conseguimos fazer sua reserva. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    const pickupLabel = PICKUP_OPTS.find((o) => o.value === pickupLocation)?.label ?? pickupLocation;
    const payLabel = PAYMENT_OPTS.find((o) => o.value === paymentIntent)?.label ?? paymentIntent;
    return (
      <div className="mx-auto max-w-md space-y-6 py-10 text-center">
        <span className="block text-7xl">🎉</span>
        <h1 className="text-2xl font-bold text-textPrimary">Reserva feita!</h1>

        <div className="rounded-2xl bg-surface p-6 shadow-card text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-textSecondary">Produto</span>
            <span className="font-semibold text-textPrimary">{productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Quantidade</span>
            <span className="font-semibold text-textPrimary">{quantity}x</span>
          </div>
          {totalPrice > 0 && (
            <div className="flex justify-between">
              <span className="text-textSecondary">Total</span>
              <span className="font-bold text-primary">
                R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-textSecondary">Retirada</span>
            <span className="font-semibold text-textPrimary">{pickupLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Pagamento</span>
            <span className="font-semibold text-textPrimary">{payLabel}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Link href="/pedidos">
            <Button size="lg" className="w-full">Ver meus pedidos</Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="secondary" className="w-full">Voltar para a feira</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-xl space-y-5 rounded-2xl bg-surface p-6 shadow-card"
    >
      <div>
        <h1 className="text-2xl font-bold text-textPrimary">Finalizar Reserva</h1>
        <p className="mt-1 text-sm text-textSecondary">{productName}</p>
      </div>

      {/* Quantidade */}
      <div>
        <label className="mb-2 block text-sm font-medium text-textPrimary">
          Quantos você quer?
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border text-lg font-bold text-textPrimary hover:border-primary"
          >
            −
          </button>
          <span className="w-8 text-center text-xl font-bold text-textPrimary">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border text-lg font-bold text-textPrimary hover:border-primary"
          >
            +
          </button>
          {totalPrice > 0 && (
            <span className="ml-auto text-lg font-bold text-primary">
              R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>

      {/* Retirada */}
      <div>
        <label className="mb-2 block text-sm font-medium text-textPrimary">
          Onde vai retirar?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PICKUP_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPickupLocation(opt.value as "feira" | "produtor")}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                pickupLocation === opt.value
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border bg-background text-textSecondary hover:border-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pagamento */}
      <div>
        <label className="mb-2 block text-sm font-medium text-textPrimary">
          Como vai pagar?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPaymentIntent(opt.value as "cash" | "pix" | "card")}
              className={`rounded-xl border-2 px-2 py-3 text-sm font-semibold transition ${
                paymentIntent === opt.value
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border bg-background text-textSecondary hover:border-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Reservando..." : "Confirmar reserva"}
      </Button>
    </form>
  );
}
