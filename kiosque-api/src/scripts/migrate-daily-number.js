/**
 * Migração — numeração visível das comandas (daily_number).
 *
 * Uso:
 *   node src/scripts/migrate-daily-number.js
 *
 * Aditiva e idempotente: pode rodar mais de uma vez sem efeito colateral.
 * NÃO apaga dados. Adiciona a coluna orders.daily_number, cria a tabela
 * contador order_sequence, numera comandas já existentes e alinha o contador.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const pool = require('../db/pool')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Coluna do número visível (separada do id interno).
    await client.query(
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS daily_number INTEGER`
    )

    // 2. Contador (linha única). current_value começa em 0.
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_sequence (
        id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        current_value INTEGER NOT NULL DEFAULT 0 CHECK (current_value >= 0)
      )
    `)
    await client.query(
      `INSERT INTO order_sequence (id, current_value)
       VALUES (1, 0) ON CONFLICT (id) DO NOTHING`
    )

    // 3. Backfill: numera comandas existentes ainda sem daily_number,
    //    continuando a partir do maior número já atribuído (evita colisão
    //    se a migração rodar parcialmente mais de uma vez).
    await client.query(`
      WITH base AS (
        SELECT COALESCE(MAX(daily_number), 0) AS m FROM orders
      ),
      numbered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
        FROM   orders
        WHERE  daily_number IS NULL
      )
      UPDATE orders o
      SET    daily_number = base.m + numbered.rn
      FROM   numbered, base
      WHERE  o.id = numbered.id
    `)

    // 4. Alinha o contador com o maior número atribuído, para que as próximas
    //    comandas continuem a sequência (até o gerente "fechar o caixa").
    await client.query(`
      UPDATE order_sequence
      SET    current_value = (SELECT COALESCE(MAX(daily_number), 0) FROM orders)
      WHERE  id = 1
    `)

    await client.query('COMMIT')

    const { rows } = await pool.query(`SELECT current_value FROM order_sequence WHERE id = 1`)
    console.log('✓ Migração concluída.')
    console.log(`  Contador atual: ${rows[0].current_value} (próxima comanda será nº ${rows[0].current_value + 1})`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

migrate()
  .catch(err => {
    console.error('Erro na migração:', err.message)
    process.exit(1)
  })
  .finally(() => pool.end())
