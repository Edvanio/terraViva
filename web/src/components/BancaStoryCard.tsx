"use client";

import React, { forwardRef } from "react";

export interface StoryProduct {
  name: string;
  price: number;
  photoDataUrl?: string | null;
}

export interface BancaStoryCardProps {
  name: string;
  city?: string | null;
  bio?: string | null;
  photoDataUrl?: string | null;
  colorPrimary?: string | null;
  products: StoryProduct[];
  bancaUrl: string;
  /** Fotos para o mosaico: [cover, ...fotosDosProdutos] */
  mosaicPhotos: (string | null)[];
}

const W = 540;
const H = 960;
const MOSAIC_H = 500;

function PhotoMosaic({ photos, width, height }: { photos: string[]; width: number; height: number }) {
  const n = Math.min(photos.length, 6);

  const img = (src: string, style: React.CSSProperties, key: number) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={key} src={src} alt="" style={{ objectFit: "cover", display: "block", ...style }} />
  );

  if (n === 0) {
    return (
      <div style={{
        width,
        height,
        background: "linear-gradient(155deg, #0d2e1c 0%, #1e5c3a 40%, #0b2217 100%)",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            "radial-gradient(circle at 20% 30%, rgba(74,222,128,0.08) 0%, transparent 45%)",
            "radial-gradient(circle at 80% 70%, rgba(74,222,128,0.06) 0%, transparent 40%)",
          ].join(","),
        }} />
      </div>
    );
  }

  if (n === 1) return img(photos[0], { width, height }, 0);

  if (n === 2) return (
    <div style={{ width, height, display: "flex", gap: 3 }}>
      {photos.slice(0, 2).map((s, i) => img(s, { flex: 1, height }, i))}
    </div>
  );

  if (n === 3) return (
    <div style={{ width, height, display: "flex", gap: 3 }}>
      {img(photos[0], { width: "58%", height }, 0)}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {img(photos[1], { width: "100%", flex: 1 }, 1)}
        {img(photos[2], { width: "100%", flex: 1 }, 2)}
      </div>
    </div>
  );

  if (n === 4) return (
    <div style={{ width, height, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 3 }}>
      {photos.slice(0, 4).map((s, i) => img(s, { width: "100%", height: "100%" }, i))}
    </div>
  );

  if (n === 5) return (
    <div style={{ width, height, display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ height: "55%", display: "flex", gap: 3 }}>
        {img(photos[0], { width: "60%", height: "100%" }, 0)}
        {img(photos[1], { flex: 1, height: "100%" }, 1)}
      </div>
      <div style={{ flex: 1, display: "flex", gap: 3 }}>
        {photos.slice(2, 5).map((s, i) => img(s, { flex: 1, height: "100%" }, i + 2))}
      </div>
    </div>
  );

  // 6 fotos: grade 3x2
  return (
    <div style={{ width, height, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 3 }}>
      {photos.slice(0, 6).map((s, i) => img(s, { width: "100%", height: "100%" }, i))}
    </div>
  );
}

/**
 * Cartaz Story 540x960 (pixelRatio 2 => 1080x1920 exportado).
 * Renderizado off-screen e capturado por html-to-image.
 * Usa apenas inline styles (sem Tailwind) para garantir fidelidade na captura.
 * Sem emojis nos textos — usa formas CSS para evitar problemas de fonte no html-to-image.
 */
export const BancaStoryCard = forwardRef<HTMLDivElement, BancaStoryCardProps>(
  ({ name, city, bio, photoDataUrl, colorPrimary, products, bancaUrl, mosaicPhotos }, ref) => {
    const accent = colorPrimary || "#2d6a4f";
    const initial = name.charAt(0).toUpperCase();
    const validMosaic = mosaicPhotos.filter(Boolean) as string[];
    const productCircles = products.filter((p) => p.photoDataUrl).slice(0, 5);

    const CIRCLE = 110;
    const HALF_CIRCLE = CIRCLE / 2;

    return (
      <div
        ref={ref}
        style={{
          width: W,
          height: H,
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          background: "#0b2217",
          boxSizing: "border-box",
        }}
      >
        {/* MOSAICO DE FOTOS — topo */}
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: MOSAIC_H, overflow: "hidden" }}>
          <PhotoMosaic photos={validMosaic} width={W} height={MOSAIC_H} />
          {/* Gradiente superior — para o logo ficar legivel */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 120,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
          }} />
          {/* Gradiente inferior — transicao suave para o fundo dark */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
            background: "linear-gradient(to bottom, transparent 0%, rgba(11,34,23,0.85) 60%, #0b2217 100%)",
          }} />
        </div>

        {/* LOGO TERRA VIVA — canto superior esquerdo */}
        <div style={{
          position: "absolute", top: 28, left: 28, zIndex: 20,
          display: "flex", alignItems: "center", gap: 9,
        }}>
          <div style={{
            width: 30, height: 30,
            borderRadius: "50%",
            background: accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", opacity: 0.85 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{
              color: "#fff",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textShadow: "0 1px 6px rgba(0,0,0,0.6)",
            }}>
              Terra Viva
            </span>
            <span style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 9,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}>
              Feira de Produtores
            </span>
          </div>
        </div>

        {/* BADGE — canto superior direito */}
        <div style={{
          position: "absolute", top: 28, right: 28, zIndex: 20,
          background: "rgba(0,0,0,0.38)",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: 100,
          padding: "7px 14px",
        }}>
          <span style={{
            color: "#fff",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}>
            Qualidade garantida
          </span>
        </div>

        {/* FOTO DO PRODUTOR — sobrepoe a divisa mosaico/info */}
        <div style={{
          position: "absolute",
          top: MOSAIC_H - HALF_CIRCLE,
          left: "50%",
          transform: "translateX(-50%)",
          width: CIRCLE,
          height: CIRCLE,
          borderRadius: "50%",
          border: "4px solid #0b2217",
          boxShadow: `0 0 0 3px ${accent}55, 0 8px 32px rgba(0,0,0,0.6)`,
          overflow: "hidden",
          background: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 30,
        }}>
          {photoDataUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photoDataUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ color: "white", fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{initial}</span>
          }
        </div>

        {/* SECAO DE INFORMACOES — parte dark inferior */}
        <div style={{
          position: "absolute",
          top: MOSAIC_H,
          left: 0, right: 0, bottom: 0,
          background: "#0b2217",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: HALF_CIRCLE + 18,
          paddingBottom: 28,
          paddingLeft: 36,
          paddingRight: 36,
          boxSizing: "border-box",
        }}>

          {/* Tag Agricultura Familiar */}
          <div style={{
            color: "#4ade80",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>
            — Agricultura Familiar —
          </div>

          {/* Nome */}
          <div style={{
            color: "#ffffff",
            fontSize: 30,
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}>
            {name}
          </div>

          {/* Cidade */}
          {city && (
            <div style={{
              color: "rgba(255,255,255,0.42)",
              fontSize: 12,
              marginBottom: 14,
              letterSpacing: "0.02em",
            }}>
              {city}
            </div>
          )}

          {/* Bio */}
          {bio && (
            <div style={{
              color: "rgba(255,255,255,0.52)",
              fontSize: 12,
              fontStyle: "italic",
              textAlign: "center",
              lineHeight: 1.65,
              marginBottom: 16,
              maxWidth: 390,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            } as React.CSSProperties}>
              &ldquo;{bio}&rdquo;
            </div>
          )}

          {/* Circulos de produtos — so fotos, sem preco/nome */}
          {productCircles.length > 0 && (
            <div style={{
              display: "flex",
              gap: productCircles.length >= 5 ? 8 : 12,
              marginBottom: 18,
              marginTop: bio ? 0 : 8,
            }}>
              {productCircles.map((p, i) => (
                <div key={i} style={{
                  width: 52, height: 52,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
                  flexShrink: 0,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photoDataUrl!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Divisor */}
          <div style={{
            width: "100%",
            height: 1,
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)",
            marginBottom: 18,
          }} />

          {/* Branding rodape */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}>
            <div style={{
              width: 7, height: 7,
              borderRadius: "50%",
              background: accent,
              flexShrink: 0,
            }} />
            <span style={{
              color: "rgba(255,255,255,0.38)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
              Terra Viva — Produtos frescos do campo
            </span>
          </div>

          {/* URL pill */}
          <div style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: 100,
            padding: "10px 24px",
            color: "rgba(255,255,255,0.72)",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.02em",
            textAlign: "center",
          }}>
            {bancaUrl}
          </div>

          {/* CTA */}
          <div style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 11,
            marginTop: 10,
            letterSpacing: "0.02em",
          }}>
            Acesse, conhea e faca seu pedido
          </div>
        </div>
      </div>
    );
  }
);

BancaStoryCard.displayName = "BancaStoryCard";
