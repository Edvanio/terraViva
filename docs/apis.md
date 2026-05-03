# Especificação de APIs

## Visão Geral

- **Base URL (produção)**: `https://terra-viva-3n3ko.ondigitalocean.app/api`
- **Base URL (dev)**: `http://localhost/api`
- **Formato**: JSON
- **Autenticação**: Bearer JWT no header `Authorization`

## Autenticação

Endpoints públicos não requerem token. Endpoints protegidos requerem:
```
Authorization: Bearer <jwt_token>
```

O JWT contém `sub` (user_id), `phone`, `exp`.

---

## Endpoints

### Auth

#### POST /auth/request-otp
Solicita envio de código OTP ao telefone.

**Body**:
```json
{ "phone": "48999001234" }
```

**Resposta 200**:
```json
{ "message": "OTP enviado", "dev_code": "123456" }
```
> `dev_code` só retorna em ambiente de desenvolvimento.

---

#### POST /auth/verify-otp
Valida OTP e retorna JWT.

**Body**:
```json
{ "phone": "48999001234", "code": "123456" }
```

**Resposta 200**:
```json
{ "access_token": "eyJ...", "token_type": "bearer" }
```

**Erros**: 401 (código inválido/expirado)

---

### Bancas (Público)

#### GET /bancas
Lista produtores com pelo menos um produto ativo.

**Resposta 200**:
```json
[
  {
    "id": "665a...",
    "short_code": "lyaqk",
    "name": "Maria Silva",
    "bio": "Produtos orgânicos da roça",
    "city": "São Ludgero",
    "phone": "48999001234",
    "payment_methods": ["cash", "pix"],
    "photo_url": "https://...",
    "cover_url": "https://...",
    "categories": ["queijos", "hortifruti"],
    "products_count": 5
  }
]
```

---

#### GET /bancas/{id_or_short_code}
Detalhe de uma banca com seus produtos ativos.

**Parâmetros**: `id_or_short_code` — ObjectId MongoDB ou short_code de 5 caracteres.

**Resposta 200**:
```json
{
  "id": "665a...",
  "short_code": "lyaqk",
  "name": "Maria Silva",
  "bio": "...",
  "city": "São Ludgero",
  "phone": "48999001234",
  "payment_methods": ["cash", "pix"],
  "photo_url": "...",
  "cover_url": "...",
  "gallery": [],
  "address": "Rua...",
  "pix_key": "48999...",
  "products": [
    {
      "id": "...",
      "user_id": "...",
      "name": "Queijo Colonial",
      "price": 25.0,
      "description": "...",
      "photo_url": "...",
      "category": "queijos",
      "is_active": true
    }
  ]
}
```

**Erros**: 404 (banca não encontrada)

---

### Produtos (Autenticado)

#### GET /products/mine
Lista produtos do produtor logado.

#### POST /products
Cria novo produto.

**Body**:
```json
{
  "name": "Queijo Colonial",
  "price": 25.0,
  "description": "Queijo artesanal envelhecido 30 dias",
  "category": "queijos",
  "photo_url": "https://...",
  "stock": 10,
  "is_active": true
}
```

#### PUT /products/{id}
Atualiza produto existente (mesmo body parcial).

#### DELETE /products/{id}
Remove produto.

#### PATCH /products/{id}/toggle
Alterna `is_active` (disponível/esgotado).

#### PATCH /products/{id}/stock
Atualiza estoque.

**Body**: `{ "stock": 5 }` ou `{ "stock": null }`

---

### Produtos IA (Autenticado)

#### POST /products/ai-generate
Gera sugestão de produto a partir de foto via GPT-4o Vision.

**Body**:
```json
{
  "photo_url": "https://spaces.../foto.jpg",
  "city": "São Ludgero"
}
```

**Resposta 200**:
```json
{
  "name": "Queijo tipo Emmental",
  "description": "Queijo suíço artesanal com furos...",
  "category": "queijos",
  "suggested_price": 45.0,
  "color_primary": "#F5DEB3",
  "color_accent": "#8B4513",
  "enhanced_photo_url": "https://..."
}
```

**Erros**: 503 (IA indisponível ou timeout 90s), 422 (URL inválida)

---

### Reservas (Autenticado)

#### POST /reservations
Cria reserva.

**Body**:
```json
{
  "product_id": "665a...",
  "quantity": 2,
  "pickup_location": "feira",
  "payment_intent": "pix"
}
```

`pickup_location`: `"feira"` | `"produtor"` | `"entrega"`  
`payment_intent`: `"cash"` | `"pix"` | `"card"`

**Resposta 200**: Objeto `ReservationResponse` completo.

---

#### GET /reservations
Lista reservas do consumidor logado.

#### GET /reservations/producer
Lista reservas recebidas pelo produtor logado.

#### PUT /reservations/{id}/status
Produtor atualiza status.

**Body**: `{ "status": "confirmed" }` ou `{ "status": "collected" }` ou `{ "status": "cancelled" }` ou `{ "status": "fiado" }`

**Status válidos**: `pending`, `confirmed`, `collected`, `cancelled`, `fiado`

#### PATCH /reservations/{id}/cancel
Consumidor cancela reserva (somente `pending`).

**Erros**: 400 (não é pending), 404 (não encontrada ou não é dono)

---

### Perfil do Produtor (Autenticado)

#### GET /producer/profile
Retorna perfil do produtor logado.

#### PUT /producer/profile
Atualiza perfil.

**Body**:
```json
{
  "name": "Maria Silva",
  "bio": "Produtos da roça",
  "city": "São Ludgero",
  "payment_methods": ["cash", "pix"],
  "pix_key": "48999001234",
  "address": "Rua das Flores, 123"
}
```

#### POST /producer/geocode
Extrai cidade/estado de um endereço via OpenAI GPT-4o-mini.

**Body**:
```json
{ "address": "Rua XV de Novembro, 200, Auxiliadora, SC" }
```

**Resposta 200**:
```json
{ "city": "Auxiliadora", "state": "SC" }
```

> Prompt otimizado: ignora nomes de rua/bairro, só retorna cidade quando o município está explícito. Casos ambíguos retornam `null`.

#### POST /producer/upload
Upload de foto (multipart/form-data). Aceita JPG, PNG, WebP, GIF. Máximo 5MB.

**Resposta 200**:
```json
{ "url": "https://terraviva.nyc3.digitaloceanspaces.com/terraviva/profiles/uuid.jpg" }

---

### Configuração da Feira

#### GET /fair-config?city=São+Ludgero
Retorna configuração ativa da feira para a cidade.

**Resposta 200**:
```json
{
  "id": "...",
  "name": "Feira Livre São Ludgero",
  "city": "São Ludgero",
  "fair_day": "sabado",
  "fair_start_time": "07:00",
  "fair_end_time": "12:00",
  "fair_location": "Praça Central",
  "order_window_open": "quarta 08:00",
  "order_window_close": "sexta 18:00",
  "active": true
}
```

---

### Health Check

#### GET /health
```json
{ "status": "ok", "timestamp": "2026-05-03T12:00:00Z" }
```

---

## Códigos de Erro Comuns

| Status | Significado |
|--------|------------|
| 400 | Validação falhou (ex: cancelar pedido não-pending) |
| 401 | Token ausente, expirado ou inválido |
| 404 | Recurso não encontrado |
| 422 | Dados inválidos (Pydantic validation) |
| 503 | Serviço externo indisponível (OpenAI) |

## Rate Limiting

Não implementado. A DO App Platform aplica proteção básica contra DDoS.

## Versionamento

API não versionada (v1 implícito). Mudanças são backward-compatible.
