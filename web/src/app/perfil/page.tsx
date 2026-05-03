"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPhone } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { ShareButton } from "@/components/ShareButton";
import PhotoPickerPopup from "@/components/PhotoPickerPopup";
import { clearSession } from "@/lib/clearSession";

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
  name: string;
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
  name: "",
  city: "",
  bio: "",
  address: "",
  pix_key: "",
  payment_methods: ["cash", "pix"],
  phone: "",
  photo_url: null,
  cover_url: null,
};

export default function PerfilPage() {
  return (
    <Suspense fallback={null}>
      <PerfilContent />
    </Suspense>
  );
}

function PerfilContent() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<ProfileData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [geoHint, setGeoHint] = useState<{ city: string | null; state: string | null } | null>(null);
  const { toast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

  function getPhoneFromToken(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.phone ?? "";
    } catch { return ""; }
  }

  useEffect(() => {
    if (!ready) return;
    const token = getToken();
    if (!token) { router.replace("/login"); return; }

    fetch(`${base}/producer/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) { clearSession(); return; }
        if (res.status === 404) {
          setForm({ ...EMPTY, phone: formatPhone(getPhoneFromToken(token)) });
          setIsNew(true);
          setLoading(false);
          setLoaded(true);
          return;
        }
        const data = await res.json();
        const tokenPhone = getPhoneFromToken(token);
        setForm({
          name: data.name ?? "",
          city: data.city ?? "",
          bio: data.bio ?? "",
          address: data.address ?? "",
          pix_key: data.pix_key ?? "",
          payment_methods: data.payment_methods ?? ["cash"],
          phone: formatPhone(data.phone || tokenPhone),
          photo_url: data.photo_url ?? null,
          cover_url: data.cover_url ?? null,
        });
        setShortCode(data.short_code ?? null);
        setLoading(false);
        setLoaded(true);
      })
      .catch(() => setLoading(false));
  }, [base, ready]);

  useEffect(() => {
    const address = form.address?.trim();
    if (!address || address.length < 6) {
      setGeoHint(null);
      return;
    }

    const token = getToken();
    if (!token) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${base}/producer/geocode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ address }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.city || data?.state) {
          setGeoHint({ city: data.city ?? null, state: data.state ?? null });
          const cityState = [data.city, data.state].filter(Boolean).join(", ");
          if (cityState) setForm((prev) => ({ ...prev, city: cityState }));
        }
      } catch {
        // sem bloqueio da UX
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [form.address, base]);

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

  async function handleAvatarChange(file: File) {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        setForm((prev) => ({ ...prev, photo_url: url }));
        // Salva imediatamente no backend
        const token = getToken();
        if (token) {
          await fetch(`${base}/producer/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ photo_url: url }),
          });
        }
      }
      toast("Foto de perfil atualizada! ✅");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao enviar foto.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleCoverChange(file: File) {
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        setForm((prev) => ({ ...prev, cover_url: url }));
        // Salva imediatamente no backend
        const token = getToken();
        if (token) {
          await fetch(`${base}/producer/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ cover_url: url }),
          });
        }
      }
      toast("Foto de capa atualizada! ✅");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao enviar capa.", "error");
    } finally {
      setUploadingCover(false);
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

  // Auto-save com debounce
  const paymentMethodsKey = JSON.stringify(form.payment_methods);
  useEffect(() => {
    if (!loaded) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      saveProfile();
    }, 1500);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [form.name, form.bio, form.address, form.city, paymentMethodsKey, loaded]);

  async function saveProfile() {
    const token = getToken();
    if (!token) return;
    if (!form.name?.trim()) return;

    setSaving(true);
    const payload = {
      name: form.name,
      city: form.city ?? "",
      bio: form.bio ?? "",
      payment_methods: form.payment_methods,
      ...(form.photo_url ? { photo_url: form.photo_url } : {}),
      ...(form.cover_url ? { cover_url: form.cover_url } : {}),
      ...(form.address ? { address: form.address } : {}),
    };

    try {
      const res = await fetch(`${base}/producer/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      setIsNew(false);
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.replace(redirect);
      }
    } catch {
      toast("Não conseguimos salvar. Tente de novo.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

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
      <PhotoPickerPopup onFileSelected={handleCoverChange} disabled={uploadingCover}>
        <div
          className="relative h-36 w-full cursor-pointer overflow-hidden rounded-2xl shadow-card"
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
            <div className="relative h-full w-full bg-gradient-to-br from-[#2d6b4f] via-[#3a7d5c] to-[#8fbc8f]">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.3),transparent_50%),radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_50%)]" />
              <div className="flex h-full w-full items-center justify-center gap-2 text-white/70">
                <span className="text-3xl">🌿</span>
                <span className="text-sm font-medium">Clique para adicionar foto de fundo</span>
              </div>
            </div>
          )}

          {/* Overlay escuro + ícone de câmera */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/25">
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-textPrimary opacity-0 shadow transition hover:opacity-100 group-hover:opacity-100">
              {uploadingCover ? "Enviando..." : "Alterar capa"}
            </span>
          </div>

          {/* Botão sempre visível no canto */}
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-textPrimary shadow-sm transition hover:bg-white"
          >
            {uploadingCover ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span>📷</span>
            )}
            {uploadingCover ? "Enviando..." : form.cover_url ? "Alterar capa" : "Adicionar capa"}
          </div>
        </div>
      </PhotoPickerPopup>

      {/* ── AVATAR + NOME ── */}
      <div className="flex items-end gap-4 -mt-8 px-2">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <PhotoPickerPopup onFileSelected={handleAvatarChange} disabled={uploadingPhoto}>
            <div
              className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-primary shadow-card"
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
          </PhotoPickerPopup>

          {/* Botão de câmera fixo */}
          <div
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-white shadow"
          >
            📷
          </div>
        </div>

        {/* Nome/cidade */}
        <div className="pb-1">
          <h1 className="text-xl font-bold text-textPrimary">
            {form.name || "Meu Perfil"}
          </h1>
          <p className="text-sm text-textSecondary">
            {isNew
              ? "Preencha seu perfil para começar a vender"
              : "Suas informações aparecem na banca e nos pedidos"}
          </p>
          {!isNew && shortCode && form.name && (
            <div className="mt-2">
              <ShareButton name={form.name} shortCode={shortCode} />
            </div>
          )}
        </div>
      </div>

      {/* ── FORMULÁRIO ── */}
      <div className="space-y-5 rounded-2xl bg-surface p-6 shadow-card">

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textPrimary">
            Seu nome
          </label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Maria Oliveira ou Família Wessler"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-textPrimary">
            Endereço
          </label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Rua / localidade — para retirada no sítio"
            required
          />
          {geoHint?.city || geoHint?.state ? (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
                📍 {geoHint.city ?? "Cidade"}{geoHint.state ? `, ${geoHint.state}` : ""}
              </span>
            </div>
          ) : null}
        </div>

        {(form.city || geoHint?.city) && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-textPrimary">
              Cidade / Estado
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-border/30 px-3 py-2.5">
              <span className="text-base">📍</span>
              <span className="flex-1 text-sm text-textPrimary">{form.city || `${geoHint?.city ?? ""}${geoHint?.state ? `, ${geoHint.state}` : ""}`}</span>
              <span className="text-sm text-textSecondary">detectado via IA</span>
            </div>
          </div>
        )}

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
          <div className="flex items-center gap-2 rounded-xl border border-border bg-border/30 px-3 py-2.5">
            <span className="text-base">🔒</span>
            <span className="flex-1 text-sm text-textPrimary">{form.phone}</span>
            <span className="text-sm text-textSecondary">número de login</span>
          </div>
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

        {saving && (
          <p className="text-center text-xs text-textSecondary animate-pulse">Salvando...</p>
        )}
      </div>
    </div>
  );
}
