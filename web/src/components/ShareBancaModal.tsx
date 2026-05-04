"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BancaStoryCard } from "./BancaStoryCard";

export interface ShareProduct {
  name: string;
  price: number;
  photoUrl?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  shortCode: string;
  city?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  coverUrl?: string | null;
  colorPrimary?: string | null;
  products?: ShareProduct[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

/**
 * Converte uma URL de imagem para dataURL usando o proxy do backend.
 * Evita erros de CORS com imagens do DO Spaces.
 */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const proxyUrl = `${API_BASE}/producer/image-proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { credentials: "include" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function ShareBancaModal({
  isOpen,
  onClose,
  name,
  shortCode,
  city,
  bio,
  photoUrl,
  coverUrl,
  colorPrimary,
  products = [],
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [desktopDownloaded, setDesktopDownloaded] = useState(false);

  // Data URLs para o cartaz
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null);
  const [productDataUrls, setProductDataUrls] = useState<(string | null)[]>([]);
  const [captureReady, setCaptureReady] = useState(false);

  const bancaUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/banca/${shortCode}`
      : `https://terra-viva-3n3ko.ondigitalocean.app/banca/${shortCode}`;

  const whatsappText = `OlÃ¡! ðŸŒ± Confira os produtos da nossa banca na feira Terra Viva!\nðŸ‘‰ ${bancaUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setGenerating(false);
      setDesktopDownloaded(false);
      setAvatarDataUrl(null);
      setCoverDataUrl(null);
      setProductDataUrls([]);
      setCaptureReady(false);
    }
  }, [isOpen]);

  async function handleGenerateStory() {
    if (generating) return;
    setGenerating(true);
    setDesktopDownloaded(false);

    try {
      // Busca avatar, capa e fotos de produtos em paralelo via proxy (resolve CORS)
      const [avatar, cover, ...prods] = await Promise.all([
        photoUrl ? toDataUrl(photoUrl) : Promise.resolve(null),
        coverUrl ? toDataUrl(coverUrl) : Promise.resolve(null),
        ...products.slice(0, 6).map((p) =>
          p.photoUrl ? toDataUrl(p.photoUrl) : Promise.resolve(null)
        ),
      ]);

      setAvatarDataUrl(avatar);
      setCoverDataUrl(cover);
      setProductDataUrls(prods);
      setCaptureReady(true);
    } catch {
      setGenerating(false);
    }
  }

  // Quando as data URLs estÃ£o prontas e o card renderizou, capturar
  useEffect(() => {
    if (!captureReady || !cardRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(cardRef.current!, {
          width: 540,
          height: 960,
          pixelRatio: 2,
          cacheBust: true,
        });

        const fetchRes = await fetch(dataUrl);
        const blob = await fetchRes.blob();
        const safeName = name.toLowerCase().replace(/\s+/g, "-");
        const file = new File([blob], `${safeName}-terra-viva.png`, { type: "image/png" });

        // Mobile: Web Share API com arquivo
        if (
          typeof navigator !== "undefined" &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({
            files: [file],
            title: `${name} â€” Terra Viva`,
            text: `ConheÃ§a a banca de ${name} na feira Terra Viva! ðŸŒ±`,
          });
          onClose();
        } else {
          // Desktop: download automÃ¡tico
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `${safeName}-terra-viva.png`;
          link.click();
          setDesktopDownloaded(true);
        }
      } catch (err) {
        console.warn("Share cancelled or failed:", err);
      } finally {
        setGenerating(false);
        setCaptureReady(false);
      }
    }, 150); // aguarda React re-renderizar o BancaStoryCard com as data URLs

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureReady]);

  if (!isOpen) return null;

  // Mosaico: [capa, ...fotos de produto]
  const mosaicPhotos: (string | null)[] = [coverDataUrl, ...productDataUrls];

  // Produtos para o card (mantÃ©m photoDataUrl para os cÃ­rculos decorativos)
  const displayProducts = products.slice(0, 5).map((p, i) => ({
    name: p.name,
    price: p.price,
    photoDataUrl: productDataUrls[i] ?? null,
  }));

  const modal = (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="relative w-full max-w-md rounded-t-3xl bg-white px-5 pb-8 pt-4 shadow-2xl">
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />

        <h3 className="mb-0.5 text-center text-lg font-bold text-textPrimary">
          Divulgar minha banca
        </h3>
        <p className="mb-5 text-center text-sm text-textSecondary">
          Compartilhe seus produtos e leve mais clientes Ã  sua banca ðŸŒ±
        </p>

        <div className="space-y-3">
          {/* â”€â”€ WhatsApp â”€â”€ */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3.5 transition hover:bg-green-100 active:scale-95"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#25d366] shadow-sm">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-textPrimary">WhatsApp</p>
              <p className="text-xs text-textSecondary">Enviar link da banca com texto</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="ml-auto h-4 w-4 text-textSecondary"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </a>

          {/* â”€â”€ Cartaz para Story â”€â”€ */}
          <button
            onClick={handleGenerateStory}
            disabled={generating}
            className="flex w-full items-center gap-4 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3.5 text-left transition hover:bg-purple-100 active:scale-95 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-sm">
              {generating ? (
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-semibold text-textPrimary">
                {generating ? "Gerando cartaz..." : "Cartaz para Story"}
              </p>
              <p className="text-xs text-textSecondary">
                {generating
                  ? "Buscando fotos e gerando imagem..."
                  : "Instagram, Facebook, TikTok e mais"}
              </p>
            </div>
            {!generating && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-auto h-4 w-4 text-textSecondary"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* InstruÃ§Ã£o desktop pÃ³s-download */}
          {desktopDownloaded && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
              âœ… <strong>Cartaz baixado!</strong> Abra o Instagram ou Facebook no seu celular,
              vÃ¡ em <strong>Adicionar Story</strong> e escolha a imagem salva.
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Card off-screen para captura pelo html-to-image â”€â”€ */}
      <div
        aria-hidden
        style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none", zIndex: -1 }}
      >
        <BancaStoryCard
          ref={cardRef}
          name={name}
          city={city}
          bio={bio}
          photoDataUrl={avatarDataUrl}
          colorPrimary={colorPrimary}
          products={displayProducts}
          mosaicPhotos={mosaicPhotos}
          bancaUrl={bancaUrl}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
