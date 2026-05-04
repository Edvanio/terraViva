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
  /** Foto de perfil do produtor (cÃ­rculo central) */
  photoDataUrl?: string | null;
  colorPrimary?: string | null;
  products: StoryProduct[];
  bancaUrl: string;
  /** Todas as fotos disponÃ­veis para o mosaico: [cover, ...productPhotos] */
  mosaicPhotos: (string | null)[];
}

const W = 540;
const H = 960;
const MOSAIC_H = 500;

/** Mosaico dinÃ¢mico baseado na quantidade de fotos disponÃ­veis */
function PhotoMosaic({ photos, width, height }: { photos: string[]; width: number; height: number }) {
  const n = Math.min(photos.length, 6);

  const img = (src: string, style: React.CSSProperties, key: number) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={key} src={src} alt="" style={{ objectFit: "cover", display: "block", ...style }} />
  );

  if (n === 0) {
    return (
      <div style={{
        width, height,
        background: "linear-gradient(155deg, #0d2e1c 0%, #1e5c3a 40%, #0b2217 100%)",
        position: "relative",
      }}>
        {/* Textura sutil */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: [
            "radial-gradient(circle at 15% 25%, rgba(74,222,128,0.07) 0%, transparent 45%)",
            "radial-gradient(circle at 85% 75%, rgba(74,222,128,0.05) 0%, transparent 40%)",
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)",
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

  // 6 fotos: 3Ã—2
  return (
    <div style={{ width, height, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 3 }}>
      {photos.slice(0, 6).map((s, i) => img(s, { width: "100%", height: "100%" }, i))}
    </div>
  );
}

/**
 * Cartaz Story premium 540Ã—960 (pixel ratio 2 â†’ exportado 1080Ã—1920).
 * Renderizado off-screen; capturado por html-to-image.
 */
export const BancaStoryCard = forwardRef<HTMLDivElement, BancaStoryCardProps>(
  ({ name, city, bio, photoDataUrl, colorPrimary, products, bancaUrl, mosaicPhotos }, ref) => {
    const accent = colorPrimary || "#2d6a4f";
    const initial = name.charAt(0).toUpperCase();
    const validMosaic = mosaicPhotos.filter(Boolean) as string[];

    // CÃ­rculos de produto (apenas fotos, sem texto nem preÃ§o)
    const productCircles = products.filter((p) => p.photoDataUrl).slice(0, 5);

    const CIRCLE = 110;
    const HALF_CIRCLE = CIRCLE / 2; // 55px

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
        {/* â•â• MOSAICO DE FOTOS (topo) â•â• */}
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: MOSAIC_H, overflow: "hidden" }}>
          <PhotoMosaic photos={validMosaic} width={W} height={MOSAIC_H} />

          {/* Gradiente superior â€” legibilidade do logo */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 120,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
          }} />

          {/* Gradiente inferior â€” transiÃ§Ã£o para o dark */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
            background: "linear-gradient(to bottom, transparent 0%, rgba(11,34,23,0.8) 60%, #0b2217 100%)",
          }} />
        </div>

        {/* â•â• LOGO TERRA VIVA (topo esquerdo) â•â• */}
        <div style={{
          position: "absolute", top: 30, left: 30, zIndex: 20,
          display: "flex", alignItems: "center", gap: 9,
        }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>ðŸŒ±</span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{
              color: "#fff",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textShadow: "0 1px 6px rgba(0,0,0,0.6)",
            }}>Terra Viva</span>
            <span style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 9,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}>Feira de Produtores</span>
          </div>
        </div>

        {/* â•â• BADGE QUALIDADE (topo direito) â•â• */}
        <div style={{
          position: "absolute", top: 30, right: 30, zIndex: 20,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 100,
          paddingTop: 7, paddingBottom: 7,
          paddingLeft: 14, paddingRight: 14,
        }}>
          <span style={{
            color: "#fff",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}>âœ¦ Qualidade garantida</span>
        </div>

        {/* â•â• FOTO DO PRODUTOR (cÃ­rculo flutuante, sobrepÃµe a divisa) â•â• */}
        <div style={{
          position: "absolute",
          top: MOSAIC_H - HALF_CIRCLE,
          left: "50%",
          transform: "translateX(-50%)",
          width: CIRCLE,
          height: CIRCLE,
          borderRadius: "50%",
          border: "4px solid #0b2217",
          boxShadow: `0 0 0 3px ${accent}60, 0 8px 32px rgba(0,0,0,0.6)`,
          overflow: "hidden",
          background: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 30,
        }}>
          {photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoDataUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: "white", fontSize: 40, fontWeight: 700 }}>{initial}</span>
          )}
        </div>

        {/* â•â• SEÃ‡ÃƒO DE INFORMAÃ‡Ã•ES (parte inferior dark) â•â• */}
        <div style={{
          position: "absolute",
          top: MOSAIC_H,
          left: 0, right: 0, bottom: 0,
          background: "#0b2217",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: HALF_CIRCLE + 16,  // espaÃ§o para o cÃ­rculo sobreposto
          paddingBottom: 30,
          paddingLeft: 36,
          paddingRight: 36,
          boxSizing: "border-box",
        }}>

          {/* Tag "Agricultura Familiar" */}
          <div style={{
            color: "#4ade80",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>
            âœ¦&nbsp;&nbsp;Agricultura Familiar&nbsp;&nbsp;âœ¦
          </div>

          {/* Nome da banca */}
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
              color: "rgba(255,255,255,0.45)",
              fontSize: 12,
              marginBottom: 14,
            }}>
              ðŸ“&nbsp;{city}
            </div>
          )}

          {/* Bio */}
          {bio && (
            <div style={{
              color: "rgba(255,255,255,0.55)",
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

          {/* CÃ­rculos de produtos (apenas visual â€” sem texto, sem preÃ§o) */}
          {productCircles.length > 0 && (
            <div style={{
              display: "flex",
              gap: productCircles.length >= 5 ? 8 : 12,
              marginBottom: 18,
              marginTop: 4,
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

          {/* EspaÃ§ador flexÃ­vel */}
          <div style={{ flex: 1 }} />

          {/* Divisor */}
          <div style={{
            width: "100%",
            height: 1,
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)",
            marginBottom: 18,
          }} />

          {/* RodapÃ©: branding Terra Viva */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 15 }}>ðŸŒ±</span>
            <span style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
              Terra Viva&nbsp;â€¢&nbsp;Produtos frescos do campo
            </span>
          </div>

          {/* URL pill */}
          <div style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 100,
            paddingTop: 10, paddingBottom: 10,
            paddingLeft: 24, paddingRight: 24,
            color: "rgba(255,255,255,0.75)",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.02em",
            textAlign: "center",
          }}>
            {bancaUrl}
          </div>

          {/* CTA */}
          <div style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
            marginTop: 10,
            letterSpacing: "0.02em",
          }}>
            ðŸ›’ Acesse, conheÃ§a e faÃ§a seu pedido
          </div>
        </div>
      </div>
    );
  }
);

BancaStoryCard.displayName = "BancaStoryCard";

