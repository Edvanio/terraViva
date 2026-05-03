# Documentação do Terra Viva

## Visão Geral

O **Terra Viva** é uma plataforma digital comunitária que conecta produtores rurais a consumidores locais, funcionando como a "feira digital" de São Ludgero/SC. Consumidores navegam pelas bancas dos produtores, reservam produtos online e retiram na feira física presencial.

O diferencial principal é o **cadastro inteligente de produtos via IA**: o produtor fotografa o produto e a IA (GPT-4o Vision) preenche automaticamente nome, descrição, categoria, cores e preço sugerido.

**Status**: Em produção estável na DigitalOcean.  
**Modelo**: Comunitário, gratuito. Sem painel admin — produtores se autogerenciam. Pagamentos são combinados presencialmente ou via WhatsApp (não há gateway de pagamento).

## Estrutura do Monorepo

```
terraVivaDev/
├── backend/          → API REST (FastAPI + Python 3.11 + MongoDB)
├── web/              → PWA responsivo (Next.js 15 + Tailwind)
├── app/              → App mobile (React Native + Expo 52)
├── shared/           → Tipos TypeScript compartilhados
├── nginx/            → Configuração de proxy reverso
├── deploy/           → Docker Compose para DigitalOcean
├── docs/             → Esta documentação
├── Dockerfile        → Build multi-stage (container único)
├── entrypoint.sh     → Orquestra backend + frontend + nginx
└── docker-compose.yml → Dev local
```

## Documentação Disponível

### Arquitetura e Stack
- [Stack Tecnológica](stack.md) — Tecnologias, frameworks e ferramentas
- [Padrões de Design](patterns.md) — Padrões arquiteturais e de código

### Funcionalidades e Regras
- [Funcionalidades](features.md) — Funcionalidades principais e secundárias
- [Regras de Negócio](business-rules.md) — Regras, validações e políticas

### APIs e Integrações
- [Especificação de APIs](apis.md) — Endpoints, autenticação e exemplos
- [Integrações](integrations.md) — Serviços externos e dependências

## Links Rápidos

| Item | Valor |
|------|-------|
| Produção | https://terra-viva-3n3ko.ondigitalocean.app |
| Repositório | https://github.com/Edvanio/terraViva |
| Branch deploy | `main` (auto-deploy via DO App Platform) |
| Branch desenvolvimento | `develop` |
| Banco de dados | MongoDB Atlas (DigitalOcean Managed) |
| Storage de imagens | DigitalOcean Spaces (S3-compatible) |
| IA | OpenAI GPT-4o Vision + DALL-E 2 |

## Ambientes

| Ambiente | Descrição | Config |
|----------|-----------|--------|
| **Produção** | Container único na DO App Platform | `.do/app.yaml` + envs no painel DO |
| **Dev local** | Docker Compose com mesmo MongoDB Atlas | `.envdev` + `docker-compose.yml` |

## Fluxo de Deploy

```
develop → PR → main → DigitalOcean auto-deploy
```

O deploy gera um único container Docker com:
- **nginx** (:80) — proxy reverso, serve static e roteia `/api/` → backend, `/` → frontend
- **uvicorn** (:8000) — FastAPI backend com 2 workers
- **node** (:3000) — Next.js standalone SSR
