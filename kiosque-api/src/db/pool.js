const { Pool, types } = require('pg')

// Força DECIMAL/NUMERIC (OID 1700) voltar como Number em JS.
// Sem isso, price/total/unit_price chegam como string e o front precisa
// fazer parseFloat em todo lugar.
types.setTypeParser(1700, parseFloat)

const pool = new Pool({
  host:                    process.env.DB_HOST,
  port:                    process.env.DB_PORT,
  database:                process.env.DB_NAME,
  user:                    process.env.DB_USER,
  password:                process.env.DB_PASSWORD,
  max:                     parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis:       30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('Erro no banco de dados:', err)
})

const APP_TZ = process.env.TZ || 'America/Sao_Paulo'
pool.on('connect', (client) => {
  client.query(`SET TIME ZONE '${APP_TZ}'`).catch((err) => {
    console.error('Erro ao definir timezone da conexão:', err)
  })
})

module.exports = pool
