/**
 * Cria um atendente "teste" com senha "teste123" para validação rápida do app.
 * Uso: node src/scripts/createTestUser.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const bcrypt = require('bcryptjs')
const pool   = require('../db/pool')

const USERNAME = 'teste'
const PASSWORD = 'teste123'
const ROLE     = 'attendant'

async function run() {
  const { rows: existing } = await pool.query(
    `SELECT id FROM users WHERE username = $1`, [USERNAME]
  )

  const hash = await bcrypt.hash(PASSWORD, 10)

  if (existing.length > 0) {
    await pool.query(
      `UPDATE users SET password_hash = $1, is_active = TRUE WHERE username = $2`,
      [hash, USERNAME]
    )
    console.log(`✓ Senha de "${USERNAME}" atualizada para "${PASSWORD}".`)
  } else {
    const { rows: roleRows } = await pool.query(
      `SELECT id FROM role WHERE name = $1`, [ROLE]
    )
    if (roleRows.length === 0) throw new Error(`Role "${ROLE}" não existe.`)

    await pool.query(
      `INSERT INTO users (username, password_hash, role_id) VALUES ($1, $2, $3)`,
      [USERNAME, hash, roleRows[0].id]
    )
    console.log(`✓ Usuário "${USERNAME}" criado.`)
  }

  console.log(`  username: ${USERNAME}`)
  console.log(`  senha:    ${PASSWORD}`)
  console.log(`  role:     ${ROLE}`)
}

run()
  .catch(err => { console.error('Erro:', err.message); process.exit(1) })
  .finally(() => pool.end())
