/**
 * Migration: adiciona coluna `people` à tabela orders.
 * Use uma única vez em bancos existentes que ainda não têm a coluna.
 *
 * Uso:
 *   node src/scripts/migrate_add_people.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const pool = require('../db/pool')

async function run() {
  console.log('Verificando coluna orders.people...')

  const { rows } = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'people'
  `)

  if (rows.length > 0) {
    console.log('✓ Coluna "people" já existe. Nada a fazer.')
    return
  }

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN people INTEGER NOT NULL DEFAULT 1 CHECK (people >= 1)
  `)
  console.log('✓ Coluna "people" criada (default = 1 para comandas existentes).')
}

run()
  .catch((err) => { console.error('Erro:', err.message); process.exit(1) })
  .finally(() => pool.end())
