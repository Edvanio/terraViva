# Terra Viva — Arquitetura Técnica

> Backend FastAPI + MongoDB · Docker no DigitalOcean
> App mobile iOS/Android (mesmo código) · Web Next.js · Offline com sync

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Componentes do Sistema](#2-componentes-do-sistema)
3. [Estrutura do Repositório (Monorepo)](#3-estrutura-do-repositório-monorepo)
4. [Backend — FastAPI + MongoDB](#4-backend--fastapi--mongodb)
5. [Frontend Web — Next.js](#5-frontend-web--nextjs)
6. [App Mobile — React Native (iOS + Android)](#6-app-mobile--react-native-ios--android)
7. [Offline First — Estratégia de Sync](#7-offline-first--estratégia-de-sync)
8. [Docker — Serviços e Compose](#8-docker--serviços-e-compose)
9. [NGINX — Roteamento e Proxy](#9-nginx--roteamento-e-proxy)
10. [DigitalOcean — Deploy e Infra](#10-digitalocean--deploy-e-infra)
11. [MongoDB — Configuração e Dados](#11-mongodb--configuração-e-dados)
12. [Variáveis de Ambiente](#12-variáveis-de-ambiente)
13. [CI/CD — Pipeline de Deploy](#13-cicd--pipeline-de-deploy)
14. [Segurança](#14-segurança)
15. [Escalabilidade — Próximos Passos](#15-escalabilidade--próximos-passos)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIOS                                  │
│                                                                   │
│   [📱 App iOS]   [📱 App Android]   [🌐 Browser Web]            │
│        └──────────────┬──────────────────┘                       │
└───────────────────────┼──────────────────────────────────────────┘
                        │ HTTPS
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│                  DigitalOcean Droplet                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   NGINX (porta 80/443)                   │    │
│  │   /api/*  ──────► FastAPI (porta 8000)                   │    │
│  │   /*      ──────► Next.js (porta 3000)                   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────┐   ┌─────────────────┐                       │
│  │  FastAPI (API)  │   │  Next.js (Web)  │                       │
│  │  Python 3.11    │   │  React / SSR    │                       │
│  │  porta 8000     │   │  porta 3000     │                       │
│  └────────┬────────┘   └─────────────────┘                       │
│           │ pymongo                                               │
│  ┌────────▼────────┐   ┌─────────────────┐                       │
│  │    MongoDB      │   │     Storage      │                       │
│  │    porta 27017  │   │  (fotos/uploads) │                       │
│  └─────────────────┘   └─────────────────┘                       │
│                                                                   │
│  Todos os serviços gerenciados pelo Docker Compose               │
└──────────────────────────────────────────────────────────────────┘
```

### Decisões de arquitetura

| Decisão | Escolha | Motivo |
|---|---|---|
| Backend | FastAPI (Python) | Já existente, rápido, async, documentação automática |
| Banco de dados | MongoDB | Flexível para schema em evolução, já em uso |
| App mobile | React Native + Expo | Um código = iOS + Android |
| Web frontend | Next.js (React) | SSR, compartilha tipos com mobile, fácil deploy |
| Containerização | Docker + Compose | Ambiente reproduzível em qualquer máquina |
| Hospedagem | DigitalOcean Droplet | Controle total, custo previsível |
| Proxy reverso | NGINX | Roteamento, SSL, compressão |
| Offline | Queue local + sync | Funciona sem internet, sincroniza ao conectar |

---

## 2. Componentes do Sistema

```
terra-viva/
│
├── backend/          ← FastAPI (Python) — API REST
├── web/              ← Next.js — interface web e painel admin
├── app/              ← React Native + Expo — iOS e Android
├── shared/           ← Tipos TypeScript compartilhados (web + mobile)
├── nginx/            ← Configuração do proxy reverso
├── docker-compose.yml
└── docker-compose.prod.yml
```

### Responsabilidades por componente

**backend/** — toda a lógica de negócio, autenticação, banco de dados. Exposto em `/api/*`.

**web/** — interface para o consumidor no navegador + painel admin para parceiros institucionais. Servido em `/`.

**app/** — app móvel. Consome a mesma API do backend. Funciona offline com queue de sincronização.

**shared/** — interfaces TypeScript (User, Banca, Product, Reservation) usadas tanto pelo web quanto pelo app. Evita duplicação de tipos.

**nginx/** — entrada única do sistema. Roteia `/api/*` para FastAPI, todo o resto para Next.js. Gerencia SSL com Let's Encrypt.

---

## 3. Estrutura do Repositório (Monorepo)

```
terra-viva/
│
├── backend/                          # API FastAPI
│   ├── main.py                       # Rotas e aplicação
│   ├── models.py                     # Pydantic schemas
│   ├── config.py                     # Configurações via .env
│   ├── database.py                   # Conexão MongoDB
│   ├── utils.py                      # JWT, OTP, helpers
│   ├── routers/                      # Rotas organizadas por domínio
│   │   ├── auth.py
│   │   ├── bancas.py
│   │   ├── products.py
│   │   ├── reservations.py
│   │   ├── producers.py
│   │   └── fair_config.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── web/                              # Next.js (web + admin)
│   ├── src/
│   │   ├── app/                      # App Router (Next.js 14+)
│   │   │   ├── page.tsx              # Home pública (bancas)
│   │   │   ├── banca/[id]/page.tsx   # Detalhe da banca
│   │   │   ├── pedidos/page.tsx      # Meus pedidos (consumidor)
│   │   │   └── admin/               # Painel do parceiro institucional
│   │   │       ├── page.tsx
│   │   │       ├── feira/page.tsx    # Config da feira
│   │   │       └── relatorios/page.tsx
│   │   ├── components/               # Componentes React compartilhados
│   │   │   ├── ui/                   # Botões, cards, inputs
│   │   │   ├── BancaCard.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── FairStatusBanner.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                # Cliente HTTP para o backend
│   │   │   └── auth.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── public/
│   ├── next.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── app/                              # React Native + Expo
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   │   ├── api.ts                # HTTP client
│   │   │   ├── auth.ts
│   │   │   └── sync.ts              # ← NOVO: gerenciador de sync offline
│   │   ├── storage/
│   │   │   ├── queue.ts             # ← NOVO: fila de operações offline
│   │   │   └── cache.ts            # ← NOVO: cache local de dados
│   │   └── theme/
│   │       └── tokens.ts
│   ├── App.tsx
│   ├── package.json
│   └── app.json
│
├── shared/                           # Tipos compartilhados (TS)
│   ├── types/
│   │   ├── user.ts
│   │   ├── banca.ts
│   │   ├── product.ts
│   │   ├── reservation.ts
│   │   └── fair-config.ts
│   └── package.json
│
├── nginx/
│   ├── nginx.conf                    # Configuração do proxy
│   └── conf.d/
│       └── terra-viva.conf
│
├── docker-compose.yml                # Desenvolvimento local
├── docker-compose.prod.yml          # Produção (DigitalOcean)
├── .env.example                      # Variáveis globais de exemplo
└── Makefile                          # Comandos úteis (make dev, make deploy...)
```

---

## 4. Backend — FastAPI + MongoDB

### Dockerfile do backend

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código
COPY . .

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Organização das rotas (routers/)

Em vez de tudo em `main.py`, cada domínio tem seu próprio router:

```python
# main.py — registro limpo
from routers import auth, bancas, products, reservations, producers, fair_config

app.include_router(auth.router,         prefix="/auth",       tags=["Auth"])
app.include_router(bancas.router,       prefix="/bancas",     tags=["Bancas"])
app.include_router(products.router,     prefix="/products",   tags=["Produtos"])
app.include_router(reservations.router, prefix="/reservations", tags=["Reservas"])
app.include_router(producers.router,    prefix="/producer",   tags=["Produtor"])
app.include_router(fair_config.router,  prefix="/fair-config", tags=["Config Feira"])
```

### Novos campos nos models (conforme definido no fluxo de negócio)

```python
# models.py — campos a adicionar

class ProducerProfile(BaseModel):
    # ... campos existentes ...
    payment_methods: List[str] = ["cash"]  # ["cash", "pix", "card"]
    pix_key: Optional[str] = None          # Chave Pix exibida ao consumidor
    address: Optional[str] = None          # Endereço para retirada direta

class ReservationCreate(BaseModel):
    product_id: str
    quantity: int = 1
    pickup_location: str          # "feira" | "produtor"
    payment_intent: str           # "cash" | "pix" | "card"

# Nova model: config da feira por cidade
class FairConfig(BaseModel):
    name: str                     # "Feira de São Ludgero"
    city: str
    logo_url: Optional[str] = None
    primary_color: str = "#2A5C2E"
    secondary_color: str = "#F7F3EC"
    fair_day: str                 # "saturday"
    fair_start_time: str          # "08:00"
    fair_end_time: str            # "12:00"
    fair_location: str            # "Centro, São Ludgero/SC"
    order_window_open: str        # "monday 07:00"
    order_window_close: str       # "friday 18:00"
    active: bool = True
```

---

## 5. Frontend Web — Next.js

### Dockerfile do web

```dockerfile
# web/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Imagem final — apenas o necessário
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

### next.config.js — modo standalone para Docker

```javascript
// web/next.config.js
const nextConfig = {
  output: 'standalone',          // necessário para Docker leve
  images: {
    domains: ['sua-api.com'],    // domínio do backend para imagens
  },
  async rewrites() {
    return [
      // /api/* vai direto pro backend (em dev; em prod o NGINX cuida)
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### Estrutura de páginas

| Rota | Quem acessa | Descrição |
|---|---|---|
| `/` | Consumidor | Home com lista de bancas |
| `/banca/[id]` | Consumidor | Detalhe da banca + produtos |
| `/pedidos` | Consumidor logado | Histórico de reservas |
| `/perfil` | Consumidor logado | Dados do usuário |
| `/admin` | Parceiro institucional | Painel admin |
| `/admin/feira` | Admin | Configurar calendário da feira |
| `/admin/relatorios` | Admin | Ver movimentação |

---

## 6. App Mobile — React Native (iOS + Android)

O app já existe em React Native + Expo. O mesmo código gera o APK (Android) e o IPA (iOS) via **Expo EAS Build**.

### Build para produção

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login no Expo
eas login

# Configurar projeto
eas build:configure

# Build Android (APK ou AAB para Play Store)
eas build --platform android --profile production

# Build iOS (IPA para App Store)
eas build --platform ios --profile production
```

### eas.json — perfis de build

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "simulator": false }
    }
  }
}
```

---

## 7. Offline First — Estratégia de Sync

O app precisa funcionar sem internet — situação comum em área rural.

### Princípio

- **Leitura**: servida do cache local. Dados são baixados e salvos ao abrir o app com internet.
- **Escrita** (reserva, perfil): entra em uma fila local. Quando a internet voltar, a fila é processada automaticamente.
- **Conflito**: timestamp vence — a operação mais recente prevalece.

### Fluxo de sync

```
App abre
    ↓
Verifica conectividade (NetInfo)
    ├── Online  → baixa dados frescos → salva no cache local
    └── Offline → serve do cache local
            ↓
Usuário faz reserva (online ou offline)
    ├── Online  → POST /reservations → sucesso
    └── Offline → salva na fila local (AsyncStorage)
            ↓
Conexão volta
    ↓
SyncManager detecta (listener NetInfo)
    ↓
Processa fila: envia cada operação para a API
    ↓
Atualiza cache com resposta
    ↓
Notifica usuário: "X reservas sincronizadas"
```

### Implementação — app/src/services/sync.ts

```typescript
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

const QUEUE_KEY = '@terra_viva:sync_queue';
const CACHE_KEY = '@terra_viva:cache';

export interface SyncOperation {
  id: string;                          // UUID local
  type: 'CREATE_RESERVATION' | 'UPDATE_PROFILE' | 'UPDATE_PRODUCT';
  payload: Record<string, unknown>;
  createdAt: string;                   // ISO timestamp
  retries: number;
}

class SyncManager {
  private isOnline = true;
  private isSyncing = false;

  // Inicializa listener de conectividade
  initialize() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        // Voltou a conectar — processa a fila
        this.processQueue();
      }
    });
  }

  // Adiciona operação na fila (quando offline)
  async enqueue(operation: Omit<SyncOperation, 'id' | 'retries' | 'createdAt'>) {
    const queue = await this.getQueue();
    const newOp: SyncOperation = {
      ...operation,
      id: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    queue.push(newOp);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return newOp.id;
  }

  // Processa fila ao voltar online
  async processQueue() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    const queue = await this.getQueue();
    const failed: SyncOperation[] = [];

    for (const op of queue) {
      try {
        await this.executeOperation(op);
      } catch {
        if (op.retries < 3) {
          failed.push({ ...op, retries: op.retries + 1 });
        }
        // Mais de 3 tentativas: descarta
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
    this.isSyncing = false;
  }

  private async executeOperation(op: SyncOperation) {
    switch (op.type) {
      case 'CREATE_RESERVATION':
        return apiClient.createReservation(op.payload as any);
      case 'UPDATE_PROFILE':
        return apiClient.updateProducerProfile(op.payload as any);
      case 'UPDATE_PRODUCT':
        return apiClient.updateProduct(op.payload as any);
    }
  }

  private async getQueue(): Promise<SyncOperation[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export const syncManager = new SyncManager();
```

### Cache local de dados — app/src/storage/cache.ts

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const TTL_MS = 1000 * 60 * 30; // 30 minutos

export async function setCache(key: string, data: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify({
    data,
    cachedAt: Date.now(),
  }));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  const { data, cachedAt } = JSON.parse(raw);
  if (Date.now() - cachedAt > TTL_MS) return null; // expirado

  return data as T;
}

// Chaves de cache usadas no app
export const CacheKeys = {
  bancas: 'bancas_list',
  banca: (id: string) => `banca_${id}`,
  myReservations: 'my_reservations',
  fairConfig: (city: string) => `fair_config_${city}`,
};
```

### Dependências para offline

```bash
npx expo install @react-native-community/netinfo
npx expo install @react-native-async-storage/async-storage
```

---

## 8. Docker — Serviços e Compose

### docker-compose.yml (desenvolvimento local)

```yaml
version: '3.9'

services:

  # ─── MongoDB ───────────────────────────────────────────────
  mongodb:
    image: mongo:7.0
    container_name: terra-viva-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: terra_viva
    volumes:
      - mongo_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/init.js:ro
    networks:
      - terra-viva-net

  # ─── Backend FastAPI ────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: terra-viva-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongodb:27017/terra_viva?authSource=admin
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=true
    depends_on:
      - mongodb
    volumes:
      - ./backend:/app          # hot reload em dev
      - uploads_data:/app/uploads
    networks:
      - terra-viva-net
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # ─── Frontend Web Next.js ───────────────────────────────────
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    container_name: terra-viva-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
      - NEXTAUTH_SECRET=${SECRET_KEY}
    depends_on:
      - backend
    networks:
      - terra-viva-net

  # ─── NGINX (proxy reverso) ──────────────────────────────────
  nginx:
    image: nginx:alpine
    container_name: terra-viva-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - certbot_data:/etc/letsencrypt:ro
      - certbot_www:/var/www/certbot:ro
    depends_on:
      - backend
      - web
    networks:
      - terra-viva-net

# ─── Volumes ────────────────────────────────────────────────
volumes:
  mongo_data:
  uploads_data:
  certbot_data:
  certbot_www:

# ─── Rede interna ────────────────────────────────────────────
networks:
  terra-viva-net:
    driver: bridge
```

### docker-compose.prod.yml (produção — sobrescreve o base)

```yaml
version: '3.9'

services:

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    volumes:
      - uploads_data:/app/uploads  # sem hot reload em prod
    environment:
      - DEBUG=false
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
      target: runner         # stage de produção do Dockerfile
    environment:
      - NODE_ENV=production

  mongodb:
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    ports: []               # não expõe mongo para fora em prod
```

### Rodar em desenvolvimento

```bash
# Copiar variáveis de ambiente
cp .env.example .env

# Subir tudo
docker compose up --build

# Backend: http://localhost:8000
# API docs: http://localhost:8000/docs
# Web: http://localhost:3000
# MongoDB: localhost:27017
```

### Rodar em produção

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 9. NGINX — Roteamento e Proxy

### nginx/conf.d/terra-viva.conf

```nginx
# Redireciona HTTP → HTTPS
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS principal
server {
    listen 443 ssl http2;
    server_name seudominio.com.br www.seudominio.com.br;

    ssl_certificate     /etc/letsencrypt/live/seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com.br/privkey.pem;

    # Compressão
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # Upload de arquivos (fotos)
    client_max_body_size 10M;

    # ── API FastAPI ──────────────────────────────────────────
    location /api/ {
        proxy_pass         http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # ── Documentação da API (só em dev — remover em prod) ───
    location /docs {
        proxy_pass http://backend:8000/docs;
    }

    # ── Frontend Next.js ─────────────────────────────────────
    location / {
        proxy_pass         http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # ── Arquivos estáticos (cache longo) ─────────────────────
    location /_next/static/ {
        proxy_pass http://web:3000/_next/static/;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

## 10. DigitalOcean — Deploy e Infra

### Infraestrutura recomendada

| Recurso | Especificação | Custo estimado |
|---|---|---|
| Droplet | Basic · 2 vCPU · 4GB RAM · 80GB SSD | ~$24/mês |
| Domínio | Registro externo (Registro.br etc.) | variável |
| Backups | Habilitado no Droplet (20% do custo) | ~$4,80/mês |
| Spaces (opcional) | Object Storage para fotos (250GB) | ~$5/mês |
| **Total** | | **~$34/mês** |

> Para o MVP inicial, 2 vCPU + 4GB RAM suporta tranquilamente centenas de usuários simultâneos.

### Passo a passo de setup no DigitalOcean

**1. Criar o Droplet**

```
Região: São Paulo (nyc3 ou syd1 como fallback)
Imagem: Ubuntu 24.04 LTS
Tamanho: Basic · 2 vCPU · 4GB
Autenticação: SSH Key (criar e adicionar)
```

**2. Configurar o servidor**

```bash
# Conectar via SSH
ssh root@IP_DO_DROPLET

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Criar usuário não-root para deploy
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy
```

**3. Clonar o repositório**

```bash
su - deploy
git clone https://github.com/seu-usuario/terra-viva.git
cd terra-viva
cp .env.example .env
nano .env   # preencher variáveis de produção
```

**4. Configurar SSL com Let's Encrypt**

```bash
# Subir apenas NGINX na porta 80 primeiro
docker compose up -d nginx

# Obter certificado
docker run --rm -v certbot_data:/etc/letsencrypt \
  -v certbot_www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d seudominio.com.br -d www.seudominio.com.br \
  --email seu@email.com --agree-tos

# Subir tudo
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

**5. Renovação automática do SSL**

```bash
# Adicionar cron para renovar o certificado
crontab -e
# Adicionar linha:
0 3 * * 1 docker run --rm -v certbot_data:/etc/letsencrypt -v certbot_www:/var/www/certbot certbot/certbot renew --quiet && docker compose exec nginx nginx -s reload
```

**6. Verificar que está tudo rodando**

```bash
docker compose ps
# Deve mostrar: nginx, backend, web, mongodb — todos Up

curl https://seudominio.com.br/api/health
# Deve retornar: {"status": "ok", "message": "Terra Viva API rodando 🌱"}
```

---

## 11. MongoDB — Configuração e Dados

### Self-hosted no Docker (MVP)

O MongoDB roda no mesmo Droplet que os outros serviços. Para o MVP com volume pequeno, é suficiente e econômico.

### Script de inicialização — scripts/mongo-init.js

```javascript
// Executado automaticamente no primeiro start do container MongoDB
db = db.getSiblingDB('terra_viva');

// Índices para performance
db.users.createIndex({ phone: 1 }, { unique: true });
db.producers.createIndex({ user_id: 1 });
db.producers.createIndex({ city: 1 });
db.products.createIndex({ producer_id: 1 });
db.products.createIndex({ producer_id: 1, is_active: 1 });
db.reservations.createIndex({ consumer_id: 1, created_at: -1 });
db.reservations.createIndex({ producer_id: 1, created_at: -1 });
db.otp_codes.createIndex({ created_at: 1 }, { expireAfterSeconds: 300 }); // TTL 5 min
db.fair_configs.createIndex({ city: 1 }, { unique: true });

print('✅ Índices do Terra Viva criados');
```

### Backup automático

```bash
# Script de backup diário — salva em /backups
# Adicionar ao cron do servidor

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
mkdir -p $BACKUP_DIR

docker exec terra-viva-mongo mongodump \
  --username $MONGO_USER \
  --password $MONGO_PASSWORD \
  --authenticationDatabase admin \
  --db terra_viva \
  --out /tmp/mongo-backup

docker cp terra-viva-mongo:/tmp/mongo-backup $BACKUP_DIR/backup_$DATE
gzip -r $BACKUP_DIR/backup_$DATE

# Manter apenas os últimos 7 dias
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "✅ Backup $DATE concluído"
```

### Migrar para MongoDB Atlas (futuro)

Quando o volume crescer, migrar o MongoDB para **DigitalOcean Managed MongoDB** ou **MongoDB Atlas** é simples — basta trocar a `MONGODB_URL` no `.env`. Nenhum código muda.

---

## 12. Variáveis de Ambiente

### .env.example (raiz do projeto)

```bash
# ─── MongoDB ────────────────────────────────────────────────
MONGO_USER=terra_viva_user
MONGO_PASSWORD=SENHA_FORTE_AQUI
MONGODB_URL=mongodb://terra_viva_user:SENHA_FORTE_AQUI@mongodb:27017/terra_viva?authSource=admin

# ─── JWT e Segurança ────────────────────────────────────────
SECRET_KEY=CHAVE_ALEATORIA_32_CARACTERES_MINIMO
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440   # 24h em produção

# ─── SMS OTP ────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+5511XXXXXXXXX

# ─── API ────────────────────────────────────────────────────
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
ALLOWED_ORIGINS=https://seudominio.com.br,https://www.seudominio.com.br

# ─── Web Next.js ────────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://seudominio.com.br/api
NEXTAUTH_SECRET=OUTRA_CHAVE_ALEATORIA_AQUI
NEXTAUTH_URL=https://seudominio.com.br

# ─── Upload de arquivos ─────────────────────────────────────
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE_MB=10

# ─── Ambiente ───────────────────────────────────────────────
ENVIRONMENT=production    # development | production
```

---

## 13. CI/CD — Pipeline de Deploy

### Makefile — comandos úteis

```makefile
# Makefile na raiz do projeto

.PHONY: dev prod deploy logs restart backup

# Desenvolvimento local
dev:
	docker compose up --build

# Produção local (teste)
prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Deploy no servidor
deploy:
	ssh deploy@${DROPLET_IP} '\
		cd terra-viva && \
		git pull origin main && \
		docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build \
	'

# Ver logs
logs:
	docker compose logs -f --tail=100

# Ver logs de um serviço
logs-backend:
	docker compose logs -f backend --tail=100

# Reiniciar serviços
restart:
	docker compose restart

# Backup manual do MongoDB
backup:
	./scripts/backup-mongo.sh

# Abrir shell no backend
shell-backend:
	docker compose exec backend bash

# Abrir shell no MongoDB
shell-mongo:
	docker compose exec mongodb mongosh -u ${MONGO_USER} -p ${MONGO_PASSWORD} terra_viva
```

### GitHub Actions — deploy automático ao fazer push na main

```yaml
# .github/workflows/deploy.yml
name: Deploy Terra Viva

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy no DigitalOcean
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/terra-viva
            git pull origin main
            docker compose -f docker-compose.yml -f docker-compose.prod.yml \
              up -d --build --remove-orphans
            docker image prune -f
            echo "✅ Deploy concluído"
```

---

## 14. Segurança

### Checklist de produção

- [ ] `DEBUG=false` no backend
- [ ] MongoDB sem porta exposta externamente (`ports: []` no compose prod)
- [ ] `ALLOWED_ORIGINS` restrito ao domínio real
- [ ] SSL/HTTPS ativo (Let's Encrypt)
- [ ] `SECRET_KEY` com no mínimo 32 caracteres aleatórios (`openssl rand -hex 32`)
- [ ] Senhas do MongoDB fortes e únicas
- [ ] Firewall no Droplet: liberar apenas 80, 443 e SSH (22)
- [ ] SSH com chave, sem senha (`PasswordAuthentication no` no sshd_config)
- [ ] Backup automático configurado
- [ ] Rate limiting no NGINX para evitar abuso de OTP

### Rate limiting no NGINX (anti-abuso de OTP)

```nginx
# nginx.conf — adicionar na seção http
limit_req_zone $binary_remote_addr zone=otp:10m rate=3r/m;

# No server block:
location /api/auth/request-otp {
    limit_req zone=otp burst=2 nodelay;
    proxy_pass http://backend:8000/auth/request-otp;
}
```

---

## 15. Escalabilidade — Próximos Passos

A arquitetura atual suporta tranquilamente o MVP e os primeiros contratos institucionais. Quando o volume crescer:

| Momento | Ação |
|---|---|
| 1.000+ usuários ativos | Mover MongoDB para DigitalOcean Managed Database |
| Alta latência de API | Adicionar Redis para cache de `GET /bancas` e `GET /fair-config` |
| Muitas fotos (GB) | Mover uploads para DigitalOcean Spaces (S3-compatible) |
| Múltiplas cidades simultâneas | Aumentar workers do Uvicorn (`--workers 4`) |
| Alta disponibilidade | Load Balancer + 2 Droplets (DigitalOcean Load Balancer) |
| App Web com muito tráfego | Mover Next.js para Vercel (fora do Docker) |

Todas essas mudanças são pontuais — a arquitetura base não muda.

---

*Terra Viva — Arquitetura Técnica v1.0 — 2026-05-01*
