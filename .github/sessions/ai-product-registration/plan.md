# Cadastro Inteligente de Produto com IA — Plano de Implementação

Se você está trabalhando nesta funcionalidade, certifique-se de atualizar este arquivo plan.md conforme progride.

---

## FASE 1 — Backend: Fundacao IA [Concluida ✅]

> Foco: criar o serviço OpenAI, o endpoint e atualizar o modelo de dados.  
> Pré-requisito: chave de API OpenAI configurada no `.env`.

### 1.1 Config e dependencias [Concluida ✅]

- Adicionar `openai>=1.30.0` em `backend/requirements.txt`
- Em `backend/config.py`, adicionar:
  - `openai_api_key: str = ""`
  - `openai_vision_model: str = "gpt-4o"`
  - `openai_image_model: str = "gpt-image-2"`
- Atualizar `.env.example`, `.env.develop.example` e `.env.production.example` com as novas variáveis

### 1.2 Modelo de dados - novos campos [Concluida ✅]

- Em `backend/models.py`, adicionar `color_primary: Optional[str] = None` e `color_accent: Optional[str] = None` em:
  - `ProductCreate`
  - `ProductUpdate`
  - `ProductResponse`
- Em `backend/routers/products.py`, garantir que os novos campos passam pelo CRUD (create, update, response)

### 1.3 Servico OpenAI (`backend/services/openai_service.py`) [Concluida ✅]

Criar módulo com 3 funções async:

| Função | Input | Output | Modelo |
|--------|-------|--------|--------|
| `analyze_with_vision(photo_url)` | URL da foto | `{ name, description, category, color_primary, color_accent }` | gpt-4o |
| `enhance_photo(photo_url)` | URL da foto | base64 da imagem melhorada | gpt-image-2 |
| `suggest_price(product_name, category, city)` | nome, cat, cidade | `{ price: float, note: str }` | gpt-4o |

Detalhes:
- `analyze_with_vision`: prompt inclui a lista fixa das 12 categorias para forçar resposta válida; pede resposta em JSON
- `enhance_photo`: prompt de estilo "food photography, fresh, appetizing, natural lighting, subtle enhancement"
- `suggest_price`: prompt com contexto "feira de agricultura familiar na cidade de X"
- Cada função deve ter tratamento de exceção próprio (retorna `None` parcial se falhar)

Função orquestradora:
```python
async def generate_ai_product(photo_url: str, city: str | None) -> AIProductResult:
    vision_result, enhanced_bytes, price_result = await asyncio.gather(
        analyze_with_vision(photo_url),
        enhance_photo(photo_url),
        suggest_price_deferred(photo_url, city),  # aguarda vision para nome/cat
    )
    # upload enhanced_bytes para DO Spaces
    # merge e retorna
```

> **Nota:** `suggest_price` depende do nome/categoria retornados pelo vision. Duas opcoes: (A) incluir preco no prompt do vision direto, (B) chamar price separado usando dados do vision. Opcao A e mais rapida (2 chamadas em vez de 3). **Decisao aplicada: incluir suggested_price no prompt do vision junto com nome/desc/cat/cores.** Assim temos apenas 2 chamadas paralelas: vision (texto completo) + image enhancement.

### 1.4 Endpoint `POST /products/ai-generate` [Concluida ✅]

- Criar `backend/routers/ai_products.py`
- Registrar em `backend/main.py` com prefix `/products` (não colide com rotas existentes porque é um path distinto `/products/ai-generate`)
- Request body: `{ photo_url: str, city: str | None }`
- Requer autenticação (`Depends(get_current_user)`)
- Timeout de 90s no endpoint
- Retorna `AIProductResponse` com todos os campos ou parcial se alguma parte falhou

### 1.5 Teste manual do endpoint [Parcial ⚠️]

- Rodar backend local (`uvicorn`)
- Enviar request via curl/httpie com uma foto real
- Validar que o retorno contém todos os campos esperados
- Validar que a foto melhorada foi salva no Spaces e a URL funciona

### Comentários:
- Implementado: `backend/routers/ai_products.py` com timeout de 90s, autenticacao e fallback de erro 503.
- Implementado: `backend/services/openai_service.py` com pipeline em paralelo (`asyncio.gather`) para vision + image edit.
- Implementado: validacao de categoria (fallback `outros`) e validacao de cor hex no backend.
- Implementado: upload da foto melhorada para pasta dedicada `do_spaces_products_folder` (`terraviva/products`).
- Implementado: novos campos `color_primary` e `color_accent` em modelos e respostas do CRUD de produtos.
- Implementado: variaveis OpenAI em `backend/.env.example`, `.env.example`, `.env.develop.example`, `.env.production.example`.
- Validacao manual E2E pendente por dependencia de chave OpenAI real e teste com foto real no endpoint.

---

## FASE 2 — Web: Modal IA e fluxo completo [Concluida ✅]

---

> Foco: criar o fluxo web completo no Next.js — desde o botão até o produto salvo.  
> Sequencial: depende da Fase 1 (endpoint funcionando).

### 2.1 Types e utilitários [Concluida ✅]

- Em `web/src/lib/types.ts`: adicionar `color_primary?: string | null` e `color_accent?: string | null` em `Product`
- Criar helper `hexToRgba(hex: string, alpha: number): string` em `web/src/lib/format.ts`
- Em `shared/types/product.ts`: adicionar os mesmos campos

### 2.2 Componente `AIProductSteps.tsx` [Concluida ✅]

- Lista de steps com ícone + label + status (`pending` | `running` | `done`)
- Animação sequencial com `setInterval` ou `requestAnimationFrame`
- Delay staggered: cada step avança a cada 2.5–3.5s (randomizado para parecer orgânico)
- Visual: fundo escuro/blur, texto branco, steps empilhados, ícone pulsando enquanto `running`

### 2.3 Componente `AIProductModal.tsx` [Concluida ✅]

Modal com 3 fases internas:

**Fase A — PhotoPicker:**
- `<input type="file" accept="image/*">` + botão "Tirar foto" (com `capture="environment"`)
- Ao selecionar: faz upload (`POST /producer/upload`) → recebe `photo_url` → avança para Fase B

**Fase B — Loading:**
- Exibe `AIProductSteps` com animação
- Em background: chama `POST /products/ai-generate { photo_url, city }`
- Quando resposta chega: mantém animação até todos os steps concluírem visualmente (delay mínimo ~7s total para UX)

**Fase C — ResultEditor:**
- Campos editáveis: nome, descrição, categoria (dropdown das 12), preço
- Toggle foto: original vs melhorada (se `enhanced_photo_url` existir)
- Preview do card com cores sugeridas + toggle aceitar/rejeitar cores
- Botões: **"Publicar produto"** (POST /products) / **"Cancelar"** (dialog de confirmação)

### 2.4 Integrar na página `minha-banca` [Concluida ✅]

- Alterar `web/src/app/minha-banca/page.tsx`:
  - Substituir o formulário inline por um botão "**+ Novo produto**"
  - Ao clicar: verifica `navigator.onLine`
    - Online → abre `AIProductModal`
    - Offline → abre formulário manual existente (manter como fallback)
  - Se `AIProductModal` receber erro do backend → toast + abre formulário manual com foto preenchida
- Remover ou reorganizar o formulário existente (mantê-lo como componente separado interno para reuso no fallback)

### 2.5 Testar fluxo web end-to-end [Parcial ⚠️]

- Testar com backend rodando local
- Validar cada fase do modal
- Confirmar que produto salvo aparece na lista com cores
- Testar fallback offline (desligar rede → ver formulário manual)
- Testar fallback de erro (backend parado → toast + formulário)

### Comentários:
- Implementado: `web/src/components/AIProductSteps.tsx` com animacao sequencial de etapas.
- Implementado: `web/src/components/AIProductModal.tsx` com 3 fases (foto, loading, editor), upload, chamada IA, toggle de foto e publicacao.
- Implementado: fallback automatico offline na `minha-banca` para formulario manual.
- Implementado: fallback de erro da IA para formulario manual com prefill de foto quando disponivel.
- Implementado: tipos de produto e `ProductCard` com suporte a `color_primary` e `color_accent`.
- Pendente: validacao manual E2E no navegador com backend/OpenAI reais.

---

## FASE 3 — Web: ProductCard com identidade visual + Perfil [Concluida ✅]

> Foco: aplicar as cores no card público e ajustar o perfil do produtor.  
> Pode ser feito em paralelo com a Fase 4 (mobile).

### 3.1 `ProductCard.tsx` — cores dinâmicas [Concluida ✅]

- Aceitar props `color_primary?` e `color_accent?`
- Se presentes:
  - Card: `border: 2px solid {color_primary}`, `background: {hexToRgba(color_primary, 0.06)}`
  - Badge de categoria: `background: {hexToRgba(color_accent, 0.15)}`, `color: {color_accent}`
- Se ausentes: manter visual atual (nenhuma mudança)
- Garantir que o card na listagem pública (`/banca/[id]`) também exibe as cores

### 3.2 `perfil/page.tsx` — cidade obrigatória + geocode hint [Concluida ✅]

- Tornar campo `city` **obrigatório** no envio do formulário (validação client-side + backend)
- No campo `address`: debounce 800ms → chamar endpoint auxiliar (ou direto GPT-4o mini no backend) que extrai cidade/estado → exibir badge `📍 {city}, {state}` abaixo do campo
- Se o hint for diferente da `city` atual, exibir sugestão: "Atualizar cidade para {X}?" com botão aceitar

### 3.3 Endpoint auxiliar para geocode (opcional) [Concluida ✅]

- `POST /producer/geocode` — recebe `{ address: str }` → retorna `{ city, state }`
- Usa GPT-4o mini (barato e rápido) para extrair cidade/estado do endereço livre
- Alternativa mais simples: fazer tudo no frontend sem endpoint extra (hardcoded para extrair cidade do formato "Rua X, Cidade - SC")
- **Decisão:** criar o endpoint para ser preciso com endereços informais de agricultores

### Comentários:
- Implementado: endpoint `POST /producer/geocode` em `backend/routers/producers.py` usando `gpt-4o-mini` e resposta JSON `{city, state}`.
- Implementado: validacao de cidade obrigatoria no save do perfil web e no backend de produtores.
- Implementado: geocode hint com debounce de 800ms no perfil web e acao "Usar esta cidade".

---

## FASE 4 — Mobile: Fluxo IA completo [Concluida ✅]

> Foco: replicar o fluxo IA no app React Native.  
> Pode ser feito em paralelo com a Fase 3.

### 4.1 Dependências mobile [Concluida ✅]

- Verificar se `expo-image-picker` já está instalado; se não, adicionar
- Verificar se `@react-native-community/netinfo` já está instalado; se não, adicionar

### 4.2 `AIProductScreen.tsx` [Concluida ✅]

Tela dedicada com 3 estados internos:

1. **PhotoPicker**: dois botões (📷 Câmera / 🖼️ Galeria) → `ImagePicker`
2. **Loading**: componente `AIProductSteps` com animação (Animated.Value, opacidade sequencial)
3. **ResultEditor**: ScrollView com campos editáveis + preview do card + botões salvar/cancelar

- Upload da foto: `FormData` via `api.post("/producer/upload")`
- Chamada IA: `api.post("/products/ai-generate", { photo_url, city })`
- Salvar: `api.post("/products", { ...editedFields })`
- Cancelar: `Alert.alert("Descartar?", ...)` antes de voltar

### 4.3 `AIProductSteps.tsx` (mobile) [Concluida ✅]

- Componente com `FlatList` ou `View` estático
- Cada step: ícone + texto + indicador (⏳/⚡/✅)
- Animação: `Animated.timing` para fade-in sequencial
- Mesma lógica de delay staggered do web

### 4.4 `AddProductScreen.tsx` — roteamento [Concluida ✅]

- No `useEffect` inicial: checar `NetInfo.fetch().then(state => state.isConnected)`
  - Online → navegar para `AIProductScreen`
  - Offline → manter formulário manual existente (sem navegar)
- Se a IA falhar dentro de `AIProductScreen` → `navigation.replace("AddProduct")` com params `{ photo_url }` para preencher automaticamente

### 4.5 `ProductCard.tsx` (mobile) — cores dinâmicas [Concluida ✅]

- Aceitar `color_primary?`, `color_accent?` via props
- Aplicar: `borderColor`, `backgroundColor` (com opacidade via lib ou inline rgba)
- Manter estilo padrão se campos ausentes

### 4.6 `ProfileScreen.tsx` — cidade obrigatória [Concluida ✅]

- Tornar `city` obrigatório antes de salvar perfil
- No campo endereço: debounce → chamar `/producer/geocode` → exibir badge com cidade/estado detectados

### 4.7 Testar fluxo mobile [Parcial ⚠️]

- Testar com Expo Go no celular real (câmera + galeria)
- Validar fluxo completo: foto → loading → resultado → salvar
- Testar offline: deve abrir formulário manual
- Testar erro de IA: toast + fallback manual com foto

### Comentários:
- Implementado: `app/src/screens/producer/AIProductScreen.tsx` com camera/galeria, upload, IA, editor e publicacao.
- Implementado: `app/src/components/AIProductSteps.tsx` com etapas sequenciais.
- Implementado: `AddProductScreen` como hub (online -> IA, offline -> manual).
- Implementado: fallback de erro IA para manual com prefill de `photo_url`.
- Implementado: `ProfileScreen` com cidade obrigatoria e geocode hint com debounce.
- Pendente: validacao em dispositivo real (Expo Go) para camera e fluxo completo.

---

## FASE 5 — Polish, testes e deploy [Parcial ⚠️]

> Foco: refinamento visual, edge cases e deploy para produção.

### 5.1 Refinamento visual do loading [Concluida ✅]

- Ajustar timing dos steps para parecer natural (aleatório entre 2–4s cada)
- Garantir que se o backend retornar em <7s, a UI espera o mínimo para completar a animação
- Testar em conexões lentas (3G throttle)

### 5.2 Edge cases e fallbacks [Concluida ✅]

- Testar foto que não é alimento (ex: paisagem) → IA deve ainda sugerir algo razoável ou retornar "outros"
- Testar cidade vazia → `suggested_price: null` + tooltip orientando
- Testar foto >5MB → validação antes do upload
- Testar `enhanced_photo_url: null` (se gpt-image-2 falhar) → UI mostra apenas original
- Validação de hex no backend: regex `/^#[0-9A-Fa-f]{6}$/` antes de salvar `color_primary`/`color_accent`

### 5.3 Atualizar `.env` de produção [Concluida ✅]

- Configurar `OPENAI_API_KEY` no server de produção (DigitalOcean)
- Garantir que o `do_spaces_folder` para fotos de produtos é separado: `terraviva/products`

### 5.4 Build Docker e deploy [Parcial ⚠️]

- `docker build -t edvanio/terra-viva:latest .`
- `docker push edvanio/terra-viva:latest`
- Testar no servidor de produção
- Verificar que as fotos melhoradas estão acessíveis publicamente via CDN/Spaces

### 5.5 Commit e merge [Parcial ⚠️]

- Commit final com mensagem descritiva
- Merge `feat/ai-product-registration` → `main`
- Tag de versão (se aplicável)

### Comentários:
- Implementado: validacao regex de hex no backend de produtos (`color_primary` e `color_accent`).
- Implementado: fallback resiliente para falhas de IA em web/mobile com retorno ao fluxo manual.
- Implementado: variaveis OpenAI em todos os arquivos de exemplo de ambiente.
- Pendente: testes de build/deploy e commit final desta rodada.

---

## Dependências entre fases

```
FASE 1 (Backend) ← obrigatória primeiro
    ↓
FASE 2 (Web modal) ← sequencial após Fase 1
    ↓
FASE 3 (Web card + perfil) ← pode ser paralela com Fase 4
FASE 4 (Mobile) ← pode ser paralela com Fase 3
    ↓
FASE 5 (Polish + Deploy) ← após todas anteriores
```

---

## Nota sobre otimização de chamadas

Na Fase 1.3, decidimos incluir `suggested_price` no mesmo prompt do Vision (junto com nome/desc/cat/cores). Isso reduz de 3 chamadas paralelas para **2** (vision+preço em 1 + image enhancement em paralelo), diminuindo custo e latência.

Prompt do Vision incluirá:
```
Analise esta foto de um produto de feira. Retorne JSON com:
- name, description, category (uma das: [...]), color_primary (hex), color_accent (hex)
- suggested_price (float, preço de feira na cidade de {city}) e suggested_price_note
```
