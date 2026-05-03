# Padrões de Design

## Padrão Arquitetural

**Monorepo com separação por camada funcional** (não é DDD formal):

```
terraVivaDev/
├── backend/         → API FastAPI (camada de dados + regras)
├── web/             → Frontend Next.js (SSR + client)
├── app/             → App mobile React Native/Expo (futuro)
├── shared/          → Tipos TypeScript compartilhados
├── nginx/           → Proxy reverso
├── deploy/          → Configs de deploy
└── docs/            → Documentação
```

## Padrões de Código

### Backend (FastAPI)

- **Router pattern**: Cada domínio tem seu arquivo em `backend/routers/`
  - `auth.py` — OTP + JWT
  - `bancas.py` — Listagem pública de produtores
  - `products.py` — CRUD de produtos
  - `ai_products.py` — Geração de produto via IA
  - `reservations.py` — Reservas (pedidos)
  - `producers.py` — Perfil do produtor + upload
  - `fair_config.py` — Configuração da feira

- **Dependency Injection** via FastAPI `Depends()`:
  - `get_current_user` — extrai e valida JWT do header `Authorization`

- **Pydantic Models** para validação de input/output (request/response)

- **Configuração via env vars** com `pydantic-settings` + `.env`

### Frontend Web (Next.js 15)

- **Server Components** para páginas públicas (home, bancas) — dados carregados no servidor
- **Client Components** (`"use client"`) para interatividade (formulários, filtros, auth)
- **Middleware** de rota para proteção de páginas privadas (cookie-based)
- **Dual auth storage**: cookie httpOnly (server-side) + localStorage (client-side)
- **API proxy**: browser chama `/api/*` → nginx → FastAPI. Server Components chamam diretamente `http://127.0.0.1:8000`

### Padrão de Comunicação

```
Browser (client) ──→ nginx :80
  │
  ├─ /api/*        ──→ FastAPI :8000 (strip /api prefix)
  ├─ /api/auth/*   ──→ Next.js :3000 (session cookies)
  └─ /*            ──→ Next.js :3000 (SSR/static)
```

## Organização de Código

### Backend
```
backend/
├── main.py          → App FastAPI, middleware, include routers
├── config.py        → Settings (env vars → Pydantic)
├── database.py      → Conexão MongoDB (singleton)
├── dependencies.py  → Auth guard (get_current_user)
├── models.py        → Todos os schemas Pydantic (request + response)
├── utils.py         → JWT, OTP, push notification, phone normalizer
├── seed.py          → Script de seed para dev
├── routers/         → Um arquivo por domínio
└── services/        → Serviços externos (OpenAI)
```

### Frontend Web
```
web/src/
├── app/             → Pages (App Router do Next.js 15)
│   ├── page.tsx           → Home (Server Component)
│   ├── bancas/page.tsx    → Lista de produtores
│   ├── banca/[id]/        → Detalhe + reservar
│   ├── login/page.tsx     → Auth (OTP)
│   ├── pedidos/page.tsx   → Meus pedidos (client)
│   ├── minha-banca/       → Dashboard do produtor
│   ├── perfil/page.tsx    → Perfil do usuário
│   └── api/auth/          → Route handlers (session cookie)
├── components/      → Componentes reutilizáveis
├── lib/             → Utilities (api client, auth, types, format)
└── styles/          → Tailwind globals
```

## Convenções de Nomenclatura

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Arquivos React | PascalCase | `BancaCard.tsx` |
| Páginas Next.js | `page.tsx` dentro de pasta | `app/bancas/page.tsx` |
| Routers Python | snake_case | `fair_config.py` |
| Modelos Pydantic | PascalCase | `ReservationCreate` |
| Env vars | UPPER_SNAKE | `MONGODB_URL` |
| Endpoints | kebab-case plural | `/bancas`, `/fair-config` |
| Collections MongoDB | snake_case plural | `otp_codes`, `fair_configs` |

## Padrão de Auth (Dual Storage)

```
Login:
1. POST /api/auth/verify-otp → JWT
2. localStorage.setItem("terra_viva_token", jwt)   ← client reads
3. POST /api/auth/session {token}                   ← sets httpOnly cookie

Uso:
- Client Components: lê localStorage
- Server Components: lê cookie httpOnly via cookies()
- Middleware: verifica cookie para proteção de rotas

Logout:
1. localStorage.removeItem("terra_viva_token")
2. DELETE /api/auth/session   ← limpa cookie
3. router.refresh()
```

## Padrão de Tratamento de Erros

- **Backend**: `HTTPException` com status code e detail message
- **Frontend**: `.catch(() => [])` para dados públicos (graceful degradation)
- **Auth failures**: redirect para `/login?redirect=<original_path>`
- **Push notifications**: fire-and-forget em thread separada (daemon)

## Padrões de Deploy

- Branch `develop` → auto-deploy no DO App Platform
- Docker multi-stage build (3 stages: deps → build → runner)
- Entrypoint com health-check do backend antes de iniciar nginx
- Variáveis secretas configuradas manualmente no painel DO
