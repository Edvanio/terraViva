# 2. MongoDB como Banco de Dados

Data: 2024-01

## Status

Aceita

## Contexto

O projeto estava em fase de MVP com schema em constante evolução. Requisitos:
- Flexibilidade para adicionar campos sem migrações
- Perfil do usuário evolui organicamente (bio, foto, pagamento, endereço...)
- Produtos têm campos opcionais variados (cores, IA metadata)
- Sem necessidade de JOINs complexos (dados desnormalizados)
- Budget limitado — precisa de tier gratuito para começar

## Decisão

Usar MongoDB Atlas (cloud managed) com driver pymongo direto (sem ODM). Database `terra_viva` com collections: `users`, `products`, `reservations`, `otp_codes`, `fair_configs`.

## Alternativas Consideradas

### Alternativa 1: PostgreSQL
**Prós**: ACID completo, JOINs, ecossistema maduro, tipagem forte
**Contras**: Schema rígido requer migrações, mais setup para hosting managed
**Razão para rejeição**: Schema do MVP muda semanalmente; migrações seriam overhead

### Alternativa 2: Firebase/Firestore
**Prós**: Serverless, real-time, auth integrado, tier gratuito generoso
**Contras**: Vendor lock-in forte, queries limitadas, preço imprevisível em escala
**Razão para rejeição**: Lock-in no ecossistema Google; queremos controle do backend

## Consequências

### Positivas
- Zero migrações — adicionar campo é apenas `$set`
- MongoDB Atlas tem tier gratuito (512MB) suficiente para MVP
- Documentos JSON mapeiam 1:1 com Pydantic models
- Índice TTL nativo para expiração de OTP codes
- Queries flexíveis sem schema prévio

### Negativas
- Sem transações multi-document (reserva + estoque não é atômico)
- Sem referential integrity (orphan references possíveis)
- Sem JOIN — dados do consumidor/produtor são copiados na reserva
- Performance de aggregation pipelines complexos

## Trade-offs

Priorizamos **flexibilidade de schema e velocidade de iteração** sobre **integridade referencial e ACID**.

## Notas de Implementação

- `backend/database.py` — singleton MongoClient com lru_cache
- Sem ODM (Mongoengine/Motor) — pymongo puro para simplicidade
- Índice unique em `users.phone`
- Índice TTL em `otp_codes.created_at` (300s)
- Cluster: `servercosthml.sb8nc.mongodb.net`

## Revisão

**2026-05**: Decisão válida. Schema evoluiu significativamente sem dor de migrações. Volume de dados ainda baixo (< 1000 docs). Se escalar muito, considerar índices compostos.
