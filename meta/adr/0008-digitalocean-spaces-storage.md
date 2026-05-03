# 8. DigitalOcean Spaces para Armazenamento de Imagens

Data: 2024-01

## Status

Aceita

## Contexto

O sistema precisa armazenar fotos de perfil e produtos. Requisitos:
- URLs públicas para exibição em `<img>`
- Custo previsível e baixo
- API compatível com S3 (boto3 funciona)
- Mesmo provedor do hosting (simplifica billing)
- CDN para performance

## Decisão

Usar DigitalOcean Spaces (S3-compatible) no endpoint `nyc3.digitaloceanspaces.com`, bucket `dadosbimdoctor`, com pastas `terraviva/profiles/` e `terraviva/products/`.

## Alternativas Consideradas

### Alternativa 1: AWS S3
**Prós**: Líder de mercado, mais features, CDN CloudFront
**Contras**: Pricing complexo, conta AWS separada, billing separado
**Razão para rejeição**: Simplificar billing mantendo tudo na DigitalOcean

### Alternativa 2: Cloudinary
**Prós**: Transformações de imagem on-the-fly, CDN incluso, tier gratuito
**Contras**: Vendor lock-in nas URLs, preço escala com transformações
**Razão para rejeição**: Não precisamos de transformações; URLs simples são suficientes

### Alternativa 3: Armazenamento local (volume Docker)
**Prós**: Sem custo, sem dependência externa
**Contras**: Não escala, perde dados se container reinicia sem volume, sem CDN
**Razão para rejeição**: Não é viável para produção

## Consequências

### Positivas
- $5/mês por 250GB (mais que suficiente)
- API S3 via boto3 (ecossistema maduro)
- URLs públicas diretas (sem proxy necessário)
- CDN incluso no Spaces
- Billing unificado com hosting

### Negativas
- Bucket compartilhado com outro projeto (`dadosbimdoctor`)
- Sem transformação de imagem (resize, crop) — frontend lida
- Região NYC3 (longe do público BR) — CDN mitiga
- Sem backup automático das imagens

## Trade-offs

Priorizamos **simplicidade operacional e custo fixo** sobre **features avançadas de mídia**.

## Notas de Implementação

- `backend/routers/producers.py` — upload via boto3 `put_object`
- Limite: 5MB por arquivo, formatos: jpeg/png/webp/gif
- Filename: UUID gerado no upload (sem colisão)
- URL pública: `https://dadosbimdoctor.nyc3.digitaloceanspaces.com/terraviva/{folder}/{filename}`
- Env vars: `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_ENDPOINT`, `DO_SPACES_BUCKET`

## Revisão

**2026-05**: Decisão válida. Custo baixo, funciona bem. Considerar migrar para bucket dedicado `terraviva` no futuro.
