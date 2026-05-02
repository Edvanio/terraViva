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
import { parsePrice } from "@/lib/format";

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
  is_active: boolean;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("terra_viva_token");
}

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

const PICKUP_LABEL: Record<string, string> = {
  feira: "Retirada na feira",
  produtor: "Retirar no local",
};
const PAYMENT_LABEL: Record<string, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  card: "Cartão",
};

export default function MinhaBancaPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

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

    if (ordersRes.ok) setOrders(await ordersRes.json());
    if (productsRes.ok) setProducts(await productsRes.json());
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

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
    const token = getToken();
    await fetch(`${base}/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !isActive }),
    });
    toast(isActive ? "Produto marcado como esgotado." : "Produto disponível! ✅");
    await loadData();
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
        <p className="text-textSecondary">Crie seu perfil para disponibilizar produtos na feira.</p>
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
              <p className="text-sm text-textSecondary">Quando alguém reservar, aparece aqui. 📦</p>
            </div>
          ) : (
            orders.map((order) => {
              const displayName = order.consumer_name && !/^\d+$/.test(order.consumer_name)
                ? order.consumer_name
                : order.consumer_phone
                  ? order.consumer_phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
                  : "Consumidor";
              return (
              <article key={order.id} className="rounded-xl bg-surface p-4 shadow-card animate-fade-in">
                <div className="flex gap-3">
                  {/* Foto do produto */}
                  {order.product_photo_url ? (
                    <Image
                      src={order.product_photo_url}
                      alt={order.product_name}
                      width={72}
                      height={72}
                      unoptimized
                      className="h-[72px] w-[72px] flex-shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-xl bg-background text-3xl">
                      {getCategoryIcon(order.product_category)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Título + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-textPrimary truncate">{order.product_name}</p>
                        {order.product_description && (
                          <p className="line-clamp-1 text-xs text-textSecondary">{order.product_description}</p>
                        )}
                      </div>
                      <Badge status={order.status} />
                    </div>

                    {/* Qtd e valor */}
                    <p className="mt-1 text-sm font-medium text-textPrimary">
                      {order.quantity}x · R$ {order.total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>

                    {/* Consumidor */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                        👤
                      </div>
                      <span className="text-xs text-textSecondary">{displayName}</span>
                    </div>

                    {/* Tags */}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-background px-2 py-0.5 text-xs text-textSecondary">
                        📍 {PICKUP_LABEL[order.pickup_location] ?? order.pickup_location}
                      </span>
                      <span className="rounded-full bg-background px-2 py-0.5 text-xs text-textSecondary">
                        💳 {PAYMENT_LABEL[order.payment_intent] ?? order.payment_intent}
                      </span>
                    </div>
                  </div>
                </div>

                {order.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => updateOrderStatus(order.id, "confirmed")}>
                      ✅ Confirmar
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1" onClick={() => updateOrderStatus(order.id, "cancelled")}>
                      ✕ Cancelar
                    </Button>
                  </div>
                )}
                {order.status === "confirmed" && (
                  <div className="mt-3">
                    <Button size="sm" className="w-full" onClick={() => updateOrderStatus(order.id, "collected")}>
                      🎉 Marcar como retirado
                    </Button>
                  </div>
                )}
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
            <Button onClick={() => setShowForm(true)} className="w-full">
              + Adicionar produto
            </Button>
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
            <div className="space-y-2">
              {products.map((product) => (
                <article key={product.id} className="flex items-center gap-4 rounded-xl bg-surface px-4 py-3 shadow-card">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-subtle text-2xl">
                    {product.photo_url ? (
                      <Image src={product.photo_url} alt={product.name} width={48} height={48} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <span>{CATEGORIES.find((c) => c.value === product.category)?.icon ?? "🧀"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-textPrimary">{product.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      {product.category && (
                        <span className="rounded-full bg-background px-2 py-0.5 text-[11px] text-textSecondary">
                          {CATEGORIES.find((c) => c.value === product.category)?.icon} {CATEGORIES.find((c) => c.value === product.category)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleProduct(product.id, product.is_active)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        product.is_active
                          ? "bg-primary-subtle text-primary"
                          : "bg-border text-textSecondary"
                      }`}
                    >
                      {product.is_active ? "✅ Disponível" : "Esgotado"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ id: product.id, name: product.name })}
                      className="text-textSecondary transition hover:text-red-600"
                      title="Remover produto"
                    >
                      🗑
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
    </div>
  );
}
