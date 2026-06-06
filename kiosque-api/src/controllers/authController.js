const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const pool   = require('../db/pool')

async function login(req, res) {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e senha são obrigatórios.' })
  }

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.password_hash, u.is_active, r.name AS role
       FROM   users u
       JOIN   role  r ON r.id = u.role_id
       WHERE  u.username = $1`,
      [username]
    )

    const user = rows[0]

    // Mesma mensagem para user não encontrado e senha errada
    // (evita enumeração de usuários)
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenciais inválidas.' })
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Usuário inativo.' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    )

    return res.json({ token, role: user.role, username: user.username })

  } catch (err) {
    console.error('[login]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// Apenas gerente pode criar usuários (proteção na rota)
async function register(req, res) {
  const { username, password, role } = req.body

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'username, password e role são obrigatórios.' })
  }

  const validRoles = ['manager', 'attendant']
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `role inválido. Use: ${validRoles.join(', ')}.` })
  }

  try {
    const { rows: roleRows } = await pool.query(
      `SELECT id FROM role WHERE name = $1`, [role]
    )
    if (roleRows.length === 0) {
      return res.status(400).json({ error: 'Role não encontrado.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role_id)
       VALUES ($1, $2, $3)
       RETURNING id, username, role_id, is_active, created_at`,
      [username, passwordHash, roleRows[0].id]
    )

    return res.status(201).json({
      message: `Usuário ${username} criado com sucesso.`,
      user: rows[0]
    })

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username já está em uso.' })
    }
    console.error('[register]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// Auto-cadastro PÚBLICO. Qualquer pessoa pode criar uma conta de atendente OU
// de gerente (perfil vem no body; default 'attendant').
async function registerAttendant(req, res) {
  const { username, password, role } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter ao menos 6 caracteres.' })
  }

  const wantedRole = role === 'manager' ? 'manager' : 'attendant'

  try {
    const { rows: roleRows } = await pool.query(
      `SELECT id FROM role WHERE name = $1`, [wantedRole]
    )
    if (roleRows.length === 0) {
      return res.status(500).json({ error: 'Perfil não configurado.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role_id)
       VALUES ($1, $2, $3)
       RETURNING id, username, is_active, created_at`,
      [username.trim(), passwordHash, roleRows[0].id]
    )

    return res.status(201).json({
      message: `Usuário ${username} criado com sucesso.`,
      user: rows[0]
    })

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username já está em uso.' })
    }
    console.error('[registerAttendant]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// Listar usuários — nunca retorna password_hash
async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, r.name AS role, u.is_active, u.created_at, u.updated_at
       FROM   users u
       JOIN   role  r ON r.id = u.role_id
       ORDER  BY u.created_at DESC`
    )

    return res.json({ total: rows.length, users: rows })

  } catch (err) {
    console.error('[getAll]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// Soft-delete: desativa o usuário em vez de excluir do banco.
// Isso preserva integridade referencial com comandas históricas.
async function deleteUser(req, res) {
  const { id } = req.params

  try {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = FALSE
       WHERE  id = $1 AND is_active = TRUE
       RETURNING id, username`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado ou já inativo.' })
    }

    return res.json({ message: `Usuário ${rows[0].username} desativado com sucesso.` })

  } catch (err) {
    console.error('[deleteUser]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// Alterar senha — gerente pode alterar qualquer senha
async function changePassword(req, res) {
  const { id } = req.params
  const { newPassword } = req.body

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'newPassword é obrigatório e deve ter ao menos 6 caracteres.' })
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10)

    const { rows } = await pool.query(
      `UPDATE users
       SET    password_hash = $1
       WHERE  id = $2 AND is_active = TRUE
       RETURNING id, username`,
      [passwordHash, id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    return res.json({ message: `Senha do usuário ${rows[0].username} alterada com sucesso.` })

  } catch (err) {
    console.error('[changePassword]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

module.exports = { login, register, registerAttendant, getAll, deleteUser, changePassword }
