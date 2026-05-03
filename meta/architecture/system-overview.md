# Visão Geral da Arquitetura

> Última atualização: 2026-05-02

## Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    CONTAINER UNIFICADO                    │
│                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  nginx   │───▶│   Next.js    │    │   FastAPI    │  │
│  │  :80     │    │   :3000      │    │   :8000      │  │
│  │          │───▶│              │    │              │  │
│  └──────────┘    └──────────────┘    └──────────────┘  │
│       │                                     │           │
└───────┼─────────────────────────────────────┼───────────┘
        │                                     │
        ▼                                     ▼
   ┌─────────┐                    ┌────────────────────┐
   │ Browser │                    │  Serviços Externos │
   │ (User)  │                    │                    │
   └─────────┘                    │ • MongoDB Atlas    │
                                  │ • DO Spaces (S3)   │
                                  │ • OpenAI API       │
                                  │ • Expo Push API    │
                                  └────────────────────┘
```

## Componentes Principais

### nginx (Proxy Reverso)
**Responsabilidade**: Roteamento de requests, SSL termination
**Regras de roteamento**:
- `/api/auth/session`, `/api/auth/logout` → Next.js (cookies)
- `/api/*` → FastAPI (strip prefix)
- `/uploads/*` → FastAPI (static files)
- `/*` → Next.js (SSR/static)

### Next.js (Frontend Web)
**Responsabilidade**: UI, SSR, autenticação client-side
**Tecnologias**: Next.js 15, React 18, Tailwind CSS, SWR
**Decisões Relacionadas**: [ADR 0003](../adr/0003-nextjs-app-router.md), [ADR 0010](../adr/0010-dual-auth-storage.md)

### FastAPI (Backend API)
**Responsabilidade**: Lógica de negócio, persistência, integração com IA
**Tecnologias**: Python 3.11, FastAPI, pymongo, python-jose, boto3, openai
**Decisões Relacionadas**: [ADR 0001](../adr/0001-fastapi-python-backend.md)

## Fluxo de Dados

### Request do Browser

```
Browser → nginx :80
  ├─ /api/* → FastAPI :8000 → MongoDB / DO Spaces / OpenAI
  └─ /* → Next.js :3000
              ├─ Server Component → FastAPI (internal http://backend:8000)
              └─ Client Component → /api/* (via nginx)
```

### Fluxo de Cadastro de Produto (IA)

```
1. Produtor tira foto
2. POST /api/producer/upload → DO Spaces → URL pública
3. POST /api/products/ai-generate {photo_url}
4. FastAPI → OpenAI GPT-4o Vision → análise da imagem
5. Retorna: {name, description, category, price, colors}
6. Produtor revisa → POST /api/products → MongoDB
```

### Fluxo de Reserva

```
1. Consumidor navega bancas (SSR, sem auth)
2. Clica "Reservar" → redirect /login se não autenticado
3. POST /api/reservations → MongoDB + Push notification
4. Produtor vê no dashboard → confirma/recusa
5. Comunicação via WhatsApp (link wa.me pré-formatado)
```

## Princípios Arquiteturais

1. **Zero fricção**: Qualquer decisão que adicione steps para o usuário deve ser questionada
2. **Simplicidade operacional**: Um container, um deploy, um billing
3. **Progressive enhancement**: Páginas públicas funcionam sem JS (SSR)
4. **Fail graceful**: Se IA falha, cadastro manual funciona; se push falha, app continua
5. **Schema flexível**: Adicionar campo = apenas `$set` no MongoDB

## Decisões Arquiteturais Chave

- [ADR 0001: FastAPI + Python](../adr/0001-fastapi-python-backend.md)
- [ADR 0002: MongoDB](../adr/0002-mongodb-database.md)
- [ADR 0005: Container unificado](../adr/0005-unified-docker-deploy.md)
- [ADR 0006: Sem roles](../adr/0006-no-roles-system.md)
- [ADR 0009: Monorepo](../adr/0009-monorepo-structure.md)
