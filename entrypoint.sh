#!/bin/sh
set -e

# ─── Encerra todos os processos filhos ao receber SIGTERM/SIGINT ───
cleanup() {
  echo "[entrypoint] Encerrando processos..."
  kill "$NGINX_PID" "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait
  exit 0
}
trap cleanup TERM INT

# ─── Frontend (Next.js standalone) ────────────────────────────────
echo "[entrypoint] Iniciando frontend (Next.js)..."
NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1 node /app/web/server.js &
FRONTEND_PID=$!

# ─── Backend (Uvicorn / FastAPI) ──────────────────────────────────
echo "[entrypoint] Iniciando backend (Uvicorn)..."
cd /app/backend
uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2 &
BACKEND_PID=$!

# ─── Aguarda backend estar pronto ─────────────────────────────────
echo "[entrypoint] Aguardando backend ficar disponível..."
for i in $(seq 1 30); do
  if wget -q -O- http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "[entrypoint] Backend pronto."
    break
  fi
  sleep 1
done

# ─── nginx ────────────────────────────────────────────────────────
echo "[entrypoint] Iniciando nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo "[entrypoint] Todos os processos iniciados. nginx=$NGINX_PID backend=$BACKEND_PID frontend=$FRONTEND_PID"

# Aguarda qualquer processo encerrar; se um cair, derruba tudo
wait -n 2>/dev/null || wait
echo "[entrypoint] Um processo encerrou — encerrando container."
cleanup
