# Regras de Negócio

## Regras Críticas

### 1. Somente produtores com produtos ativos aparecem

**Descrição**: A listagem pública de bancas (`GET /bancas`) só retorna produtores que tenham pelo menos 1 produto com `is_active: true`.

**Justificativa**: Evita exibir bancas vazias ao consumidor, mantendo a experiência limpa.

**Implementação**: `backend/routers/bancas.py` — loop filtra com `if not products: continue`

**Exceção**: O detalhe da banca (`GET /bancas/:id`) sempre retorna, mesmo sem produtos.

---

### 2. Reserva só pode ser criada para produto ativo

**Descrição**: `POST /reservations` valida que o `product_id` existe E tem `is_active: True`.

**Implementação**: `backend/routers/reservations.py` — `db.products.find_one({"_id": ..., "is_active": True})`

---

### 3. Cancelamento apenas de reservas pendentes

**Descrição**: O consumidor só pode cancelar reservas com status `pending`. Reservas `confirmed` ou `collected` não podem ser canceladas pelo consumidor.

**Justificativa**: Após confirmação pelo produtor, há compromisso mútuo.

**Implementação**: `backend/routers/reservations.py` — `cancel_reservation()` verifica `status != "pending"` → 400

---

### 4. Apenas o produtor dono pode alterar status da reserva

**Descrição**: `PUT /reservations/:id/status` exige que o usuário logado seja o produtor associado àquela reserva.

**Implementação**: Busca `producer` pelo `user_id`, depois filtra reserva por `producer_id`.

---

### 5. Usuário é criado automaticamente no primeiro login

**Descrição**: Se o telefone não existe em `users`, é criado com `role: "consumer"` no momento do `verify-otp`.

**Justificativa**: Zero fricção — não há cadastro separado. Qualquer pessoa com WhatsApp pode usar.

**Implementação**: `backend/routers/auth.py` → `verify_otp()` faz `insert_one` se `find_one` retorna null.

---

### 6. OTP expira em 5 minutos

**Descrição**: Collection `otp_codes` tem índice TTL de 300 segundos.

**Implementação**: `backend/main.py` → `startup_indexes()` cria `expireAfterSeconds=300`

---

### 7. Perfil de produtor é separado do usuário

**Descrição**: Existe uma coleção `producers` separada de `users`. Um `user` com `role: "producer"` precisa ter uma entrada correspondente em `producers` para funcionar.

**Justificativa**: Permite enriquecer o perfil do produtor (bio, cidade, foto, métodos de pagamento, pix, endereço) sem poluir a coleção de usuários.

**Implicação**: A migração `POST /producer/migrate-from-users` cria entradas em `producers` para usuários com `role: "producer"` que não tenham perfil.

---

## Validações e Restrições

| Validação | Onde | Regra |
|-----------|------|-------|
| Telefone | `utils.normalize_phone()` | Mínimo 10 dígitos (só números) |
| OTP | `models.OtpVerify` | Exatamente 6 caracteres |
| Preço do produto | `models.ProductCreate` | `> 0` (Field gt=0) |
| Quantidade na reserva | `models.ReservationCreate` | `>= 1` (Field ge=1) |
| Cores do produto | `routers/products.py` | Formato `#XXXXXX` (regex hex 6 dígitos) |
| Upload de imagem | `routers/producers.py` | Máximo 5MB, tipos: jpeg/png/webp/gif |
| URL da foto (IA) | `routers/ai_products.py` | Deve ter scheme http/https e host válido |
| Cidade do produtor | `routers/producers.py` | Não pode ser vazia ao criar perfil |
| Telefone único | Index MongoDB | `users.phone` — unique constraint |

## Políticas e Workflows

### Fluxo de Vida de uma Reserva

```
[Consumidor cria]        [Produtor confirma]     [Na feira]
    pending ──────────────→ confirmed ──────────→ collected
       │                        │
       │ [Consumidor cancela]   │ [Produtor cancela]
       └──→ cancelled           └──→ cancelled
```

### Fluxo de Login

```
1. Consumidor informa telefone
2. Backend gera OTP (6 dígitos) e salva em otp_codes
3. Em dev: retorna código diretamente (DEV_OTP_DEFAULT=123456)
4. Em prod: (A SER IMPLEMENTADO) enviar via WhatsApp Business API
5. Consumidor digita código
6. Backend valida → cria/busca user → gera JWT
7. Frontend salva JWT em localStorage + cookie httpOnly
```

### Fluxo de Cadastro IA

```
1. Produtor abre "Cadastro inteligente" na Minha Banca
2. Seleciona/fotografa produto → upload para DO Spaces
3. POST /products/ai-generate com photo_url
4. GPT-4O Vision analisa → retorna JSON com metadados
5. (Opcional) Imagem é aprimorada
6. Produtor revisa campos sugeridos
7. Confirma → POST /products cria produto real
```

## Cálculos e Algoritmos

### Preço Total da Reserva
```python
total_price = quantity * product["price"]
```

### Categorias da Banca
```python
categories = list({p.get("category") for p in products if p.get("category")})
```
Calculado dinamicamente a partir dos produtos ativos — não é campo persistido.

## Regras de Domínio

### Roles
- `consumer` — Pode reservar produtos e ver pedidos
- `producer` — Pode tudo do consumer + gerenciar banca/produtos + ver pedidos recebidos
- `admin` — Pode gerenciar configuração da feira (`fair_config`)

### Pickup Locations
- `feira` — Retirada na feira (local padrão)
- `produtor` — Buscar na propriedade do produtor
- `entrega` — Entrega em casa (futuro, nem todas as bancas oferecem)

### Payment Intent
- `cash` — Dinheiro
- `pix` — Pix (presencial, QR na hora)
- `card` — Cartão (maquininha na feira)

> **Importante**: Não há processamento de pagamento online. O `payment_intent` é apenas a intenção declarada — o pagamento acontece presencialmente.
