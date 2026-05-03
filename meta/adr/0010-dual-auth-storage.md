# 10. Dual Auth Storage (Cookie + localStorage)

Data: 2024-02

## Status

Aceita

## Contexto

Next.js 15 App Router tem dois mundos de execução:
- **Server Components / Middleware**: só acessam cookies (não têm acesso a localStorage)
- **Client Components**: acessam localStorage facilmente, mas cookies httpOnly não são legíveis por JS

O sistema precisa de auth em ambos os mundos:
- Middleware protege rotas server-side (redirect se não logado)
- Client Components fazem fetch autenticado para API

## Decisão

Armazenar JWT em **dois lugares simultaneamente**:
1. `localStorage("terra_viva_token")` — para Client Components lerem e enviarem no header
2. Cookie httpOnly `terra_viva_token` — para Middleware e Server Components validarem

Sincronização via API Route: `POST /api/auth/session` grava cookie, `DELETE /api/auth/session` limpa.

## Alternativas Consideradas

### Alternativa 1: Apenas cookie httpOnly
**Prós**: Mais seguro (XSS não acessa token), padrão de segurança
**Contras**: Client Components não conseguem ler para fetch; precisa de API routes intermediárias para tudo
**Razão para rejeição**: Muitas API routes intermediárias = complexidade excessiva

### Alternativa 2: Apenas localStorage
**Prós**: Simples, acessível em qualquer Client Component
**Contras**: Middleware não consegue verificar auth; sem proteção server-side de rotas
**Razão para rejeição**: Rotas protegidas ficariam sem gate server-side (flash de conteúdo)

### Alternativa 3: Session-based auth (server-side session)
**Prós**: Token nunca exposto ao client, seguro
**Contras**: Estado no servidor, não compatível com standalone Next.js, precisa de session store
**Razão para rejeição**: Complexidade de infraestrutura; JWT stateless é mais simples

## Consequências

### Positivas
- Middleware protege rotas antes do render (sem flash)
- Client Components fazem fetch direto com token do localStorage
- Server Components podem validar via cookie se necessário
- Logout limpa ambos os storages

### Negativas
- Token duplicado (dois pontos de ataque)
- Sincronização necessária (se um expira e outro não, estado inconsistente)
- Cookie precisa de API route adicional para set/clear
- XSS pode roubar token do localStorage (cookie httpOnly está seguro)

## Trade-offs

Priorizamos **funcionalidade em ambos os mundos (server + client)** sobre **segurança máxima**. Aceitável porque:
- Valor transacional é baixo (reservas, não pagamentos)
- Token expira em 7 dias
- Não há dados sensíveis além do telefone

## Notas de Implementação

- `web/src/app/api/auth/session/route.ts` — POST (set cookie), DELETE (clear cookie)
- `web/middleware.ts` — lê cookie para proteção de rotas
- `web/src/lib/api.ts` — Client Components lêem localStorage para Authorization header
- Login flow: verify-otp → salva localStorage → POST /api/auth/session → cookie set
- Logout flow: clear localStorage → DELETE /api/auth/session → router.refresh()

## Revisão

**2026-05**: Decisão válida. Funciona bem na prática. Se migrar para tokens de curta duração com refresh token, reconsiderar (refresh token só no cookie httpOnly).
