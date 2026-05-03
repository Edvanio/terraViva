# Funcionalidades

## Funcionalidades Principais

### 1. Autenticação por OTP (sem senha)
**Descrição**: Login via código de 6 dígitos enviado por SMS/WhatsApp ao telefone do usuário.
**Casos de Uso**: Primeiro acesso cria conta automaticamente; acessos seguintes apenas validam OTP.
**Componentes**: `backend/routers/auth.py`, `web/src/app/login/`, `app/src/screens/auth/`
**Dependências**: Coleção `otp_codes` com TTL index (5min de expiração automática).

### 2. Vitrine de Produtores (Bancas)
**Descrição**: Listagem pública de todos os produtores com produtos ativos. Cada banca mostra foto, nome, cidade, categorias e produtos disponíveis.
**Casos de Uso**: Consumidor navega, filtra por categoria, acessa detalhe da banca.
**Componentes**: `backend/routers/bancas.py`, `web/src/app/bancas/`, `web/src/components/BancaCard.tsx`
**Dependências**: Produtos ativos do produtor, foto de perfil (DO Spaces).

### 3. Cadastro Inteligente de Produtos (IA)
**Descrição**: Produtor fotografa o produto → GPT-4o Vision analisa a imagem e sugere nome, descrição, categoria, preço estimado e cores predominantes. O produtor pode editar antes de salvar.
**Casos de Uso**: Cadastro rápido para produtores com dificuldade em descrever produtos.
**Componentes**: `backend/routers/ai_products.py`, `backend/services/openai_service.py`, `web/src/components/AIProductModal.tsx`
**Dependências**: API OpenAI (GPT-4o Vision), DO Spaces para upload da imagem.

### 4. CRUD de Produtos
**Descrição**: Gerenciamento completo de catálogo — criar, editar, ativar/desativar, controlar estoque.
**Casos de Uso**: Produtor gerencia sua vitrine pela aba "Minha Banca".
**Componentes**: `backend/routers/products.py`, `web/src/app/minha-banca/page.tsx`
**Dependências**: Upload de imagem para DO Spaces; estoque nullable (sem controle = estoque infinito).

### 5. Sistema de Reservas (Pedidos)
**Descrição**: Consumidor reserva produtos para retirada na feira. Fluxo de status: `pending → confirmed → collected`. Produtor confirma preparação; marca como coletado no dia.
**Casos de Uso**: 
- Consumidor faz pedido (escolhe produto, quantidade, local de retirada, forma de pagamento)
- Produtor confirma ou cancela
- No dia da feira, marca como coletado
**Componentes**: `backend/routers/reservations.py`, `web/src/app/pedidos/`, `web/src/app/minha-banca/`
**Dependências**: Notificações (push + WhatsApp) em cada mudança de status.

### 6. Notificações Multi-canal
**Descrição**: Sistema de notificações com 3 canais: in-app (polling), push (Expo), WhatsApp (z-api).
**Casos de Uso**:
- Novo pedido → notifica produtor
- Pedido confirmado/coletado/cancelado → notifica consumidor
**Componentes**: `backend/routers/notifications.py`, `backend/utils.py`, `web/src/components/NotificationBell.tsx`
**Dependências**: z-api (WhatsApp), Expo Push API, coleção `notifications`.

### 7. Perfil do Produtor
**Descrição**: Configuração completa da banca — nome, bio, cidade, foto, capa, chave Pix, métodos de pagamento aceitos, geolocalização.
**Casos de Uso**: Produtor configura sua identidade visual e informações de contato.
**Componentes**: `backend/routers/producers.py`, `web/src/app/perfil/`
**Dependências**: DO Spaces (fotos), Nominatim/OpenAI (geocoding), geração de short_code.

### 8. Short Codes (URLs Curtas)
**Descrição**: Cada produtor recebe um código alfanumérico de 5 caracteres para compartilhar sua banca via WhatsApp/redes sociais.
**Casos de Uso**: Produtor compartilha `terra-viva.app/b/ABC12` em grupos de WhatsApp.
**Componentes**: `backend/utils.py` (`generate_short_code`), startup migration em `main.py`
**Dependências**: Índice unique + sparse na coleção `users`.

### 9. Configuração da Feira
**Descrição**: Administrador configura horário de funcionamento, local, e janela de pedidos da feira.
**Casos de Uso**: Definir quando a feira abre/fecha, onde será realizada.
**Componentes**: `backend/routers/fair_config.py`, `web/src/components/FairStatusBanner.tsx`
**Dependências**: Coleção `fair_config` (singleton document).

### 10. Avaliações Pós-compra
**Descrição**: Após coleta, consumidor pode avaliar o pedido (1-5 estrelas + comentário). Avaliações são públicas na vitrine da banca.
**Casos de Uso**: Feedback público para outros consumidores.
**Componentes**: `backend/routers/reviews.py`
**Dependências**: Uma review por reservation (unique index), vinculada ao producer_id.

### 11. Sistema de Fiado
**Descrição**: Produtor pode marcar um pedido coletado como "fiado" — indicando que o pagamento ficou pendente para próxima feira.
**Casos de Uso**: Produtor anota dívidas informais de clientes frequentes.
**Componentes**: `backend/routers/reservations.py` (status `fiado`), `web/src/app/minha-banca/` (aba Fiados)
**Dependências**: Apenas mudança de status — sem integração com gateway de pagamento.

## Funcionalidades Secundárias

### Onboarding
Fluxo de primeira vez que introduz o usuário à plataforma (carrossel de benefícios).

### Banner de Status da Feira
Indicador visual no topo da home mostrando se a feira está aberta, fechada, ou próxima de abrir.

### Geolocalização Automática
Na edição de perfil, detecta cidade via GPS do navegador + reverse geocoding (Nominatim → fallback OpenAI).

### Polling de Notificações
Bell icon com badge de não-lidas; polling a cada 30s no frontend web.

## Funcionalidades Planejadas (Roadmap)

- Pagamento online integrado (Pix automático)
- Chat entre produtor e consumidor
- Entregas com rastreamento
- Multi-feira (várias feiras no mesmo sistema)
- Relatórios de vendas para produtores
