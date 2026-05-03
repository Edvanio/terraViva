"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { CATEGORIES, getCategoryIcon } from "@/components/CategoryChip";
import { AIProductModal } from "@/components/AIProductModal";
import { ShareButton } from "@/components/ShareButton";
import PhotoPickerPopup from "@/components/PhotoPickerPopup";
import { parsePrice } from "@/lib/format";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { handleApiError } from "@/lib/clearSession";

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
  status: "pending" | "confirmed" | "collected" | "cancelled" | "fiado";
  pickup_location: string;
  payment_intent: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  photo_url?: string;
  category?: string;
  unit?: string | null;
  color_primary?: string | null;
  color_accent?: string | null;
  is_active: boolean;
  stock?: number | null;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("terra_viva_token");
}

const ARCHIVE_HOURS = 24;
function isArchived(order: Order): boolean {
  if (order.status !== "collected" && order.status !== "cancelled") return false;
  const updated = new Date(order.updated_at).getTime();
  return Date.now() - updated > ARCHIVE_HOURS * 60 * 60 * 1000;
}

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

const PICKUP_LABEL: Record<string, string> = {
  feira: "🏪 Na feira",
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
  const [tab, setTab] = useState<"orders" | "products" | "fiados">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [producerCity, setProducerCity] = useState<string>("");
  const [producerName, setProducerName] = useState<string>("");
  const [bancaShortCode, setBancaShortCode] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const { toast } = useToast();
  const stockDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Formulário novo produto / edição
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("unidade");
  const [newPhoto, setNewPhoto] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!token) return;

    const [ordersRes, productsRes, profileRes] = await Promise.all([
      fetch(`${base}/reservations/producer`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${base}/products/mine`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${base}/producer/profile`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (handleApiError(profileRes) || handleApiError(ordersRes) || handleApiError(productsRes)) return;

    if (profileRes.ok) {
      const profile = await profileRes.json();
      if (!profile.name) {
        router.replace(`/perfil?redirect=${encodeURIComponent("/minha-banca")}`);
        return;
      }
      setProducerCity(profile.city || "");
      setProducerName(profile.name || "");
      setBancaShortCode(profile.short_code ?? null);
    } else {
      router.replace(`/perfil?redirect=${encodeURIComponent("/minha-banca")}`);
      return;
    }

    if (ordersRes.ok) {
      const ordersData = await ordersRes.json();
      setOrders(ordersData);
      const hasPending = ordersData.some((o: Order) => o.status === "pending" || o.status === "confirmed");
      const hasFiados = ordersData.some((o: Order) => o.status === "fiado");
      if (!hasPending && hasFiados) setTab("fiados");
      else if (!hasPending && !hasFiados) setTab("products");
    }
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
    const msgs: Record<string, string> = {
      confirmed: "Pedido confirmado! ✅",
      collected: "Pago e retirado! 🎉",
      fiado: "Anotado no fiado! 📝",
      cancelled: "Pedido cancelado.",
    };
    toast(msgs[status] || "Atualizado!");
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

  function startEdit(product: any) {
    setEditingId(product.id);
    setNewName(product.name);
    setNewPrice(product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
    setNewDesc(product.description ?? "");
    setNewCategory(product.category ?? "");
    setNewUnit(product.unit ?? "unidade");
    setNewPhoto(product.photo_url ?? "");
  }

  function closeEdit() {
    setEditingId(null);
    setNewName(""); setNewPrice(""); setNewDesc(""); setNewPhoto(""); setNewCategory(""); setNewUnit("unidade");
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const token = getToken();
    const payload = {
      name: newName,
      price: parsePrice(newPrice),
      description: newDesc || undefined,
      category: newCategory || undefined,
      unit: newUnit || "unidade",
      photo_url: newPhoto || undefined,
      is_active: true,
    };
    const url = editingId ? `${base}/products/${editingId}` : `${base}/products`;
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const wasEditing = !!editingId;
      setNewName(""); setNewPrice(""); setNewDesc(""); setNewPhoto(""); setNewCategory(""); setNewUnit("unidade");
      setEditingId(null);
      setShowForm(false);
      toast(wasEditing ? "Produto atualizado! ✅" : "Produto adicionado! ✅");
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-border/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!ready) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Minha Banca</h1>
          <p className="text-sm text-textSecondary">Gerencie pedidos e produtos</p>
        </div>
        <div className="flex items-center gap-2">
          {bancaShortCode && products.some((p) => p.is_active) && (
            <ShareButton name={producerName} shortCode={bancaShortCode} />
          )}
          <Link href="/perfil">
            <Button variant="secondary" size="sm">✏️ Editar perfil</Button>
          </Link>
        </div>
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
          📦 Pedidos
          {orders.filter((o) => o.status === "pending").length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
              {orders.filter((o) => o.status === "pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("fiados")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
            tab === "fiados"
              ? "bg-surface text-amber-600 shadow-card"
              : "text-textSecondary hover:text-textPrimary"
          }`}
        >
          📝 Fiados
          {orders.filter((o) => o.status === "fiado").length > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">
              {orders.filter((o) => o.status === "fiado").length}
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
          🧀 Produtos
        </button>
      </div>

      {/* ── PEDIDOS ── */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.filter((o) => !isArchived(o)).length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <span className="text-5xl">📭</span>
              <p className="text-textSecondary">Nenhum pedido recebido ainda.</p>
              <p className="text-sm text-textSecondary">Quando alguém pedir, aparece aqui. 🌿</p>
            </div>
          ) : (
            orders.filter((o) => !isArchived(o)).map((order) => {
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
                      <p className="mt-0.5 line-clamp-1 text-sm text-textSecondary">{order.product_description}</p>
                    )}

                    {/* Preço destaque */}
                    <p className="mt-2 text-xl font-bold text-primary">
                      R$ {order.total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-primary-subtle px-2.5 py-0.5 text-sm font-semibold text-primary">
                      📦 {order.quantity}x {order.product_name.split(" ")[0]}
                    </span>

                    {/* Quem pediu + entrega + pagamento */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                        🧑‍🌾 {displayName}
                      </span>
                      <span className="rounded-full bg-background px-2 py-0.5 text-sm text-textSecondary">
                        {PICKUP_LABEL[order.pickup_location] ?? order.pickup_location}
                      </span>
                      <span className="rounded-full bg-background px-2 py-0.5 text-sm text-textSecondary">
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
                      <Button size="lg" className="flex-1 py-3" onClick={() => updateOrderStatus(order.id, "confirmed")}>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateOrderStatus(order.id, "collected")}
                        className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors"
                      >
                        Pago
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, "fiado")}
                        className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
                      >
                        Fiado
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                        className="flex-1 rounded-xl bg-red-100 py-2.5 text-sm font-bold text-red-600 hover:bg-red-200 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* WhatsApp */}
                  {order.consumer_phone && (
                    <a
                      href={(() => {
                        const pickup = { feira: "🏪 Na feira", produtor: "🏡 Buscar no produtor", entrega: "🚗 Entrega em casa" }[order.pickup_location] ?? order.pickup_location;
                        const payment = { cash: "💵 Dinheiro", pix: "📲 Pix", card: "💳 Cartão" }[order.payment_intent] ?? order.payment_intent;
                        const msg = [
                          `Olá${order.consumer_name ? `, *${order.consumer_name}*` : "!"}! 👋`,
                          ``,
                          `Sou *${producerName || "produtor"}* do *Terra Viva*. Recebi seu pedido:`,
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

          {orders.some((o) => isArchived(o)) && (
            <Link
              href="/minha-banca/arquivados"
              className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-textSecondary hover:bg-background transition-colors"
            >
              🌾 Arquivados
            </Link>
          )}
        </div>
      )}


      {/* ── FIADOS ── */}
      {tab === "fiados" && (
        <div className="space-y-4">
          {orders.filter((o) => o.status === "fiado").length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <span className="text-5xl">🎉</span>
              <p className="font-medium text-textPrimary">Nenhum fiado pendente!</p>
              <p className="text-sm text-textSecondary">Quando anotar um fiado, aparece aqui.</p>
            </div>
          ) : (
            (() => {
              const fiados = orders.filter((o) => o.status === "fiado");
              const grouped: Record<string, Order[]> = {};
              fiados.forEach((o) => {
                const key = o.consumer_name || "Cliente";
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(o);
              });
              return Object.entries(grouped).map(([name, items]) => {
                const total = items.reduce((s, o) => s + o.total_price, 0);
                return (
                  <div key={name} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-textPrimary">🧑‍🌾 {name}</h4>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
                        R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-textPrimary truncate">{item.product_name}</p>
                            <p className="text-xs text-textSecondary">
                              {new Date(item.updated_at).toLocaleDateString("pt-BR")} · {item.quantity}x · R$ {item.total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <button
                            onClick={() => updateOrderStatus(item.id, "collected")}
                            className="ml-3 flex-shrink-0 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors"
                          >
                            💰 Recebi
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()
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
                <p className="mt-0.5 text-sm text-white/75">A IA analisa a foto e preenche pra você</p>
              </div>
            </button>
          ) : (
            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => { setShowForm(false); setNewName(""); setNewPrice(""); setNewDesc(""); setNewPhoto(""); setNewCategory(""); setNewUnit("unidade"); }}>
                ✕ Cancelar
              </Button>
            </div>
          )}

          {showForm && (
            <form onSubmit={addProduct} className="space-y-3 rounded-xl bg-surface p-4 shadow-card animate-fade-in">
              <h3 className="font-semibold text-textPrimary">{editingId ? "Editar produto" : "Novo produto"}</h3>
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
                <p className="mb-2 text-sm font-medium text-textSecondary">Unidade</p>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full h-[42px] rounded-xl border border-border bg-background px-3 text-sm appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8"
                >
                  <option value="unidade">Unidade</option>
                  <option value="kg">Kg</option>
                  <option value="g">Gramas</option>
                  <option value="litro">Litro</option>
                  <option value="ml">ml</option>
                  <option value="duzia">Dúzia</option>
                  <option value="pe">Pé</option>
                  <option value="bandeja">Bandeja</option>
                  <option value="pote">Pote</option>
                  <option value="fatia">Fatia</option>
                  <option value="pacote">Pacote</option>
                  <option value="saco">Saco</option>
                  <option value="maco">Maço</option>
                </select>
              </div>

              {/* Foto do produto */}
              <div>
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
                  <PhotoPickerPopup onFileSelected={uploadProductPhoto} disabled={uploadingPhoto}>
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-textSecondary transition hover:border-primary hover:text-primary disabled:opacity-60"
                    >
                      📷 {uploadingPhoto ? "Enviando..." : "Adicionar foto"}
                    </button>
                  </PhotoPickerPopup>
                )}
              </div>

              <Button type="submit" size="sm" className="w-full" disabled={saving || uploadingPhoto}>
                {uploadingPhoto ? "Enviando foto..." : saving ? "Salvando..." : editingId ? "Atualizar produto" : "Salvar produto"}
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
                <article key={product.id} onClick={() => startEdit(product)} className="cursor-pointer rounded-2xl bg-surface p-4 shadow-card transition hover:ring-2 hover:ring-primary/30">
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
                      {product.description && (
                        <p className="truncate text-sm text-textSecondary">{product.description}</p>
                      )}
                      <p className="text-lg font-bold text-primary">
                        R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{product.unit && <span className="text-sm font-semibold text-textSecondary">/{product.unit}</span>}
                      </p>
                      {product.category && (
                        <span className="text-sm text-textSecondary">
                          {CATEGORIES.find((c) => c.value === product.category)?.icon} {CATEGORIES.find((c) => c.value === product.category)?.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Linha 2: Estoque */}
                  <div onClick={(e) => e.stopPropagation()} className="mt-3 flex items-center justify-between rounded-xl bg-background px-3 py-2">
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
                  <div onClick={(e) => e.stopPropagation()} className="mt-3 flex items-center gap-2">
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

      {/* Modal de edição de produto */}
      {editingId && createPortal(
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[99999] flex items-start sm:items-center justify-center bg-black/60 sm:overflow-y-auto sm:p-4">
          <form onSubmit={addProduct} className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] overflow-y-auto sm:rounded-2xl sm:border sm:border-border/50 bg-surface px-4 pt-3 pb-6 sm:p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-textPrimary">✏️ Editar produto</h3>
              <button type="button" onClick={closeEdit} className="text-textSecondary text-xl leading-none">✕</button>
            </div>
            <Input
              placeholder="Nome do produto"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
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
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="h-[42px] rounded-xl border border-border bg-background px-3 text-sm appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8"
              >
                <option value="unidade">Unidade</option>
                <option value="kg">Kg</option>
                <option value="g">Gramas</option>
                <option value="litro">Litro</option>
                <option value="ml">ml</option>
                <option value="duzia">Dúzia</option>
                <option value="pe">Pé</option>
                <option value="bandeja">Bandeja</option>
                <option value="pote">Pote</option>
                <option value="fatia">Fatia</option>
                <option value="pacote">Pacote</option>
                <option value="saco">Saco</option>
                <option value="maco">Maço</option>
              </select>
            </div>
            <Input
              placeholder="Descrição (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />

            {/* Categoria */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-textSecondary">Categoria</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setNewCategory(newCategory === cat.value ? "" : cat.value)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                      newCategory === cat.value
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border bg-surface text-textSecondary"
                    }`}
                  >
                    <span className="text-sm">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Foto */}
            <div className="flex items-center gap-3">
              {newPhoto ? (
                <div className="relative">
                  <Image
                    src={newPhoto}
                    alt="Foto do produto"
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPhoto("")}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <PhotoPickerPopup onFileSelected={uploadProductPhoto} disabled={uploadingPhoto}>
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-textSecondary transition hover:border-primary hover:text-primary disabled:opacity-60"
                  >
                    📷 {uploadingPhoto ? "Enviando..." : "Foto"}
                  </button>
                </PhotoPickerPopup>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2 sticky bottom-0 bg-surface pb-1">
              <Button type="submit" size="sm" className="flex-1 py-2.5" disabled={saving || uploadingPhoto}>
                {saving ? "Salvando..." : "✅ Salvar"}
              </Button>
              <Button type="button" size="sm" variant="secondary" className="flex-1 py-2.5" onClick={closeEdit}>
                ✕ Cancelar
              </Button>
              <button
                type="button"
                onClick={() => { closeEdit(); setConfirmDelete({ id: editingId, name: newName }); }}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-lg text-red-600 transition hover:bg-red-100"
              >
                🗑️
              </button>
            </div>
          </form>
        </div>
      , document.body)}

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
