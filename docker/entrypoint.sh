#!/bin/sh
# DeliveryHub — entrypoint de produção
set -e

export DATABASE_URL="${DATABASE_URL:-file:/app/data/deliveryhub.db}"

echo "DeliveryHub — aplicando migrations..."
npx prisma migrate deploy

if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "DeliveryHub — executando seed..."
  npx tsx prisma/seed.ts || true
fi

echo "DeliveryHub — iniciando servidor..."
exec "$@"
