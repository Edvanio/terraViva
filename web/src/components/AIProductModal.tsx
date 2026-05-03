"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CATEGORIES } from "@/components/CategoryChip";
import { AIProductSteps } from "@/components/AIProductSteps";
import { parsePrice } from "@/lib/format";

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

interface AIResult {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  unit?: string | null;
  color_primary?: string | null;
  color_accent?: string | null;
  suggested_price?: number | null;
  suggested_price_note?: string | null;
  original_photo_url: string;
  enhanced_photo_url?: string | null;
}

interface Props {
  open: boolean;
  token: string;
  city?: string | null;
  onClose: () => void;
  onPublished: () => Promise<void> | void;
  onFallbackManual: (photoUrl?: string) => void;
}

export function AIProductModal({ open, token, city, onClose, onPublished, onFallbackManual }: Props) {
  const [phase, setPhase] = useState<"picker" | "loading" | "editor">("picker");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<AIResult | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<"original" | "enhanced">("enhanced");
  const [useColors, setUseColors] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPhase("picker");
    setUploading(false);
    setSaving(false);
    setStepIndex(0);
    setResult(null);
    setSelectedPhoto("enhanced");
    setUseColors(true);
    setName("");
    setDescription("");
    setCategory("");
    setUnit("");
    setPrice("");
  }, [open]);

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, 6));
    }, 1200 + Math.round(Math.random() * 600));
    return () => clearInterval(timer);
  }, [phase]);

  const effectivePhoto = useMemo(() => {
    if (!result) return "";
    if (selectedPhoto === "enhanced" && result.enhanced_photo_url) return result.enhanced_photo_url;
    return result.original_photo_url;
  }, [result, selectedPhoto]);

  async function uploadAndGenerate(file: File) {
    setUploading(true);
    const startedAt = Date.now();

    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch(`${base}/producer/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!uploadRes.ok) throw new Error("upload_failed");
      const { url } = await uploadRes.json();

      setPhase("loading");

      const aiRes = await fetch(`${base}/products/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photo_url: url, city: city || undefined }),
      });

      if (!aiRes.ok) throw new Error("ai_failed");
      const data: AIResult = await aiRes.json();

      const elapsed = Date.now() - startedAt;
      const minWait = 7000;
      if (elapsed < minWait) {
        await new Promise((r) => setTimeout(r, minWait - elapsed));
      }

      setStepIndex(7);
      setResult(data);
      setName(data.name || "");
      setDescription(data.description || "");
      setCategory(data.category || "outros");
      setUnit(data.unit || "unidade");
      setPrice(data.suggested_price ? String(data.suggested_price.toFixed(2).replace(".", ",")) : "");
      setSelectedPhoto(data.enhanced_photo_url ? "enhanced" : "original");
      setPhase("editor");
    } catch {
      onFallbackManual(undefined);
      onClose();
    } finally {
      setUploading(false);
    }
  }

  async function publish() {
    if (!result) return;
    setSaving(true);
    try {
      const payload = {
        name,
        description: description || undefined,
        category: category || "outros",
        unit: unit || "unidade",
        price: parsePrice(price),
        photo_url: effectivePhoto || result.original_photo_url,
        color_primary: useColors ? result.color_primary || undefined : undefined,
        color_accent: useColors ? result.color_accent || undefined : undefined,
        is_active: true,
      };

      const createRes = await fetch(`${base}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) throw new Error("save_failed");
      await onPublished();
      onClose();
    } catch {
      onFallbackManual(result.original_photo_url);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4">
      <div className="mx-auto max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl bg-surface p-5 shadow-card">
        {phase === "picker" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-textPrimary">Cadastro inteligente com IA</h3>
            <p className="text-sm text-textSecondary">Tire uma foto do seu produto colonial ou escolha uma da galeria.</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAndGenerate(file);
              }}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAndGenerate(file);
              }}
            />
            <Button onClick={() => inputRef.current?.click()} className="w-full" disabled={uploading}>
              {uploading ? "Enviando foto..." : "📷 Tirar foto do produto"}
            </Button>
            <Button variant="secondary" onClick={() => galleryRef.current?.click()} className="w-full" disabled={uploading}>
              🖼️ Escolher da galeria
            </Button>
            <button onClick={onClose} className="w-full rounded-xl border border-border py-3 text-sm font-medium text-textSecondary hover:bg-background transition-colors">
              Cancelar
            </button>
          </div>
        )}

        {phase === "loading" && (
          <div className="rounded-2xl bg-surface border border-border p-5">
            <h3 className="mb-1 text-lg font-bold text-primary">🌱 IA montando seu produto</h3>
            <p className="mb-4 text-sm text-textSecondary">Estamos analisando sua foto e preparando seu anúncio.</p>
            <AIProductSteps stepIndex={stepIndex} />
          </div>
        )}

        {phase === "editor" && result && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-textPrimary">Revise antes de publicar</h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedPhoto("original")}
                className={`rounded-full px-3 py-1 text-sm ${selectedPhoto === "original" ? "bg-primary text-white" : "bg-background text-textSecondary"}`}
              >
                Foto original
              </button>
              <button
                type="button"
                onClick={() => setSelectedPhoto("enhanced")}
                disabled={!result.enhanced_photo_url}
                className={`rounded-full px-3 py-1 text-sm ${selectedPhoto === "enhanced" ? "bg-primary text-white" : "bg-background text-textSecondary"} disabled:opacity-50`}
              >
                Foto melhorada
              </button>
            </div>
            <div className="relative h-44 w-full overflow-hidden rounded-xl bg-background">
              <Image src={effectivePhoto} alt="Preview" fill className="object-cover" unoptimized />
            </div>

            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preco" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              rows={3}
              placeholder="Descricao"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
              ))}
            </select>

            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
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

            <label className="flex items-center gap-2 text-sm text-textPrimary">
              <input type="checkbox" checked={useColors} onChange={(e) => setUseColors(e.target.checked)} />
              Usar paleta sugerida no card
            </label>

            {result.suggested_price_note ? (
              <p className="text-xs text-textSecondary">{result.suggested_price_note}</p>
            ) : null}

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  if (window.confirm("Descartar este cadastro?")) onClose();
                }}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={publish} disabled={saving || !name || !price}>
                {saving ? "Publicando..." : "Publicar produto"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
