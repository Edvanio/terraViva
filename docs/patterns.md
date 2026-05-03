# Padrões de Design

## Padrões Arquiteturais

### Monorepo com Container Único
O projeto adota monorepo com `backend/`, `web/`, `app/` e `shared/` na mesma árvore. O deploy gera um único container Docker que roda todos os serviços orquestrados por `entrypoint.sh`.

### API-First
O backend é a fonte de verdade. Web e app são consumidores da mesma API REST. Tipos compartilhados em `shared/types/` garantem consistência.

### Server-Side Rendering (SSR) + Client Components
O Next.js usa App Router com Server Components para páginas públicas (bancas, home) e Client Components para páginas autenticadas (perfil, minha-banca, pedidos).

## Organização de Código

### Backend (`backend/`)
```
backend/
├── main.py           → App FastAPI, startup, routers
├── config.py         → Settings (pydantic-settings + .env)
├── database.py       → Conexão MongoDB (singleton)
├── dependencies.py   → get_current_user (JWT decode)
├── models.py         → Pydantic models (request/response)
├── utils.py          → Helpers (OTP, JWT, phone, push)
├── seed.py           → Dados de seed para dev
├── routers/          → Endpoints agrupados por domínio
│   ├── auth.py       → OTP request/verify
│   ├── bancas.py     → Listagem pública de bancas
│   ├── products.py   → CRUD de produtos
│   ├── ai_products.py→ Geração de produto via IA
│   ├── reservations.py → Pedidos (consumidor + produtor)
│   ├── producers.py  → Perfil do produtor
│   └── fair_config.py→ Config da feira
└── services/
    └── openai_service.py → Integração OpenAI (vision + image)
```

### Web (`web/src/`)
```
web/src/
├── app/              → App Router (pages + API routes)
│   ├── page.tsx      → Home (SSR)
│   ├── bancas/       → Listagem de bancas (SSR)
│   ├── banca/[id]/   → Detalhe + reservar
│   ├── login/        → Auth OTP
│   ├── minha-banca/  → Painel do produtor (CSR)
│   ├── pedidos/      → Pedidos do consumidor (CSR)
│   ├── perfil/       → Perfil do produtor (CSR)
│   └── api/auth/     → API routes (cookie session)
├── components/       → Componentes reutilizáveis
├── lib/              → Utilitários (api, auth, types, hooks)
└── styles/           → CSS global
```

### App (`app/src/`)
```
app/src/
├── screens/          → Telas (auth, consumer, producer)
├── navigation/       → React Navigation (tabs + stack)
├── components/       → Componentes compartilhados
├── context/          → AuthContext, TenantContext
├── services/         → API client, auth, sync
├── storage/          → Cache offline, queue
└── theme/            → Design tokens
```

## Padrões de Código

### Backend

| Padrão | Uso |
|--------|-----|
| **Router pattern** | Cada domínio tem seu arquivo em `routers/` |
| **Dependency Injection** | `Depends(get_current_user)` para autenticação |
| **Response Models** | Pydantic models tipam todas as respostas |
| **Singleton DB** | `get_db()` retorna mesma instância |
| **Fire-and-forget** | Push notifications em thread daemon separada |

### Web (Next.js)

| Padrão | Uso |
|--------|-----|
| **Server Components** | Páginas públicas (home, bancas, banca/[id]) |
| **Client Components** | Páginas autenticadas ("use client") |
| **Auth Guard hook** | `useAuthGuard()` — valida token + redireciona |
| **SWR fetching** | Data fetching com cache/revalidation (pedidos) |
| **API internal URL** | SSR usa `http://127.0.0.1:8000`, client usa `/api` |
| **Cookie + localStorage** | Dual auth: cookie para SSR, localStorage para CSR |

### Mobile (React Native)

| Padrão | Uso |
|--------|-----|
| **Context API** | AuthContext para estado global de auth |
| **Secure Store** | Token armazenado no keychain do dispositivo |
| **Offline-first** | Queue de operações + cache local |
| **Bottom Tabs** | Navegação principal por tabs (consumer/producer) |

## Convenções de Nomenclatura

| Entidade | Convenção | Exemplo |
|----------|-----------|---------|
| Arquivos Python | snake_case | `fair_config.py` |
| Arquivos TS/TSX | PascalCase (componentes), camelCase (lib) | `BancaCard.tsx`, `api.ts` |
| Rotas Next.js | kebab-case (pastas) | `minha-banca/`, `banca/[id]/` |
| API endpoints | kebab-case | `/fair-config`, `/ai-generate` |
| MongoDB collections | plural snake_case | `users`, `products`, `fair_configs` |
| Env vars | UPPER_SNAKE_CASE | `MONGODB_URL`, `API_INTERNAL_URL` |

## Padrões de Autenticação

```
┌──────────┐   OTP request    ┌──────────┐
│  Client  │ ──────────────── │ Backend  │
│          │   phone number   │          │
│          │ ◄──────────────  │          │
│          │   dev_code (dev) │          │
│          │                  │          │
│          │   verify OTP     │          │
│          │ ──────────────── │          │
│          │   phone + code   │          │
│          │ ◄──────────────  │          │
│          │   JWT token      │          │
└──────────┘                  └──────────┘
      │
      │ POST /api/auth/session {token}
      ▼
┌──────────┐
│ Next.js  │ → Set httpOnly cookie (360 dias)
│ API Route│
└──────────┘
```

## Padrões de Tratamento de Erros

### Backend
- HTTPException com status codes semânticos (400, 401, 404, 422, 503)
- Timeout explícito para chamadas OpenAI (90s)
- Logging via `print()` para erros de IA

### Web
- `useAuthGuard` valida token e redireciona para `/login` se 401
- `clearSession()` — utilitário que limpa localStorage + cookie + redireciona
- `handleApiError(response)` — detecta 401 e limpa sessão automaticamente
- Server Components: `.catch(() => null)` + `notFound()` para graceful degradation
- Middleware protege rotas autenticadas no edge (verifica cookie)

## Padrões de Estado (Web)

| Tipo de página | Estratégia |
|----------------|-----------|
| Pública SSR | `apiGet()` no Server Component, `force-dynamic` |
| Autenticada CSR | `useAuthGuard()` + `useState` + `fetch` em `useEffect` |
| Lista com refresh | `useSWR` com token no header |
| Formulários | `useState` + `onSubmit` handler |

## Design System

O projeto usa um design system customizado "orgânico" definido em `web/tailwind.config.ts`:
- Paleta verde/terra (`primary`, `primary-dark`, `primary-subtle`)
- Tipografia: `font-display` para títulos
- Bordas arredondadas generosas (`rounded-2xl`, `rounded-3xl`)
- Sombras suaves (`shadow-card`, `shadow-tab`)
- Emojis como ícones em pontos de interface
