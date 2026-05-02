"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPhone } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";

const PAYMENT_OPTIONS = [
  { value: "cash", label: "💵 Dinheiro" },
  { value: "pix", label: "📲 Pix" },
  { value: "card", label: "💳 Cartão" },
];

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("terra_viva_token");
}

interface ProfileData {
  city: string;
  bio: string;
  address: string;
  pix_key: string;
  payment_methods: string[];
  phone: string;
  photo_url: string | null;
  cover_url: string | null;
}

const EMPTY: ProfileData = {
  city: "",
  bio: "",
  address: "",
  pix_key: "",
  payment_methods: ["cash"],
  phone: "",
  photo_url: null,
  cover_url: null,
};

export default function PerfilPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { toast } = useToast();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

  function getPhoneFromToken(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.phone ?? "";
    } catch { return ""; }
  }

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }

    fetch(`${base}/producer/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 404) {
          setForm({ ...EMPTY, phone: formatPhone(getPhoneFromToken(token)) });
          setIsNew(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setForm({
          city: data.city ?? "",
          bio: data.bio ?? "",
          address: data.address ?? "",
          pix_key: data.pix_key ?? "",
          payment_methods: data.payment_methods ?? ["cash"],
          phone: formatPhone(data.phone ?? ""),
          photo_url: data.photo_url ?? null,
          cover_url: data.cover_url ?? null,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [base]);

  async function uploadFile(file: File): Promise<string | null> {
    const token = getToken();
    if (!token) return null;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${base}/producer/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? "Erro no upload");
    }
    const { url } = await res.json();
    return url as string;
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadFile(file);
      if (url) setForm((prev) => ({ ...prev, photo_url: url }));
      toast("Foto de perfil atualizada! ✅");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao enviar foto.", "error");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      if (url) setForm((prev) => ({ ...prev, cover_url: url }));
      toast("Foto de capa atualizada! ✅");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao enviar capa.", "error");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  }

  function togglePayment(value: string) {
    setForm((prev) => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(value)
        ? prev.payment_methods.filter((p) => p !== value)
        : [...prev.payment_methods, value],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const token = getToken();
    if (!token) { setSaving(false); return; }

    const method = isNew ? "POST" : "PUT";
    const payload = {
      city: form.city,
      bio: form.bio ?? "",
      payment_methods: form.payment_methods,
      phone: form.phone ?? "",
      ...(form.photo_url ? { photo_url: form.photo_url } : {}),
      ...(form.cover_url ? { cover_url: form.cover_url } : {}),
      ...(form.address ? { address: form.address } : {}),
      ...(form.pix_key ? { pix_key: form.pix_key } : {}),
    };

    try {
      const res = await fetch(`${base}/producer/profile`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      setIsNew(false);
      toast("Perfil salvo com sucesso! ✅");
    } catch {
      toast("Não conseguimos salvar. Tente de novo.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-textSecondary">Carregando perfil...</p>
      </div>
    );
  }

  const initial = form.city?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="mx-auto max-w-xl space-y-6">

      {/* ── FOTO DE CAPA ── */}
      <div
        className="relative h-36 w-full cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 shadow-card"
        onClick={() => coverInputRef.current?.click()}
      >
        {form.cover_url ? (
          <Image
            src={form.cover_url}
            alt="Foto de capa"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 576px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center gap-2 text-primary/60">
            <span className="text-3xl">🌿</span>
            <span className="text-sm font-medium">Clique para adicionar foto de fundo</span>
          </div>
        )}

        {/* Overlay escuro + ícone de câmera */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/25">
          <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-textPrimary opacity-0 shadow transition hover:opacity-100 group-hover:opacity-100">
            {uploadingCover ? "Enviando..." : "Alterar capa"}
          </span>
        </div>

        {/* Botão sempre visível no canto */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
          className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-textPrimary shadow-sm transition hover:bg-white"
          disabled={uploadingCover}
        >
          {uploadingCover ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <span>📷</span>
          )}
          {uploadingCover ? "Enviando..." : form.cover_url ? "Alterar capa" : "Adicionar capa"}
        </button>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleCoverChange}
        />
      </div>

      {/* ── AVATAR + NOME ── */}
      <div className="flex items-end gap-4 -mt-8 px-2">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-primary shadow-card"
            onClick={() => avatarInputRef.current?.click()}
          >
            {form.photo_url ? (
              <Image
                src={form.photo_url}
                alt="Foto de perfil"
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                {initial}
              </span>
            )}

            {/* Camera overlay no hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/40">
              <span className="text-xl opacity-0 transition hover:opacity-100">📷</span>
            </div>

            {uploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="animate-spin text-white">⏳</span>
              </div>
            )}
          </div>

          {/* Botão de câmera fixo */}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-white shadow hover:bg-primary/90"
            disabled={uploadingPhoto}
          >
            📷
          </button>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Nome/cidade */}
        <div className="pb-1">
          <h1 className="text-xl font-bold text-textPrimary">
            {form.city || "Meu Perfil"}
          </h1>
          <p className="text-sm text-textSecondary">
            {isNew
              ? "Preencha seu perfil para aparecer na feira"
              : "Suas informações aparecem na banca e nos pedidos"}
          </p>
        </div>
      </div>

      {/* ── FORMULÁRIO ── */}
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-surface p-6 shadow-card">

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textPrimary">
            Nome da banca / cidade
          </label>
          <Input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Ex: Sítio da Família Wessler"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textPrimary">
            Nossa história
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Conte um pouco sobre você, sua família e seus produtos..."
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-textPrimary placeholder:text-textSecondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textPrimary">
            Telefone / WhatsApp
          </label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
            placeholder="(48) 9 9999-9999"
            type="tel"
            inputMode="numeric"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-textPrimary">
            Formas de pagamento aceitas
          </label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const active = form.payment_methods.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => togglePayment(opt.value)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-background text-textSecondary hover:border-primary hover:text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {form.payment_methods.includes("pix") && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-textPrimary">
              Chave Pix
            </label>
            <Input
              value={form.pix_key}
              onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textPrimary">
            Endereço (opcional)
          </label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Rua / localidade — para retirada no sítio"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? "Salvando..." : isNew ? "Criar perfil" : "Salvar alterações"}
        </Button>
      </form>
    </div>
  );
}
