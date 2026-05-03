# 5. Container Unificado para Deploy

Data: 2024-03

## Status

Aceita

## Contexto

O Terra Viva roda em DigitalOcean (droplet ou App Platform). Requisitos:
- Deploy simples (uma pessoa gerencia)
- Custo mínimo (um container = um droplet barato)
- Sem orquestrador (K8s é overkill)
- Backend, frontend e proxy precisam funcionar juntos

## Decisão

Criar uma imagem Docker unificada contendo backend (FastAPI/uvicorn), frontend (Next.js standalone), e nginx (proxy reverso). Supervisord gerencia os 3 processos. Entrypoint faz health-check do backend antes de iniciar nginx.

## Alternativas Consideradas

### Alternativa 1: 3 containers separados + docker-compose em prod
**Prós**: Isolamento, escala independente, restart individual
**Contras**: Mais complexo de operar, 3x recursos mínimos, orquestração necessária
**Razão para rejeição**: Overkill para volume atual; um droplet de $6/mês resolve

### Alternativa 2: Serverless (Vercel + Lambda)
**Prós**: Zero ops, auto-scale, tier gratuito
**Contras**: Cold starts, vendor lock-in, custo imprevisível com IA
**Razão para rejeição**: Backend com upload de imagem + OpenAI não se encaixa bem em serverless

### Alternativa 3: DO App Platform com Dockerfile separado por serviço
**Prós**: Managed, auto-deploy
**Contras**: Mais caro ($7/container × 3), configuração mais complexa
**Razão para rejeição**: Container único custa 1/3 do preço

## Consequências

### Positivas
- Deploy = `docker pull && docker run` (ou git push para auto-deploy)
- Custo mínimo (~$6-12/mês)
- Uma imagem, um endpoint, um health-check
- Comunicação interna via localhost (sem rede entre containers)

### Negativas
- Não escala horizontalmente (3 processos no mesmo container)
- Restart de um processo reinicia tudo
- Build mais lento (multi-stage com 2 runtimes)
- Logs misturados (supervisord precisa separar)

## Trade-offs

Priorizamos **simplicidade operacional e custo mínimo** sobre **escalabilidade e isolamento**.

## Notas de Implementação

- `Dockerfile` — multi-stage: Python deps → Node build → runner com supervisord
- `supervisord.conf` — gerencia uvicorn, node, nginx
- `entrypoint.sh` — espera backend responder /health antes de iniciar nginx
- `Makefile` — `build-hub`, `push-hub`, `run-prod`
- `deploy/docker-compose.digitalocean.yml` — config de produção

## Revisão

**2026-05**: Decisão válida para volume atual. Se precisar escalar (>100 req/s), separar em containers distintos com load balancer.
