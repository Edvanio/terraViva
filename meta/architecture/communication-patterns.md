# Padrões de Comunicação

> Última atualização: 2026-05-02

## Visão Geral

O Terra Viva usa exclusivamente **comunicação síncrona via REST**. Não há mensageria, eventos ou gRPC. A simplicidade é intencional — volume baixo, equipe pequena.

## Comunicação Síncrona (REST)

### Browser → nginx → FastAPI

**Rota**: `/api/*` (strip prefix por nginx)
**Autenticação**: Bearer Token JWT no header `Authorization`
**Formato**: JSON
**Timeout**: Padrão nginx (60s), exceto IA (90s)

### Browser → nginx → Next.js

**Rota**: `/*` (default), `/api/auth/session`, `/api/auth/logout`
**Autenticação**: Cookie httpOnly `terra_viva_token`
**Formato**: HTML (SSR) ou JSON (API routes)

### Next.js Server Components → FastAPI

**Rota**: `http://backend:8000/*` (env `API_INTERNAL_URL`, Docker network)
**Autenticação**: Sem auth para rotas públicas; cookie forwarded para protegidas
**Uso**: Carregar dados para SSR (bancas, fair-config)

### FastAPI → MongoDB Atlas

**Protocolo**: MongoDB Wire Protocol via pymongo
**Connection**: Pool gerenciado pelo driver (singleton via `lru_cache`)
**Retry**: Built-in do pymongo (retryable writes)

### FastAPI → DigitalOcean Spaces

**Protocolo**: S3 API via boto3
**Operação**: `put_object` (upload de imagem)
**Timeout**: Padrão boto3

### FastAPI → OpenAI API

**Protocolo**: HTTPS via SDK `openai`
**Timeout**: 90s
**Operações**: Chat completion (Vision), Image generation
**Fallback**: HTTP 503 ao client se falhar

### FastAPI → Expo Push API

**Protocolo**: HTTPS via httpx
**Timeout**: 5s
**Padrão**: Fire-and-forget (não bloqueia response)
**Fallback**: Log warning, nunca propaga erro

## Matriz de Comunicação

| De | Para | Protocolo | Auth | Crítico? |
|----|------|-----------|------|----------|
| Browser | nginx | HTTP | - | Sim |
| nginx | Next.js | HTTP (proxy) | Cookie | Sim |
| nginx | FastAPI | HTTP (proxy) | Bearer JWT | Sim |
| Next.js SSR | FastAPI | HTTP (internal) | Optional | Sim |
| FastAPI | MongoDB | MongoDB Wire | Connection string | Sim |
| FastAPI | DO Spaces | S3 API | Access key | Alto |
| FastAPI | OpenAI | HTTPS | API Key | Feature-level |
| FastAPI | Expo Push | HTTPS | - | Baixo |

## Resiliência

| Componente | Estratégia | Impacto de falha |
|------------|-----------|-----------------|
| MongoDB | Pool pymongo (retry interno) | App inteira cai |
| DO Spaces | HTTP 502 propagado | Upload de fotos falha |
| OpenAI | Timeout 90s → HTTP 503 | Cadastro IA indisponível, manual funciona |
| Expo Push | Fire-and-forget, log warning | Produtor não recebe notificação |
| Next.js SSR | `.catch(() => [])` | Página mostra lista vazia |
| nginx | Health check no entrypoint | Container não sobe |

## Segurança na Comunicação

- **nginx ↔ browser**: HTTP em dev, HTTPS em prod (DigitalOcean managed SSL)
- **nginx ↔ backend/web**: HTTP localhost (mesma máquina, não exposto)
- **FastAPI ↔ MongoDB**: TLS (MongoDB Atlas força)
- **FastAPI ↔ DO Spaces**: HTTPS (S3 API)
- **FastAPI ↔ OpenAI**: HTTPS

## Decisões Relacionadas

- [ADR 0005: Container unificado](../adr/0005-unified-docker-deploy.md) — comunicação via localhost
- [ADR 0010: Dual auth storage](../adr/0010-dual-auth-storage.md) — cookie vs Bearer
