# 11. SSR para Páginas Públicas, CSR para Páginas Privadas

Data: 2024-02

## Status

Aceita

## Contexto

O Terra Viva tem dois tipos de páginas com necessidades distintas:
- **Páginas públicas** (home, bancas, detalhe da banca): precisam de SEO para que produtores compartilhem links no WhatsApp e apareçam em buscas
- **Páginas privadas** (perfil, pedidos, minha-banca): não precisam de SEO, mas precisam de interatividade com estado complexo

O Next.js 15 App Router oferece Server Components (SSR) e Client Components (CSR) no mesmo projeto.

## Decisão

Usar **Server Components com `force-dynamic`** para páginas públicas e **Client Components (`"use client"`)** para páginas autenticadas.

| Tipo | Renderização | Exemplo |
|------|-------------|---------|
| Público | SSR (Server Component) | `/`, `/bancas`, `/banca/[id]` |
| Privado | CSR (Client Component) | `/perfil`, `/pedidos`, `/minha-banca` |

## Alternativas Consideradas

### Alternativa 1: Tudo SSR
**Prós**: SEO em todas as páginas, sem loading spinners
**Contras**: Complexidade para manipular estado do usuário em Server Components, proteção de rota mais difícil
**Razão para rejeição**: Páginas autenticadas precisam de interatividade pesada (formulários, modais, toasts) que é mais natural com Client Components

### Alternativa 2: Tudo CSR (SPA)
**Prós**: Simplicidade, um padrão para tudo
**Contras**: Sem SEO, links do WhatsApp não mostram preview, Google não indexa bancas
**Razão para rejeição**: SEO é essencial — produtores compartilham links das bancas via WhatsApp

### Alternativa 3: ISR (Incremental Static Regeneration)
**Prós**: Performance + SEO com cache
**Contras**: Dados podem ficar desatualizados entre revalidações
**Razão para rejeição**: Volume de dados pequeno, `force-dynamic` garante dados sempre frescos sem complexidade de cache

## Consequências

### Positivas
- Links de bancas geram preview rico no WhatsApp (OG tags)
- Google indexa páginas de bancas/produtos
- Páginas privadas têm interatividade completa sem limitações
- Dados públicos sempre frescos (force-dynamic)

### Negativas
- Dois padrões de renderização no mesmo projeto
- Server Components usam URL interna (`http://backend:8000`), Client Components usam `/api` — lógica dual em `lib/api.ts`
- Páginas CSR mostram loading spinner antes de hidratar

### Neutras
- `middleware.ts` protege rotas privadas no edge verificando cookie
- `useAuthGuard()` hook adicional no client-side como fallback

## Trade-offs

Priorizamos **SEO e compartilhamento** nas páginas públicas sobre **consistência de padrão**. Páginas privadas priorizam **interatividade** sobre SEO.

## Notas de Implementação

- `web/src/app/page.tsx` — `export const dynamic = "force-dynamic"` (home SSR)
- `web/src/app/bancas/page.tsx` — SSR com `apiGet()` no server
- `web/src/app/perfil/page.tsx` — `"use client"` com `useAuthGuard()`
- `web/src/lib/api.ts` — `getApiBaseUrl()` retorna URL interna (server) ou `/api` (client)
- `web/middleware.ts` — protege `/pedidos`, `/perfil`, `/minha-banca`, `/banca/*/reservar`

## Revisão

**2026-05**: Decisão válida. SEO funciona bem para bancas compartilhadas no WhatsApp. Padrão dual (SSR+CSR) é natural no Next.js App Router.
