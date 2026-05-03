# Stack Tecnológica

## Linguagens e Runtime

| Linguagem | Versão | Uso |
|-----------|--------|-----|
| Python | 3.11 | Backend API |
| TypeScript | 5.6 | Web + App + Shared |
| JavaScript (Node.js) | 20 LTS | Runtime do Next.js em produção |

## Frameworks Principais

| Framework | Versão | Papel |
|-----------|--------|-------|
| FastAPI | 0.115.6 | Backend REST API |
| Next.js | 15.0.3 | Web frontend (SSR + CSR) |
| React | 18.3.1 | UI (web e mobile) |
| React Native | 0.76.1 | App mobile |
| Expo | 52 | Toolchain mobile |
| Tailwind CSS | 3.4.16 | Estilização web |

## Banco de Dados

- **MongoDB Atlas** (DigitalOcean Managed Database)
  - Cluster: `db-mongodb-bimdoctor-ce100a5c.mongo.ondigitalocean.com`
  - Database: `terra_viva`
  - Driver: `pymongo 4.10.1` (sync)
  - Sem ORM — acesso direto via driver
  - Indexes: `users.phone` (unique), `users.short_code` (unique, sparse), `otp_codes.created_at` (TTL 5min)

### Collections Principais

| Collection | Propósito |
|------------|-----------|
| `users` | Produtores e consumidores (mesmo schema) |
| `products` | Catálogo de produtos dos produtores |
| `reservations` | Pedidos/reservas de consumidores |
| `otp_codes` | Códigos OTP temporários (TTL 5min) |
| `fair_configs` | Configuração da feira (horários, local) |

## Storage de Imagens

- **DigitalOcean Spaces** (S3-compatible)
  - Endpoint: `https://nyc3.digitaloceanspaces.com`
  - Bucket: `dadosbimdoctor`
  - Pastas: `terraviva/profiles/`, `terraviva/products/`
  - SDK: `boto3 1.35.86`

## Inteligência Artificial

- **OpenAI GPT-4o** — Vision (análise de foto do produto → nome, descrição, categoria, preço)
- **OpenAI DALL-E 2** — Geração de imagem de fundo do produto (quando necessário)
- SDK: `openai >= 1.30.0`

## Autenticação

- **OTP via SMS** (placeholder — em dev usa código fixo)
- **JWT** (python-jose) — token com validade de 360 dias
- **Cookie httpOnly** — sessão do Next.js server-side
- **localStorage** — token para client components

## Infraestrutura

| Componente | Tecnologia |
|------------|-----------|
| Hosting | DigitalOcean App Platform |
| Container | Docker multi-stage (Python 3.11-slim base) |
| Proxy reverso | nginx |
| Process manager | `entrypoint.sh` (bash com trap) |
| CI/CD | GitHub → DO auto-deploy (branch `main`) |

## Dependências Backend (Python)

| Pacote | Propósito |
|--------|-----------|
| `fastapi` | Framework web |
| `uvicorn` | ASGI server |
| `pymongo` | Driver MongoDB |
| `python-jose` | JWT encode/decode |
| `pydantic-settings` | Configuração via env vars |
| `boto3` | Upload S3/Spaces |
| `openai` | API de IA |
| `Pillow` | Processamento de imagem |
| `httpx` | HTTP client async |

## Dependências Web (Node.js)

| Pacote | Propósito |
|--------|-----------|
| `next` | Framework SSR/SSG |
| `react` / `react-dom` | UI library |
| `swr` | Data fetching client-side |
| `tailwindcss` | Utility-first CSS |

## Dependências Mobile (Expo/RN)

| Pacote | Propósito |
|--------|-----------|
| `expo` | Toolchain e build |
| `@react-navigation/*` | Navegação (tabs + stack) |
| `axios` | HTTP client |
| `expo-image-picker` | Captura de fotos |
| `expo-notifications` | Push notifications |
| `expo-secure-store` | Armazenamento seguro de token |
| `@react-native-async-storage` | Cache offline |

## Arquitetura de Deploy (Container Único)

```
┌─────────────────────────────────────────┐
│  DigitalOcean App Platform (1 container)│
│                                         │
│  nginx (:80)                            │
│    ├─ /api/*         → uvicorn :8000    │
│    ├─ /api/auth/*    → node :3000       │
│    └─ /*             → node :3000       │
│                                         │
│  uvicorn (:8000)     FastAPI (2 workers)│
│  node (:3000)        Next.js standalone │
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
  MongoDB Atlas       DO Spaces (S3)
```

## Decisões Arquiteturais

| Decisão | Justificativa |
|---------|---------------|
| Container único | DO App Platform cobra por container; unificar reduz custo |
| MongoDB sem ORM | Flexibilidade, schema evolutivo sem migrations |
| Next.js standalone | Menor footprint para produção em container |
| JWT longo (360 dias) | Público-alvo rural sem costume de re-login frequente |
| OTP por SMS (sem senha) | Simplicidade máxima para público pouco técnico |
| SSR + force-dynamic | SEO para bancas públicas, dados sempre frescos |
| Tailwind sem component lib | Design system customizado "orgânico" |
