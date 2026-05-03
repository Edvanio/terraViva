# 4. Autenticação por OTP via Telefone

Data: 2024-01

## Status

Aceita

## Contexto

O público-alvo do Terra Viva são produtores rurais e consumidores de feiras orgânicas no Sul de SC. Características:
- Muitos têm baixa fluência digital
- Todos têm WhatsApp (canal universal)
- Memorizar senhas é barreira significativa
- Email não é usado pelo público rural mais velho
- Simplicidade é prioridade absoluta

## Decisão

Autenticação sem senha via OTP (One-Time Password) de 6 dígitos enviado por telefone. JWT com validade de **360 dias** (`ACCESS_TOKEN_EXPIRE_MINUTES=518400`). Em dev, código fixo `123456`.

## Alternativas Consideradas

### Alternativa 1: Email + Senha
**Prós**: Padrão da indústria, não depende de terceiros
**Contras**: Público não usa email, exige "esqueci senha", mais fricção
**Razão para rejeição**: Público rural não tem hábito de email; barreira de entrada alta

### Alternativa 2: OAuth social (Google/Facebook)
**Prós**: Login com 1 clique, sem senha
**Contras**: Depende de conta Google/Facebook, público pode não ter
**Razão para rejeição**: Nem todos têm conta Google; adiciona complexidade desnecessária

### Alternativa 3: Magic Link por SMS
**Prós**: Sem digitar código
**Contras**: Custo de SMS, link pode não abrir no navegador correto
**Razão para rejeição**: OTP é mais simples de implementar e mais familiar

## Consequências

### Positivas
- Zero fricção — só precisa do número de WhatsApp
- Não precisa memorizar nada
- Criação automática de conta no primeiro login
- 360 dias de sessão = praticamente nunca precisa re-autenticar

### Negativas
- Dependência futura de WhatsApp Business API (custo) para envio real
- Em dev usa código fixo (não testável em prod sem API de envio)
- Sem 2FA adicional — quem tem acesso ao WhatsApp tem acesso à conta
- OTP de 6 dígitos tem janela de 5 minutos (segurança limitada)

## Trade-offs

Priorizamos **acessibilidade e zero fricção** sobre **segurança robusta**. Aceitável para marketplace de feira (baixo valor transacional).

## Notas de Implementação

- `backend/routers/auth.py` — `request-otp` e `verify-otp`
- `backend/utils.py` — `generate_otp()`, `create_access_token()`
- Collection `otp_codes` com índice TTL de 300s
- `DEV_OTP_DEFAULT=123456` para ambiente de desenvolvimento
- JWT payload: `{sub: user_id, phone, exp}`
- Token expira em 518400 min (360 dias) — trade-off consciente: público rural usa a plataforma esporadicamente (1x/semana), re-login frequente causaria abandono

## Revisão

**2026-05**: Decisão válida. OTP fixo funciona para dev/staging. Para produção real com volume, será necessário integrar WhatsApp Business API ou SMS gateway.
