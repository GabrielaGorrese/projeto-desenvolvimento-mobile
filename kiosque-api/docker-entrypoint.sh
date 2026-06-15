#!/bin/sh
set -e

echo "Aguardando banco de dados..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  sleep 1
done

echo "Rodando seed..."
node src/scripts/seed.js

echo "Criando usuário de teste..."
node src/scripts/createTestUser.js

exec "$@"
