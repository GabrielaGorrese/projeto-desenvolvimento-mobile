/**
 * Migração — estado de entrega por item (order_item.delivered).
 *
 * Uso:
 *   node src/scripts/migrate-item-delivered.js
 *
 * Aditiva e idempotente. Adiciona a coluna order_item.delivered (default FALSE).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const pool = require('../db/pool')

async function migrate() {
  await pool.query(
    `ALTER TABLE order_item ADD COLUMN IF NOT EXISTS delivered BOOLEAN NOT NULL DEFAULT FALSE`
  )
  console.log('✓ Coluna order_item.delivered criada (default FALSE).')
}

migrate()
  .catch(err => { console.error('Erro na migração:', err.message); process.exit(1) })
  .finally(() => pool.end())
