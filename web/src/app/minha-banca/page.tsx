"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { CATEGORIES, getCategoryIcon } from "@/components/CategoryChip";
import { AIProductModal } from "@/components/AIProductModal";
import { parsePrice } from "@/lib/format";
import { useAuthGuard } from "@/lib/useAuthGuard";

interface Order {
  id: string;
  product_name: string;
  product_photo_url?: string | null;
  product_description?: string | null;
  product_category?: string | null;
  consumer_name?: string | null;
  consumer_phone?: string | null;
  quantity: number;
  total_price: number;
  status: "pending" | "confirmed" | "collected" | "cancelled";
  pickup_location: string;
  payment_intent: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  photo_url?: string;
  category?: string;
  color_primary?: string | null;
  color_accent?: string | null;
  is_active: boolean;
  stock?: number | null;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("terra_viva_token");
}

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

const PICKUP_LABEL: Record<string, string> = {
  feira: "� Na feira",
  produtor: "🌾 Buscar no produtor",
  entrega: "🚜 Entrega em casa",
};
const PAYMENT_LABEL: Record<string, string> = {
  cash: "💵 Dinheiro",
  pix: "📲 Pix",
  card: "💳 Cartão",
};

export default function MinhaBancaPage() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [producerCity, setProducerCity] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const { toast } = useToast();
  const stockDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Formulário novo produto
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function uploadProductPhoto(file: File) {
    setUploadingPhoto(true);
    try {
      const token = getToken();
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${base}/producer/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        setNewPhoto(data.url);
      } else {
        toast("Erro ao enviar foto.", "error");
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function loadData() {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const [ordersRes, productsRes, profileRes] = await Promise.all([
      fetch(`${base}/reservations/producer`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${base}/products/mine`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${base}/producer/profile`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (profileRes.status === 404) {
      setHasProfile(false);
      setLoading(false);
      return;
    }

    if (profileRes.ok) {
      const profile = await profileRes.json();
      setProducerCity(profile.city || "");
    }

    if (ordersRes.ok) setOrders(await ordersRes.json());
    if (productsRes.ok) setProducts(await productsRes.json());
    setLoading(false);
  }

  useEffect(() => { if (ready) loadData(); }, [ready]);

  async function updateOrderStatus(orderId: string, status: Order["status"]) {
    const token = getToken();
    await fetch(`${base}/reservations/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    toast(status === "confirmed" ? "Pedido confirmado! ✅" : status === "collected" ? "Marcado como retirado! 🎉" : "Pedido cancelado.");
    await loadData();
  }

  async function toggleProduct(productId: string, isActive: boolean) {
    // Optimistic update
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, is_active: !isActive } : p));
    const token = getToken();
    const res = await fetch(`${base}/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !isActive }),
    });
    if (!res.ok) {
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, is_active: isActive } : p));
      toast("Erro ao atualizar produto.", "error");
    } else {
      toast(isActive ? "Marcado como esgotado." : "Produto disponível! ✅");
    }
  }

  function updateStock(productId: string, newStock: number) {
    const clamped = Math.max(0, newStock);
    // Optimistic update imediato
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, stock: clamped } : p));
    // Debounce: só envia para API após 500ms de pausa
    if (stockDebounceRef.current[productId]) clearTimeout(stockDebounceRef.current[productId]);
    stockDebounceRef.current[productId] = setTimeout(() => {
      const token = getToken();
      fetch(`${base}/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stock: clamped }),
      });
    }, 500);
  }

  async function deleteProduct(productId: string) {
    const token = getToken();
    await fetch(`${base}/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setConfirmDelete(null);
    toast("Produto removido.", "info");
    await loadData();
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const token = getToken();
    const res = await fetch(`${base}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: newName,
        price: parsePrice(newPrice),
        description: newDesc || undefined,
        category: newCategory || undefined,
        photo_url: newPhoto || undefined,
        is_active: true,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setNewName(""); setNewPrice(""); setNewDesc(""); setNewPhoto(""); setNewCategory("");
      setShowForm(false);
      toast("Produto adicionado! ✅");
      await loadData();
    } else {
      toast("Não conseguimos salvar. Tente de novo.", "error");
    }
  }

  function startAiFlow() {
    if (!navigator.onLine) {
      toast("Sem internet. Abrindo cadastro manual.", "info");
      setShowForm(true);
      return;
    }
    setShowForm(false);
    setShowAiModal(true);
  }

  if (!ready) return null;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-border/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <span className="text-5xl">🌱</span>
        <p className="text-xl font-bold text-textPrimary">Você ainda não tem perfil de vendedor</p>
        <p className="text-textSecondary">Crie seu perfil para começar a vender seus produtos.</p>
        <Link href="/perfil">
          <Button size="lg" className="mt-2">Criar meu perfil</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Minha Banca</h1>
          <p className="text-sm text-textSecondary">Gerencie pedidos e produtos</p>
        </div>
        <Link href="/perfil">
          <Button variant="secondary" size="sm">✏️ Editar perfil</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-border/30 p-1">
        <button
          onClick={() => setTab("orders")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
            tab === "orders"
              ? "bg-surface text-primary shadow-card"
              : "text-textSecondary hover:text-textPrimary"
          }`}
        >
          📦 Pedidos recebidos
          {orders.filter((o) => o.status === "pending").length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">
              {orders.filter((o) => o.status === "pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("products")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
            tab === "products"
              ? "bg-surface text-primary shadow-card"
              : "text-textSecondary hover:text-textPrimary"
          }`}
        >
          🧀 Meus produtos
        </button>
      </div>

      {/* ── PEDIDOS ── */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <span className="text-5xl">📭</span>
              <p className="text-textSecondary">Nenhum pedido recebido ainda.</p>
              <p className="text-sm text-textSecondary">Quando alguém pedir, aparece aqui. 🌿</p>
            </div>
          ) : (
            orders.map((order) => {
              const displayName = order.consumer_name || "Cliente";
              return (
              <article key={order.id} className="overflow-hidden rounded-2xl bg-white shadow-card animate-fade-in">
                {/* Topo: foto + info */}
                <div className="flex gap-3 p-4">
                  {order.product_photo_url ? (
                    <Image
                      src={order.product_photo_url}
                      alt={order.product_name}
                      width={88}
                      height={88}
                      unoptimized
                      className="h-[88px] w-[88px] flex-shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-[88px] w-[88px] flex-shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-4xl">
                      {getCategoryIcon(order.product_category)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-bold text-textPrimary leading-tight truncate">{order.product_name}</p>
                      <Badge status={order.status} />
                    </div>

                    {order.product_description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-textSecondary">{order.product_description}</p>
                    )}

                    {/* Preço destaque */}
                    <p className="mt-2 text-xl font-bold text-primary">
                      R$ {order.total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      <span className="ml-1.5 text-sm font-normal text-textSecondary">{order.quantity}x</span>
                    </p>

                    {/* Quem pediu + entrega + pagamento */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        🧑‍🌾 {displayName}
                      </span>
                      <span className="rounded-full bg-background px-2 py-0.5 text-xs text-textSecondary">
                        {PICKUP_LABEL[order.pickup_location] ?? order.pickup_location}
                      </span>
                      <span className="rounded-full bg-background px-2 py-0.5 text-xs text-textSecondary">
                        {PAYMENT_LABEL[order.payment_intent] ?? order.payment_intent}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rodapé de ações */}
                <div className="border-t border-border px-4 py-3 space-y-2">
                  {/* Botões de status */}
                  {order.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => updateOrderStatus(order.id, "confirmed")}>
                        🤝 Confirmar pedido
                      </Button>
                      <button
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                        className="text-sm text-red-500 font-medium hover:text-red-700 transition-colors px-2"
                      >
                        Recusar
                      </button>
                    </div>
                  )}
                  {order.status === "confirmed" && (
                    <Button size="sm" className="w-full" onClick={() => updateOrderStatus(order.id, "collected")}>
                      🧺 Marcar como retirado
                    </Button>
                  )}

                  {/* WhatsApp */}
                  {order.consumer_phone && (
                    <a
                      href={(() => {
                        const pickup = { feira: "\ud83d\uded6 Na feira", produtor: "\ud83c\udf3e Buscar no produtor", entrega: "\ud83d\ude9c Entrega em casa" }[order.pickup_location] ?? order.pickup_location;
                        const payment = { cash: "\ud83d\udcb5 Dinheiro", pix: "\ud83d\udcf2 Pix", card: "\ud83d\udcb3 Cart\u00e3o" }[order.payment_intent] ?? order.payment_intent;
                        const msg = [
                          `Ol\u00e1${order.consumer_name ? `, *${order.consumer_name}*` : "!"}! 👋`,
                          ``,
                          `Sou *${producerCity || "produtor"}* do *Terra Viva*. Recebi seu pedido:`,
                          ``,
                          `🛒 *${order.product_name}*`,
                          `📦 Quantidade: ${order.quantity}x`,
                          `💰 Total: *R$ ${order.total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}*`,
                          `📍 Retirada: ${pickup}`,
                          `${payment}`,
                          ``,
                          `Vamos combinar os detalhes? 🌿`,
                        ].join("\n");
                        return `https://wa.me/55${order.consumer_phone!.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-2.5 text-sm font-bold text-green-700 hover:bg-green-100 active:scale-[0.98] transition-all"
                    >
                      💬 Falar no WhatsApp
                    </a>
                  )}
                </div>
              </article>
              );
            })
          )}
        </div>
      )}

      {/* ── PRODUTOS ── */}
      {tab === "products" && (
        <div className="space-y-3">
          {!showForm ? (
            <button
              onClick={startAiFlow}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-4 text-white shadow-card transition-all duration-200 hover:shadow-card-hover hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-125" />
              <span className="relative text-3xl">🧺</span>
              <div className="relative text-center">
                <p className="text-base font-bold leading-tight">Adicionar produto</p>
                <p className="mt-0.5 text-xs text-white/75">A IA analisa a foto e preenche pra você</p>
              </div>
            </button>
          ) : (
            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => { setShowForm(false); setNewPhoto(""); }}>
                ✕ Cancelar
              </Button>
            </div>
          )}

          {showForm && (
            <form onSubmit={addProduct} className="space-y-3 rounded-xl bg-surface p-4 shadow-card animate-fade-in">
              <h3 className="font-semibold text-textPrimary">Novo produto</h3>
              <Input
                placeholder="Nome do produto (ex: Queijo Colonial)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-textSecondary">R$</span>
                <Input
                  placeholder="28,00"
                  inputMode="decimal"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
              <Input
                placeholder="Descrição (opcional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />

              {/* Categoria */}
              <div>
                <p className="mb-2 text-sm font-medium text-textSecondary">Categoria</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setNewCategory(newCategory === cat.value ? "" : cat.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                        newCategory === cat.value
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-border bg-surface text-textSecondary hover:border-primary hover:text-primary hover:bg-primary-subtle"
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foto do produto */}
              <div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProductPhoto(f); }}
                />
                {newPhoto ? (
                  <div className="relative">
                    <Image
                      src={newPhoto}
                      alt="Foto do produto"
                      width={80}
                      height={80}
                      unoptimized
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPhoto("")}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-textSecondary transition hover:border-primary hover:text-primary disabled:opacity-60"
                  >
                    📷 {uploadingPhoto ? "Enviando..." : "Adicionar foto"}
                  </button>
                )}
              </div>

              <Button type="submit" size="sm" className="w-full" disabled={saving || uploadingPhoto}>
                {uploadingPhoto ? "Enviando foto..." : saving ? "Salvando..." : "Salvar produto"}
              </Button>
            </form>
          )}

          {products.length === 0 && !showForm ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <span className="text-5xl">📦</span>
              <p className="text-textSecondary">Nenhum produto cadastrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <article key={product.id} className="rounded-2xl bg-surface p-4 shadow-card">
                  {/* Linha 1: Foto + Info */}
                  <div className="flex gap-3">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-subtle text-3xl">
                      {product.photo_url ? (
                        <Image src={product.photo_url} alt={product.name} width={64} height={64} unoptimized className="h-full w-full object-cover" />
                      ) : (
                        <span>{CATEGORIES.find((c) => c.value === product.category)?.icon ?? "🧀"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-base font-bold text-textPrimary">{product.name}</p>
                      <p className="text-lg font-bold text-primary">
                        R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {product.category && (
                        <span className="text-xs text-textSecondary">
                          {CATEGORIES.find((c) => c.value === product.category)?.icon} {CATEGORIES.find((c) => c.value === product.category)?.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Linha 2: Estoque */}
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-background px-3 py-2">
                    <span className="text-sm font-medium text-textSecondary">🧺 Unidades no cesto</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateStock(product.id, (product.stock ?? 0) - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-border text-lg font-bold text-textPrimary hover:bg-primary/20 active:scale-95"
                      >
                        −
                      </button>
                      <span className="min-w-[2rem] text-center text-lg font-bold text-textPrimary">
                        {product.stock ?? 0}
                      </span>
                      <button
                        onClick={() => updateStock(product.id, (product.stock ?? 0) + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary hover:bg-primary/30 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Linha 3: Disponível / Esgotado (segmented) + lixeira */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex flex-1 gap-1 rounded-xl bg-background p-1">
                      <button
                        onClick={() => !product.is_active && toggleProduct(product.id, false)}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                          product.is_active
                            ? "bg-primary text-white shadow-sm"
                            : "text-textSecondary hover:text-primary"
                        }`}
                      >
                        🧺 Disponível
                      </button>
                      <button
                        onClick={() => product.is_active && toggleProduct(product.id, true)}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                          !product.is_active
                            ? "bg-red-500 text-white shadow-sm"
                            : "text-textSecondary hover:text-red-500"
                        }`}
                      >
                        🪣 Esgotado
                      </button>
                    </div>
                    <button
                      onClick={() => setConfirmDelete({ id: product.id, name: product.name })}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg text-red-500 transition hover:bg-red-100 hover:text-red-700"
                      title="Remover produto"
                    >
                      🗑️
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-card space-y-4 animate-fade-in">
            <span className="block text-center text-4xl">⚠️</span>
            <p className="text-center font-semibold text-textPrimary">
              Tem certeza que quer remover<br />
              <span className="text-primary">"{confirmDelete.name}"</span>?
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </Button>
              <Button size="sm" className="flex-1 !bg-red-600 hover:!bg-red-700" onClick={() => deleteProduct(confirmDelete.id)}>
                Sim, remover
              </Button>
            </div>
          </div>
        </div>
      )}

      <AIProductModal
        open={showAiModal}
        token={getToken() || ""}
        city={producerCity}
        onClose={() => setShowAiModal(false)}
        onPublished={loadData}
        onFallbackManual={(photoUrl) => {
          setShowAiModal(false);
          setShowForm(true);
          if (photoUrl) setNewPhoto(photoUrl);
          toast("IA indisponivel agora. Continue no cadastro manual.", "info");
        }}
      />
    </div>
  );
}
