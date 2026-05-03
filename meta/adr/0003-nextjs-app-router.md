# 3. Next.js 15 App Router para Frontend Web

Data: 2024-01

## Status

Aceita

## Contexto

O Terra Viva precisa de:
- SEO para páginas públicas (bancas aparecendo no Google)
- Performance em dispositivos móveis baratos (público rural)
- PWA-like experience (sem instalar app)
- Suporte a Server Components para carregar dados sem loading spinners
- Deploy como container Docker (standalone output)

## Decisão

Usar Next.js 15 com App Router, output `standalone`, Tailwind CSS para estilização, e SWR para data fetching client-side.

## Alternativas Consideradas

### Alternativa 1: SPA React (Vite)
**Prós**: Mais simples, sem server-side rendering, build rápido
**Contras**: Sem SEO, loading spinner em toda navegação, sem Server Components
**Razão para rejeição**: SEO é importante para descoberta de bancas no Google

### Alternativa 2: Remix
**Prós**: SSR com mutations simplificadas, progressive enhancement
**Contras**: Comunidade menor, menos plugins/exemplos, deploy mais complexo
**Razão para rejeição**: Next.js tem ecossistema maior e mais recursos da comunidade

## Consequências

### Positivas
- SEO nativo para páginas públicas (home, bancas, detalhe da banca)
- Server Components eliminam loading spinners para dados iniciais
- Output `standalone` gera container mínimo (~90MB)
- Tailwind = design system consistente com classes utilitárias
- Middleware de rota para auth server-side

### Negativas
- Complexidade de Server vs Client Components (mental model)
- `useSearchParams` requer `<Suspense>` wrapper
- Auth dual (cookie + localStorage) necessária por causa de SSR
- Build lento (~40s no Docker por falta de cache)

## Trade-offs

Priorizamos **SEO e performance percebida** sobre **simplicidade de arquitetura**.

## Notas de Implementação

- `web/next.config.mjs` — output: "standalone", images remotePatterns
- `web/middleware.ts` — proteção de rotas via cookie
- Server Components: `page.tsx` (home), `bancas/page.tsx`
- Client Components: `perfil/page.tsx`, `minha-banca/page.tsx`, `pedidos/page.tsx`
- API proxy via nginx: `/api/*` → FastAPI

## Revisão

**2026-05**: Decisão válida. SSR funciona bem para páginas públicas. Client Components para interatividade. Build estável.
