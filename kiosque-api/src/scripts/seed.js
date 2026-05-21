/**
 * Script de seed — cria o usuário administrador inicial.
 *
 * Uso:
 *   npm run seed
 *
 * Só precisa ser executado UMA vez após criar as tabelas.
 * Se o usuário 'admin' já existir, o script é abortado sem erro.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const bcrypt = require('bcryptjs')
const pool   = require('../db/pool')

async function seed() {
  console.log('Iniciando seed...')

  const { rows: existing } = await pool.query(
    `SELECT id FROM users WHERE username = 'admin'`
  )

  if (existing.length > 0) {
    console.log('Usuário "admin" já existe. Nada a fazer.')
    return
  }

  const { rows: roleRows } = await pool.query(
    `SELECT id FROM role WHERE name = 'manager'`
  )
  if (roleRows.length === 0) {
    throw new Error('Role "manager" não encontrada. Execute o SQL do schema primeiro.')
  }

  const passwordHash = await bcrypt.hash('admin123', 10)

  await pool.query(
    `INSERT INTO users (username, password_hash, role_id) VALUES ($1, $2, $3)`,
    ['admin', passwordHash, roleRows[0].id]
  )

  console.log('✓ Usuário admin criado.')
  console.log('  Username : admin')
  console.log('  Senha    : admin123')
  console.log('  ATENÇÃO  : Altere a senha após o primeiro login!')
}

seed()
  .catch(err => {
    console.error('Erro no seed:', err.message)
    process.exit(1)
  })
  .finally(() => pool.end())
