# Stack Tecnológica

## Linguagens e Runtime

| Linguagem | Versão | Uso |
|-----------|--------|-----|
| Python | 3.11 | Backend (FastAPI) |
| TypeScript | 5.6 | Frontend web + App mobile + Shared types |
| Node.js | 20 (Alpine) | Runtime do Next.js |

## Frameworks Principais

| Framework | Versão | Papel |
|-----------|--------|-------|
| **FastAPI** | 0.115.6 | API REST backend |
| **Next.js** | 15.0.3 | Frontend web (SSR + Server Components) |
| **React** | 18.3.1 | UI (web e mobile) |
| **Expo** | ~52.0 | App mobile React Native (futuro) |
| **Tailwind CSS** | 3.4.16 | Estilização web |

## Bibliotecas Chave

### Backend (Python)
| Biblioteca | Propósito |
|------------|-----------|
| `uvicorn` | Servidor ASGI |
| `pymongo` | Driver MongoDB |
| `python-jose` | Criação/validação de JWT |
| `pydantic-settings` | Configuração tipada via env vars |
| `boto3` | Upload de imagens para DO Spaces (S3-compatible) |
| `openai` | Integração GPT-4O Vision + geração de imagem |
| `httpx` | HTTP client (push notifications Expo) |
| `Pillow` | Processamento de imagem |

### Frontend Web (TypeScript)
| Biblioteca | Propósito |
|------------|-----------|
| `swr` | Data fetching com cache/revalidation |
| `next` | Framework web fullstack |

### App Mobile (TypeScript)
| Biblioteca | Propósito |
|------------|-----------|
| `@react-navigation` | Navegação entre telas |
| `expo-image-picker` | Captura de fotos de produtos |
| `expo-notifications` | Push notifications |
| `expo-secure-store` | Armazenamento seguro de tokens |
| `axios` | HTTP client |

## Banco de Dados

- **MongoDB Atlas** (cluster `servercosthml`)
- Driver: `pymongo` 4.10
- Sem ORM — acesso direto via collections
- Collections: `users`, `producers`, `products`, `reservations`, `otp_codes`, `fair_configs`
- Índices:
  - `otp_codes.created_at` — TTL 300s (auto-expiração)
  - `users.phone` — unique

## Infraestrutura

```
┌─────────────────────────────────────────────────────┐
│         DigitalOcean App Platform (1 container)      │
│                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  nginx   │──│  Next.js     │  │  Uvicorn     │  │
│  │  :80     │  │  :3000       │  │  :8000       │  │
│  └──────────┘  └──────────────┘  └──────────────┘  │
│       │              │                    │          │
│       │   proxy /    │   proxy /api/      │          │
│       └──────────────┘────────────────────┘          │
└─────────────────────────────────────────────────────┘
        │                           │
        ▼                           ▼
  MongoDB Atlas              DO Spaces (S3)
  (dados)                    (imagens)
```

- **Container único** com nginx + Next.js (standalone) + Uvicorn/FastAPI
- Build multi-stage (node-deps → node-builder → python-slim runner)
- Deploy automático via `git push origin develop`
- Healthcheck: `curl http://127.0.0.1/`
- Startup: entrypoint.sh aguarda backend ficar saudável antes de iniciar nginx

## Storage de Imagens

- **DigitalOcean Spaces** (S3-compatible)
- Bucket: `dadosbimdoctor`
- Pastas:
  - `terraviva/profiles/` — fotos de perfil dos produtores
  - `terraviva/products/` — fotos de produtos
- ACL: `public-read`
- Endpoint: `https://nyc3.digitaloceanspaces.com`

## Ferramentas de Desenvolvimento

| Ferramenta | Uso |
|------------|-----|
| Docker Compose | Ambiente local (3 containers: backend, web, nginx) |
| TypeScript | Type-checking no frontend |
| PostCSS + Autoprefixer | Pipeline CSS |

## Decisões Arquiteturais Importantes

1. **Container único em produção**: Simplifica deploy/custo no piloto. nginx faz roteamento interno entre Next.js e FastAPI. Trade-off: não escala componentes independentemente.

2. **MongoDB sem ORM**: Acesso direto via pymongo para flexibilidade e simplicidade. Adequado para esquema em evolução durante piloto.

3. **Auth por OTP (sem senha)**: Público-alvo são produtores rurais — login simples via WhatsApp. JWT com cookie httpOnly para segurança server-side + localStorage para client-side.

4. **Next.js Server Components**: Páginas públicas (bancas, home) renderizam no servidor com dados pré-carregados via `apiGet()` chamando o backend internamente (`API_INTERNAL_URL`).

5. **OpenAI como diferencial**: GPT-4O Vision analisa foto do produto e preenche metadados automaticamente — reduz fricção para produtores com pouca fluência digital.
