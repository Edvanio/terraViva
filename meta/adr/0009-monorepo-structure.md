# 9. Monorepo com Separação por Pasta

Data: 2024-01

## Status

Aceita

## Contexto

O Terra Viva tem 4 componentes: backend Python, frontend web Next.js, app mobile Expo, e tipos compartilhados TypeScript. Equipe de 1 pessoa. Requisitos:
- Iteração rápida (mudança no backend + frontend no mesmo commit)
- Simplicidade de setup (um `git clone`)
- Sem overhead de tooling (turborepo, nx, lerna)
- Docker Compose para dev local

## Decisão

Monorepo simples com separação por pasta na raiz: `backend/`, `web/`, `app/`, `shared/`, `nginx/`, `deploy/`, `docs/`, `meta/`. Sem build system formal para shared types.

## Alternativas Consideradas

### Alternativa 1: Repos separados
**Prós**: Isolamento total, CI/CD independente, permissões granulares
**Contras**: Overhead de manutenção, sync entre repos, versioning de shared types
**Razão para rejeição**: Uma pessoa gerencia tudo; repos separados adicionam complexidade sem benefício

### Alternativa 2: Monorepo com Turborepo/Nx
**Prós**: Build caching, task orchestration, dependency graph
**Contras**: Complexidade de configuração, overkill para 1 dev, não funciona bem com Python
**Razão para rejeição**: Python + TypeScript no mesmo monorepo formal é complexo; overhead não justifica

## Consequências

### Positivas
- Um `git clone` = tudo disponível
- `docker-compose up` sobe tudo
- Mudança frontend + backend no mesmo PR/commit
- Shared types acessíveis sem publish/install
- Documentação junto do código

### Negativas
- Shared types não são validados/compilados automaticamente no backend
- Build do web não depende formalmente do shared (cópia manual de tipos)
- CI/CD rebuilda tudo mesmo quando só docs mudou
- Sem tree-shaking entre pacotes

## Trade-offs

Priorizamos **simplicidade e velocidade de iteração** sobre **isolamento e build system formal**.

## Notas de Implementação

```
terraVivaDev/
├── backend/     → Python, independente
├── web/         → Next.js, package.json próprio
├── app/         → Expo, package.json próprio
├── shared/      → TypeScript types (reference manual)
├── nginx/       → Configs de proxy
├── deploy/      → Docker configs de produção
├── docs/        → Documentação
└── meta/        → ADRs e arquitetura
```

- Cada pasta tem seu próprio gerenciador de deps (pip, npm)
- Docker Compose orquestra em dev
- Dockerfile unificado para prod

## Revisão

**2026-05**: Decisão válida. Funciona bem para equipe pequena. Se adicionar mais devs, considerar CI/CD com path-based triggers.
