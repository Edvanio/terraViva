# Terra Viva — Documento de Projeto

> Plataforma digital de feira da agricultura familiar.
> Produtos da colônia, direto para sua mesa.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Problema e Solução](#2-problema-e-solução)
3. [Modelo de Negócio](#3-modelo-de-negócio)
4. [Modelo Multi-Tenant com Parceiros Institucionais](#4-modelo-multi-tenant-com-parceiros-institucionais)
5. [Proposta de Valor](#5-proposta-de-valor)
6. [Público-Alvo](#6-público-alvo)
7. [Fluxo do Usuário](#7-fluxo-do-usuário)
8. [Telas e Funcionalidades](#8-telas-e-funcionalidades)
9. [Arquitetura Técnica](#9-arquitetura-técnica)
10. [API — Endpoints](#10-api--endpoints)
11. [Banco de Dados](#11-banco-de-dados)
12. [Autenticação](#12-autenticação)
13. [Personalização por Instituição (Multi-Tenant)](#13-personalização-por-instituição-multi-tenant)
14. [Indicadores e Dados Estratégicos](#14-indicadores-e-dados-estratégicos)
15. [Estratégia de Expansão](#15-estratégia-de-expansão)
16. [Roadmap de Desenvolvimento](#16-roadmap-de-desenvolvimento)
17. [O que está pronto (MVP Atual)](#17-o-que-está-pronto-mvp-atual)
18. [O que falta construir](#18-o-que-falta-construir)
19. [Stack Tecnológica](#19-stack-tecnológica)
20. [Estrutura de Arquivos do Repositório](#20-estrutura-de-arquivos-do-repositório)

---

## 1. Visão Geral

O **Terra Viva** é uma plataforma digital que conecta produtores da agricultura familiar diretamente aos consumidores locais. Permite a visualização, reserva e retirada de produtos coloniais de forma simples e intuitiva — poucas telas, linguagem acessível, foco em quem tem baixa familiaridade digital.

A proposta é **digitalizar a feira sem perder sua essência**: o app é uma agenda de reservas, não um caixa. O produtor sabe antes da feira o que vai levar. O consumidor chega sabendo o que vai encontrar. O dinheiro troca de mão no momento da retirada, como sempre foi.

O app é **gratuito para o agricultor**. A receita vem de **contratos com instituições parceiras** — prefeituras, secretarias de agricultura, EPAGRI, cooperativas (Sicoob, Sicredi etc.) — que ao assinar recebem a plataforma com a identidade visual da instituição (logo, cores). Sem contrato, o app funciona normalmente com a marca Terra Viva.

---

## 2. Problema e Solução

### O problema

- Feiras locais têm baixa divulgação digital
- Produtores não sabem quanto vão vender na semana
- Desperdício de produção por falta de previsão
- Consumidores têm dificuldade em encontrar produtos coloniais
- Pouco uso de tecnologia no meio rural

### A solução

Uma plataforma onde:

- Cada produtor tem sua **banca digital** — perfil, história, foto, galeria
- Cada produtor informa quais formas de pagamento aceita: dinheiro, Pix, cartão
- Consumidores visualizam os produtos disponíveis e fazem reservas durante a semana
- Na reserva, o consumidor indica como pretende pagar (dentre o que o produtor aceita)
- O pagamento acontece fisicamente na retirada — feira ou casa do produtor
- Interface pensada para públicos com pouca intimidade tecnológica

---

## 3. Modelo de Negócio

### Para o agricultor: gratuito

O produtor cadastra sua banca, seus produtos e recebe pedidos sem pagar nada. Isso elimina a barreira de adoção e garante escala de bancas rapidamente.

### Receita: B2G — Business to Government / Institucional

A plataforma é licenciada para **instituições que representam os produtores ou o território**:

| Tipo de parceiro | Exemplos |
|---|---|
| Secretarias de Agricultura | Municipal, estadual |
| Órgãos de extensão rural | EPAGRI (SC), EMATER (RS/PR), SENAR |
| Cooperativas de crédito | Sicoob, Sicredi |
| Prefeituras | Qualquer município com feira |
| Associações de produtores | APAs, sindicatos rurais |

### Estrutura de cobrança

- Licença por instituição (município ou cooperativa)
- Valor baseado em número de bancas ativas
- Mínimo sugerido: 20 bancas por contrato
- Receita base previsível e recorrente (mensal ou anual)

### Benefícios do modelo

- Receita previsível e recorrente
- Venda institucional (decisão de compra mais simples)
- Escala por cidade: 1 venda = N produtores cobertos
- Forte apelo político e social (agricultura familiar = pauta)
- Produtor não paga = adoção rápida = produto valioso para o parceiro

---

## 4. Modelo de Parceria Institucional (White-Label)

O app **funciona sem nenhum contrato** — qualquer produtor se cadastra, qualquer consumidor usa. A marca padrão é Terra Viva.

Quando uma instituição assina parceria (prefeitura, EPAGRI, cooperativa), ela recebe o app com sua **identidade visual própria**: logo e cores no lugar do padrão Terra Viva. É um white-label leve — o mesmo produto, com a cara do parceiro.

### O que muda com a parceria

| Sem contrato | Com contrato institucional |
|---|---|
| Marca Terra Viva | Logo + cores da instituição parceira |
| Funcional para qualquer cidade | Identidade visual da cidade/órgão |
| Sem painel admin | Painel admin com calendário da feira e dados |
| — | Relatórios de movimentação para o parceiro |

### Como funciona tecnicamente

```
App abre sem contexto
        ↓
Exibe marca Terra Viva (padrão)
        ↓
Prefeitura parceira fornece config de branding
        ↓
App carrega logo + cor da instituição (overlay leve)
        ↓
Mesmos dados, mesma estrutura — visual diferente
```

Não há isolamento de dados por tenant, nem geolocalização obrigatória. A config de branding é opcional e sobreposta ao comportamento padrão.

### Estrutura da config de parceiro

Cada parceiro tem apenas uma config de aparência + calendário:

- `name` — nome exibido (ex: "Feira de São Ludgero")
- `logo_url` — logo da prefeitura ou instituição
- `primary_color` — cor principal da identidade
- `secondary_color` — cor secundária
- `city` — cidade(s) coberta(s)
- `fair_schedule` — dia da semana, horário e local da feira
- `order_window` — janela de pedidos (ex: segunda a sexta, 7h às 18h)

---

## 5. Proposta de Valor

### Para o produtor (agricultor)

- App gratuito — zero barreira de entrada
- Mais visibilidade para sua banca
- Previsibilidade de vendas: sabe antes da feira o que vai vender
- Redução de desperdício de produção
- Conexão direta com o consumidor

### Para o consumidor

- Facilidade de encontrar produtos coloniais locais
- Compra rápida, sem complicação
- Conhece a história do produtor — humanização da venda
- Escolhe como retirar: feira ou sítio

### Para a instituição parceira (EPAGRI / Secretaria / Cooperativa)

- Ferramenta de gestão do território agrícola
- Dados estratégicos sobre produção e consumo local
- Fortalecimento de associados / cooperados
- Modernização dos serviços ao produtor
- Diferencial competitivo com identidade própria na plataforma

### Para o município / prefeitura

- Fortalecimento da economia local
- Valorização da agricultura familiar
- Aumento do movimento da feira
- Modernização do setor rural com custo baixo

---

## 6. Público-Alvo

### Produtores (oferta)

- Agricultores familiares
- Feirantes coloniais
- Produtores de queijo, embutidos, pães, doces, hortaliças
- Perfil: baixa familiaridade digital — interface deve ser extremamente simples

### Consumidores (demanda)

- Moradores locais que frequentam feiras
- Pessoas que buscam produtos artesanais e coloniais
- Público urbano e periurbano de cidades pequenas e médias do Sul do Brasil

### Parceiros institucionais (pagadores)

- EPAGRI (SC) — extensão rural oficial em Santa Catarina
- Secretarias municipais e estaduais de Agricultura
- Cooperativas de crédito: Sicoob, Sicredi
- Associações de produtores rurais

---

## 7. Fluxo do Usuário

### Ciclo semanal da feira

O Terra Viva opera em ciclos — não é um marketplace aberto 24/7. Cada ciclo corresponde a uma feira.

```
SEGUNDA → SEXTA (janela aberta)
  Consumidor reserva produtos
  Produtor acompanha reservas recebidas
  Produtor pode fechar a banca se o estoque esgotar

SÁBADO (dia da feira)
  Produtor sabe o que levar — viu os pedidos da semana
  Consumidor vai buscar e paga na hora
  Ciclo encerra

DOMINGO
  App fica em modo "Próxima feira" até segunda
```

### Produtor (agricultor)

```
1. Baixa o app (gratuito, sem aprovação)
2. Cria perfil da banca (foto, história, galeria)
3. Define formas de pagamento aceitas: Dinheiro / Pix / Cartão
4. Cadastra produtos (nome, preço, foto, descrição)
5. Durante a semana: acompanha reservas recebidas
6. Pode fechar a banca manualmente se estoque acabar
7. No dia da feira ou em casa: entrega e recebe o pagamento
```

### Consumidor

```
1. Abre o app (Terra Viva ou com logo da prefeitura local)
2. Vê bancas abertas e produtos disponíveis
3. Escolhe produto → informa quantidade
4. Vê como o produtor aceita receber (Dinheiro / Pix / Cartão)
5. Informa como pretende pagar
6. Escolhe onde vai retirar: feira ou casa do produtor
7. Confirma a reserva
8. Acompanha em "Meus Pedidos"
9. No dia: vai buscar → paga → pronto
```

### Prefeitura / instituição parceira

```
1. Assina parceria com Terra Viva
2. Recebe painel admin com identidade visual da cidade
3. Configura calendário da feira (dia, horário, janela de pedidos)
4. A janela máxima de pedidos é definida pela prefeitura
5. O produtor pode fechar a banca antes do prazo, se quiser
6. Acompanha dados de movimentação da feira no painel
```

---

## 8. Telas e Funcionalidades

### App do Consumidor

#### Tela 1 — Home (Lista de Bancas)

Objetivo: permitir que o usuário encontre rapidamente um produtor ou produto.

- Listagem de bancas ativas da região
- Filtro por categoria: Todos / Queijos / Pães / Doces / Frios
- Busca por nome do produtor ou produto
- Indicação de bancas ativas
- Cabeçalho com identidade do tenant (ex: "São Ludgero · Feira do Produtor")

#### Tela 2 — Banca do Produtor

Objetivo: apresentar o produtor e seus produtos com confiança e humanização.

- Foto e nome do produtor
- Tempo de atividade ("Família Wessler · Desde 1995")
- Avaliação e número de avaliações
- Descrição / história da banca
- Lista de produtos com foto, nome, peso e preço
- Botão: **Comprar**

#### Tela 3 — Meus Pedidos

Objetivo: substituir o carrinho tradicional por um histórico de compras com status.

- Lista de pedidos realizados
- Status de cada pedido: Confirmado / Aguardando pagamento / Pronto para retirada / Retirado
- Forma de pagamento e local de retirada
- Horário e local da feira
- Total de pedidos do ciclo atual

#### Tela 4 — Finalizar Compra

Objetivo: realizar a reserva em poucos passos. O pagamento não acontece aqui — é um combinado para a retirada.

- Resumo do produto (foto, nome, quantidade, valor total)
- Seção "Como este produtor aceita receber": exibe os métodos cadastrados pelo produtor (Dinheiro / Pix / Cartão)
- Campo "Como você vai pagar": consumidor escolhe um dos métodos disponíveis
- Seção "Onde retirar":
  - Retirar na feira (ex: "Sábado, 8h às 12h · Centro de São Ludgero")
  - Retirar no local do produtor (endereço e horário do produtor)
- Botão: **Confirmar reserva**
- Nota de rodapé: "O pagamento é feito no momento da retirada"

---

### Área do Produtor

#### Tela 5 — Perfil do Produtor

Objetivo: gerar confiança e conexão com o consumidor.

- Foto de perfil e nome do sítio/banca
- Categorias produzidas (ex: Queijos · Frios · Salames)
- Avaliação e número de avaliações
- Distância (ex: "2.5 km · São Ludgero/SC")
- Botão: Editar Perfil
- Galeria de fotos (até 4 imagens)
- Seção "Nossa História" (texto livre)
- Possibilidade de vídeo de apresentação (roadmap)

#### Tela 6 — Cadastro de Produtos

Objetivo: cadastro simples e direto para o agricultor.

- Campo: nome do produto
- Campo: descrição (peso, tipo, características)
- Campo: preço por unidade
- Foto do produto
- Status: Ativo / Inativo (toggle)
- Botão: **+ Adicionar Produto**

#### Tela 7 — Configurações da Banca (no perfil do produtor)

Objetivo: o produtor define como quer receber o pagamento.

- Seção "Formas de pagamento que aceito":
  - ☑ Dinheiro
  - ☑ Pix (chave exibida para o consumidor na retirada)
  - ☐ Cartão (quando disponível na feira)
- Chave Pix (opcional, exibida no resumo do pedido para facilitar o pagamento)
- Endereço do sítio / casa (para retirada direta, se o produtor oferecer)

---

## 9. Arquitetura Técnica

### Visão geral

```
┌─────────────────────────────────────┐
│   React Native + Expo (iOS/Android) │
│   App do Consumidor + App Produtor  │
└──────────────────┬──────────────────┘
                   │ HTTPS / REST
                   │ JWT Auth
                   │
┌──────────────────┴──────────────────┐
│     Python + FastAPI (Backend API)  │
│  · Rotas REST                       │
│  · Autenticação JWT + OTP           │
│  · Config de branding por cidade    │
│  · Validação Pydantic               │
└──────────────────┬──────────────────┘
                   │ pymongo
                   │
┌──────────────────┴──────────────────┐
│        MongoDB Atlas (Cloud DB)     │
│  Collections:                       │
│  users · producers · products       │
│  reservations · fair_configs        │
│  otp_codes                          │
└─────────────────────────────────────┘
```

### Componentes do Backend (FastAPI)

| Módulo | Arquivo | Responsabilidade |
|---|---|---|
| Configuração | `config.py` | Variáveis de ambiente (MongoDB URL, JWT secret, CORS) |
| Banco de dados | `database.py` | Conexão e instância do MongoDB |
| Modelos | `models.py` | Schemas Pydantic para request/response |
| Utilitários | `utils.py` | JWT, OTP, formatação de telefone, envio SMS |
| Rotas | `main.py` | Todos os endpoints REST |

### Componentes do App (React Native)

| Módulo | Arquivo | Responsabilidade |
|---|---|---|
| Navegação | `App.tsx` | Stack e Tab Navigator, rotas por papel do usuário |
| Contexto de Auth | `AuthContext.tsx` | Estado de login, OTP, logout |
| Serviço de API | `services/api.ts` | Cliente axios com interceptors |
| Serviço de Auth | `services/auth.ts` | Token storage, login/logout |
| Tipos | `types.ts` | Interfaces TypeScript (User, Banca, Product, Reservation) |

---

## 10. API — Endpoints

### Autenticação (OTP por celular)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/request-otp` | Solicita código OTP via SMS | Não |
| POST | `/auth/verify-otp` | Verifica OTP e retorna JWT | Não |
| GET | `/me` | Dados do usuário logado | Sim |

### Bancas (Produtores)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| GET | `/bancas` | Lista todas as bancas ativas | Não |
| GET | `/bancas/{id}` | Detalhes da banca + produtos | Não |

### Produtos

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| POST | `/products` | Cria produto (só produtor) | Sim |
| PUT | `/products/{id}` | Atualiza produto | Sim |

### Reservas

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| POST | `/reservations` | Cria reserva (só consumidor) | Sim |
| GET | `/reservations` | Lista minhas reservas (consumidor) | Sim |
| GET | `/producer/reservations` | Reservas recebidas (produtor) | Sim |

### Perfil do Produtor

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| POST | `/producer/profile` | Cria perfil do produtor | Sim |
| PUT | `/producer/profile` | Atualiza perfil | Sim |

### Config da Feira (Branding + Calendário)

| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| GET | `/fair-config?city={cidade}` | Retorna branding + calendário da cidade (ou null) | Não |
| POST | `/fair-config` | Cria config de parceiro (admin) | Sim |
| PUT | `/fair-config/{id}` | Atualiza config de parceiro (admin) | Sim |

### Health

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/health` | Verificação de saúde da API |

---

## 11. Banco de Dados

### Coleções atuais

#### `users`
```json
{
  "_id": "ObjectId",
  "phone": "string (único)",
  "name": "string",
  "role": "consumer | producer",
  "created_at": "datetime"
}
```

#### `otp_codes` (TTL: 5 minutos)
```json
{
  "_id": "ObjectId",
  "phone": "string",
  "code": "string (6 dígitos)",
  "name": "string",
  "role": "consumer | producer",
  "created_at": "datetime"
}
```

#### `producers`
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "bio": "string",
  "photo_url": "string",
  "gallery": ["string"],
  "city": "string",
  "phone": "string",
  "created_at": "datetime"
}
```

#### `products`
```json
{
  "_id": "ObjectId",
  "producer_id": "string",
  "name": "string",
  "price": "float",
  "description": "string",
  "photo_url": "string",
  "is_active": "boolean",
  "created_at": "datetime"
}
```

#### `reservations`
```json
{
  "_id": "ObjectId",
  "consumer_id": "string",
  "product_id": "string",
  "producer_id": "string",
  "product_name": "string",
  "quantity": "int",
  "total_price": "float",
  "pickup_location": "feira | produtor",
  "status": "pending | confirmed | collected | cancelled",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Campos a adicionar nas coleções existentes

#### `producers` — adicionar campos de pagamento e localização
```json
{
  "payment_methods": ["cash", "pix", "card"],
  "pix_key": "string (opcional, exibida no pedido)",
  "address": "string (endereço do sítio, para retirada direta)"
}
```

#### `reservations` — adicionar intenção de pagamento e local de retirada
```json
{
  "payment_intent": "cash | pix | card",
  "pickup_location": "feira | produtor"
}
```

> **Nota:** `pickup_location` já existe no modelo atual. `payment_intent` é o novo campo.

### Coleção a criar: configuração de parceiro institucional

#### `fair_configs`
```json
{
  "_id": "ObjectId",
  "name": "string (ex: Feira de São Ludgero)",
  "city": "string",
  "logo_url": "string",
  "primary_color": "string (#hex)",
  "secondary_color": "string (#hex)",
  "fair_day": "string (ex: saturday)",
  "fair_start_time": "string (ex: 08:00)",
  "fair_end_time": "string (ex: 12:00)",
  "fair_location": "string (endereço da feira)",
  "order_window_open": "string (ex: monday 07:00)",
  "order_window_close": "string (ex: friday 18:00)",
  "contact_email": "string",
  "active": "boolean",
  "created_at": "datetime"
}
```

> Esta coleção **não isola dados** — é apenas configuração de branding e calendário. Sem ela, o app usa os padrões Terra Viva.

---

## 12. Autenticação

O sistema usa **OTP por celular** — sem senha, sem e-mail.

**Por quê?** Agricultores não querem lembrar de senha. Celular é o que eles têm.

### Fluxo de autenticação

```
1. Usuário informa número de celular
2. Backend gera código de 6 dígitos (TTL 5 min)
3. Código enviado por SMS (Twilio / AWS SNS em produção)
4. Em desenvolvimento: código exibido no console
5. Usuário digita o código
6. Backend valida, cria usuário se novo, retorna JWT
7. JWT armazenado no dispositivo (Expo SecureStore)
8. Token expira em 30 minutos (configurável)
```

### Token JWT

- Algoritmo: HS256
- Expiração: 30 minutos
- Armazenamento: Expo SecureStore (criptografado no dispositivo)
- Enviado no header: `Authorization: Bearer {token}`

### Roles

| Role | Acesso |
|---|---|
| `consumer` | Navegar bancas, fazer reservas, ver pedidos |
| `producer` | Gerenciar banca, produtos, ver pedidos recebidos |
| `admin` (a criar) | Painel do parceiro institucional, relatórios |

---

## 13. Personalização por Parceiro Institucional

### Princípio

O app Terra Viva funciona sem nenhum parceiro. O contrato institucional agrega **identidade visual** e **configuração da feira** — não cria uma instância separada, não isola dados, não muda a lógica.

É um white-label leve: mesma base, aparência personalizada.

### Como o branding é carregado

O app faz uma chamada a `GET /fair-config?city={cidade}` na abertura. Se existir uma config ativa para aquela cidade, carrega logo e cores do parceiro. Se não existir, usa os padrões Terra Viva. Sem geolocalização obrigatória — o usuário pode informar a cidade manualmente ou o app usa a localização do dispositivo como sugestão.

### O que é personalizado com o contrato

| Elemento | Padrão (sem contrato) | Com parceiro |
|---|---|---|
| Logo no cabeçalho | Terra Viva | Logo da prefeitura / instituição |
| Cor primária | Verde Terra Viva | Cor da identidade do parceiro |
| Nome da feira | "Terra Viva" | "Feira de São Ludgero" |
| Calendário da feira | Não configurado | Dia, horário e local definidos |
| Janela de pedidos | Sempre aberta | Segunda a sexta, ex. 7h–18h |
| Painel admin | Não existe | Disponível para o parceiro |

### Painel admin do parceiro (MVP mínimo)

O que o parceiro precisa ver para que o contrato faça sentido:

- Configurar logo, cores e nome da feira
- Definir dia, horário e local da feira
- Configurar janela de pedidos (abertura e fechamento)
- Ver total de reservas da semana
- Ver quais bancas estão ativas

Relatórios avançados e exportação ficam para fases futuras.

---

## 14. Indicadores e Dados Estratégicos

A plataforma gera dados que se tornam um grande diferencial para os parceiros institucionais:

| Indicador | Utilidade para o parceiro |
|---|---|
| Valor total negociado | Demonstra impacto econômico do programa |
| Número de pedidos | Mede adoção e engajamento |
| Produtos mais vendidos | Orienta extensão rural e capacitação |
| Desempenho por produtor | Identifica quem precisa de suporte |
| Produtores mais ativos | Reconhecimento e incentivo |
| Impacto econômico local | Argumento político para renovação do contrato |
| Ticket médio | Evolução da renda do agricultor |

Esses dados são apresentados no painel administrativo do tenant e podem ser exportados para relatórios de prestação de contas.

---

## 15. Estratégia de Expansão

### Fase de validação

1. Iniciar com 1 município piloto (São Ludgero/SC ou similar)
2. Validar com 20+ produtores reais
3. Medir engajamento de consumidores
4. Coletar feedback de uso

### Fase de escala

2. Apresentar resultados para EPAGRI regional e Sicoob
3. Fechar contratos por microrregião
4. Replicar modelo sem alteração de código (apenas novo tenant)
5. Expandir para outros estados (PR, RS)

### Critérios de priorização de territórios

- Cidades com feira do produtor ativa
- Presença da EPAGRI ou extensão rural
- Cooperativa de crédito como potencial parceiro
- Produção colonial diversificada (queijos, pães, doces, frios)

---

## 16. Roadmap de Desenvolvimento

### ✅ MVP (concluído)

- Autenticação por celular + OTP
- Listagem de bancas
- Visualização de produtos
- Reserva de produto (consumidor)
- Visualização de reservas (consumidor e produtor)
- Perfil do produtor
- Cadastro de produtos

### Fase 2 — Lançamento Real (1–2 meses)

- [ ] Campo `payment_methods` no perfil do produtor (Dinheiro / Pix / Cartão)
- [ ] Campo `payment_intent` na reserva (consumidor escolhe baseado no que o produtor aceita)
- [ ] Ciclo da feira: janela de pedidos com abertura e fechamento configuráveis
- [ ] Status da feira na home: "Aberta para reservas até sexta" / "Próxima feira: sábado 8h"
- [ ] Coleção `fair_configs` no banco (branding + calendário por cidade)
- [ ] Endpoint `GET /fair-config` retorna config da cidade se existir
- [ ] App carrega branding do parceiro se houver config ativa
- [ ] Painel admin mínimo: configurar calendário + ver reservas da semana
- [ ] Upload de fotos (produto e produtor)
- [ ] Envio de OTP por SMS real (Twilio)
- [ ] Deploy em produção (Railway + Expo EAS)

### Fase 3 — Engajamento (2–4 meses)

- [ ] Avaliações e comentários dos consumidores
- [ ] Notificações push (pedido confirmado, pronto para retirada)
- [ ] Filtros e busca avançada
- [ ] Status de pedido em tempo real
- [ ] Produtor confirma/recusa pedido com justificativa
- [ ] Histórico de vendas para o produtor
- [ ] Relatórios básicos para o parceiro

### Fase 4 — Dados e Expansão (4–8 meses)

- [ ] Dashboard analítico completo por tenant
- [ ] Exportação de relatórios (PDF/CSV)
- [ ] Chat integrado produtor–consumidor
- [ ] Integração Pix nativo (via intermediário ou banco parceiro)
- [ ] Geolocalização do produtor no mapa
- [ ] Vídeo de apresentação na banca do produtor
- [ ] Sugestão de produtos por histórico do consumidor
- [ ] App web (versão browser para consumidor)

---

## 17. O que está pronto (MVP Atual)

O repositório `terra-viva/` contém um MVP funcional com:

### Backend (`backend/`)

- API REST em Python + FastAPI
- MongoDB como banco de dados
- Autenticação por OTP (código no console em dev)
- JWT para sessões
- CRUD de: usuários, bancas, produtos, reservas, perfil do produtor
- Documentação automática em `/docs` (Swagger UI)

### App (`app/`)

- React Native + Expo (iOS e Android)
- Tela de login com OTP
- Listagem de bancas
- Detalhe da banca com produtos
- Fluxo de reserva
- Tela "Meus Pedidos"
- Tela do Produtor
- Contexto de autenticação com SecureStore
- Navegação por role (consumidor/produtor)

---

## 18. O que falta construir

Itens críticos para o lançamento real, em ordem de prioridade:

| Prioridade | Item | Impacto |
|---|---|---|
| 🔴 Alta | Formas de pagamento no perfil do produtor | Fluxo de negócio correto |
| 🔴 Alta | Intenção de pagamento na reserva | Combinado claro antes da retirada |
| 🔴 Alta | Ciclo da feira (janela de pedidos + status na home) | Coração do produto |
| 🔴 Alta | Upload de fotos de produtos e produtores | App não funciona sem foto |
| 🔴 Alta | SMS real (Twilio) | Autenticação funcional em produção |
| 🔴 Alta | Deploy em produção (Railway + Expo EAS) | Tornar o app acessível |
| 🟡 Média | Config de branding por cidade (`fair_configs`) | Necessário para fechar contrato com prefeitura |
| 🟡 Média | Painel admin mínimo (calendário + reservas) | Entrega de valor para o parceiro |
| 🟡 Média | Notificações push (nova reserva para o produtor) | Produtor não precisa checar manualmente |
| 🟢 Baixa | Avaliações de produtores | Confiança e engajamento |
| 🟢 Baixa | Dashboard analítico completo | Valor para o parceiro (fase 3+) |
| 🟢 Baixa | Chat produtor–consumidor | Comunicação direta |

---

## 19. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| App mobile | React Native + Expo | Expo 50 / RN 0.73 |
| Navegação | React Navigation | v6 |
| HTTP client | Axios | v1.6 |
| Storage seguro | Expo SecureStore | v13 |
| Backend | Python + FastAPI | FastAPI 0.104 |
| Banco de dados | MongoDB Atlas | Cloud (M0 grátis) |
| Driver MongoDB | PyMongo | v4.6 |
| Autenticação | JWT (python-jose) + OTP | HS256 / 30min |
| Hash de senha | passlib[bcrypt] | — |
| Validação | Pydantic v2 | — |
| Servidor HTTP | Uvicorn | v0.24 |
| Deploy backend | Railway | — |
| Deploy app | Expo EAS Build | — |
| SMS (produção) | Twilio ou AWS SNS | A contratar |

---

## 20. Estrutura de Arquivos do Repositório

```
terra-viva/
│
├── backend/                    # API Python + FastAPI
│   ├── main.py                 # Todos os endpoints REST
│   ├── models.py               # Schemas Pydantic (request/response)
│   ├── config.py               # Configurações via .env
│   ├── database.py             # Conexão MongoDB
│   ├── utils.py                # JWT, OTP, helpers
│   ├── requirements.txt        # Dependências Python
│   ├── .env                    # Segredos (não versionar)
│   ├── .env.example            # Modelo de configuração
│   └── test_connection.py      # Teste de conexão com o banco
│
├── app/                        # App Mobile React Native + Expo
│   ├── App.tsx                 # Navegação raiz + Auth Provider
│   ├── app.json                # Configuração Expo
│   ├── package.json            # Dependências Node
│   ├── babel.config.js
│   └── src/
│       ├── screens/
│       │   ├── AuthScreen.tsx          # Login por OTP
│       │   ├── HomeScreen.tsx          # Lista de bancas
│       │   ├── BancaDetailScreen.tsx   # Detalhe da banca
│       │   ├── ReservationScreen.tsx   # Tela de compra
│       │   ├── MyReservationsScreen.tsx# Meus pedidos
│       │   └── ProducerScreen.tsx      # Área do produtor
│       ├── context/
│       │   └── AuthContext.tsx         # Estado de autenticação
│       ├── services/
│       │   ├── api.ts                  # Cliente axios
│       │   └── auth.ts                 # Login, token, logout
│       └── types.ts                    # Interfaces TypeScript
│
├── docs/
│   └── API.md                  # Documentação dos endpoints
│
├── README.md                   # Início rápido
├── SETUP.md                    # Setup detalhado
├── DEVELOPMENT.md              # Arquitetura e padrões
├── TESTING.md                  # Como testar com OTP no console
└── MONGODB_SETUP.md            # Configuração do MongoDB Atlas
```

---

*Terra Viva — Produtos da colônia, direto para sua mesa.*
*Versão do documento: 2026-05-01 — revisado após análise de fluxo de negócio*
