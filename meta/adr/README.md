# Architecture Decision Records (ADRs)

Este diretório contém os registros de decisões arquiteturais (ADRs) do projeto **Terra Viva**.

## O que é um ADR?

Um ADR (Architecture Decision Record) é um documento que captura uma decisão arquitetural importante, incluindo o contexto que a motivou, as alternativas consideradas e as consequências da escolha.

## Índice de Decisões

### Decisões Ativas

| ADR | Título | Categoria | Data |
|-----|--------|-----------|------|
| [0001](0001-fastapi-python-backend.md) | FastAPI + Python como backend | Stack | 2024-01 |
| [0002](0002-mongodb-database.md) | MongoDB como banco de dados | Dados | 2024-01 |
| [0003](0003-nextjs-app-router.md) | Next.js 15 App Router para frontend web | Stack | 2024-01 |
| [0004](0004-otp-phone-auth.md) | Autenticação por OTP via telefone | Segurança | 2024-01 |
| [0005](0005-unified-docker-deploy.md) | Container unificado para deploy | Operações | 2024-03 |
| [0006](0006-no-roles-system.md) | Sem sistema de roles | Arquitetura | 2025-04 |
| [0007](0007-openai-product-ai.md) | OpenAI para cadastro inteligente de produtos | Stack | 2024-06 |
| [0008](0008-digitalocean-spaces-storage.md) | DigitalOcean Spaces para imagens | Infraestrutura | 2024-01 |
| [0009](0009-monorepo-structure.md) | Monorepo com separação por pasta | Arquitetura | 2024-01 |
| [0010](0010-dual-auth-storage.md) | Dual auth storage (cookie + localStorage) | Segurança | 2024-02 |
| [0011](0011-ssr-publico-csr-privado.md) | SSR para público, CSR para privado | Arquitetura | 2024-02 |
| [0012](0012-tailwind-sem-lib-ui.md) | Tailwind puro sem biblioteca de UI | Stack | 2024-01 |

## Categorias

### Stack Tecnológica
- ADR 0001: FastAPI + Python como backend
- ADR 0003: Next.js 15 App Router
- ADR 0007: OpenAI para cadastro inteligente
- ADR 0012: Tailwind puro sem biblioteca de UI

### Dados e Persistência
- ADR 0002: MongoDB como banco de dados
- ADR 0008: DigitalOcean Spaces para imagens

### Arquitetura
- ADR 0006: Sem sistema de roles
- ADR 0009: Monorepo com separação por pasta
- ADR 0011: SSR para público, CSR para privado

### Segurança
- ADR 0004: Autenticação por OTP via telefone
- ADR 0010: Dual auth storage

### Operações e Deploy
- ADR 0005: Container unificado para deploy

## Como Propor um Novo ADR

1. Copie o [template.md](template.md)
2. Numere sequencialmente (próximo: 0013)
3. Preencha todas as seções
4. Submeta para review

## Documentação Relacionada

- [Visão Geral da Arquitetura](../architecture/system-overview.md)
- [Padrões de Comunicação](../architecture/communication-patterns.md)
- [Documentação geral](../../docs/index.md)
