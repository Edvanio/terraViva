# Integrações

## Serviços Externos

### OpenAI API
**Tipo**: API REST (SDK Python)  
**Propósito**: Geração inteligente de produtos a partir de fotos  
**Modelos usados**:
- `gpt-4o` — Vision (análise de imagem → metadata do produto)
- `dall-e-2` — Geração de imagem de fundo estilizada

**Dados enviados**: URL da foto do produto, cidade do produtor  
**Dados recebidos**: Nome, descrição, categoria, preço sugerido, cores, imagem gerada  
**Dependência**: Opcional (funcionalidade de IA desativada graciosamente sem API key)  
**Tratamento de falhas**:
- Timeout de 90 segundos (`asyncio.wait_for`)
- Retorna HTTP 503 se indisponível
- Fallback: produtor cadastra produto manualmente

**Configuração**: `OPENAI_API_KEY` env var

---

### DigitalOcean Spaces (S3-Compatible)
**Tipo**: Object Storage API (SDK boto3)  
**Propósito**: Armazenamento de imagens (fotos de perfil, capas, produtos)  
**Protocolo**: S3 API via `boto3`

**Dados enviados**: Imagens processadas (resize/compress via Pillow)  
**Dados recebidos**: URL pública da imagem  
**Dependência**: Crítica (sem Spaces, upload de fotos não funciona)  
**Tratamento de falhas**: Exceção propagada ao frontend ("Erro ao enviar foto")

**Configuração**:
- `DO_SPACES_KEY` — Access key
- `DO_SPACES_SECRET` — Secret key
- `DO_SPACES_ENDPOINT` — `https://nyc3.digitaloceanspaces.com`
- `DO_SPACES_BUCKET` — `dadosbimdoctor`
- `DO_SPACES_FOLDER` — `terraviva/profiles`
- `DO_SPACES_PRODUCTS_FOLDER` — `terraviva/products`

---

### MongoDB Atlas (DigitalOcean Managed)
**Tipo**: Database as a Service  
**Propósito**: Persistência principal (usuários, produtos, reservas, configs)  
**Protocolo**: MongoDB Wire Protocol via `pymongo` (sync)

**Cluster**: `db-mongodb-bimdoctor-ce100a5c.mongo.ondigitalocean.com`  
**Database**: `terra_viva`  
**Dependência**: Crítica  
**Tratamento de falhas**: Conexão falha = app não inicia (fail fast)

**Configuração**: `MONGODB_URL` env var (connection string SRV com TLS)

---

### Expo Push Notifications
**Tipo**: HTTP API  
**Propósito**: Enviar notificações push ao produtor quando recebe novo pedido  
**Protocolo**: POST para `https://exp.host/--/api/v2/push/send`

**Dados enviados**: `expo_push_token` do produtor, título, body  
**Dependência**: Opcional (falha silenciosa)  
**Tratamento de falhas**: Fire-and-forget em thread daemon, não bloqueia response  

**Configuração**: Token do dispositivo salvo em `users.expo_push_token`

---

## Integrações Internas (Intra-Container)

### nginx → FastAPI
**Tipo**: Proxy reverso  
**Rota**: `/api/*` → `http://127.0.0.1:8000/`  
**Detalhes**: Strip `/api` prefix, forward headers (`X-Real-IP`, `X-Forwarded-For`)

### nginx → Next.js
**Tipo**: Proxy reverso  
**Rotas**:
- `/*` → `http://127.0.0.1:3000` (páginas e assets)
- `/api/auth/session` → `http://127.0.0.1:3000` (API route Next.js)

### Next.js SSR → FastAPI
**Tipo**: HTTP fetch interno  
**URL**: `http://127.0.0.1:8000` (env `API_INTERNAL_URL`)  
**Propósito**: Server Components buscam dados diretamente do backend sem passar por nginx  
**Configuração**: `API_INTERNAL_URL` passada explicitamente no `entrypoint.sh`

### Next.js Client → FastAPI
**Tipo**: HTTP fetch via browser  
**URL**: `/api/*` (relativo, passa por nginx)  
**Propósito**: Client Components fazem requests autenticadas via browser  
**Configuração**: `NEXT_PUBLIC_API_URL=/api` (build-time)

### Nominatim / OpenStreetMap (Client-side)
**Tipo**: HTTP fetch no browser (client-side)  
**URL**: `https://nominatim.openstreetmap.org/reverse`  
**Propósito**: Reverse geocode das coordenadas GPS do usuário para detectar cidade/UF  
**Custo**: Gratuito (sem API key)  
**Limitações**: Rate limit de 1 req/segundo; requer `User-Agent` identificador  
**Tratamento de Falhas**: Toast de erro; fallback para digitação manual

---

## Dependências Externas Futuras (Não Implementadas)

| Serviço | Propósito | Status |
|---------|-----------|--------|
| Twilio/Vonage | Envio real de SMS para OTP | Planejado |
| Gateway de Pagamento | Pix automático | Planejado |
| WhatsApp Business API | Notificações via WhatsApp | Avaliando |

---

## Diagrama de Integrações

```
                    ┌─────────────────┐
                    │   Consumidor    │
                    │  (Browser/App)  │
                    └────────┬────────┘
                             │ HTTPS
                             ▼
                    ┌─────────────────┐
                    │  nginx (:80)    │
                    │  (DO Container) │
                    └──┬──────────┬───┘
                       │          │
              /api/*   │          │  /*
                       ▼          ▼
              ┌─────────┐  ┌──────────┐
              │ FastAPI  │  │ Next.js  │
              │ (:8000)  │  │ (:3000)  │
              └──┬───┬───┘  └──────────┘
                 │   │           │
                 │   │    SSR fetch (127.0.0.1:8000)
                 │   │           │
    ┌────────────┘   └───────────┼──────────┐
    │                            │          │
    ▼                            ▼          ▼
┌────────┐              ┌──────────┐  ┌──────────┐
│MongoDB │              │ OpenAI   │  │DO Spaces │
│ Atlas  │              │ (GPT-4o) │  │  (S3)    │
└────────┘              └──────────┘  └──────────┘
    │
    │ (push token)
    ▼
┌────────────┐
│ Expo Push  │
│ API        │
└────────────┘

    Browser (client-side)
        │
        ▼
┌──────────────┐
│  Nominatim   │
│ OpenStreetMap│
│(reverse geo) │
└──────────────┘
```

## Contratos de Integração

### OpenAI Vision Request
O prompt enviado ao GPT-4o inclui instruções para retornar JSON com:
- `name` (string) — nome do produto
- `description` (string) — descrição comercial
- `category` (enum) — uma das 12 categorias fixas
- `suggested_price` (float) — preço em R$ baseado na região
- `color_primary` (hex) — cor dominante do produto
- `color_accent` (hex) — cor de destaque

### OpenAI Geocode (GPT-4o-mini)
Prompt otimizado para extrair município de endereços brasileiros:
- Ignora nomes de rua/bairro como possíveis cidades
- Retorna `null` em casos ambíguos
- Request: `POST /producer/geocode { address: "..." }`

### Nominatim Reverse Geocode (Client-side)
```
GET https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&accept-language=pt-BR
User-Agent: TerraViva/1.0
```
Resposta processada: extrai `address.city/town/village/municipality` + `ISO3166-2-lvl4` para UF.

### Expo Push Notification
```json
{
  "to": "ExponentPushToken[xxx]",
  "title": "Novo pedido!",
  "body": "Queijo Colonial (x2) - feira"
}
```
