# Stack Tecnológica

## Linguagens e Runtime

| Linguagem | Versão | Uso |
|-----------|--------|-----|
| Python | 3.11 | Backend API |
| TypeScript | 5.6 | Web + Mobile + Shared types |
| JavaScript (Node.js) | 18 LTS | Runtime Next.js em produção |

## Frameworks Principais

| Framework | Versão | Componente |
|-----------|--------|------------|
| FastAPI | 0.115.6 | Backend REST API |
| Next.js | 15.0.3 (App Router) | Frontend web (SSR + CSR) |
| React | 18.3.1 | UI web |
| React Native | 0.76.1 | App mobile |
| Expo | 52.0.11 | Build e distribuição mobile |
| Tailwind CSS | 3.4.16 | Estilização web |

## Bibliotecas Chave

### Backend (Python)
| Biblioteca | Propósito |
|-----------|-----------|
| PyMongo 4.10.1 | Driver MongoDB (sem ORM) |
| Pydantic + pydantic-settings | Validação, serialização, config |
| python-jose | Geração/validação JWT |
| boto3 | Upload para DigitalOcean Spaces (S3) |
| openai | API GPT-4o Vision + geração de imagem |
| httpx | Cliente HTTP (push notifications, z-api) |
| Pillow | Processamento de imagens (resize) |

### Web (TypeScript)
| Biblioteca | Propósito |
|-----------|-----------|
| SWR 2.2.5 | Data fetching com cache client-side |
| js-cookie | Gestão de cookies (auth) |
| react-hot-toast | Feedback visual (toasts) |
| lucide-react | Ícones |

### Mobile (TypeScript)
| Biblioteca | Propósito |
|-----------|-----------|
| @react-navigation | Navegação (stack + tabs) |
| expo-secure-store | Armazenamento seguro do JWT |
| @react-native-async-storage | Cache local |
| expo-notifications | Push notifications |
| expo-camera | Captura de foto para IA |

## Banco de Dados

- **MongoDB** (DigitalOcean Managed Database)
- **Abordagem**: Schema-flexible, sem ORM — queries diretas via PyMongo
- **Índices**: TTL para OTP (5min), unique em phone/short_code, sparse em reviews
- **Coleções principais**: `users`, `products`, `reservations`, `reviews`, `otp_codes`, `notifications`, `fair_config`

## Infraestrutura

| Componente | Tecnologia |
|-----------|-----------|
| Containers | Docker + Docker Compose |
| Proxy reverso | nginx 1.25 |
| Hosting | DigitalOcean App Platform |
| Storage (arquivos) | DigitalOcean Spaces (S3-compatível) |
| CI/CD | Auto-deploy via push no branch `main` |
| DNS/TLS | Gerenciado pelo DO App Platform |

## Ferramentas de Desenvolvimento

| Ferramenta | Propósito |
|-----------|-----------|
| Docker Compose | Orquestração local (backend + web + nginx) |
| Makefile | Shortcuts para comandos comuns |
| ESLint + Prettier | Linting/formatação web |
| supervisord | Gerenciamento de processos no container |

## Arquitetura Geral

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  App Mobile │     │  Browser    │     │  WhatsApp    │
│  (Expo)     │     │  (Next.js)  │     │  (z-api)     │
└──────┬──────┘     └──────┬──────┘     └──────┬───────┘
       │                   │                    │
       │  HTTPS            │  nginx :80         │  Webhook
       ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                    nginx (reverse proxy)              │
│  /api/* → FastAPI :8000  |  /* → Next.js :3000       │
└──────────────────────────────────────────────────────┘
       │                          │
       ▼                          ▼
┌──────────────┐          ┌──────────────┐
│   FastAPI    │◄─────────│   Next.js    │
│   (backend)  │  SSR     │   (web SSR)  │
└──────┬───────┘          └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  MongoDB     │     │  DO Spaces   │     │  OpenAI API  │
│  (Atlas)     │     │  (S3)        │     │  (GPT-4o)    │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Decisões Arquiteturais Importantes

| Decisão | Justificativa |
|---------|---------------|
| FastAPI sobre Express/NestJS | Type-safety nativa, schema validation com Pydantic, alta performance async |
| MongoDB sobre PostgreSQL | Documentos flexíveis — produto pode ter campos variáveis; sem necessidade de migrations |
| Monorepo único | Deploy unificado, tipos compartilhados, menor overhead de coordenação |
| Container Docker unificado | Reduz custo no DO App Platform (billing por container) |
| JWT com 360 dias de expiração | Usuários rurais acessam esporadicamente (dia da feira); elimina fricção de re-login |
| Sem sistema de roles | Mesmo usuário pode ser produtor e consumidor simultaneamente — simplifica UX |
| OTP por SMS (sem senha) | Público-alvo com baixa afinidade digital; login por código no WhatsApp/SMS |
| OpenAI Vision para cadastro | Produtor fotografa produto → IA gera nome, descrição, preço e categoria |
