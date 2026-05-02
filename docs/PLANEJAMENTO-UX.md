# Planejamento de Melhorias UX — Terra Viva

> Baseado na análise crítica do fluxo, focando no público-alvo: agricultores familiares.
> Autenticação será revisada separadamente (futuro).

---

## Fase 1 — Quick Wins (Impacto imediato, esforço baixo)

### 1.1 Renomear CTAs da Home

**Onde:** Web (`HomeActions.tsx`) + Mobile (`HomeScreen.tsx`)

| Atual | Novo |
|-------|------|
| "Reservar na banca" | **"Quero comprar" 🛒** |
| "Disponibilizar na banca" | **"Quero vender" 🌽** |

Adicionar subtítulos:
- Comprar: "Veja o que tem na feira"
- Vender: "Coloque seus produtos pra vender"

**Esforço:** 15 min

---

### 1.2 Confirmação antes de excluir produto

**Onde:** Web (`/minha-banca/page.tsx`) + Mobile (`ProductsScreen.tsx`)

- Ao clicar em 🗑, exibir modal/alert: "Tem certeza que quer remover o **{nome do produto}**?"
- Botões: "Cancelar" / "Sim, remover"

**Esforço:** 20 min

---

### 1.3 Fonte mínima 14px

**Onde:** Web (`globals.css`, `tailwind.config.ts`)

- Base do body: `font-size: 14px` (atualmente herda 16px, ok)
- Revisar elementos com `text-[10px]` e `text-xs` (12px) → promover para `text-sm` (14px) em áreas de ação
- Manter `text-[10px]` apenas em labels decorativos (tagline do logo)

**Esforço:** 30 min

---

### 1.4 Máscara no telefone + aceitar vírgula no preço

**Onde:** Web (`login/page.tsx`, `minha-banca/page.tsx`, `perfil/page.tsx`)

- Telefone: máscara visual `(48) 9 9999-9999` (input mask)
- Preço: aceitar `28,50` ou `28.50`, converter internamente para float com ponto
- Campo de preço com prefixo visual "R$" e teclado numérico

**Esforço:** 1h

---

## Fase 2 — Fluxo de Reserva Simplificado

### 2.1 Bancas visíveis sem login

**Onde:** Middleware (`middleware.ts`), Web (`/bancas`, `/banca/[id]`)

- Listagem de bancas e detalhe de banca: **públicos** (já são)
- Botão "Reservar" no produto: se não logado → redireciona para `/login` com `?redirect=/banca/{id}/reservar?productId={id}`
- Após login → volta direto para o checkout

**Comportamento atual:** Já funciona assim (bancas são públicas). Precisa apenas:
- Adicionar `redirect` query param no fluxo de login
- Após login, usar `redirect` se presente

**Esforço:** 45 min

---

### 2.2 Tela de sucesso após reserva

**Onde:** Web (`/banca/[id]/reservar/page.tsx`) + Mobile (`CheckoutScreen.tsx`)

Após `POST /reservations` com sucesso:

```
┌─────────────────────────────┐
│         🎉                   │
│   Reserva feita!            │
│                              │
│   Queijo Colonial (2x)      │
│   R$ 56,00                  │
│                              │
│   📍 Retire sábado na feira │
│   💳 Pagamento: Pix         │
│                              │
│   [ Ver meus pedidos ]      │
│   [ Voltar para a feira ]   │
└─────────────────────────────┘
```

**Esforço:** 1h

---

## Fase 3 — Experiência do Produtor

### 3.1 Perfil simplificado (primeira vez)

**Onde:** Backend (`models.py`, `routers/producers.py`) + Web (`perfil/page.tsx`)

Campos na **primeira criação**:
| Campo | Obrigatório | Nota |
|-------|:-----------:|------|
| `city` | ✅ | Pré-preenchido se possível |
| `phone` | ✅ | Já vem do login |
| `bio` | ❌ | Placeholder: "Conte sobre seus produtos" |
| `payment_methods` | ❌ | Default: `["cash"]` |
| `pix_key` | ❌ | Mostrar depois |
| `address` | ❌ | Mostrar depois |

**Mudança no backend:**
- `bio` deixa de ser obrigatório (default: "")
- `phone` pré-preenchido com o número do login (já existe no JWT)
- `payment_methods` default `["cash"]` se não informado

**Esforço:** 30 min

---

### 3.2 Toggle de produto: "Disponível" / "Esgotado"

**Onde:** Web (`/minha-banca/page.tsx`) + Mobile

| Atual | Novo |
|-------|------|
| "Ativo" / "Inativo" | **"Disponível ✅"** / **"Esgotado"** |

Cores: verde para disponível, cinza para esgotado.

**Esforço:** 10 min

---

## Fase 4 — Onboarding + Feedback

### 4.1 Onboarding (3 telas)

**Onde:** Web (modal no primeiro acesso) + Mobile (telas antes do login)

| Tela | Título | Descrição |
|------|--------|-----------|
| 1 | 🌿 Bem-vindo ao Terra Viva | "A feira digital da colônia. Compre direto do produtor, sem intermediário." |
| 2 | 🛒 Como comprar | "Escolha uma banca, reserve o produto e retire na feira de sábado." |
| 3 | 🌽 Como vender | "Cadastre seus produtos e receba pedidos no celular." |

- Botão "Próximo" → "Próximo" → "Começar"
- Salvar flag `onboarding_done` no localStorage/AsyncStorage
- Nunca mostrar de novo após a primeira vez

**Esforço:** 2h

---

### 4.2 Feedback visual consistente

**Onde:** Global (web + mobile)

- **Carregamento:** skeleton loader (retângulos animados) em vez de "Carregando..."
- **Listas vazias:** mensagens acolhedoras com emoji + ação sugerida
  - "Tudo tranquilo por aqui! 🌿" em vez de "Nenhuma reserva"
  - "Nenhum pedido ainda. Que tal ver o que tem na feira?" + botão
- **Sucesso:** toast verde no topo (2s) após ações como salvar perfil, criar produto
- **Erro:** toast vermelho com linguagem simples ("Não conseguimos salvar. Tente de novo.")

**Esforço:** 2h

---

## Fase 5 — Notificações + Offline

### 5.1 Push notification de novo pedido

**Onde:** Backend + Mobile (Expo Push) + Web (futuro: WhatsApp)

Fluxo:
1. Comprador faz reserva → `POST /reservations`
2. Backend identifica o produtor dono do produto
3. Envia push notification: "Novo pedido! {nome_produto} (x{qty})"
4. Produtor abre app → vê pedido na aba "Pedidos recebidos"

**Implementação:**
- Salvar `expo_push_token` no perfil do produtor (campo novo)
- Usar Expo Push API para enviar
- Futuramente: integrar com WhatsApp Business API (Evolution API ou similar)

**Esforço:** 4h

---

### 5.2 Cache offline de bancas e produtos

**Onde:** Mobile (`storage/cache.ts` — já existe mas não é usado no web)

- Ao carregar bancas com sucesso → salvar no AsyncStorage/localStorage
- Se requisição falhar (offline) → mostrar dados do cache + badge "Dados de X min atrás"
- Implementar stale-while-revalidate pattern

**Web:**
- Já usa SWR em `/pedidos` → expandir para bancas e produtos
- Adicionar `fallbackData` de localStorage

**Esforço:** 3h

---

## Fase 6 (Futuro) — Integração WhatsApp

### 6.1 Notificação de pedido via WhatsApp

- Produtor recebe mensagem: "Novo pedido no Terra Viva! Queijo Colonial (2x). Abra o app para confirmar."
- Possibilidade de responder "1" para confirmar direto pelo WhatsApp

### 6.2 Login via link no WhatsApp

- Em vez de digitar código OTP, receber link: "Toque aqui para entrar no Terra Viva"
- Link abre o app/web com token temporário → login automático

### 6.3 Cardápio compartilhável

- Produtor pode gerar link da sua banca para enviar no WhatsApp
- "Veja meus produtos na feira: terraviva.app/banca/dona-maria"

> *Fase 6 será planejada separadamente após validação das fases 1-5.*

---

## Cronograma Sugerido

| Fase | Escopo | Esforço total |
|------|--------|---------------|
| **1** | Quick wins (CTAs, fontes, confirmações, máscaras) | ~2h |
| **2** | Fluxo de reserva (redirect, tela de sucesso) | ~2h |
| **3** | Produtor (perfil simples, toggle nomes) | ~1h |
| **4** | Onboarding + feedback visual | ~4h |
| **5** | Push + offline | ~7h |
| **6** | WhatsApp (futuro) | TBD |

**Total fases 1-5:** ~16h de desenvolvimento

---

## Prioridade de Execução

```
Fase 1 (quick wins)
  ↓
Fase 3 (produtor — simplifica barreira de entrada)
  ↓
Fase 2 (reserva — melhora conversão)
  ↓
Fase 4 (onboarding + feedback)
  ↓
Fase 5 (push + offline)
  ↓
Fase 6 (WhatsApp — pós-validação)
```

---

## Princípios de Design

1. **Uma ação principal por tela** — nunca mais de 3 opções visíveis
2. **Linguagem de roça** — sem jargão técnico, sem inglês
3. **Fontes grandes** — mínimo 14px, ações em 16px+
4. **Feedback imediato** — toda ação tem resposta visual em < 300ms
5. **Funciona no sol** — contraste alto, cores sólidas
6. **Funciona sem internet** — cache local, fila offline, feedback de status
7. **30 segundos** — se não dá pra fazer em 30s com uma mão, é complexo demais
