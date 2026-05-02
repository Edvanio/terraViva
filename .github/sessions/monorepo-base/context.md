# Context — Monorepo Base (Terra Viva)

## Visão do Produto

O **Terra Viva** é uma plataforma digital de feira da agricultura familiar. Conecta produtores locais diretamente a consumidores. Funciona como uma **agenda de reservas**, não um marketplace com pagamento online — o dinheiro troca de mão na retirada física, como sempre foi na feira.

**Frase que guia tudo:** _"Digitalizar a feira sem perder sua essência."_

---

## Modelo de Negócio

| Quem | Como funciona |
|---|---|
| **Agricultor** | Gratuito. Cadastra banca, produtos, recebe reservas |
| **Consumidor** | Gratuito. Reserva produtos, retira na feira ou no sítio |
| **Instituição parceira** | Paga contrato (B2G). Recebe white-label com identidade visual da cidade |

Parceiros institucionais: prefeituras, secretarias de agricultura, EPAGRI, EMATER, cooperativas (Sicoob, Sicredi).

---

## Ciclo Semanal da Feira (Coração do Produto)

```
SEGUNDA → SEXTA  ← Janela aberta para reservas
  · Consumidor reserva produtos
  · Produtor acompanha reservas recebidas
  · Produtor pode fechar a banca se o estoque esgotar

SÁBADO  ← Dia da feira
  · Produtor sabe o que levar (viu os pedidos)
  · Consumidor vai buscar e paga na hora
  · Ciclo encerra

DOMINGO  ← Modo "Próxima feira"
  · App mostra countdown até a próxima abertura
```

---

## Usuários e Fluxos

### Consumidor

```
1. Abre o app (Terra Viva ou logo da prefeitura local)
2. Vê bancas abertas e produtos disponíveis
3. Escolhe produto → informa quantidade
4. Vê como o produtor aceita receber (Dinheiro / Pix / Cartão)
5. Informa como pretende pagar
6. Escolhe onde vai retirar: feira ou casa do produtor
7. Confirma a reserva
8. Acompanha em "Meus Pedidos"
9. No dia: vai buscar → paga → pronto
```

### Produtor (Agricultor)

```
1. Baixa o app (gratuito, sem aprovação)
2. Cria perfil da banca (foto, história, galeria)
3. Define formas de pagamento: Dinheiro / Pix / Cartão
4. Cadastra produtos (nome, preço, foto, descrição)
5. Durante a semana: acompanha reservas recebidas
6. Pode fechar a banca manualmente se estoque acabar
7. No dia da feira: entrega e recebe o pagamento
```

### Instituição Parceira (Admin)

```
1. Assina parceria
2. Recebe painel admin com identidade visual da cidade
3. Configura calendário da feira (dia, horário, janela de pedidos)
4. Acompanha dados de movimentação
```

---

## Autenticação

- **OTP por celular** — sem senha, sem e-mail
- Agricultor não quer lembrar senha. Celular é o que ele tem.
- Fluxo: celular → código 6 dígitos (SMS em prod, console em dev) → JWT
- JWT: HS256, 30 min, armazenado no Expo SecureStore (app) / cookie httpOnly (web)
- Roles: `consumer` | `producer` | `admin`

---

## Telas — App Mobile

### Consumidor

| Tela | Descrição |
|---|---|
| **Login** | Campo de celular → digita OTP de 6 dígitos |
| **Home** | Lista de bancas ativas com filtro por categoria e busca |
| **Banca do Produtor** | Foto, história, avaliação, lista de produtos, botão Comprar |
| **Finalizar Compra** | Resumo, forma de pagamento, local de retirada, confirmar |
| **Meus Pedidos** | Histórico com status (Confirmado / Aguardando / Retirado / Cancelado) |

### Produtor

| Tela | Descrição |
|---|---|
| **Pedidos Recebidos** | Lista de reservas da semana por produto |
| **Meus Produtos** | Lista com status ativo/inativo, botão adicionar |
| **Cadastro de Produto** | Nome, descrição, preço, foto, toggle ativo |
| **Meu Perfil (Banca)** | Foto, história, galeria, formas de pagamento, endereço do sítio |

---

## Telas — Web (Next.js)

Web adaptativa — funciona em mobile browser e desktop. Mesmas telas do app mobile mais:

| Rota | Descrição |
|---|---|
| `/` | Home pública — lista de bancas (sem login) |
| `/banca/[id]` | Detalhe da banca com produtos |
| `/pedidos` | Meus pedidos (consumidor logado) |
| `/produtor/perfil` | Perfil do produtor |
| `/admin` | Painel do parceiro institucional |
| `/admin/feira` | Configurar calendário e branding |
| `/admin/reservas` | Ver reservas da semana |

---

## Design System

O Terra Viva não é um app de supermercado. Tons de terra, madeira, interior. Feito para quem usa ao sol, no campo.

### Cores

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#2A5C2E` | Header, botões primários, ícones ativos |
| `primaryMedium` | `#3D7A42` | Hover, variações |
| `primaryLight` | `#10B981` | Badge status positivo |
| `background` | `#F7F3EC` | Fundo de todas as telas (creme) |
| `surface` | `#FFFFFF` | Fundo de cards |
| `amber` | `#F59E0B` | Estrelas, badge "aguardando" |
| `textPrimary` | `#1A1A1A` | Texto principal |
| `textSecondary` | `#6B7280` | Subtítulos, descrições |

### Status de Pedido

| Status | Fundo | Texto |
|---|---|---|
| Confirmado | `#D1FAE5` | `#065F46` |
| Aguardando pagamento | `#FEF3C7` | `#92400E` |
| Pronto para retirada | `#A7F3D0` | `#065F46` |
| Cancelado | `#FEE2E2` | `#991B1B` |

### Tipografia

Fontes do sistema — SF Pro (iOS), Roboto (Android). Sem fontes customizadas no MVP.

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| Display | 24px | 700 | Nome do produtor na banca |
| Título | 20px | 700 | Cabeçalhos |
| Subtítulo | 16px | 600 | Nome de produto |
| Corpo | 14px | 400 | Descrições, bio |
| Preço | 18px | 700 | Valor — sempre verde, sempre bold |

### Espaçamento (múltiplos de 8px)

`xs=4 · sm=8 · md=16 · lg=24 · xl=32 · xxl=48`

### Border Radius

`sm=8 · md=12 · lg=16 · full=9999`

### Ícones

Feather Icons (outline) via `@expo/vector-icons` — linha leve, compatível com o estilo rural.

---

## API — Endpoints

### Auth
| Método | Endpoint | Auth |
|---|---|---|
| POST | `/auth/request-otp` | Não |
| POST | `/auth/verify-otp` | Não |
| GET | `/me` | Sim |

### Bancas
| Método | Endpoint | Auth |
|---|---|---|
| GET | `/bancas` | Não |
| GET | `/bancas/{id}` | Não |

### Produtos
| Método | Endpoint | Auth |
|---|---|---|
| POST | `/products` | Sim (producer) |
| PUT | `/products/{id}` | Sim (producer) |
| DELETE | `/products/{id}` | Sim (producer) |

### Reservas
| Método | Endpoint | Auth |
|---|---|---|
| POST | `/reservations` | Sim (consumer) |
| GET | `/reservations` | Sim (consumer — minhas reservas) |
| GET | `/producer/reservations` | Sim (producer — recebidas) |
| PUT | `/reservations/{id}/status` | Sim (producer) |

### Perfil do Produtor
| Método | Endpoint | Auth |
|---|---|---|
| POST | `/producer/profile` | Sim |
| PUT | `/producer/profile` | Sim |

### Config da Feira (Multi-Tenant)
| Método | Endpoint | Auth |
|---|---|---|
| GET | `/fair-config?city={cidade}` | Não |
| POST | `/fair-config` | Sim (admin) |
| PUT | `/fair-config/{id}` | Sim (admin) |

### Health
| Método | Endpoint |
|---|---|
| GET | `/health` |

---

## Banco de Dados (MongoDB Atlas)

### Coleções

**`users`** — todos os usuários
```json
{ "_id", "phone" (único), "name", "role": "consumer|producer|admin", "created_at" }
```

**`otp_codes`** — TTL 5 minutos
```json
{ "_id", "phone", "code" (6 dígitos), "role", "created_at" }
```

**`producers`** — perfil público da banca
```json
{
  "_id", "user_id", "bio", "photo_url", "gallery": [],
  "city", "phone", "created_at",
  "payment_methods": ["cash","pix","card"],
  "pix_key": null,
  "address": null
}
```

**`products`** — produtos de cada banca
```json
{ "_id", "producer_id", "name", "price", "description", "photo_url", "is_active", "created_at" }
```

**`reservations`** — reservas dos consumidores
```json
{
  "_id", "consumer_id", "product_id", "producer_id",
  "product_name", "quantity", "total_price",
  "pickup_location": "feira|produtor",
  "payment_intent": "cash|pix|card",
  "status": "pending|confirmed|collected|cancelled",
  "created_at", "updated_at"
}
```

**`fair_configs`** — configuração por cidade (multi-tenant)
```json
{
  "_id", "name", "city", "logo_url",
  "primary_color", "secondary_color",
  "fair_day", "fair_start_time", "fair_end_time", "fair_location",
  "order_window_open", "order_window_close",
  "active": true, "created_at"
}
```

---

## Multi-Tenant (Branding por Cidade)

Sem geolocalização obrigatória. App faz `GET /fair-config?city={cidade}` na abertura.
- Se existir config ativa → carrega logo e cores do parceiro
- Se não existir → usa padrões Terra Viva

O que é personalizado: logo, cores, nome da feira, calendário, janela de pedidos.
O que **não** muda: lógica de negócio, dados, fluxos de reserva.

---

## Offline-First (App Mobile)

Situação comum em área rural. Princípio:
- **Leitura** → servida do cache local (TTL 30min, AsyncStorage)
- **Escrita** → vai para fila local; processa automaticamente ao voltar online
- **Conflito** → timestamp mais recente vence

---

## O que está sendo construído agora

Estrutura base do monorepo. Nenhum dado real ainda. Objetivo: tudo rodando e se comunicando.

**Resultado esperado:**
- `backend/` rodando via Docker → `http://localhost:8000/docs`
- `web/` rodando via Docker → `http://localhost:3000`
- `app/` rodando via Expo → QR code no celular / emulador
- `docker compose up` sobe tudo com um comando
- `make dev` / `make stop` / `make logs` no Makefile

---

## Decisões Tomadas

| Decisão | Escolha | Motivo |
|---|---|---|
| Repositório | Monorepo único | Tudo junto, fácil de navegar |
| Backend infra | Docker Compose | Reproduzível em qualquer máquina |
| MongoDB | Atlas (cloud) | Já configurado, sem container local |
| App mobile | Expo (sem Bare Workflow) | iOS + Android no mesmo código, fácil onboarding |
| Web | Next.js 14 App Router | SSR, deploy simples, compartilha tipos com app |
| Estilos web | Tailwind CSS | Tokens do design system como variáveis CSS |
| Estilos app | StyleSheet nativo + tokens | Performance nativa, sem bibliotecas de UI pesadas |
| Ícones | Feather Icons (@expo/vector-icons) | Já incluído no Expo, outline leve |
| Fontes | Sistema (SF Pro / Roboto) | Sem peso extra no app, legíveis ao sol |
| Auth web | Cookie httpOnly | Mais seguro que localStorage |
| Auth mobile | Expo SecureStore | Criptografado no dispositivo |
