

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const pool = require('../db/pool')

async function migrate() {
  const client = await pool.connect()
  try {
    const { rows: statusRows } = await client.query(
      `SELECT id FROM status WHERE name = 'open'`
    )
    if (statusRows.length === 0) throw new Error("Status 'open' não encontrado.")
    const openId = statusRows[0].id

    const { rows: dups } = await client.query(
      `SELECT daily_number, COUNT(*) AS n
       FROM   orders
       WHERE  status_id = $1 AND daily_number IS NOT NULL
       GROUP  BY daily_number
       HAVING COUNT(*) > 1`,
      [openId]
    )
    if (dups.length > 0) {
      console.error('✗ Há comandas abertas com número duplicado. Resolva antes de migrar:')
      dups.forEach(d => console.error(`  número ${d.daily_number}: ${d.n} comandas`))
      process.exitCode = 1
      return
    }

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_open_daily_number
      ON orders (daily_number)
      WHERE status_id = ${openId} AND daily_number IS NOT NULL
    `)

    console.log(`✓ Índice único uq_open_daily_number criado (status_id = ${openId}).`)
  } finally {
    client.release()
  }
}

migrate()
  .catch(err => { console.error('Erro na migração:', err.message); process.exit(1) })
  .finally(() => pool.end())
