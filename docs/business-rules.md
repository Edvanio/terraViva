# Regras de Negócio

## Regras de Autenticação

### RN-AUTH-01: Login exclusivamente por OTP
**Descrição**: Não existe senha. Todo login é feito por código OTP de 6 dígitos enviado ao telefone.  
**Justificativa**: Público-alvo rural, pouco familiarizado com gestão de senhas.  
**Implementação**: `backend/routers/auth.py`  
**Validações**:
- Telefone normalizado (apenas dígitos, mínimo 10)
- OTP expira em 5 minutos (TTL index no MongoDB)
- OTP gerado com `secrets.randbelow()` (criptograficamente seguro)
- Em dev: aceita código fixo via `DEV_OTP_DEFAULT` (vazio em produção)

### RN-AUTH-02: Criação automática de usuário
**Descrição**: Se o telefone não existe no banco ao verificar OTP, o usuário é criado automaticamente.  
**Justificativa**: Eliminação de fricção no cadastro.  
**Implementação**: `backend/routers/auth.py` → `verify_otp()`

### RN-AUTH-03: Sessão de longa duração
**Descrição**: JWT e cookie duram 360 dias.  
**Justificativa**: Público usa o app esporadicamente (1x/semana na feira). Re-login frequente causaria abandono.

### RN-AUTH-04: Dual-token (cookie + localStorage)
**Descrição**: Token armazenado em cookie httpOnly (para SSR/middleware) E em localStorage (para client components).  
**Justificativa**: Next.js Server Components precisam do cookie; Client Components precisam enviar header Authorization nas fetch requests.

---

## Regras de Produtos

### RN-PROD-01: Produto pertence a um único produtor
**Descrição**: `products.user_id` referencia o produtor dono.  
**Validação**: Apenas o dono pode editar/excluir seus produtos.

### RN-PROD-02: Visibilidade via `is_active`
**Descrição**: Produto com `is_active: false` não aparece nas bancas públicas.  
**Uso**: Produtor marca como "esgotado" sem excluir.

### RN-PROD-03: Estoque opcional
**Descrição**: Campo `stock` pode ser `null` (estoque ilimitado) ou numérico.  
**Implementação**: UI permite toggle entre "ilimitado" e quantidade específica.

### RN-PROD-04: Categorias fixas
**Descrição**: Lista pré-definida de categorias:
- `hortifruti`, `queijos`, `paes`, `doces`, `embutidos`, `conservas`, `colonial`, `bebidas`, `ovos`, `artesanal`, `temperos`, `outros`

**Implementação**: Validada no `openai_service.py` e no frontend.

### RN-PROD-05: IA sugere, produtor confirma
**Descrição**: A geração por IA é apenas sugestão. O produtor pode editar todos os campos antes de salvar.  
**Timeout**: 90 segundos para resposta da OpenAI.

---

## Regras de Bancas

### RN-BANCA-01: Banca = Produtor com produtos
**Descrição**: Uma "banca" é a visualização pública de um usuário que possui pelo menos um produto (ativo ou não).  
**Implementação**: `GET /bancas` filtra `users` que têm `products` com `is_active: true`.

### RN-BANCA-02: Banca sem produtos é acessível
**Descrição**: Se um produtor existe mas não tem produtos ativos, a banca é acessível via URL direta (mostra "nenhum produto disponível").  
**Implementação**: `GET /bancas/{id}` não retorna 404 por falta de produtos.

### RN-BANCA-03: Short code único
**Descrição**: Cada usuário recebe um código de 5 caracteres (letras minúsculas + dígitos) gerado automaticamente.  
**Validações**: Unicidade garantida por index unique + retry.  
**Uso**: URL curta para compartilhamento.

---

## Regras de Reservas

### RN-RES-01: Apenas consumidor logado pode reservar
**Descrição**: Endpoint protegido por JWT.  
**Middleware**: `web/middleware.ts` protege `/banca/*/reservar`.

### RN-RES-02: Status machine
**Descrição**: Fluxo de estados da reserva:
```
pending → confirmed → collected
pending → cancelled (pelo consumidor)
confirmed → cancelled (pelo produtor)
```

### RN-RES-03: Somente `pending` pode ser cancelado pelo consumidor
**Descrição**: Consumidor só cancela pedidos que ainda não foram confirmados pelo produtor.  
**Implementação**: `PATCH /reservations/{id}/cancel` verifica `status == "pending"` e `consumer_id == user._id`.

### RN-RES-04: Somente produtor muda status para confirmed/collected
**Descrição**: `PUT /reservations/{id}/status` verifica `producer_id == user._id`.

### RN-RES-05: Preço calculado no backend
**Descrição**: `total_price = quantity × product.price` — calculado no momento da criação.  
**Justificativa**: Evita manipulação de preço pelo frontend.

### RN-RES-06: Notificação push ao produtor
**Descrição**: Ao criar reserva, produtor recebe push notification via Expo.  
**Implementação**: Thread daemon fire-and-forget (não bloqueia response).

---

## Regras da Feira

### RN-FEIRA-01: Configuração por cidade
**Descrição**: Cada cidade tem sua configuração de feira (dia, horário, local, janela de pedidos).  
**Implementação**: Collection `fair_configs` com filtro por `city` e `active: true`.

### RN-FEIRA-02: Janela de pedidos
**Descrição**: Pedidos só podem ser feitos dentro da janela definida (`order_window_open` / `order_window_close`).  
**Implementação**: Frontend exibe banner de status (aberta/fechada). **Nota**: Validação backend da janela ainda não implementada — apenas informativo no frontend.

---

## Regras de Upload

### RN-UPLOAD-01: Imagens processadas antes do upload
**Descrição**: Imagens são processadas via Pillow (resize, compressão) antes de upload ao Spaces.  
**Limite**: `client_max_body_size 10m` no nginx.

### RN-UPLOAD-02: URLs públicas
**Descrição**: Imagens ficam públicas no Spaces (ACL `public-read`).  
**Estrutura**: `terraviva/profiles/{uuid}.{ext}` e `terraviva/products/{uuid}.{ext}`.

---

## Regras de Segurança

### RN-SEC-01: Cookie secure em produção
**Descrição**: Cookie de sessão usa `secure: true` em produção (HTTPS only).

### RN-SEC-02: CORS restritivo
**Descrição**: Apenas origens listadas em `CORS_ORIGINS` são aceitas.

### RN-SEC-03: Token validado em cada request autenticada
**Descrição**: `dependencies.py` → `get_current_user()` decodifica JWT e busca usuário no banco.

### RN-SEC-04: DEV_OTP_DEFAULT vazio em produção
**Descrição**: O código OTP fixo para desenvolvimento tem default vazio. Só funciona se explicitamente configurado via env var.
