# Padrões de Design

## Padrões Arquiteturais

### Router-based Domain Organization (Backend)
O backend segue uma organização por **domínio de negócio** através de routers FastAPI:

```
backend/routers/
├── auth.py          → Autenticação (OTP + JWT)
├── bancas.py        → Vitrine pública de produtores
├── products.py      → CRUD de produtos
├── ai_products.py   → Cadastro inteligente via IA
├── reservations.py  → Gestão de pedidos (fluxo de status)
├── notifications.py → Notificações in-app
├── reviews.py       → Avaliações pós-compra
├── producers.py     → Perfil do produtor
└── fair_config.py   → Configuração da feira
```

### App Router (Web)
Next.js 15 com App Router — separação clara entre:
- **Server Components** (SSR): Páginas públicas (home, bancas, banca/[id])
- **Client Components** ('use client'): Páginas protegidas e interativas

### Stack Navigation + Bottom Tabs (Mobile)
React Navigation com:
- **Stack** (raiz): Auth flow → Main tabs
- **Bottom Tabs**: Consumer mode / Producer mode
- **Context Providers**: AuthContext + TenantContext

## Padrões de Código

### Dependency Injection (Backend)
```python
# get_current_user como dependência FastAPI
@router.post("/")
async def create(payload: Model, user=Depends(get_current_user), db=Depends(get_db)):
    ...
```

### Repository Pattern (implícito)
Queries MongoDB diretas nos routers (sem camada de repository separada) — o PyMongo atua como data access layer direto.

### Fire-and-Forget (Notificações)
```python
# Notificações disparam em daemon threads — não bloqueiam a response
threading.Thread(target=send_whatsapp, args=(phone, msg), daemon=True).start()
```

### Response Models (Serialização)
Toda response é tipada via Pydantic BaseModel — garante contrato de API estável.

### SWR Pattern (Web Client)
```typescript
// Fetch com cache, revalidação e deduplicação automática
const { data } = useSWR('/api/endpoint', fetcher);
```

## Organização de Código

### Backend
```
backend/
├── main.py          → App factory, middleware, startup hooks
├── config.py        → Pydantic Settings (env vars)
├── database.py      → Singleton MongoDB connection
├── dependencies.py  → get_current_user (JWT decode)
├── models.py        → Pydantic models (request/response)
├── utils.py         → Helpers (push, whatsapp, short_code, geocoding)
├── routers/         → Endpoints por domínio
├── services/        → Lógica complexa (OpenAI)
└── uploads/         → Volume compartilhado (imagens)
```

### Web
```
web/src/
├── app/             → Pages (App Router)
│   ├── api/auth/    → Route handlers (session, logout)
│   ├── banca/[id]/  → Detalhe + reserva
│   ├── bancas/      → Lista pública
│   ├── login/       → OTP login
│   ├── minha-banca/ → Dashboard produtor
│   ├── pedidos/     → Meus pedidos (consumidor)
│   └── perfil/      → Edição de perfil
├── components/      → Componentes reutilizáveis
├── lib/             → Utilitários (api client, auth helpers)
└── styles/          → CSS global
```

### Mobile
```
app/src/
├── screens/         → Telas organizadas por papel
│   ├── auth/        → Phone + OTP
│   ├── consumer/    → Navegação e checkout
│   └── producer/    → Catálogo e IA
├── navigation/      → Navigators (Root, Consumer, Producer)
├── context/         → State global (Auth, Tenant)
├── services/        → API client, auth, sync
├── storage/         → Cache local + fila offline
├── components/      → Componentes compartilhados
└── theme/           → Design tokens
```

## Convenções de Nomenclatura

| Escopo | Convenção | Exemplo |
|--------|-----------|---------|
| Routers (Python) | snake_case, plural | `reservations.py` |
| Endpoints | REST (verbo HTTP + noun) | `POST /reservations`, `PATCH /reservations/{id}/status` |
| Pages (Next.js) | kebab-case no path | `/minha-banca`, `/pedidos` |
| Components (React) | PascalCase | `ProductCard.tsx` |
| Funções helper | snake_case (Python) / camelCase (TS) | `send_whatsapp()`, `fetchWithAuth()` |
| Variáveis de ambiente | UPPER_SNAKE_CASE | `ZAPI_INSTANCE_ID` |
| Collections MongoDB | snake_case, plural | `otp_codes`, `fair_config` |

## Padrões de Autenticação

### Fluxo OTP
1. Cliente envia phone → backend gera OTP (6 dígitos, TTL 5min)
2. Cliente envia OTP → backend valida → gera JWT (360 dias)
3. JWT armazenado em: cookie httpOnly (`terra_viva_token`) + localStorage

### Proteção de Rotas
- **Web**: middleware.ts redireciona para `/login` se sem cookie
- **Mobile**: AuthContext verifica token no SecureStore
- **Backend**: `Depends(get_current_user)` valida JWT em cada request protegida

## Padrões de Tratamento de Erros

| Camada | Estratégia |
|--------|-----------|
| Backend | `HTTPException` com status code + detail message |
| Web (SSR) | try/catch → fallback UI ou redirect |
| Web (CSR) | SWR error state → toast notification |
| Notificações | Fire-and-forget — falha silenciosa (não bloqueia UX) |
| IA (OpenAI) | Timeout 90s → fallback para cadastro manual |

## Padrões de Estado (Pedidos)

```
                    ┌──────────┐
           ┌───────│ pending  │───────┐
           │       └──────────┘       │
           ▼                          ▼
    ┌────────────┐            ┌────────────┐
    │ confirmed  │            │ cancelled  │
    └─────┬──────┘            └────────────┘
          │
          ▼
    ┌────────────┐
    │ collected  │
    └────────────┘
          │
          ▼
    ┌────────────┐
    │   fiado    │  (opcional — pagamento pendente)
    └────────────┘
```
