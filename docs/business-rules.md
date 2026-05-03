# Regras de Negócio

## RN-AUTH — Autenticação

### RN-AUTH-01: Login exclusivamente por OTP
- Não existe cadastro com senha. O login é feito por código de 6 dígitos.
- Se o telefone não existir no banco, o usuário é criado automaticamente no primeiro login.
- OTP expira em **5 minutos** (TTL index no MongoDB).
- Em ambiente de desenvolvimento, o código fixo `123456` é aceito (via `DEV_OTP_DEFAULT`).

### RN-AUTH-02: Sessão longa
- JWT tem expiração de **360 dias** (6 meses).
- Justificativa: usuários rurais acessam semanalmente (dia da feira) — re-login gera atrito.
- Token armazenado em cookie httpOnly + localStorage (dual storage para SSR + CSR).

### RN-AUTH-03: Sem sistema de roles
- O mesmo usuário pode ser produtor e consumidor simultaneamente.
- Não existe campo `role`. A "role" é inferida: quem tem produtos cadastrados é produtor.

## RN-PROD — Produtos

### RN-PROD-01: Preço obrigatório
- Todo produto deve ter preço > 0.
- O preço é definido pelo produtor e calculado server-side (quantidade × preço unitário).

### RN-PROD-02: Estoque opcional
- Se `stock` for `null`, o produto tem estoque ilimitado.
- Se `stock` for um número, é decrementado a cada reserva confirmada.
- Produto com `stock = 0` não aparece como disponível.

### RN-PROD-03: Ativo/Inativo
- Produtor pode desativar produtos sem deletá-los (`active: false`).
- Produtos inativos não aparecem na vitrine pública.

### RN-PROD-04: Categorias pré-definidas
- Produtos são classificados em categorias (hortaliças, frutas, laticínios, panificados, etc.).
- A IA sugere categoria automaticamente; produtor pode alterar.

### RN-PROD-05: Cadastro por IA
- Produtor envia foto → GPT-4o Vision retorna JSON com: name, description, category, suggested_price, colors.
- O resultado é **sugestão editável** — produtor confirma ou altera antes de salvar.
- Se IA falhar (timeout 90s / erro), o fluxo manual é oferecido como fallback.

## RN-BANCA — Vitrine

### RN-BANCA-01: Visibilidade pública
- Bancas são listadas publicamente sem login.
- Apenas produtores com **pelo menos 1 produto ativo** aparecem na listagem.

### RN-BANCA-02: Short code
- Cada produtor recebe um código único de 5 caracteres alfanuméricos.
- Gerado automaticamente no primeiro login (migration no startup).
- Usado para URLs curtas compartilháveis (WhatsApp, redes sociais).

### RN-BANCA-03: Personalização visual
- Produtor pode definir cores da banca (cor primária) que são aplicadas nos botões da vitrine.
- Se não definir, usa cor padrão do sistema (`bg-primary`).

## RN-RES — Reservas (Pedidos)

### RN-RES-01: Máquina de estados
```
pending → confirmed → collected → fiado (opcional)
pending → cancelled (por produtor ou consumidor)
```
- Apenas o **produtor** pode mover para `confirmed`, `collected` ou `fiado`.
- **Consumidor** só pode cancelar enquanto status = `pending`.
- **Produtor** pode cancelar em qualquer status exceto `collected`.

### RN-RES-02: Dados do pedido
- Cada reserva armazena: `product_id`, `product_name`, `quantity`, `unit_price`, `total_price`, `pickup_location`, `payment_intent`.
- Product name é denormalizado (snapshot no momento da reserva — não muda se produto for editado).

### RN-RES-03: Local de retirada
- Opções: `feira` (na feira física), `produtor` (buscar no local do produtor), `entrega` (entrega em domicílio).
- A disponibilidade de cada opção depende da configuração do produtor.

### RN-RES-04: Forma de pagamento
- Declaração de intenção: `pix`, `cash` (dinheiro), `card` (cartão).
- **Não há cobrança automática** — é apenas indicativo para o produtor se preparar.

### RN-RES-05: Notificação em cada transição
- Toda mudança de status dispara notificação ao interessado:
  - Novo pedido → notifica produtor (push + WhatsApp)
  - Confirmação/coleta/cancelamento → notifica consumidor (push + WhatsApp)
  - Cancelamento pelo consumidor → notifica produtor

### RN-RES-06: Fiado
- Status especial indicando "coletado mas não pago".
- Apenas o produtor pode marcar como fiado.
- Fica visível na aba "Fiados" do dashboard do produtor.
- Não há cobrança automática — gestão manual pelo produtor.

## RN-REVIEW — Avaliações

### RN-REVIEW-01: Uma avaliação por pedido
- Índice unique em `reservation_id` garante no máximo 1 review por reserva.
- Apenas pedidos com status `collected` podem ser avaliados.

### RN-REVIEW-02: Avaliação pública
- Reviews são visíveis na vitrine da banca (públicas).
- Campos: rating (1-5), comment (texto livre), consumer_name.

## RN-FAIR — Configuração da Feira

### RN-FAIR-01: Documento singleton
- Existe apenas um registro de configuração da feira no sistema (single-feira).
- Contém: dias de funcionamento, horários, localização, janela de pedidos.

### RN-FAIR-02: Banner de status
- Frontend calcula em tempo real se a feira está aberta/fechada baseado na config.
- Exibe banner contextual: "Feira aberta", "Abre amanhã às X", "Fechada".

## RN-NOTIF — Notificações

### RN-NOTIF-01: Três canais independentes
- **In-app**: registro no banco (`notifications` collection), polling via API.
- **Push**: Expo Push API (mobile).
- **WhatsApp**: z-api (mensagem formatada com emojis e link).

### RN-NOTIF-02: Fire-and-forget
- Envio de push e WhatsApp ocorre em thread separada (daemon).
- Falha no envio **não** bloqueia a response do endpoint principal.
- Não há retry automático em caso de falha.

### RN-NOTIF-03: Mensagens ricas no WhatsApp
- Mensagens incluem: detalhes do pedido, emojis, separadores visuais, link para a plataforma.
- Labels humanizados: `feira` → "🏪 Na feira", `pix` → "💸 Pix", etc.
