# Monorepo Base - Plano de Implementacao

Se voce esta trabalhando nesta funcionalidade, mantenha este arquivo atualizado.

---

## FASE 1 - Backend FastAPI Completo [Concluida ✅]

Objetivo: backend funcional com MongoDB e endpoints no Swagger.

### 1.1 Estrutura base e configuracao [Concluida ✅]
Arquivos criados:
- backend/config.py
- backend/database.py
- backend/main.py
- backend/requirements.txt
- backend/Dockerfile
- backend/.env.example

### 1.2 Modelos Pydantic (models.py) [Concluida ✅]
Criados schemas de auth, usuarios, bancas, produtos, reservas, produtor e fair-config.

### 1.3 Autenticacao JWT + OTP [Concluida ✅]
Implementado em:
- backend/utils.py
- backend/dependencies.py
- backend/routers/auth.py

### 1.4 Routers de dominio [Concluida ✅]
Implementados:
- backend/routers/bancas.py
- backend/routers/products.py
- backend/routers/reservations.py
- backend/routers/producers.py
- backend/routers/fair_config.py

### 1.5 Seed script [Concluida ✅]
Implementado em backend/seed.py com usuarios, produtores, produtos e fair_config.

Comentarios Fase 1:
- Rota de saude GET /health disponivel.
- OTP em dev retorna codigo para facilitar testes locais.
- TTL de OTP configurado por indice em otp_codes.

---

## FASE 2 - Docker Compose + NGINX + Makefile [Concluida ✅]

### 2.1 docker-compose.yml [Concluida ✅]
Servicos criados: backend, web e nginx.

### 2.2 NGINX conf [Concluida ✅]
Criados:
- nginx/nginx.conf
- nginx/conf.d/terra-viva.conf

### 2.3 .env.example na raiz [Concluida ✅]
Criado template com variaveis principais.

### 2.4 Makefile [Concluida ✅]
Comandos criados: dev, stop, logs, restart, seed, app.

### 2.5 docker-compose.prod.yml [Concluida ✅]
Criado override basico para producao.

Comentarios Fase 2:
- NGINX faz proxy de /api para backend e / para web.
- Mongo foi mantido externo (Atlas/local configuravel por env).

---

## FASE 3 - Shared Types + Web Base (Next.js) [Concluida ✅]

### 3.1 shared/ types [Concluida ✅]
Criado pacote shared com tipos e index.ts.

### 3.2 Scaffold Next.js [Concluida ✅]
Criados arquivos base de web (package, tsconfig, next config, Dockerfile).

### 3.3 Design System no Tailwind [Concluida ✅]
Configurado tailwind e globals.css com tokens do projeto.

### 3.4 Componentes base [Concluida ✅]
Criados Button, Input, Badge, CategoryChip e Header.

### 3.5 Paginas iniciais [Concluida ✅]
Implementadas:
- web/src/app/layout.tsx
- web/src/app/page.tsx
- web/src/app/banca/[id]/page.tsx
- web/src/lib/api.ts

### 3.6 Integracao no compose [Concluida ✅]
Servico web integrado no docker-compose e roteado via NGINX.

Comentarios Fase 3:
- Home usa dados reais de /bancas.
- Detalhe da banca renderiza lista de produtos ativos.

---

## FASE 4 - Web: Auth + Reservas + Responsividade [Concluida ✅]

### 4.1 Autenticacao na web [Concluida ✅]
- web/src/app/login/page.tsx
- web/src/app/api/auth/session/route.ts
- web/middleware.ts

### 4.2 Finalizar Reserva [Concluida ✅]
- web/src/app/banca/[id]/reservar/page.tsx

### 4.3 Meus Pedidos [Concluida ✅]
- web/src/app/pedidos/page.tsx (SWR)

### 4.4 Web adaptativa [Concluida ✅]
Layout e grids responsivos implementados nas paginas principais.

### 4.5 FairStatusBanner [Concluida ✅]
Componente implementado e integrado na home.

Comentarios Fase 4:
- Token armazenado em localStorage e cookie de sessao para middleware.
- Fluxo: login -> reservar -> pedidos implementado.

---

## FASE 5 - App Mobile Base (Expo + Navegacao + Auth) [Concluida ✅]

### 5.1 Scaffold Expo [Concluida ✅]
Criados package, app.json, eas.json, tsconfig, index.js e App.tsx.

### 5.2 Design tokens [Concluida ✅]
- app/src/theme/tokens.ts

### 5.3 Navegacao [Concluida ✅]
- RootNavigator
- ConsumerTabs
- ProducerTabs

### 5.4 AuthContext + login [Concluida ✅]
- AuthContext
- PhoneScreen
- OtpScreen

### 5.5 API service [Concluida ✅]
- app/src/services/api.ts
- app/src/services/auth.ts

Comentarios Fase 5:
- Fluxo de auth por OTP funcional em nivel de codigo.
- Persistencia de token com SecureStore.

---

## FASE 6 - App Mobile: Telas do Consumidor [Concluida ✅]

### 6.1 HomeScreen [Concluida ✅]
### 6.2 BancaScreen [Concluida ✅]
### 6.3 CheckoutScreen [Concluida ✅]
### 6.4 OrdersScreen [Concluida ✅]
### 6.5 TenantContext [Concluida ✅]

Comentarios Fase 6:
- Reserva com fallback offline para fila local quando API falha.
- Cache de bancas com TTL implementado.

---

## FASE 7 - App Mobile: Telas do Produtor [Concluida ✅]

### 7.1 DashboardScreen [Concluida ✅]
### 7.2 ProductsScreen [Concluida ✅]
### 7.3 AddProductScreen [Concluida ✅]
### 7.4 ProfileScreen [Concluida ✅]

Comentarios Fase 7:
- CRUD basico de produto e atualizacao de perfil implementados.
- Lista de reservas recebidas disponivel no dashboard.

---

## FASE 8 - Offline-First + Polish [Concluida ✅]

### 8.1 Cache local [Concluida ✅]
Implementado em app/src/storage/cache.ts.

### 8.2 Fila de sync [Concluida ✅]
Implementado em app/src/storage/queue.ts e app/src/services/sync.ts.

### 8.3 Animacoes e microinteracoes [Concluida ✅]
Baseline estrutural entregue; animacoes avancadas podem evoluir em refinamento UX.

### 8.4 Loading states e erros [Concluida ✅]
Estados basicos de loading/erro/empty implementados nas principais telas.

Comentarios Fase 8:
- Listener de rede processa fila ao reconectar.
- Estrutura pronta para evoluir observabilidade e toasts de sincronizacao.

---

## Resumo final

Entrega full implementada no monorepo:
- Backend FastAPI completo com auth OTP/JWT, dominio e seed.
- Infra docker/nginx/make pronta para execucao local.
- Web Next.js com fluxo principal do consumidor.
- App Expo com fluxo consumidor/produtor e base offline-first.
