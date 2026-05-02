# Context — Cadastro Inteligente de Produto com IA

**Feature slug:** `ai-product-registration`  
**Branch:** `feat/ai-product-registration`  
**Data:** 2026-05-02  
**Status:** Aguardando aprovação

---

## Por que está sendo construído

O Terra Viva atende agricultores familiares, muitas vezes com pouca intimidade digital. O cadastro atual de produtos exige que o produtor preencha manualmente nome, descrição, categoria, foto e preço — uma barreira de entrada real para quem não tem prática. A ideia é transformar esse processo em algo mágico e quase automático: o produtor tira uma foto e a IA faz o resto.

**Frase-guia:** *"Você tira a foto. A gente cuida do anúncio."*

---

## Objetivo

Criar um fluxo de cadastro de produto assistido por IA que:
1. Aceita foto da galeria ou câmera
2. Usa OpenAI para gerar nome, descrição, categoria, paleta de cores e sugestão de preço
3. Melhora a foto visualmente (mais apetitosa, fresca, vibrante)
4. Apresenta resultado em modal step-by-step animado e tecnológico
5. Permite edição de todos os campos antes de confirmar
6. Salva produto com identidade visual própria (cores no card)
7. Confirma antes de descartar trabalho

Implementado simultaneamente em **Web (Next.js)** e **Mobile (React Native + Expo)**.

---

## Resultado esperado

### Experiência do produtor (fluxo completo)

> O fluxo com IA **é sempre o padrão**. O produtor nunca precisa escolher entre "IA" ou "manual" — ele simplesmente cadastra um produto. A IA acontece por baixo. O formulário manual aparece **apenas como fallback automático quando o dispositivo está offline**.

```
[Botão "+ Novo produto"]
        ↓
[Escolher foto] ←→ [Tirar foto] 
        ↓
[Modal animado — etapas sequenciais]
  ✅ Foto importada
  🔍 Identificando o produto...
  ✍️  Gerando nome e descrição...
  🏷️  Escolhendo a categoria...
  🎨  Definindo identidade visual...
  📸  Melhorando a foto...
  💰  Sugerindo o preço para sua região...
        ↓
[Tela de resultado editável]
  - Nome (editável)
  - Descrição (editável)  
  - Categoria (editável, dropdown)
  - Foto original ← → Foto melhorada pela IA (escolha do produtor)
  - Paleta de cores sugerida (preview no card, aceitar/recusar)
  - Preço sugerido (editável, com tooltip de disclaimer)
  - Preview do card como ficará na banca
        ↓
[Confirmar] → Produto salvo
[Cancelar] → Dialog de confirmação → Descarta ou volta
```

---

## Escopo detalhado

### 1. Foto
- Web: `<input type="file" accept="image/*" capture="environment">` — abre galeria ou câmera conforme dispositivo
- Mobile: `expo-image-picker` com opções galeria/câmera
- Upload da foto original para DO Spaces (fluxo existente via `POST /producer/upload`)
- Melhoria via `gpt-image-2` (Image Edits endpoint): prompt instrui a tornar a imagem mais apetitosa, fresca, iluminada, estilo food photography profissional

### 2. Análise por IA (GPT-4o Vision + gpt-image-2)
Novo endpoint: `POST /products/ai-generate`

Recebe: `{ photo_url: string, city: string }`

Retorna:
```json
{
  "name": "Queijo Colonial Curado",
  "description": "Feito artesanalmente com leite fresco da fazenda...",
  "category": "queijos",
  "color_primary": "#D4A853",
  "color_accent": "#8B5E3C",
  "suggested_price": 28.00,
  "enhanced_photo_url": "https://..."
}
```

**Pipeline interno do endpoint:**
1. Baixa a foto do Spaces (ou recebe base64)
2. Chama GPT-4o Vision → JSON estruturado com nome, descrição, categoria, cores sugeridas (hex)
3. Chama `gpt-image-2` edit → retorna foto melhorada → faz upload para Spaces → retorna URL
4. Chama GPT-4o texto → sugere preço baseado em `city` e tipo de produto
5. Retorna tudo em resposta única

**Chamadas em paralelo:** passos 2 e 3 podem ser paralelos (independentes). Passo 4 pode ser paralelo com 3.

### 3. Modelo de dados — novos campos

`ProductCreate` / `ProductUpdate` / `ProductResponse`:
```python
color_primary: Optional[str] = None   # hex, ex: "#D4A853"
color_accent: Optional[str] = None    # hex, ex: "#8B5E3C"
```

`Product` (types.ts no web):
```ts
color_primary?: string | null
color_accent?: string | null
```

### 4. ProductCard com identidade visual

- Recebe `color_primary` e `color_accent` como props opcionais
- Se presentes: borda colorida (2px, `color_primary`), fundo suave (`color_primary` + `15` alpha), emoji do categoria no badge com fundo `color_accent`
- Se ausentes: comportamento atual (sem quebra)
- Afeta: `web/src/components/ProductCard.tsx` e `app/src/components/ProductCard.tsx`

### 5. Cidade no perfil

- Campo `city` já existe na UI — mas deve ser **destacado e obrigatório** na criação inicial
- Novo comportamento: ao digitar no campo `address` (endereço), debounce 800ms → GPT-4o extrai cidade/estado → exibe badge informativo `📍 Jaçanã, SC` (apenas leitura, não substitui o campo)
- `city` é pré-requisito para sugestão de preço; se ausente no perfil, o endpoint retorna `suggested_price: null` com mensagem orientando completar o perfil

---

## Restrições e premissas

| Item | Decisão |
|------|---------|
| API OpenAI | Chave configurada via env `OPENAI_API_KEY` (será fornecida pelo usuário) |
| Modelos usados | `gpt-4o` para texto/vision, `gpt-image-2` para edição de imagem |
| Custo por cadastro | ~$0.20–0.50 (estimativa: 1 chamada vision + 1 edit de imagem) |
| Timeout | Pipeline IA pode levar até 60s — exibir animação de progresso, não travar a UI |
| Fluxo padrão | IA sempre, sem opção de escolha para o produtor — a mágica acontece automaticamente |
| Fallback offline | Se `navigator.onLine === false` (web) ou `NetInfo.isConnected === false` (mobile) ao clicar em "+ Novo produto", abre direto o formulário manual |
| Fallback IA falhou | Se a chamada ao backend retornar erro após o upload da foto, exibe toast de erro + abre formulário manual com a foto já preenchida |
| Foto melhorada | Salva no mesmo bucket DO Spaces, pasta `products/` |
| Plataforma | Web + Mobile simultâneo |
| Propriedade editorial | O produtor sempre vê e aprova antes de publicar |

---

## Dependências

- `openai` Python SDK (`pip install openai`)
- `expo-image-picker` (já pode estar no projeto mobile — verificar)
- Nenhuma dependência nova no frontend web (usa APIs nativas do browser)
- Chave de API OpenAI no `.env` backend

---

## Como será testado

- [ ] Upload de foto de alimento qualquer → verificar que retorno tem todos os campos
- [ ] Foto com iluminação ruim → verificar que foto melhorada está notavelmente melhor
- [ ] Categoria sugerida bate com as 12 categorias existentes (sem inventar)
- [ ] Cores geradas são válidas em hex e visualmente coerentes com o produto
- [ ] Offline → clicar em "+ Novo produto" → abre formulário manual diretamente (sem tentativa de IA)
- [ ] Online mas IA falhou → toast de erro → formulário manual abre com foto já preenchida
- [ ] Botão cancelar → dialog aparece → "Sim, descartar" → fecha sem salvar
- [ ] Produção com `city` vazia no perfil → `suggested_price: null`, campo de preço vazio mas editável
- [ ] Produto salvo aparece no card com as cores da IA
- [ ] Card sem `color_primary/accent` continua visual normal (regressão)
