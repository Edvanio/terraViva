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
}

/**
 * Cartaz visual para Story (540×960 — pixelRatio 2 → 1080×1920).
 * Renderizado off-screen; capturado por html-to-image.
 * Usa apenas inline styles para garantir fidelidade na captura.
 */
export const BancaStoryCard = forwardRef<HTMLDivElement, BancaStoryCardProps>(
  ({ name, city, bio, photoDataUrl, colorPrimary, products, bancaUrl }, ref) => {
    const accent = colorPrimary || "#2d6a4f";
    const displayProducts = products.slice(0, 6);
    const initial = name.charAt(0).toUpperCase();

    return (
      <div
        ref={ref}
        style={{
          width: 540,
          height: 960,
          background: "linear-gradient(155deg, #0b2217 0%, #163825 45%, #0d2b1c 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "36px 28px 28px",
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -100, right: -80,
          width: 320, height: 320, borderRadius: "50%",
          background: "rgba(255,255,255,0.025)",
        }} />
        <div style={{
          position: "absolute", bottom: 120, left: -70,
          width: 220, height: 220, borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
        }} />
        <div style={{
          position: "absolute", top: "45%", right: -40,
          width: 140, height: 140, borderRadius: "50%",
          background: "rgba(255,255,255,0.02)",
        }} />

        {/* ── TERRA VIVA logo ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>🌱</span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{
              color: "#ffffff",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              Terra Viva
            </span>
            <span style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              Feira de produtores
            </span>
          </div>
        </div>

        {/* ── Foto do produtor ── */}
        <div style={{
          width: 108, height: 108,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.75)",
          boxShadow: "0 0 0 6px rgba(255,255,255,0.08)",
          overflow: "hidden",
          marginBottom: 14,
          background: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoDataUrl}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 44, color: "white", fontWeight: 700 }}>{initial}</span>
          )}
        </div>

        {/* ── Nome da banca ── */}
        <div style={{
          color: "#ffffff",
          fontSize: 26,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.15,
          marginBottom: 6,
          maxWidth: 420,
        }}>
          {name}
        </div>

        {/* ── Cidade ── */}
        {city && (
          <div style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            marginBottom: 14,
          }}>
            📍 {city}
          </div>
        )}

        {/* ── Divisor ── */}
        <div style={{
          width: 48, height: 2,
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
          borderRadius: 2,
          marginBottom: 14,
        }} />

        {/* ── Bio ── */}
        {bio && (
          <div style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 12.5,
            textAlign: "center",
            lineHeight: 1.55,
            marginBottom: 18,
            maxWidth: 400,
            fontStyle: "italic",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          } as React.CSSProperties}>
            &ldquo;{bio}&rdquo;
          </div>
        )}

        {/* ── Grid de produtos ── */}
        {displayProducts.length > 0 && (
          <>
            <div style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 10.5,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 10,
              alignSelf: "flex-start",
            }}>
              Produtos disponíveis
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              width: "100%",
              marginBottom: 20,
            }}>
              {displayProducts.map((p, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  {/* Foto do produto */}
                  <div style={{
                    width: "100%",
                    height: 80,
                    background: "rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {p.photoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photoDataUrl}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 28 }}>🌿</span>
                    )}
                  </div>
                  {/* Nome + preço */}
                  <div style={{ padding: "7px 7px 9px" }}>
                    <div style={{
                      color: "rgba(255,255,255,0.88)",
                      fontSize: 10.5,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      marginBottom: 4,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    } as React.CSSProperties}>
                      {p.name}
                    </div>
                    <div style={{
                      color: "#4ade80",
                      fontSize: 11.5,
                      fontWeight: 700,
                    }}>
                      R$ {p.price.toFixed(2).replace(".", ",")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* ── CTA ── */}
        <div style={{
          color: "rgba(255,255,255,0.8)",
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 10,
          textAlign: "center",
          letterSpacing: "0.01em",
        }}>
          🛒 Acesse, conheça e faça seu pedido!
        </div>

        {/* ── URL pill ── */}
        <div style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: 100,
          paddingTop: 9, paddingBottom: 9,
          paddingLeft: 22, paddingRight: 22,
          color: "rgba(255,255,255,0.85)",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.01em",
          textAlign: "center",
          maxWidth: 400,
        }}>
          {bancaUrl}
        </div>
      </div>
    );
  }
);

BancaStoryCard.displayName = "BancaStoryCard";
