# Funcionalidades

## Funcionalidades Principais

### 1. Cadastro Inteligente de Produtos via IA

**Descrição**: O produtor fotografa o produto e a IA preenche automaticamente todos os campos (nome, descrição, categoria, cores, preço sugerido). Opcionalmente gera uma versão aprimorada da foto.

**Casos de Uso**:
- Produtor com pouca fluência digital cadastra produto rapidamente
- Padronização visual e descritiva dos produtos da feira

**Componentes Envolvidos**:
- `backend/routers/ai_products.py` — Endpoint `POST /products/ai-generate`
- `backend/services/openai_service.py` — GPT-4O Vision + geração de imagem
- `web/src/app/minha-banca/page.tsx` — UI de fluxo IA no dashboard do produtor
- `app/src/screens/producer/AIProductScreen.tsx` — (futuro) tela mobile

**Fluxo**:
1. Produtor faz upload da foto → URL no DO Spaces
2. `POST /products/ai-generate` com `photo_url`
3. GPT-4O Vision analisa a imagem e retorna JSON com metadados
4. (Opcional) Imagem é aprimorada/regenerada
5. Produtor revisa e confirma → `POST /products` cria o produto

---

### 2. Sistema de Reservas

**Descrição**: Consumidor navega pelas bancas, escolhe um produto, define quantidade e forma de retirada/pagamento, e cria uma reserva. O produtor é notificado e confirma.

**Casos de Uso**:
- Consumidor reserva produtos antes da feira (garantia de disponibilidade)
- Produtor visualiza demanda antecipadamente

**Componentes Envolvidos**:
- `backend/routers/reservations.py` — CRUD de reservas
- `web/src/app/banca/[id]/reservar/page.tsx` — Formulário de reserva
- `web/src/app/pedidos/page.tsx` — Lista de pedidos do consumidor
- `web/src/app/minha-banca/page.tsx` — Lista de pedidos do produtor

**Fluxo**:
1. Consumidor acessa banca → vê produtos
2. Clica "Reservar" → formulário (quantidade, retirada, pagamento)
3. `POST /reservations` → cria com status `pending`
4. Push notification para produtor (Expo)
5. Produtor confirma via dashboard → status `confirmed`
6. Na feira: produtor marca como `collected`

**Estados da reserva**: `pending` → `confirmed` → `collected` | `cancelled`

---

### 3. Listagem e Filtro de Bancas (Produtores)

**Descrição**: Página pública que lista todos os produtores com produtos ativos. Filtro por categoria.

**Casos de Uso**:
- Consumidor descobre produtores da feira
- Navegação sem necessidade de login

**Componentes Envolvidos**:
- `backend/routers/bancas.py` — `GET /bancas` (lista) e `GET /bancas/:id` (detalhe)
- `web/src/app/page.tsx` — Home com lista de bancas (Server Component)
- `web/src/app/bancas/page.tsx` — Página dedicada de bancas
- `web/src/components/BancaFilter.tsx` — Filtro client-side por categoria
- `web/src/components/BancaCard.tsx` — Card visual do produtor

---

### 4. Autenticação por OTP (WhatsApp)

**Descrição**: Login sem senha — usuário informa número de WhatsApp, recebe código de 6 dígitos, e entra. JWT gerado com role e telefone.

**Componentes Envolvidos**:
- `backend/routers/auth.py` — `POST /auth/request-otp` e `POST /auth/verify-otp`
- `web/src/app/login/page.tsx` — UI de login
- `web/src/app/api/auth/session/route.ts` — Cookie httpOnly management
- `web/middleware.ts` — Proteção de rotas server-side

---

### 5. Dashboard do Produtor

**Descrição**: Área privada onde o produtor gerencia seus produtos, vê pedidos recebidos, e contata consumidores via WhatsApp.

**Componentes Envolvidos**:
- `web/src/app/minha-banca/page.tsx` — Dashboard com tabs (pedidos/produtos)
- `backend/routers/products.py` — CRUD de produtos
- `backend/routers/reservations.py` — `GET /reservations/producer`

**Funcionalidades**:
- Listar/criar/editar/excluir produtos
- Cadastro inteligente via IA (upload foto)
- Ver pedidos recebidos com dados do consumidor
- Botão "Falar no WhatsApp" com mensagem pré-formatada
- Upload de foto de perfil

---

### 6. Perfil do Usuário

**Descrição**: Tela onde o usuário configura nome, telefone, endereço e se promove a produtor.

**Componentes Envolvidos**:
- `web/src/app/perfil/page.tsx` — Formulário de perfil
- `backend/routers/producers.py` — Criar/editar perfil de produtor

---

### 7. Comunicação WhatsApp

**Descrição**: Links `wa.me` com mensagens pré-formatadas para contato direto entre produtor e consumidor sobre pedidos.

**Componentes Envolvidos**:
- `web/src/app/pedidos/page.tsx` — Consumidor → Produtor
- `web/src/app/minha-banca/page.tsx` — Produtor → Consumidor

---

## Funcionalidades Secundárias

### Onboarding
- Modal de introdução para novos usuários (3 slides)
- Componente: `web/src/components/Onboarding.tsx`
- Grava flag `terra_viva_onboarded` no localStorage

### Fair Status Banner
- Banner mostrando status atual da feira (aberta/fechada, horários)
- Baseado em `FairConfig` do backend
- Componente: `web/src/components/FairStatusBanner.tsx`

### Push Notifications (Mobile - Futuro)
- Expo Push para notificar produtores de novos pedidos
- Backend envia via `utils.send_push_notification()`

---

## Funcionalidades Planejadas (Futuro)

- App mobile React Native em produção
- Integração real com WhatsApp Business API (envio automático de OTP)
- Pagamento online (Pix integrado)
- Multi-tenant (múltiplas cidades/feiras)
- Histórico de vendas e relatórios para produtores
