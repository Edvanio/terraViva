# Terra Viva — Design System

> Identidade visual do app: agricultura familiar, interior, comunidade.
> Feito para eles — simples, humano, de confiança.

---

## Índice

1. [Filosofia Visual](#1-filosofia-visual)
2. [Paleta de Cores](#2-paleta-de-cores)
3. [Tipografia](#3-tipografia)
4. [Espaçamento e Grid](#4-espaçamento-e-grid)
5. [Componentes](#5-componentes)
6. [Ícones e Ilustrações](#6-ícones-e-ilustrações)
7. [Fotografia](#7-fotografia)
8. [Telas — Anatomia](#8-telas--anatomia)
9. [Design Tokens (React Native)](#9-design-tokens-react-native)

---

## 1. Filosofia Visual

O Terra Viva não é um app de supermercado. É a digitalização de algo que já existia — a feira, o produtor, o produto colonial. O design precisa honrar isso.

**Palavras que guiam cada decisão visual:**

- **Confiança** — o produtor precisa parecer real, próximo, humano
- **Simplicidade** — o agricultor com pouca familiaridade digital tem que usar sem travar
- **Pertencimento** — quem abre o app precisa sentir que é para ele, não para um público genérico
- **Naturalidade** — tons de terra, verde, madeira — não azul corporativo

**O que evitar:**

- Branco clínico de app de delivery (iFood, Rappi)
- Gradientes chamativos ou neon
- Ícones muito abstratos
- Fontes finas demais (dificulta leitura ao sol, ao ar livre)

---

## 2. Paleta de Cores

### Cores principais

| Nome | Hex | Uso |
|---|---|---|
| Verde Floresta | `#2A5C2E` | Header, botões primários, ícones ativos |
| Verde Médio | `#3D7A42` | Estados hover, variações de botão |
| Verde Claro | `#10B981` | Badges de status positivo, confirmado |
| Creme Fundo | `#F7F3EC` | Background de todas as telas |
| Âmbar | `#F59E0B` | Estrelas de avaliação, badge "aguardando" |
| Laranja Status | `#F97316` | Badge "aguardando pagamento" |

### Cores neutras

| Nome | Hex | Uso |
|---|---|---|
| Branco | `#FFFFFF` | Fundo dos cards |
| Cinza Claro | `#F3F4F6` | Fundos de input, pill inativo |
| Cinza Médio | `#9CA3AF` | Textos secundários, labels |
| Cinza Escuro | `#6B7280` | Subtítulos, descrições |
| Preto Suave | `#1A1A1A` | Texto principal |

### Cores de status de pedido

| Status | Cor | Hex |
|---|---|---|
| Confirmado | Verde | `#10B981` |
| Aguardando pagamento | Âmbar | `#F59E0B` |
| Pronto para retirada | Verde claro | `#34D399` |
| Cancelado | Vermelho suave | `#EF4444` |

### Hierarquia

```
#2A5C2E  ←  Verde Floresta (primário — botões, header, ativo)
#F7F3EC  ←  Creme (fundo — naturalidade, calor)
#FFFFFF  ←  Branco (cards — limpeza, legibilidade)
#1A1A1A  ←  Texto principal
#6B7280  ←  Texto secundário
```

---

## 3. Tipografia

### Família de fonte

**React Native padrão do sistema** — evitar fontes customizadas no MVP para não aumentar o tamanho do app.

- iOS: SF Pro
- Android: Roboto

Ambas são legíveis, sem serifa, e funcionam bem ao ar livre.

### Escala tipográfica

| Nome | Tamanho | Peso | Uso |
|---|---|---|---|
| Display | 24px | Bold (700) | Nome do produtor na banca |
| Título | 20px | Bold (700) | Cabeçalhos de seção |
| Subtítulo | 16px | SemiBold (600) | Nome de produto, nome da banca na lista |
| Corpo | 14px | Regular (400) | Descrições, bio do produtor |
| Label | 13px | Medium (500) | Filtros, labels de campo |
| Pequeno | 12px | Regular (400) | Textos de apoio, datas, horários |
| Preço | 18px | Bold (700) | Valor em verde — destaque sempre |

### Regras

- Tamanho mínimo: **12px** — abaixo disso não serve para o público rural
- Linha de base: `lineHeight = fontSize × 1.5` (confortável para leitura ao sol)
- Nunca usar peso Light em campos importantes
- Preço sempre em negrito e em verde floresta

---

## 4. Espaçamento e Grid

### Base

Múltiplos de **8px** — padrão de mercado, funciona em qualquer densidade de tela.

| Token | Valor | Uso |
|---|---|---|
| `space.xs` | 4px | Espaço mínimo entre elementos inline |
| `space.sm` | 8px | Padding interno de badges e chips |
| `space.md` | 16px | Padding horizontal de telas |
| `space.lg` | 24px | Espaço entre seções |
| `space.xl` | 32px | Margens grandes |
| `space.xxl` | 48px | Separações de bloco |

### Border Radius

| Token | Valor | Uso |
|---|---|---|
| `radius.sm` | 8px | Inputs, chips de filtro |
| `radius.md` | 12px | Cards de produto |
| `radius.lg` | 16px | Cards de banca, modais |
| `radius.full` | 9999px | Badges de status, avatar |

### Sombras (Shadow)

Cards flutuam levemente sobre o fundo creme — dá sensação de profundidade sem ser exagerado.

```
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.06
shadowRadius: 8
elevation: 3  (Android)
```

---

## 5. Componentes

### Header (Cabeçalho)

```
Fundo:       Verde Floresta #2A5C2E
Texto:       Branco #FFFFFF
Logo:        Terra Viva + ícone folha (branco)
Subtítulo:   Cidade · Nome da Feira (branco, 13px, opacidade 0.85)
Altura:      56px + safe area
```

**Com parceiro institucional:** logo da instituição substitui o Terra Viva, cor primária vem da config do parceiro.

---

### Card de Banca (Lista na Home)

```
Fundo:       Branco #FFFFFF
Sombra:      shadow leve (ver acima)
Radius:      16px
Padding:     16px

Estrutura:
  [Foto do produtor — 64×64, radius 32, borda verde 2px]
  [Nome da banca — 16px Bold]
  [Categoria — 13px Cinza Médio]
  [⭐ Avaliação — âmbar] [· N avaliações — cinza]
  [N produtos · Cidade/UF — 12px cinza]
```

---

### Card de Produto (dentro da Banca)

```
Fundo:       Branco
Radius:      12px
Padding:     12px

Estrutura:
  [Foto do produto — 80×80, radius 8, object-fit: cover]
  [Nome — 15px SemiBold]
  [Descrição — 13px cinza, 2 linhas max]
  [R$ XX,XX — 18px Bold Verde Floresta]
  [Botão quantidade: − 1 +]
  [Botão Comprar — verde, full width]
```

---

### Botão Primário

```
Fundo:       Verde Floresta #2A5C2E
Texto:       Branco, 16px Bold
Altura:      52px
Radius:      12px
Sombra:      leve (shadow acima)
```

---

### Botão Secundário (Outlined)

```
Fundo:       Transparente
Borda:       2px sólido Verde Floresta
Texto:       Verde Floresta, 16px SemiBold
Altura:      52px
Radius:      12px
```

---

### Chips de Filtro de Categoria

```
Ativo:
  Fundo:   Verde Floresta #2A5C2E
  Texto:   Branco, 13px Medium
  Radius:  20px
  Padding: 8px 16px

Inativo:
  Fundo:   #F3F4F6
  Texto:   Cinza Escuro, 13px Medium
  Radius:  20px
  Padding: 8px 16px
```

Categorias padrão: **Todos · Queijos · Pães · Doces · Frios**

---

### Badge de Status de Pedido

```
Radius:      full (pílula)
Padding:     4px 10px
Fonte:       12px Medium

Confirmado:         fundo #D1FAE5   texto #065F46
Aguardando pag.:    fundo #FEF3C7   texto #92400E
Pronto p/ retirada: fundo #A7F3D0   texto #065F46
Cancelado:          fundo #FEE2E2   texto #991B1B
```

---

### Bottom Tab Bar (Consumidor)

```
Fundo:       Branco
Borda topo:  1px #E5E7EB
Ícone ativo: Verde Floresta + label verde
Ícone inativo: Cinza Médio

Abas:
  🏠 Início    |    🏷️ Categorias    |    📦 Pedidos    |    👤 Perfil
```

### Bottom Tab Bar (Produtor)

```
Abas:
  🏠 Início    |    🏪 Bancas    |    📦 Produtos    |    👤 Perfil
```

---

### Campo de Busca

```
Fundo:       Branco
Placeholder: "Buscar bancas ou produtos..."
Ícone:       🔍 Verde Floresta
Radius:      12px
Altura:      44px
Borda:       1px #E5E7EB
```

---

### Card de Informação da Feira

```
Fundo:       #FFF8EC (âmbar muito claro)
Borda esq.:  3px sólido âmbar #F59E0B
Ícone:       📅 calendário
Texto:       "Todo sábado, 8h às 12h"
Subtexto:    "Centro · São Ludgero/SC"
```

---

### Avatar do Produtor

```
Tamanho:     64×64 (lista) / 96×96 (perfil)
Radius:      full (circular)
Borda:       2px Verde Floresta
Fallback:    iniciais do nome em fundo verde claro
```

---

## 6. Ícones e Ilustrações

Usar **ícones de linha** (outline), não sólidos — mais leves e compatíveis com o estilo rural/limpo.

Biblioteca sugerida: **Feather Icons** (já incluso no Expo via `@expo/vector-icons`).

| Ação | Ícone |
|---|---|
| Home / Início | `home` |
| Categorias | `grid` |
| Pedidos | `package` |
| Perfil | `user` |
| Bancas | `map-pin` |
| Produtos | `box` |
| Busca | `search` |
| Editar | `edit-2` |
| Adicionar | `plus` |
| Localização | `map-pin` |
| Calendário / Feira | `calendar` |
| Pagamento | `credit-card` |
| Telefone / Celular | `phone` |
| Galeria / Foto | `image` |
| Vídeo | `play-circle` |
| Seta voltar | `arrow-left` |
| Confirmado | `check-circle` |
| Pendente | `clock` |

---

## 7. Fotografia

A fotografia é o coração visual do app. Sem ela, o produto não tem alma.

### Guia para fotos de produtor

- Fundo natural — roça, sítio, galinheiro, chão de terra
- Rosto visível, olhando para a câmara — humaniza
- Luz natural — evitar flash
- Sem poses corporativas
- Família ou animais na foto são bem-vindos

### Guia para fotos de produto

- Produto sobre superfície natural: madeira, pedra, pano de linho
- Luz natural lateral (janela)
- Sem filtros fortes
- Foco no produto — não no plano de fundo
- Mostrar textura (queijo com casca, pão fatiado)

### Tamanhos de imagem no app

| Contexto | Tamanho exibido | Upload mínimo sugerido |
|---|---|---|
| Avatar do produtor | 64×64 / 96×96 | 400×400px |
| Foto da banca (hero) | 100% largura × 200px | 800×400px |
| Galeria do produtor | 80×80 (thumbnail) | 400×400px |
| Foto do produto | 80×80 (lista) / 240×240 (detalhe) | 400×400px |

---

## 8. Telas — Anatomia

### Home — App do Consumidor

```
┌─────────────────────────────────┐
│  🌿 Terra Viva          [ícone] │  ← Header verde
│  📍 São Ludgero · Feira do Prod.│
├─────────────────────────────────┤
│  🔍 Buscar bancas ou produtos   │  ← Campo de busca
├─────────────────────────────────┤
│  [Todos] [Queijos] [Pães] [+]   │  ← Filtros de categoria
├─────────────────────────────────┤
│  Todas as Bancas       Ver todas│
│                                 │
│  ┌─────────────────────────────┐│
│  │ [foto] Sabor da Colônia     ││  ← Card de banca
│  │        Queijos e laticínios ││
│  │        ⭐4.9 · 12 produtos  ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ [foto] Recanto dos Pães     ││
│  │        Pães caseiros e cucas││
│  │        ⭐4.8 · 8 produtos   ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  🏠 Início | 🏷️ Cat. | 📦 Ped. | 👤│  ← Tab bar
└─────────────────────────────────┘
```

### Finalizar Compra — App do Consumidor

```
┌─────────────────────────────────┐
│  ←  Finalizar Compra            │  ← Header verde
├─────────────────────────────────┤
│  Produto                        │
│  ┌──────────────────────────────┐
│  │ [foto] Queijo Colonial       │
│  │        Sabor da Colônia      │
│  │        Quantidade: 1 unidade │
│  │        R$ 28,00              │
│  └──────────────────────────────┘
│                                 │
│  Como deseja pagar?             │  ← Baseado no que produtor aceita
│  ● Pix                          │
│  ○ Dinheiro ou cartão           │
│                                 │
│  Como deseja retirar?           │
│  ● Retirar na feira             │
│    Sábado, 8h às 12h            │
│  ○ Retirar no local do produtor │
│    Horário comercial            │
│                                 │
│  ┌──────────────────────────────┐
│  │ 📅 Feira do Produtor         │
│  │    Todo sábado, 8h às 12h   │
│  │    Centro · São Ludgero/SC  │
│  └──────────────────────────────┘
│                                 │
│  [  ✓ Confirmar reserva       ] │  ← Botão verde
│  Pagamento feito na retirada    │  ← Nota de rodapé
└─────────────────────────────────┘
```

### Perfil do Produtor — Área do Produtor

```
┌─────────────────────────────────┐
│  🌿 Terra Viva    Área Produtor │  ← Header verde
├─────────────────────────────────┤
│            [foto]  ✔            │  ← Avatar circular com selo
│       Sítio do Seu João         │
│     Queijos · Frios · Salames   │
│     ⭐ 4.9 · 129 avaliações     │
│     📍 2.5 km · São Ludgero/SC  │
│                                 │
│    [  ✏️ Editar Perfil        ] │  ← Botão outlined
│                                 │
│  Galeria                        │
│  [img1] [img2] [img3] [img4]    │
│         [ 🖼️ Galeria ]          │
│                                 │
│  Nossa História                 │
│  "Texto livre do produtor..."   │
│                                 │
│  [▶ Vídeo de apresentação 1:20] │  ← Card com thumbnail
├─────────────────────────────────┤
│  🏠 Início | 🏪 Bancas | 📦 | 👤│
└─────────────────────────────────┘
```

---

## 9. Design Tokens (React Native)

Arquivo a criar em `app/src/theme/tokens.ts`:

```typescript
// Terra Viva — Design Tokens
// Baseado nos mockups do produto

export const colors = {
  // Primárias
  primary: '#2A5C2E',        // Verde Floresta — header, botões, ativo
  primaryMedium: '#3D7A42',  // Verde Médio — hover, variações
  primaryLight: '#10B981',   // Verde Claro — status positivo
  primaryLightest: '#D1FAE5',// Verde Mínimo — fundo de badge
  
  // Fundo
  background: '#F7F3EC',     // Creme — fundo de todas as telas
  surface: '#FFFFFF',        // Branco — fundo de cards
  
  // Texto
  textPrimary: '#1A1A1A',    // Preto suave — texto principal
  textSecondary: '#6B7280',  // Cinza escuro — subtítulos
  textTertiary: '#9CA3AF',   // Cinza médio — labels, metadados
  textOnPrimary: '#FFFFFF',  // Branco — texto sobre verde
  textPrice: '#2A5C2E',      // Verde — preço (sempre em verde)
  
  // Status de pedido
  statusConfirmed: '#10B981',     // Confirmado
  statusConfirmedBg: '#D1FAE5',
  statusPending: '#F59E0B',       // Aguardando pagamento
  statusPendingBg: '#FEF3C7',
  statusReady: '#34D399',         // Pronto para retirada
  statusReadyBg: '#A7F3D0',
  statusCancelled: '#EF4444',     // Cancelado
  statusCancelledBg: '#FEE2E2',
  
  // Avaliação
  star: '#F59E0B',           // Âmbar — estrelas
  
  // Bordas e separadores
  border: '#E5E7EB',         // Cinza claro — bordas
  divider: '#F3F4F6',        // Cinza mínimo — separadores
  
  // Info da feira
  fairInfoBg: '#FFF8EC',     // Fundo do card da feira
  fairInfoBorder: '#F59E0B', // Borda do card da feira
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  display: 24,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#2A5C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const layout = {
  screenPaddingH: spacing.md,    // 16px padding horizontal padrão
  headerHeight: 56,
  tabBarHeight: 60,
  cardBorderRadius: radius.lg,
  buttonHeight: 52,
  inputHeight: 48,
  avatarSm: 48,
  avatarMd: 64,
  avatarLg: 96,
};

// Atalhos de uso frequente
export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadow,
  layout,
};

export default theme;
```

---

### Como usar nos componentes

```typescript
import theme from '../theme/tokens';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,  // Creme
    paddingHorizontal: theme.layout.screenPaddingH,
  },
  card: {
    backgroundColor: theme.colors.surface,     // Branco
    borderRadius: theme.layout.cardBorderRadius,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: theme.layout.buttonHeight,
    borderRadius: theme.radius.md,
    ...theme.shadow.button,
  },
  price: {
    color: theme.colors.textPrice,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
});
```

---

*Terra Viva Design System — versão 1.0 — 2026-05-01*
