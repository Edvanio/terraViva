# Especificação de APIs

## Visão Geral

- **Base URL (produção)**: `https://terra-viva-3n3ko.ondigitalocean.app/api`
- **Base URL (dev)**: `http://localhost/api`
- **Formato**: JSON
- **Autenticação**: Bearer Token (JWT) no header `Authorization`

## Autenticação

Login é feito via OTP (código de 6 dígitos):
1. `POST /auth/request-otp` → gera código
2. `POST /auth/verify-otp` → valida código → retorna JWT

O JWT expira em **7 dias** (10080 minutos).

---

## Endpoints

### Auth

#### POST /auth/request-otp
Gera e armazena OTP para o telefone informado.

**Body**:
```json
{ "phone": "48999110001" }
```

**Resposta 200**:
```json
{
  "message": "OTP gerado com sucesso",
  "phone": "48999110001",
  "dev_code": "123456"  // null em produção real
}
```

---

#### POST /auth/verify-otp
Valida OTP e retorna JWT. Cria usuário automaticamente se não existe.

**Body**:
```json
{ "phone": "48999110001", "code": "123456" }
```

**Resposta 200**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Erro 401**: OTP inválido ou expirado.

---

#### GET /auth/me
Retorna dados do usuário logado.

**Auth**: Requerida

**Resposta 200**:
```json
{
  "id": "6651a...",
  "phone": "48999110001",
  "role": "producer",
  "name": "João da Horta",
  "created_at": "2024-05-01T10:00:00Z"
}
```

---

### Bancas (Produtores)

#### GET /bancas
Lista todos os produtores com produtos ativos. **Sem auth**.

**Resposta 200**:
```json
[
  {
    "id": "665...",
    "user_id": "664...",
    "bio": "Banca de verduras frescas",
    "city": "Sao Ludgero",
    "payment_methods": ["cash", "pix"],
    "photo_url": "https://dadosbimdoctor.nyc3...",
    "cover_url": null,
    "categories": ["Verduras", "Frutas"],
    "products_count": 5
  }
]
```

---

#### GET /bancas/{banca_id}
Detalhe de uma banca com seus produtos. **Sem auth**.

**Resposta 200**:
```json
{
  "id": "665...",
  "user_id": "664...",
  "bio": "...",
  "city": "Sao Ludgero",
  "payment_methods": ["cash", "pix"],
  "photo_url": "...",
  "cover_url": null,
  "gallery": [],
  "address": "Rua X, 123",
  "pix_key": "48999110001",
  "products": [
    {
      "id": "666...",
      "producer_id": "665...",
      "name": "Alface",
      "price": 5.0,
      "description": "Alface crespa orgânica",
      "photo_url": "...",
      "category": "Verduras",
      "is_active": true
    }
  ]
}
```

---

### Produtos

#### GET /products/mine
Lista produtos do produtor logado.

**Auth**: Requerida

---

#### POST /products
Cria produto.

**Auth**: Requerida (produtor)

**Body**:
```json
{
  "name": "Alface Crespa",
  "price": 5.0,
  "description": "Orgânica, colhida hoje",
  "photo_url": "https://...",
  "category": "Verduras",
  "color_primary": "#4CAF50",
  "color_accent": "#8BC34A",
  "is_active": true,
  "stock": 10
}
```

---

#### PUT /products/{product_id}
Atualiza produto (apenas campos enviados).

**Auth**: Requerida (produtor dono)

---

#### DELETE /products/{product_id}
Exclui produto.

**Auth**: Requerida (produtor dono)

---

#### POST /products/ai-generate
Gera metadados de produto via IA a partir de foto.

**Auth**: Requerida

**Body**:
```json
{
  "photo_url": "https://dadosbimdoctor.nyc3.../photo.jpg",
  "city": "Sao Ludgero"
}
```

**Resposta 200**:
```json
{
  "name": "Alface Crespa",
  "description": "Alface crespa orgânica cultivada...",
  "category": "Verduras",
  "color_primary": "#4CAF50",
  "color_accent": "#8BC34A",
  "suggested_price": 5.0,
  "suggested_price_note": "Preço médio feiras SC",
  "original_photo_url": "https://...",
  "enhanced_photo_url": "https://..."
}
```

**Erro 503**: IA indisponível ou timeout (90s).

---

### Reservas

#### POST /reservations
Cria reserva para um produto.

**Auth**: Requerida

**Body**:
```json
{
  "product_id": "666...",
  "quantity": 2,
  "pickup_location": "feira",
  "payment_intent": "pix"
}
```

**Resposta 200**:
```json
{
  "id": "667...",
  "consumer_id": "664...",
  "producer_id": "665...",
  "product_id": "666...",
  "product_name": "Alface Crespa",
  "product_photo_url": "...",
  "consumer_name": "Carlos",
  "consumer_phone": "48999110011",
  "producer_name": "João da Horta",
  "producer_phone": "48999110001",
  "quantity": 2,
  "total_price": 10.0,
  "pickup_location": "feira",
  "payment_intent": "pix",
  "status": "pending",
  "created_at": "2024-05-01T...",
  "updated_at": "2024-05-01T..."
}
```

---

#### GET /reservations
Lista reservas do consumidor logado.

**Auth**: Requerida

---

#### GET /reservations/producer
Lista reservas recebidas pelo produtor logado.

**Auth**: Requerida (produtor)

---

#### PUT /reservations/{id}/status
Produtor atualiza status da reserva.

**Auth**: Requerida (produtor dono)

**Body**:
```json
{ "status": "confirmed" }
```

---

#### PATCH /reservations/{id}/cancel
Consumidor cancela reserva pendente.

**Auth**: Requerida (consumidor dono)

**Erro 400**: Se status não é `pending`.

---

### Produtor (Perfil)

#### GET /producer/profile
Retorna perfil do produtor logado.

**Auth**: Requerida

---

#### POST /producer/profile
Cria perfil de produtor.

**Auth**: Requerida

**Body**:
```json
{
  "bio": "Produtor de hortaliças orgânicas",
  "city": "Sao Ludgero",
  "phone": "48999110001",
  "payment_methods": ["cash", "pix"]
}
```

---

#### PUT /producer/profile
Atualiza perfil (campos parciais).

**Auth**: Requerida

---

#### POST /producer/upload
Upload de foto de perfil.

**Auth**: Requerida
**Content-Type**: `multipart/form-data`
**Limite**: 5MB, formatos: jpeg/png/webp/gif

---

#### POST /producer/migrate-from-users
Migração: cria perfil em `producers` para usuários com `role=producer` que não têm perfil. Idempotente.

**Auth**: Nenhuma (endpoint administrativo)

---

### Configuração da Feira

#### GET /fair-config?city=Sao%20Ludgero
Retorna configuração ativa da feira para a cidade.

**Auth**: Nenhuma

**Resposta 200**:
```json
{
  "id": "668...",
  "name": "Feira Terra Viva Sao Ludgero",
  "city": "Sao Ludgero",
  "primary_color": "#2A5C2E",
  "secondary_color": "#F7F3EC",
  "fair_day": "saturday",
  "fair_start_time": "08:00",
  "fair_end_time": "12:00",
  "fair_location": "Praca Central",
  "order_window_open": "monday 07:00",
  "order_window_close": "friday 18:00",
  "active": true
}
```

---

### Health Check

#### GET /health
```json
{ "status": "ok", "timestamp": "2024-05-01T10:00:00Z" }
```

---

## Códigos de Erro Comuns

| Status | Significado |
|--------|-------------|
| 400 | Validação falhou (ex: cancelar reserva não-pending) |
| 401 | Token ausente, inválido ou expirado |
| 403 | Role insuficiente (ex: consumer tentando acessar admin) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: perfil de produtor já existe) |
| 413 | Arquivo muito grande (> 5MB) |
| 422 | Dados inválidos (formato, constraint) |
| 502 | Erro no storage (DO Spaces) |
| 503 | IA indisponível ou timeout |
