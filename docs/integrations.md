# Integrações

## Serviços Externos

### MongoDB Atlas

**Tipo**: Banco de dados (cloud managed)
**Propósito**: Persistência de todos os dados da aplicação
**Protocolo**: MongoDB Wire Protocol via `pymongo`
**Cluster**: `servercosthml.sb8nc.mongodb.net`
**Database**: `terra_viva`
**Dependência**: Crítica — sem MongoDB nada funciona
**Tratamento de Falhas**: Nenhum retry explícito; conexão usa pool do pymongo com defaults

**Collections**:
| Collection | Propósito |
|------------|-----------|
| `users` | Usuários (phone, role, name) |
| `producers` | Perfil expandido dos produtores |
| `products` | Produtos das bancas |
| `reservations` | Reservas/pedidos |
| `otp_codes` | Códigos OTP temporários (TTL 5min) |
| `fair_configs` | Configuração da feira por cidade |

---

### DigitalOcean Spaces (S3-compatible)

**Tipo**: Object Storage (imagens)
**Propósito**: Armazenamento de fotos de perfil e produtos
**Protocolo**: S3 API via `boto3`
**Endpoint**: `https://nyc3.digitaloceanspaces.com`
**Bucket**: `dadosbimdoctor`
**Dependência**: Alta — upload de fotos falha sem acesso
**Tratamento de Falhas**: HTTPException 502 propagada ao usuário

**Estrutura**:
```
dadosbimdoctor/
└── terraviva/
    ├── profiles/   ← fotos de perfil (producers)
    └── products/   ← fotos de produtos
```

**URLs públicas**: `https://dadosbimdoctor.nyc3.digitaloceanspaces.com/terraviva/products/<filename>`

---

### OpenAI API

**Tipo**: API REST (IA generativa)
**Propósito**: Análise de fotos de produtos (Vision) + geração/aprimoramento de imagem
**Protocolo**: HTTPS via SDK `openai`
**Modelos**:
  - `gpt-4o` — Análise de imagem (identifica produto, sugere nome/descrição/preço)
  - `gpt-image-1` — Geração/aprimoramento de imagem do produto
**Dependência**: Feature-level — cadastro IA não funciona, mas app opera normalmente sem
**Tratamento de Falhas**: Timeout de 90s + fallback gracioso (503)
**Custo**: Pay-per-use (tokens de input + imagem)

---

### Expo Push Notification API

**Tipo**: API REST
**Propósito**: Notificar produtores sobre novos pedidos
**Protocolo**: HTTPS (`https://exp.host/--/api/v2/push/send`)
**Dependência**: Baixa — fire-and-forget, não bloqueia fluxo
**Tratamento de Falhas**: Thread daemon; exceções logadas como warning, nunca propagadas
**Status atual**: Funcional apenas no app mobile (futuro)

---

### DigitalOcean App Platform

**Tipo**: PaaS (hosting)
**Propósito**: Deploy e hosting do container unificado
**Protocolo**: Git push → build automático
**Configuração**: `.do/app.yaml`
**Dependência**: Infraestrutura — é onde a aplicação roda
**Trigger**: Push na branch `develop` → auto-deploy

---

## Integrações Internas (entre componentes)

### nginx → Next.js (frontend)

| Rota | Destino |
|------|---------|
| `/*` | `http://127.0.0.1:3000` |
| `/api/auth/session` | `http://127.0.0.1:3000` (exact match) |
| `/api/auth/logout` | `http://127.0.0.1:3000` (exact match) |

### nginx → FastAPI (backend)

| Rota | Destino |
|------|---------|
| `/api/*` | `http://127.0.0.1:8000/` (strip prefix) |
| `/uploads/*` | `http://127.0.0.1:8000/uploads/` |

### Next.js Server Components → FastAPI

- URL interna: `http://127.0.0.1:8000` (env `API_INTERNAL_URL`)
- Sem auth para rotas públicas (`/bancas`, `/fair-config`)
- Com auth (cookie) para rotas protegidas

### Browser → Next.js API Routes

- `POST /api/auth/session` — Grava cookie httpOnly com JWT
- `DELETE /api/auth/session` — Limpa cookie

---

## Contratos de Integração

### JWT Token Payload
```json
{
  "sub": "user_id (ObjectId string)",
  "role": "consumer|producer|admin",
  "phone": "48999110001",
  "exp": 1234567890
}
```

### OpenAI Vision Response (esperado)
```json
{
  "name": "Alface Crespa",
  "description": "Alface crespa orgânica...",
  "category": "Verduras",
  "color_primary": "#4CAF50",
  "color_accent": "#8BC34A",
  "suggested_price": 5.0,
  "suggested_price_note": "Preço médio para feiras em SC"
}
```

---

## Resiliência

| Componente | Estratégia |
|------------|-----------|
| MongoDB | Pool de conexões pymongo (retry interno) |
| OpenAI | Timeout 90s + HTTP 503 ao usuário |
| DO Spaces | HTTP 502 ao usuário se upload falha |
| Push Notifications | Fire-and-forget (thread daemon, log warning) |
| Startup | Entrypoint aguarda backend (health check loop 30s) antes de nginx |
| Bancas (SSR) | `.catch(() => [])` — se API falha, mostra lista vazia |
