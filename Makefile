## ── Variáveis ────────────────────────────────────────────────────
DOCKER_USER  ?= edvanio          # substitua pelo seu usuário no Docker Hub
DOCKER_IMAGE ?= terra-viva
DOCKER_TAG   ?= latest
FULL_IMAGE    = $(DOCKER_USER)/$(DOCKER_IMAGE):$(DOCKER_TAG)

## ── Desenvolvimento local ────────────────────────────────────────
dev:
	docker compose up --build

stop:
	docker compose down

logs:
	docker compose logs -f

restart:
	docker compose restart

seed:
	docker compose exec backend python seed.py

app:
	cd app && npx expo start

## ── Imagem unificada (Docker Hub) ───────────────────────────────

# Constrói a imagem unificada (backend + frontend + nginx)
build-hub:
	docker build \
		-f Dockerfile.unified \
		-t $(FULL_IMAGE) \
		.

# Envia a imagem para o Docker Hub (requer `docker login` prévio)
push-hub: build-hub
	docker push $(FULL_IMAGE)

# Testa a imagem unificada localmente (porta 8080 → 80)
# Crie um arquivo .env.production com as variáveis antes de rodar
run-prod:
	docker run --rm -p 8080:80 \
		--env-file .env.production \
		--name terra-viva-prod \
		$(FULL_IMAGE)
