# 1. FastAPI + Python como Backend

Data: 2024-01

## Status

Aceita

## Contexto

O Terra Viva precisava de um backend que:
- Integrasse nativamente com OpenAI SDK (Python-first)
- Permitisse prototipagem rápida para MVP
- Fosse leve o suficiente para rodar em droplet barato
- Tivesse suporte a async para I/O (MongoDB, upload de imagens)

O diferencial do produto é o cadastro via IA — a linguagem do backend precisava ter o melhor ecossistema para isso.

## Decisão

Usar Python 3.11 com FastAPI como framework web (ASGI), pymongo para MongoDB, e python-jose para JWT.

## Alternativas Consideradas

### Alternativa 1: Node.js + Express
**Prós**: Mesma linguagem do frontend (TypeScript), ecossistema npm rico, performance I/O
**Contras**: SDK OpenAI menos maduro na época, mais boilerplate para validação
**Razão para rejeição**: Ecossistema Python para IA é superior; FastAPI tem validação nativa via Pydantic

### Alternativa 2: Django
**Prós**: Framework completo (ORM, admin, auth), comunidade grande
**Contras**: Pesado para API simples, ORM não se aplica a MongoDB, overhead desnecessário
**Razão para rejeição**: FastAPI é mais leve e performático para API REST pura

## Consequências

### Positivas
- Integração nativa com OpenAI SDK (vision, image generation)
- Validação automática via Pydantic models
- Documentação OpenAPI gerada automaticamente
- Async nativo para operações I/O
- Deploy leve (~50MB container)

### Negativas
- Dois runtimes no projeto (Python + Node.js)
- Shared types não compilam entre backend e frontend
- Menor pool de devs fullstack (precisa saber Python E TypeScript)

## Trade-offs

Priorizamos **ecossistema de IA e velocidade de prototipagem** sobre **unificação de linguagem** no monorepo.

## Notas de Implementação

- `backend/requirements.txt` — dependências
- `backend/main.py` — app FastAPI com CORS e routers
- `backend/config.py` — pydantic-settings para env vars tipadas
- Sem ORM — pymongo direto (MongoDB não precisa de ORM)

## Revisão

**2026-05**: Decisão permanece válida. A integração com OpenAI (Vision + Image) é fluida e justifica a escolha.
