# Documentação do Terra Viva

## Visão Geral

**Terra Viva** é um marketplace de agricultura familiar que conecta produtores rurais diretamente a consumidores da feira de São Ludgero/SC. O sistema funciona como um mecanismo de **reserva** — o consumidor escolhe produtos pelo app web, reserva, e retira presencialmente na feira.

O diferencial principal é o **cadastro inteligente de produtos via IA**: o produtor fotografa o produto e a IA (GPT-4O Vision) preenche automaticamente nome, descrição, categoria, cores e preço sugerido.

**Status**: Piloto com 2-5 produtores e ~50 consumidores.

## Documentação Disponível

### Arquitetura e Stack
- [Stack Tecnológica](stack.md) — Tecnologias, frameworks e ferramentas utilizadas
- [Padrões de Design](patterns.md) — Padrões arquiteturais e de código

### Funcionalidades e Regras
- [Funcionalidades](features.md) — Descrição das funcionalidades principais
- [Regras de Negócio](business-rules.md) — Regras de negócio implementadas

### Integrações
- [Integrações](integrations.md) — Comunicação com serviços externos

### APIs
- [Especificação de APIs](apis.md) — Endpoints, contratos e exemplos

## Links Rápidos

| Item | URL |
|------|-----|
| Produção | https://terra-viva-3n3ko.ondigitalocean.app |
| Repositório | https://github.com/Edvanio/terraViva |
| Branch de deploy | `develop` (auto-deploy via DO App Platform) |
| Banco de dados | MongoDB Atlas (cluster `servercosthml`) |
| Storage de imagens | DigitalOcean Spaces (`dadosbimdoctor/terraviva/`) |

## Ambiente de Desenvolvimento

```bash
# Subir tudo com Docker Compose
docker-compose up --build

# Acessar
# Web: http://localhost:3000
# API: http://localhost:8000
# OTP padrão (dev): 123456
```

## Documentação Legada (referência histórica)

- [ARQUITETURA.md](ARQUITETURA.md)
- [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)
- [FLUXO-APP.md](FLUXO-APP.md)
- [PLANEJAMENTO-UX.md](PLANEJAMENTO-UX.md)
- [TERRA-VIVA-PROJETO.md](TERRA-VIVA-PROJETO.md)
