# Especificação de APIs

## Visão Geral

- **Base URL (produção)**: `https://terra-viva-3n3ko.ondigitalocean.app/api`
- **Base URL (local)**: `http://localhost/api`
- **Formato**: JSON
- **Autenticação**: Bearer JWT (header `Authorization: Bearer <token>`)
- **Versionamento**: Sem versão no path (v1 implícito)

## Autenticação

### POST /auth/request-otp
Solicita envio de OTP para o telefone.

**Body**:
```json
{ "phone": "48999887766" }
```
**Response 200**:
```json
{ "message": "OTP enviado" }
```

---

### POST /auth/verify-otp
Valida OTP e retorna JWT. Cria usuário se não existir.

**Body**:
```json
{ "phone": "48999887766", "code": "123456" }
```
**Response 200**:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "665a...",
    "phone": "48999887766",
    "name": null,
    "short_code": "A1B2C"
  }
}
```
**Erro 401**: OTP inválido ou expirado.

---

## Bancas (Público)

### GET /bancas
Lista produtores com produtos ativos.

**Query params**:
- `category` (opcional): filtrar por categoria

**Response 200**:
```json
[
  {
    "id": "665a...",
    "name": "Sítio Boa Vista",
    "city": "São Ludgero",
    "photo_url": "https://...",
    "cover_url": "https://...",
    "short_code": "A1B2C",
    "categories": ["hortaliças", "frutas"],
    "products_count": 12,
    "rating_avg": 4.5,
    "rating_count": 8
  }
]
```

---

### GET /bancas/{user_id}
Detalhe da banca com todos os produtos.

**Response 200**:
```json
{
  "id": "665a...",
  "name": "Sítio Boa Vista",
  "bio": "Produção orgânica familiar",
  "city": "São Ludgero",
  "photo_url": "...",
  "cover_url": "...",
  "color_primary": "#2d6a4f",
  "pix_key": "48999...",
  "payment_methods": ["pix", "cash"],
  "products": [
    {
      "id": "665b...",
      "name": "Alface Crespa",
      "description": "Orgânica, colhida hoje",
      "price": 4.50,
      "stock": null,
      "category": "hortaliças",
      "image_url": "...",
      "active": true
    }
  ],
  "reviews": [...]
}
```

---

## Produtos (Autenticado — Produtor)

### GET /products
Lista produtos do produtor autenticado.

### POST /products
Cria produto.

**Body**:
```json
{
  "name": "Queijo Colonial",
  "description": "Maturado 30 dias",
  "price": 25.00,
  "stock": 10,
  "category": "laticínios",
  "image_url": "https://..."
}
```

### PATCH /products/{id}
Atualiza produto (parcial).

### DELETE /products/{id}
Remove produto.

---

### POST /products/ai-analyze
Analisa imagem via IA e retorna sugestões.

**Body** (multipart/form-data):
- `image`: arquivo de imagem

**Response 200**:
```json
{
  "name": "Geleia de Morango",
  "description": "Geleia artesanal de morango com pedaços da fruta",
  "category": "conservas",
  "suggested_price": 18.00,
  "colors": ["#c62828", "#ff5722"]
}
```

---

## Reservas (Autenticado)

### GET /reservations
Lista reservas do usuário (como consumidor ou produtor).

**Query params**:
- `role`: `consumer` | `producer`
- `status` (opcional): filtrar por status

### POST /reservations
Cria nova reserva.

**Body**:
```json
{
  "product_id": "665b...",
  "quantity": 2,
  "pickup_location": "feira",
  "payment_intent": "pix"
}
```
**Response 201**:
```json
{
  "id": "665c...",
  "product_id": "665b...",
  "product_name": "Alface Crespa",
  "consumer_id": "665a...",
  "producer_id": "665d...",
  "quantity": 2,
  "unit_price": 4.50,
  "total_price": 9.00,
  "pickup_location": "feira",
  "payment_intent": "pix",
  "status": "pending",
  "created_at": "2026-05-03T10:30:00Z"
}
```

---

### PATCH /reservations/{id}/status
Atualiza status da reserva (produtor).

**Body**:
```json
{ "status": "confirmed" }
```
**Status válidos**: `confirmed`, `collected`, `cancelled`, `fiado`

---

### DELETE /reservations/{id}
Cancela reserva (consumidor — apenas se `pending`).

---

## Notificações (Autenticado)

### GET /notifications
Lista notificações do usuário.

**Response 200**:
```json
[
  {
    "id": "665e...",
    "type": "new_order",
    "title": "📦 Novo pedido!",
    "body": "João pediu Alface (x2)",
    "read": false,
    "created_at": "2026-05-03T10:30:00Z"
  }
]
```

### PATCH /notifications/read-all
Marca todas como lidas.

---

## Reviews (Autenticado)

### POST /reviews
Cria avaliação para pedido coletado.

**Body**:
```json
{
  "reservation_id": "665c...",
  "rating": 5,
  "comment": "Produtos sempre frescos!"
}
```

### GET /reviews/{producer_id}
Lista reviews públicas de um produtor.

---

## Produtor — Perfil (Autenticado)

### GET /producer/profile
Retorna perfil do produtor autenticado.

### PATCH /producer/profile
Atualiza perfil.

**Body**:
```json
{
  "name": "Sítio Boa Vista",
  "bio": "Agricultura familiar desde 1990",
  "city": "São Ludgero",
  "color_primary": "#2d6a4f",
  "pix_key": "48999887766",
  "payment_methods": ["pix", "cash"]
}
```

### POST /producer/photo
Upload de foto de perfil (multipart/form-data).

### POST /producer/cover
Upload de foto de capa (multipart/form-data).

---

## Feira — Configuração

### GET /fair-config
Retorna configuração atual da feira.

### PUT /fair-config
Atualiza configuração (admin).

---

## Health Check

### GET /health
**Response 200**:
```json
{ "status": "ok", "timestamp": "2026-05-03T10:30:00Z" }
```

---

## Códigos de Erro Comuns

| Código | Significado |
|--------|------------|
| 400 | Dados inválidos (validação Pydantic) |
| 401 | Token ausente, inválido ou expirado |
| 403 | Sem permissão (ex: cancelar pedido de outro usuário) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: review duplicada) |
| 500 | Erro interno do servidor |
