# 7. OpenAI para Cadastro Inteligente de Produtos

Data: 2024-06

## Status

Aceita

## Contexto

Produtores rurais têm dificuldade em:
- Escrever descrições de produtos (baixa fluência digital)
- Definir preço competitivo (não sabem o que outros cobram)
- Categorizar corretamente
- Tirar fotos com boa apresentação

O diferencial do Terra Viva é **facilitar ao máximo** o cadastro. Se o produtor só precisa tirar uma foto, a adoção aumenta drasticamente.

## Decisão

Usar GPT-4o Vision para analisar foto do produto e sugerir automaticamente: nome, descrição, categoria, cores dominantes e preço de referência. Opcionalmente, usar geração de imagem para versão aprimorada da foto.

## Alternativas Consideradas

### Alternativa 1: Cadastro manual apenas
**Prós**: Sem custo de API, sem dependência externa
**Contras**: Barreira alta para público com baixa fluência digital
**Razão para rejeição**: Público-alvo não consegue preencher formulários complexos

### Alternativa 2: Google Cloud Vision
**Prós**: Mais barato por request, labels e OCR bons
**Contras**: Não gera texto descritivo, não sugere preços, menos criativo
**Razão para rejeição**: Não resolve o problema completo (precisa de geração de texto)

### Alternativa 3: Modelo local (CLIP/BLIP)
**Prós**: Sem custo por request, privacidade, offline
**Contras**: Qualidade inferior, precisa de GPU, complexidade de deploy
**Razão para rejeição**: Qualidade do GPT-4o Vision é muito superior para nosso caso

## Consequências

### Positivas
- Produtor cadastra produto com 1 foto (experiência "mágica")
- Descrições consistentes e bem escritas
- Preço sugerido baseado em contexto regional
- Categorização automática correta
- Diferencial competitivo do produto

### Negativas
- Custo por request (~$0.01-0.05 por análise de imagem)
- Dependência de API externa (indisponibilidade = feature quebrada)
- Latência de 3-8s por request
- Sugestões podem estar erradas (precisa revisão humana)

## Trade-offs

Priorizamos **experiência do usuário e diferenciação de produto** sobre **custo operacional e independência de terceiros**.

## Notas de Implementação

- `backend/routers/ai_products.py` — endpoint `POST /products/ai-generate`
- Modelos: `gpt-4o` (vision), `gpt-image-1` (geração de imagem)
- Timeout: 90s para OpenAI calls
- Fallback: HTTP 503 se IA indisponível (app funciona sem, cadastro manual)
- Prompt inclui contexto da cidade para preços regionais
- Resposta: JSON com name, description, category, colors, price, price_note

## Revisão

**2026-05**: Feature central validada. Produtores adoram. Custo controlado (poucos cadastros/dia). Considerar cache de análises similares se volume crescer.
