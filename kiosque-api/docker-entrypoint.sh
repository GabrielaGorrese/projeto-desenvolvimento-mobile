#!/bin/sh
set -e

echo "Aguardando PostgreSQL..."

until node -e "
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
client.connect()
  .then(() => client.end())
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
" >/dev/null 2>&1; do
  sleep 2
done

echo "Banco disponível. Executando seed..."
node src/scripts/seed.js

echo "Criando usuário de teste..."
node src/scripts/createTestUser.js

echo "Iniciando API..."
exec "$@"
