# Funcionalidades

## Funcionalidades Principais

### 1. Autenticação por OTP (SMS)
**Descrição**: Login sem senha via código de 6 dígitos enviado por SMS ao celular.  
**Casos de Uso**: Primeiro acesso, re-autenticação após expiração.  
**Componentes**:
- `backend/routers/auth.py` — request-otp, verify-otp
- `web/src/app/login/page.tsx` — Formulário OTP
- `web/middleware.ts` — Proteção de rotas
- `web/src/lib/useAuthGuard.ts` — Guard client-side

**Fluxo**:
1. Usuário informa telefone
2. Backend gera OTP (6 dígitos via `secrets`), salva em `otp_codes` com TTL 5min
3. Em dev: retorna código na resposta. Em prod: enviaria SMS (não implementado)
4. Usuário informa código
5. Backend valida, cria/encontra usuário, gera JWT (360 dias)
6. Frontend salva em localStorage + cookie httpOnly

---

### 2. Vitrine de Bancas (Público)
**Descrição**: Listagem pública de produtores que possuem produtos ativos.  
**Casos de Uso**: Qualquer pessoa — consumidor final ou outro produtor — navega as bancas sem login. Como cada produtor vende produtos diferentes, é comum que produtores comprem entre si (ex: quem faz queijo compra verduras de outro).  
**Componentes**:
- `backend/routers/bancas.py` — GET /bancas, GET /bancas/{id}
- `web/src/app/bancas/page.tsx` — Listagem SSR
- `web/src/app/banca/[id]/page.tsx` — Detalhe SSR
- `web/src/components/BancaCard.tsx` — Card de banca

**Detalhes**: Aceita lookup por ObjectId ou `short_code` (5 chars alfanuméricos para URLs curtas de compartilhamento).

---

### 3. Cadastro Inteligente de Produtos (IA)
**Descrição**: Produtor fotografa o produto e a IA preenche automaticamente nome, descrição, categoria, preço sugerido e cores.  
**Casos de Uso**: Produtor rural com pouca experiência digital cadastra produtos rapidamente.  
**Componentes**:
- `backend/routers/ai_products.py` — POST /products/ai-generate
- `backend/services/openai_service.py` — GPT-4o Vision + DALL-E 2
- `web/src/components/AIProductModal.tsx` — Modal de geração
- `web/src/components/AIProductSteps.tsx` — Wizard step-by-step

**Fluxo**:
1. Produtor tira/seleciona foto do produto
2. Foto é enviada ao backend
3. Backend envia para GPT-4o Vision com prompt especializado
4. IA retorna: nome, descrição, categoria, preço sugerido, cores
5. Opcionalmente, DALL-E 2 gera imagem de fundo estilizada
6. Produtor revisa e confirma (pode editar antes de salvar)

---

### 4. Gestão de Produtos (CRUD)
**Descrição**: Produtor gerencia seu catálogo de produtos.  
**Casos de Uso**: Criar, editar preço/estoque, marcar esgotado, excluir produto.  
**Componentes**:
- `backend/routers/products.py` — CRUD completo
- `web/src/app/minha-banca/page.tsx` — Painel do produtor (tab "Produtos")

**Funcionalidades**:
- Criar produto (manual ou via IA)
- Editar nome, preço, descrição, foto, categoria
- Controle de estoque (quantidade ou ilimitado)
- Toggle disponível/esgotado (`is_active`)
- Excluir produto
- Upload de foto para DigitalOcean Spaces

---

### 5. Sistema de Reservas
**Descrição**: Consumidor reserva produtos para retirada na feira física.  
**Casos de Uso**: Garantir disponibilidade antes de ir à feira.  
**Componentes**:
- `backend/routers/reservations.py` — Criar, listar, atualizar status, cancelar
- `web/src/app/banca/[id]/reservar/page.tsx` — Formulário de reserva
- `web/src/app/pedidos/page.tsx` — Lista de pedidos do consumidor
- `web/src/app/minha-banca/page.tsx` — Pedidos recebidos (tab "Pedidos")

**Fluxo**:
1. Consumidor escolhe produto, quantidade, local de retirada e forma de pagamento
2. Reserva é criada com status `pending`
3. Produtor recebe notificação push
4. Produtor confirma → status `confirmed`
5. Na retirada → status `collected`
6. Consumidor pode cancelar se ainda `pending`

**Status possíveis**: `pending` → `confirmed` → `collected` | `cancelled` | `fiado`

**Sistema Fiado**: Produtor pode marcar pedido como "fiado" — o cliente leva o produto e paga depois. Na tela do produtor há 3 tabs: Pedidos, Fiados e Produtos. Tab "Fiados" filtra reservas com status `fiado`. Ações disponíveis: ✅ Pago (muda para `collected`), ❌ Cancelar.

---

### 6. Perfil do Produtor
**Descrição**: Produtor configura seu perfil público (nome, bio, cidade, foto, capa, meios de pagamento, chave Pix).  
**Componentes**:
- `backend/routers/producers.py` — GET/PUT profile, upload foto/capa, geocode
- `web/src/app/perfil/page.tsx` — Formulário de perfil
- `web/src/components/CustomerInfoPrompt.tsx` — Prompt de nome/cidade (consumidores)
- Upload de avatar e capa para DO Spaces

**Geolocalização**:
- Botão "📍 Usar minha localização" usa `navigator.geolocation` + reverse geocode via **Nominatim/OpenStreetMap** (gratuito, sem API key)
- Detecta cidade e UF automaticamente pelas coordenadas GPS
- Chip exibe a cidade detectada abaixo do campo endereço
- Fallback: geocode via OpenAI GPT-4o-mini quando o endereço é digitado (prompt otimizado para diferenciar nomes de rua vs município)

---

### 6b. Identificação do Consumidor (CustomerInfoPrompt)
**Descrição**: Antes de fazer o primeiro pedido, o consumidor é solicitado a informar nome (obrigatório) e cidade (opcional).  
**Componentes**:
- `web/src/components/CustomerInfoPrompt.tsx` — Componente 2 steps
- `web/src/app/banca/[id]/reservar/page.tsx` — Integração no checkout

**Fluxo**:
1. Ao acessar reserva, busca `GET /producer/profile`
2. Se `name == null`, exibe prompt "👋 Qual o seu nome?"
3. Após nome, exibe "📍 Onde você mora?" (com botão "Pular")
4. Salva via `PUT /producer/profile`
5. Formulário de reserva aparece

---

### 7. Compartilhamento de Banca (Short URL)
**Descrição**: Cada produtor tem um `short_code` de 5 caracteres. Gera URL curta para compartilhar no WhatsApp.  
**Componentes**:
- `backend/utils.py` — `generate_short_code(db)`
- `web/src/components/ShareButton.tsx` — Botão com Web Share API + fallback clipboard
- `backend/routers/bancas.py` — GET /bancas/{short_code} aceita short_code

**Exemplo**: `https://terra-viva-3n3ko.ondigitalocean.app/banca/lyaqk`

---

### 8. Configuração da Feira
**Descrição**: Configuração de horário de funcionamento da feira, janela de pedidos, localização.  
**Componentes**:
- `backend/routers/fair_config.py` — CRUD config
- `web/src/components/FairStatusBanner.tsx` — Banner de status (aberta/fechada)

---

## Funcionalidades Secundárias

### Push Notifications
- Produtor recebe notificação quando um pedido é criado
- Usa Expo Push Notifications (token salvo em `users.expo_push_token`)
- Disparo fire-and-forget via thread daemon

### Middleware de Proteção
- `web/middleware.ts` verifica cookie para rotas protegidas (`/pedidos`, `/perfil`, `/minha-banca`, `/banca/*/reservar`)
- Redireciona para `/login?redirect=...` preservando destino

### Header Inteligente
- Server Component que lê cookie
- Mostra "Entrar" (guest) ou "Perfil + Sair" (logado)
- Nav desktop oculta em mobile (usa BottomTabBar)

### BottomTabBar Responsiva
- Mobile-only (md:hidden)
- Guest: Início, Produtores, Entrar
- Logado: Início, Produtores, Pedidos, Vender, Perfil
- Escuta `storage` events para reagir a logout em tempo real

---

### Pagamento Padrão Pix
- Na tela de reserva, o pagamento padrão mudou de "Dinheiro" para **"Pix"**
- Reflete o uso real dos produtores da região

### Favicon Terra Viva
- Ícone SVG customizado (broto verde em fundo #2d6a4f) em `web/src/app/icon.svg`
- Next.js App Router detecta automaticamente
- `themeColor: "#2d6a4f"` no metadata do layout

### Quantidade Destacada nos Pedidos
- Cards de pedido exibem `📦 Nx Nome do Produto` com badge visual
- Facilita leitura rápida da quantidade no painel do produtor

### WhatsApp com Labels Unificados
- Mensagem WhatsApp usa constantes `PICKUP_LABEL` e `PAYMENT_LABEL` para manter consistência
- Evita duplicação de labels entre exibição e mensagem

---

## Funcionalidades Planejadas (Roadmap)

- [ ] Envio real de SMS (Twilio/Vonage) em produção
- [ ] Avaliações/ratings de produtores
- [ ] Chat/mensagens entre consumidor e produtor
- [ ] Gateway de pagamento (Pix automático)
- [ ] Painel admin para gestão da feira
- [ ] Multi-feira (múltiplas cidades)
- [ ] Histórico e analytics para produtores
