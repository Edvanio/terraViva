# Integrações

## Serviços Externos

### OpenAI (GPT-4o + DALL-E)
| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | REST API |
| **Propósito** | Cadastro inteligente de produtos (Vision), geocoding por fallback |
| **Modelos** | `gpt-4o` (vision), `gpt-image-1` (geração), `gpt-4o-mini` (geocoding) |
| **Dependência** | Opcional — fallback para cadastro manual se indisponível |
| **Timeout** | 90 segundos |
| **Dados enviados** | Imagem do produto (base64), prompt com contexto da feira |
| **Dados recebidos** | JSON: name, description, category, suggested_price, colors[] |
| **Implementação** | `backend/services/openai_service.py` |

### DigitalOcean Spaces (S3)
| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | S3-compatible API (boto3) |
| **Propósito** | Armazenamento de imagens (perfil, capa, produtos) |
| **Bucket** | `dadosbimdoctor` |
| **Pastas** | `terraviva/profiles/`, `terraviva/products/` |
| **Dependência** | Crítica — sem storage, upload de fotos falha |
| **Acesso** | URLs públicas (CDN DO Spaces) |
| **Implementação** | `backend/routers/producers.py`, `backend/routers/products.py` |

### MongoDB Atlas (DigitalOcean Managed)
| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | Database driver (PyMongo) |
| **Propósito** | Persistência de todos os dados |
| **Connection** | SRV URI com TLS |
| **Dependência** | Crítica |
| **Coleções** | users, products, reservations, reviews, otp_codes, notifications, fair_config |
| **Implementação** | `backend/database.py` (singleton) |

### Expo Push Notifications
| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | HTTP API |
| **Propósito** | Push notifications para app mobile |
| **Endpoint** | `https://exp.host/--/api/v2/push/send` |
| **Dependência** | Opcional — apenas para usuários mobile com token registrado |
| **Dados enviados** | `{ to: expo_push_token, title, body }` |
| **Tratamento de falha** | Fire-and-forget (daemon thread) |
| **Implementação** | `backend/utils.py` → `send_push_notification()` |

### z-api (WhatsApp)
| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | REST API |
| **Propósito** | Notificações transacionais via WhatsApp |
| **Endpoint** | `https://api.z-api.io/instances/{id}/token/{token}/send-text` |
| **Dependência** | Opcional — apenas se produtor/consumidor tiver telefone cadastrado |
| **Autenticação** | Instance ID + Token + Client-Token (header) |
| **Dados enviados** | `{ phone: "55XXXXXXXXXXX", message: "texto formatado" }` |
| **Tratamento de falha** | Fire-and-forget (daemon thread) |
| **Implementação** | `backend/utils.py` → `send_whatsapp()` |

### Nominatim / OpenStreetMap
| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | HTTP API (free tier) |
| **Propósito** | Reverse geocoding — coordenadas → cidade/endereço |
| **Dependência** | Opcional — fallback para GPT-4o-mini se indisponível |
| **Rate limit** | 1 req/s (OSM policy) |
| **Implementação** | `backend/routers/producers.py` |

## Comunicação Intra-Container

### nginx ↔ FastAPI
| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | HTTP reverse proxy |
| **Rota** | `/api/*` → `http://backend:8000` (strip prefix) |
| **Headers** | X-Real-IP, X-Forwarded-For, X-Forwarded-Proto |
| **Upload** | `/uploads/*` → FastAPI (cache 1 dia) |

### nginx ↔ Next.js
| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | HTTP reverse proxy |
| **Rota** | `/*` → `http://web:3000` |
| **WebSocket** | Upgrade headers para HMR em dev |

### Next.js SSR → FastAPI
| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | HTTP interno (server-to-server) |
| **URL** | `http://backend:8000` (via `API_INTERNAL_URL`) |
| **Uso** | Server Components fazem fetch direto ao backend sem passar pelo nginx |
| **Auth** | Cookie `terra_viva_token` forwarded |

## Diagrama de Integrações

```
                    ┌────────────────────┐
                    │   OpenAI API       │
                    │  (Vision + Image)  │
                    └────────┬───────────┘
                             │ HTTPS
                             ▼
┌──────────┐    HTTP    ┌──────────────┐    PyMongo    ┌──────────────┐
│  z-api   │◄───────────│   FastAPI    │──────────────►│   MongoDB    │
│(WhatsApp)│            │   Backend    │               │   Atlas      │
└──────────┘            └──────┬───────┘               └──────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                    ▼          ▼          ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ DO Spaces│ │Expo Push │ │Nominatim │
            │  (S3)    │ │   API    │ │  (OSM)   │
            └──────────┘ └──────────┘ └──────────┘
```

## Contratos de Integração

### WhatsApp (z-api) — Formato de mensagem
```
🌱 *Terra Viva — [Título do evento]* [Emoji]
━━━━━━━━━━━━━━━━━━━━
[Detalhes do pedido com emojis]
━━━━━━━━━━━━━━━━━━━━
👆 [Call to action]:
https://terra-viva-3n3ko.ondigitalocean.app/[rota]
```

### Push Notification (Expo)
```json
{
  "to": "ExponentPushToken[...]",
  "title": "📦 Novo pedido!",
  "body": "João pediu Alface (x2) — Na feira"
}
```

## Resiliência

| Integração | Estratégia |
|-----------|-----------|
| OpenAI | Timeout 90s → fallback manual |
| z-api | Fire-and-forget (sem retry) |
| Expo Push | Fire-and-forget (sem retry) |
| Nominatim | Fallback → GPT-4o-mini geocoding |
| MongoDB | Conexão persistente (pool); startup falha se indisponível |
| DO Spaces | Erro 500 propagado ao cliente |
