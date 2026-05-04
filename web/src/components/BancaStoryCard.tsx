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
  /** Foto do produtor — recebida mas nao renderizada neste layout (capa e produtos em destaque) */
  photoDataUrl?: string | null;
  colorPrimary?: string | null;
  products: StoryProduct[];
  bancaUrl: string;
  /** mosaicPhotos[0] = capa da banca; mosaicPhotos[1..] = fotos dos produtos */
  mosaicPhotos: (string | null)[];
}

const W = 540;
const H = 960;
/** Altura da foto de capa (hero) */
const COVER_H = 440;
/** Altura da secao de informacoes (cartao claro) */
const INFO_H = H - COVER_H; // 520px

/**
 * Cartaz Story 540x960 premium.
 * Layout: capa em destaque no topo → secao clara com produtos + convite.
 * Capturado off-screen por html-to-image (pixelRatio 2 → 1080x1920).
 * Usa inline styles; sem emojis (causam falha de fonte no canvas).
 */
export const BancaStoryCard = forwardRef<HTMLDivElement, BancaStoryCardProps>(
  ({ name, city, bio, colorPrimary, products, bancaUrl, mosaicPhotos }, ref) => {
    const accent = colorPrimary || "#2d6a4f";
    const coverPhoto = mosaicPhotos[0] ?? null;
    const productCards = products.filter((p) => p.photoDataUrl).slice(0, 3);

    /* dimensoes dos cartoes de produto */
    const PAD_H = 32;
    const GAP = 10;
    const cols = productCards.length === 1 ? 1 : productCards.length === 2 ? 2 : 3;
    const cardW = Math.floor((W - PAD_H * 2 - GAP * (cols - 1)) / cols);
    const LABEL_H = 38;

    return (
      <div
        ref={ref}
        style={{
          width: W,
          height: H,
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          background: "#0f2d1a",
          boxSizing: "border-box",
        }}
      >
        {/* ──────────────────────────────────────────────
            FOTO DE CAPA — hero superior
        ────────────────────────────────────────────── */}
        <div style={{ position: "absolute", top: 0, left: 0, width: W, height: COVER_H, overflow: "hidden" }}>
          {coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPhoto}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: `linear-gradient(155deg, ${accent}cc 0%, #0f2d1a 100%)`,
            }} />
          )}

          {/* gradiente topo — logo legivel */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 160,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)",
          }} />

          {/* gradiente base — suaviza transicao para secao clara */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
            background: "linear-gradient(to bottom, transparent 0%, rgba(11,34,23,0.82) 60%, #0f2d1a 100%)",
          }} />
        </div>

        {/* ── LOGO TERRA VIVA — topo esq ── */}
        <div style={{
          position: "absolute", top: 26, left: 26, zIndex: 20,
          display: "flex", alignItems: "center", gap: 9,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.55)",
          }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#fff", opacity: 0.9 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{
              color: "#fff", fontSize: 16, fontWeight: 800,
              letterSpacing: "0.12em", textTransform: "uppercase",
              textShadow: "0 1px 8px rgba(0,0,0,0.7)",
            }}>Terra Viva</span>
            <span style={{
              color: "rgba(255,255,255,0.6)", fontSize: 9,
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>Feira de Produtores</span>
          </div>
        </div>

        {/* ── BADGE — topo dir ── */}
        <div style={{
          position: "absolute", top: 26, right: 26, zIndex: 20,
          background: "rgba(0,0,0,0.42)", border: "1px solid rgba(255,255,255,0.28)",
          borderRadius: 100, padding: "7px 15px",
        }}>
          <span style={{ color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>
            Produto Colonial
          </span>
        </div>

        {/* ── NOME + CIDADE — sobreposto na base da foto ── */}
        <div style={{
          position: "absolute",
          top: COVER_H - 115,
          left: 0, right: 0, zIndex: 25,
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "0 40px",
        }}>
          <div style={{
            color: "#fff",
            fontSize: 38, fontWeight: 800,
            textAlign: "center", lineHeight: 1.1,
            letterSpacing: "-0.02em",
            textShadow: "0 2px 18px rgba(0,0,0,0.9)",
          }}>
            {name}
          </div>
          {city && (
            <div style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 13, marginTop: 7,
              letterSpacing: "0.06em",
              textShadow: "0 1px 8px rgba(0,0,0,0.7)",
            }}>
              {city}
            </div>
          )}
        </div>

        {/* ──────────────────────────────────────────────
            SECAO CLARA — informacoes + produtos
        ────────────────────────────────────────────── */}
        <div style={{
          position: "absolute",
          top: COVER_H, left: 0, right: 0,
          height: INFO_H,
          background: "#fdf6e3",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: 24, paddingBottom: 26,
          paddingLeft: PAD_H, paddingRight: PAD_H,
          boxSizing: "border-box",
        }}>

          {/* Linha decorativa + Agricultura Familiar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ height: 1, width: 34, background: `${accent}55` }} />
            <span style={{
              color: accent, fontSize: 10, fontWeight: 800,
              letterSpacing: "0.22em", textTransform: "uppercase",
            }}>
              Agricultura Familiar
            </span>
            <div style={{ height: 1, width: 34, background: `${accent}55` }} />
          </div>

          {/* Convite — linguagem simples de produtor */}
          <div style={{
            color: "#1c3a12", fontSize: 17, fontWeight: 700,
            textAlign: "center", lineHeight: 1.55,
            marginBottom: 18, maxWidth: 430,
          }}>
            Venha conhecer os produtos fresquinhos da nossa banca!
          </div>

          {/* ── GRADE DE PRODUTOS ── */}
          {productCards.length > 0 && (
            <div style={{
              display: "flex", flexDirection: "row",
              gap: GAP, width: "100%",
              justifyContent: "center",
              marginBottom: 16,
            }}>
              {productCards.map((p, i) => (
                <div key={i} style={{
                  width: cardW, flexShrink: 0,
                  borderRadius: 16, overflow: "hidden",
                  background: "#fff",
                  boxShadow: "0 3px 14px rgba(0,0,0,0.10)",
                  border: `1px solid ${accent}28`,
                  display: "flex", flexDirection: "column",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.photoDataUrl!}
                    alt={p.name}
                    style={{ width: "100%", height: cardW, objectFit: "cover", display: "block" }}
                  />
                  <div style={{
                    height: LABEL_H,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 6px",
                    color: "#1c3a12", fontSize: 11, fontWeight: 700,
                    textAlign: "center", lineHeight: 1.3,
                    overflow: "hidden",
                  }}>
                    <span style={{
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    } as React.CSSProperties}>
                      {p.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bio — somente se nao houver produtos suficientes */}
          {bio && productCards.length < 2 && (
            <div style={{
              color: "#5a7c5a", fontSize: 12, fontStyle: "italic",
              textAlign: "center", lineHeight: 1.6,
              marginBottom: 14, maxWidth: 400,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            } as React.CSSProperties}>
              &ldquo;{bio}&rdquo;
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Divisor */}
          <div style={{
            width: "100%", height: 1,
            background: `linear-gradient(to right, transparent, ${accent}44, transparent)`,
            marginBottom: 16,
          }} />

          {/* CTA */}
          <div style={{
            color: "#5a7c5a", fontSize: 12, fontWeight: 600,
            textAlign: "center", marginBottom: 12,
            letterSpacing: "0.02em",
          }}>
            Acesse, conheca e faca seu pedido!
          </div>

          {/* URL pill */}
          <div style={{
            background: `${accent}18`,
            border: `1px solid ${accent}55`,
            borderRadius: 100,
            padding: "10px 26px",
            color: accent, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.02em", textAlign: "center",
            maxWidth: "100%",
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
          }}>
            {bancaUrl}
          </div>

          {/* Branding */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
            <span style={{
              color: `${accent}88`, fontSize: 9, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
            }}>
              Terra Viva — Produtos frescos do campo
            </span>
          </div>
        </div>
      </div>
    );
  }
);

BancaStoryCard.displayName = "BancaStoryCard";
