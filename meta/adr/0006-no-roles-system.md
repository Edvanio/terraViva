# 6. Sem Sistema de Roles

Data: 2025-04

## Status

Aceita

## Contexto

Inicialmente o sistema tinha roles explícitos (consumer/producer/admin). Problemas observados:
- Usuários não entendiam "se tornar produtor" — barreira de conversão
- O conceito de "role" adicionava complexidade desnecessária ao fluxo
- Na prática, qualquer pessoa na feira pode vender
- Não há necessidade de aprovação ou moderação no MVP
- A distinção consumer/producer criava UX confuso (middleware gates, redirect chains)

## Decisão

Remover completamente o conceito de roles. Todo usuário é igual. Um usuário "é produtor" (aparece como banca) automaticamente quando tem ≥1 produto ativo. Sem admin — produtores se auto-gerenciam.

## Alternativas Consideradas

### Alternativa 1: Manter roles (consumer/producer/admin)
**Prós**: Controle de acesso, separação clara de responsabilidades
**Contras**: Fricção de conversão, UX complexo, gates desnecessários
**Razão para rejeição**: Barreira para começar a vender é inaceitável para o público

### Alternativa 2: Roles com auto-promoção silenciosa
**Prós**: Mantém controle interno sem fricção visível
**Contras**: Complexidade no backend, campo role sem utilidade real
**Razão para rejeição**: Complexidade sem benefício — se é automático, para que ter?

## Consequências

### Positivas
- Zero fricção para começar a vender (cadastra produto → aparece)
- Código mais simples (sem middleware de role, sem guards)
- UX linear (perfil → produto → banca aparece)
- Menos coleções no MongoDB (sem `producers` separado)

### Negativas
- Sem controle de quem pode vender (qualquer um pode)
- Sem admin para moderar conteúdo
- Sem diferenciação de permissões
- Difícil adicionar moderação futuramente

## Trade-offs

Priorizamos **zero fricção e simplicidade** sobre **controle e moderação**. Aceitável para comunidade pequena onde todos se conhecem (feira local).

## Notas de Implementação

- `backend/routers/bancas.py` — filtra users com products ativos (sem check de role)
- `web/src/app/minha-banca/page.tsx` — gate por `profile.name` (não por role)
- Perfil salvo diretamente em `users` collection (sem `producers` separado)
- JWT não contém role — apenas `sub` (user_id) e `phone`

## Revisão

**2026-05**: Decisão válida para contexto de feira local. Se expandir para múltiplas cidades com produtores desconhecidos, reconsiderar moderação.
