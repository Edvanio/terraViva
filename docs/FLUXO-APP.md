# Fluxo do App — Terra Viva

> Documento de referência para o fluxo completo do sistema.
> Cobre o **App Mobile** (React Native / Expo) e o **Web** (Next.js).

---

## Visão Geral

```
Usuário entra
    │
    ├─ Não autenticado ──► Tela de Login (phone → OTP → token)
    │
    └─ Autenticado
           │
           ├─ Reservar na banca   ──► fluxo COMPRADOR
           └─ Disponibilizar na banca ──► fluxo PRODUTOR
```

O sistema **não separa papéis no cadastro**. O mesmo usuário pode comprar e vender. O modo é escolhido a cada sessão na tela inicial.

---

## 1. Autenticação (OTP via WhatsApp)

### Passo 1 — Solicitar código

| Campo       | Valor                          |
|-------------|-------------------------------|
| Endpoint    | `POST /auth/request-otp`      |
| Body        | `{ "phone": "48999999999" }`  |
| Resposta    | `{ "message": "...", "dev_code": "123456" }` |

- Em produção, o código é enviado por WhatsApp.
- Em ambiente de desenvolvimento, o campo `dev_code` retorna `123456` (valor configurado em `config.py → dev_otp_default`).

### Passo 2 — Verificar código

| Campo       | Valor                                      |
|-------------|-------------------------------------------|
| Endpoint    | `POST /auth/verify-otp`                   |
| Body        | `{ "phone": "48999999999", "code": "123456" }` |
| Resposta    | `{ "access_token": "<JWT>" }`             |

- O token JWT é válido por **30 minutos** (configurável via `access_token_expire_minutes`).
- Após login bem-sucedido:
  - **Web**: token salvo em `localStorage` (`terra_viva_token`) **e** em cookie httpOnly via `POST /api/auth/session`.
  - **Mobile**: token salvo no contexto `AuthContext` (AsyncStorage).

### Logout

- **Web**: `POST /api/auth/logout` → apaga cookie → redireciona para `/`.
- **Mobile**: limpar token do contexto/storage → `RootNavigator` mostra tela de autenticação.

---

## 2. Tela Inicial (Home)

Ponto de partida após autenticação. Exibe dois CTAs e as listas de atividade recente.

```
┌──────────────────────────────────────────┐
│  🌿 Status da feira (FairStatusBanner)   │
│                                          │
│  [  Reservar na banca  ] [Disponibilizar]│  ← CTAs principais
│                                          │
│  Minhas reservas (últimas 3)             │
│  Solicitações recebidas (últimas 3)      │
└──────────────────────────────────────────┘
```

| Seção                | Origem de dados                  | Rota de destino     |
|----------------------|----------------------------------|---------------------|
| Reservar na banca    | —                                | `/bancas`           |
| Disponibilizar       | —                                | `/minha-banca`      |
| Minhas reservas      | `GET /reservations`              | `/pedidos`          |
| Solicitações         | `GET /reservations/producer`     | `/minha-banca`      |

---

## 3. Fluxo do Comprador

### 3.1 Listagem de Bancas

**Rota web:** `/bancas`  
**Tela mobile:** `Bancas`

```
GET /bancas
 └─► lista de bancas com: city, bio, payment_methods, products[]
```

Exibe cards com: foto/avatar, cidade, métodos de pagamento, total de produtos.  
Ao clicar em uma banca → detalhe da banca.

---

### 3.2 Detalhe da Banca

**Rota web:** `/banca/[id]`  
**Tela mobile:** `Banca`

```
GET /bancas/{id}
 └─► banca com lista de produtos
```

Exibe:
- Perfil do produtor (avatar, cidade, bio, avaliação, métodos de pagamento)
- Lista de produtos ativos com preço e botão "Comprar / Reservar"

Ao clicar em "Comprar" → Checkout.

---

### 3.3 Checkout (Reserva)

**Rota web:** `/banca/[id]/reservar?productId={id}`  
**Tela mobile:** `Checkout`

```
POST /reservations
Body: {
  product_id,
  quantity,
  pickup_location: "feira" | "produtor",
  payment_intent:  "cash" | "pix" | "card"
}
```

- Em caso de falha de rede (mobile), a reserva é enfileirada localmente (`queue.ts`) e sincronizada quando a conexão for restaurada.
- Após confirmação → redireciona para `/pedidos` (web) ou `Orders` (mobile).

---

### 3.4 Meus Pedidos

**Rota web:** `/pedidos` (protegida por middleware)  
**Acesso mobile:** lista na HomeScreen

```
GET /reservations
 └─► reservas do usuário autenticado
```

Status possíveis:

| Status       | Significado                          |
|--------------|--------------------------------------|
| `pending`    | Aguardando confirmação do produtor   |
| `confirmed`  | Produtor confirmou                   |
| `collected`  | Retirado pelo comprador              |
| `cancelled`  | Cancelado                            |

---

## 4. Fluxo do Produtor

### 4.1 Dashboard — Minha Banca

**Rota web:** `/minha-banca` (protegida por middleware)  
**Tela mobile:** `MyProducts`

Duas abas:

#### Aba "Pedidos recebidos"

```
GET /reservations/producer
 └─► reservas recebidas para os produtos do produtor
```

Ações disponíveis por status:

| Status atual | Ações disponíveis                    |
|--------------|--------------------------------------|
| `pending`    | ✅ Confirmar / ✕ Cancelar            |
| `confirmed`  | 🎉 Marcar como retirado              |
| outros       | Somente visualização                 |

```
PUT /reservations/{id}/status
Body: { "status": "confirmed" | "collected" | "cancelled" }
```

#### Aba "Meus produtos"

```
GET /products/mine        ← lista produtos do produtor autenticado
POST /products            ← criar produto
PUT /products/{id}        ← editar (nome, preço, is_active)
DELETE /products/{id}     ← excluir
```

Cada produto mostra: nome, preço, toggle Ativo/Inativo, botão excluir.  
Formulário inline para adicionar novo produto (nome, preço, descrição).

---

### 4.2 Perfil do Produtor

**Rota web:** `/perfil` (protegida por middleware)  
**Aba mobile:** `Profile`

Campos do perfil:

| Campo             | Obrigatório | Descrição                    |
|-------------------|-------------|------------------------------|
| `city`            | ✅          | Cidade / localidade          |
| `bio`             | ✅          | Descrição da banca           |
| `phone`           | ✅          | Contato                      |
| `payment_methods` | ✅          | `["cash","pix","card"]`      |
| `address`         | ❌          | Endereço para retirada       |
| `pix_key`         | ❌          | Chave Pix                    |

```
GET /producer/profile   ← carrega perfil existente (404 = perfil novo)
POST /producer/profile  ← cria perfil (primeira vez)
PUT /producer/profile   ← atualiza perfil existente
```

> Se o usuário ainda não tem perfil de produtor e acessa `/minha-banca`, é redirecionado para `/perfil` para criar o cadastro primeiro.

---

## 5. Navegação — Web

```
Header (fixo, contextual por pathname)
│
├─ / → Home                        (sempre visível)
│
├─ Modo comprador (/bancas, /pedidos):
│   ├─ Bancas
│   └─ Meus pedidos
│
├─ Modo produtor (/minha-banca):
│   ├─ Minha banca
│   └─ Perfil
│
└─ Não autenticado:
    └─ [Entrar] pill → /login
```

**Proteção de rotas (middleware.ts):**

| Rota           | Proteção         |
|----------------|-----------------|
| `/pedidos`     | Requer token     |
| `/perfil`      | Requer token     |
| `/minha-banca` | Requer token     |
| demais         | Públicas         |

---

## 6. Navegação — Mobile

```
Não autenticado:
  Phone → Otp

Autenticado (bottom tabs):
  Home (Início)    ←── CTA "Reservar" ──► Bancas → Banca → Checkout
  Perfil                                           ↑
                   ←── CTA "Disponibilizar" ──► MyProducts → AddProduct
```

**Stack de navegação (`RootNavigator`):**

```
AppTabs
 ├─ Home
 └─ Profile

Bancas       (fullscreen, sem tabs)
Banca        (fullscreen)
Checkout     (fullscreen)
MyProducts   (fullscreen)
AddProduct   (fullscreen)
```

---

## 7. APIs Backend — Resumo

| Método | Rota                        | Autenticação | Descrição                      |
|--------|-----------------------------|:------------:|-------------------------------|
| POST   | `/auth/request-otp`         | ❌           | Solicita código OTP            |
| POST   | `/auth/verify-otp`          | ❌           | Verifica OTP, retorna JWT      |
| GET    | `/bancas`                   | ❌           | Lista todas as bancas          |
| GET    | `/bancas/{id}`              | ❌           | Detalhe da banca + produtos    |
| GET    | `/fair-config`              | ❌           | Config da feira (horário etc.) |
| GET    | `/producer/profile`         | ✅           | Perfil do produtor autenticado |
| POST   | `/producer/profile`         | ✅           | Cria perfil do produtor        |
| PUT    | `/producer/profile`         | ✅           | Atualiza perfil                |
| GET    | `/products/mine`            | ✅           | Produtos do produtor atual     |
| POST   | `/products`                 | ✅           | Cria produto                   |
| PUT    | `/products/{id}`            | ✅           | Edita produto                  |
| DELETE | `/products/{id}`            | ✅           | Exclui produto                 |
| POST   | `/reservations`             | ✅           | Cria reserva (comprador)       |
| GET    | `/reservations`             | ✅           | Minhas reservas (comprador)    |
| GET    | `/reservations/producer`    | ✅           | Pedidos recebidos (produtor)   |
| PUT    | `/reservations/{id}/status` | ✅           | Atualiza status do pedido      |

---

## 8. Ciclo de Vida de uma Reserva

```
Comprador cria reserva
        │
        ▼
   [pending] ◄─── produtor recebe notificação
        │
   ┌────┴────┐
   │         │
[confirmed] [cancelled]
   │
   ▼
[collected]  ← produtor marca como retirado
```

---

## 9. Sincronização Offline (Mobile)

O app mobile usa uma fila local (`storage/queue.ts`) para lidar com perda de conexão:

1. Falha ao criar reserva → item adicionado à fila com `{ id, method, path, body }`.
2. `sync.ts` processa a fila ao restabelecer conexão, reenviando os itens na ordem.
3. Itens processados com sucesso são removidos da fila.

---

## 10. Tokens e Segurança

| Item                   | Detalhe                                         |
|------------------------|-------------------------------------------------|
| Algoritmo JWT          | HS256                                           |
| Expiração              | 30 minutos (configurável)                       |
| Armazenamento web      | `localStorage` + cookie httpOnly                |
| Armazenamento mobile   | AsyncStorage (via AuthContext)                  |
| Código OTP (dev)       | `123456` (fixo em `dev_otp_default`)            |
| Código OTP (produção)  | Gerado aleatoriamente, enviado via WhatsApp     |
| CORS permitido         | `http://localhost:3000`, `http://127.0.0.1:3000`|
