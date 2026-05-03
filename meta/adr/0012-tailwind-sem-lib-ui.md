# 12. Tailwind Puro sem Biblioteca de UI

Data: 2024-01

## Status

Aceita

## Contexto

O Terra Viva conecta produtores rurais e consumidores em feiras orgânicas. A identidade visual precisa transmitir:
- Natureza, terra, orgânico — paleta verde/marrom
- Simplicidade e acolhimento — público rural/comunitário
- Emojis como ícones — linguagem visual do WhatsApp que o público já usa
- Diferenciação de apps corporativos genéricos

Bibliotecas de UI como shadcn, Material UI ou Chakra têm estética própria, tendendo ao corporativo/minimalista.

## Decisão

Usar **Tailwind CSS puro** com design tokens customizados em `tailwind.config.ts`. Sem bibliotecas de componentes pré-fabricados. Emojis usados no lugar de ícones SVG.

```ts
// Design tokens principais (tailwind.config.ts)
colors: {
  primary: { DEFAULT: '#2E7D32', light: '#4CAF50', dark: '#1B5E20' },
  earth: { DEFAULT: '#795548', light: '#A1887F', dark: '#4E342E' },
  cream: '#FFF8E1',
  leaf: '#81C784',
}
```

## Alternativas Consideradas

### Alternativa 1: shadcn/ui + Tailwind
**Prós**: Componentes acessíveis prontos, estilizável via Tailwind
**Contras**: Estética base neutra/corporate, precisa customizar pesado
**Razão para rejeição**: Personalização necessária anularia a vantagem de usar componentes prontos

### Alternativa 2: Material UI (MUI)
**Prós**: Ecossistema enorme, componentes maduros
**Contras**: Bundle pesado, look Google, difícil customizar profundamente
**Razão para rejeição**: Estética incompatível com identidade orgânica/rural

### Alternativa 3: Chakra UI
**Prós**: API elegante, theming flexível
**Contras**: Mais uma dependência, menos popular que MUI
**Razão para rejeição**: Adiciona camada sobre Tailwind que já resolve o problema

## Consequências

### Positivas
- Identidade visual única e reconhecível (verde orgânico + terra)
- Emojis como ícones = familiaridade para público de WhatsApp
- Controle total sobre cada pixel
- Sem dependência de versionamento de lib de UI
- Bundle leve (Tailwind = apenas classes usadas)

### Negativas
- Componentes precisam ser criados do zero
- Sem acessibilidade (a11y) built-in — precisa implementar manualmente
- Mais trabalho para componentes complexos (modais, dropdowns)
- Sem documentação centralizada de componentes

### Neutras
- Design tokens centralizados em `tailwind.config.ts`
- Componentes vivem em `web/src/components/` e `app/src/components/`

## Trade-offs

Priorizamos **identidade visual única e controle** sobre **produtividade e acessibilidade built-in**. Aceitável para app de comunidade rural com componentes relativamente simples.

## Notas de Implementação

- `web/tailwind.config.ts` — paleta orgânica, borderRadius arredondados, sombras suaves
- `web/src/styles/globals.css` — utilitários globais com `@apply`
- `web/src/components/` — componentes web customizados (BancaCard, ProductCard, etc.)
- `app/src/theme/tokens.ts` — tokens compartilhados com React Native
- Emojis usados em headers, cards e botões: 🥬 🍅 🌿 📦 🛒

## Revisão

**2026-05**: Decisão válida. A identidade orgânica diferencia o app e o público se identifica. Para componentes mais complexos futuros (data picker, autocomplete), considerar shadcn pontualmente.
