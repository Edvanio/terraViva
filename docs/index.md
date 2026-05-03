# Documentação — Terra Viva

## Visão Geral

**Terra Viva** é uma feira digital que conecta agricultores familiares diretamente a consumidores locais. O sistema digitaliza feiras físicas já existentes, permitindo que produtores cadastrem seus produtos (inclusive com IA) e que consumidores reservem itens para retirada no dia da feira.

O projeto é um **monorepo** com backend (FastAPI), frontend web (Next.js), app mobile (React Native/Expo) e tipos compartilhados (TypeScript).

## Documentação Disponível

### Arquitetura e Stack
- [Stack Tecnológica](stack.md) — Tecnologias, frameworks e ferramentas
- [Padrões de Design](patterns.md) — Padrões arquiteturais e de código

### Funcionalidades e Regras
- [Funcionalidades](features.md) — Descrição das funcionalidades principais
- [Regras de Negócio](business-rules.md) — Regras de negócio implementadas

### Integrações e APIs
- [Integrações](integrations.md) — Comunicação com serviços externos
- [Especificação de APIs](apis.md) — Endpoints, contratos e exemplos

## Links Rápidos

| Item | Valor |
|------|-------|
| Repositório | GitHub (privado) |
| Produção | https://terra-viva-3n3ko.ondigitalocean.app |
| Deploy | DigitalOcean App Platform (auto-deploy branch `main`) |
| Banco de Dados | MongoDB Atlas (DigitalOcean Managed) |
| Storage (arquivos) | DigitalOcean Spaces (`dadosbimdoctor`) |

## Ambiente de Desenvolvimento

```bash
# Pré-requisitos: Docker + Docker Compose
docker compose up --build

# Acessos locais:
#   Web:     http://localhost (nginx → Next.js)
#   API:     http://localhost/api (nginx → FastAPI)
#   Backend: http://localhost:8000 (direto)
```

## Estrutura do Monorepo

```
terraVivaDev/
├── backend/        → FastAPI + PyMongo (Python 3.11)
├── web/            → Next.js 15 App Router (TypeScript)
├── app/            → React Native + Expo (TypeScript)
├── shared/         → Tipos TypeScript compartilhados
├── nginx/          → Reverse proxy (configuração)
├── deploy/         → Docker Compose para produção
└── docs/           → Esta documentação
```
