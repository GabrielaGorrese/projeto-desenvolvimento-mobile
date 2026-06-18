const pool   = require('../db/pool')
const socket = require('../utils/socket')

async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name FROM category ORDER BY name ASC`
    )
    return res.json({ total: rows.length, categories: rows })
  } catch (err) {
    console.error('[categories.getAll]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function create(req, res) {
  const { name } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name é obrigatório.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO category (name) VALUES ($1) RETURNING id, name`,
      [name.trim()]
    )
    socket.getIO().emit('category:created', rows[0])
    return res.status(201).json({ message: `Categoria "${rows[0].name}" criada.`, category: rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Já existe uma categoria com esse nome.' })
    }
    console.error('[categories.create]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function remove(req, res) {
  const { id } = req.params

  try {
    const { rows } = await pool.query(
      `DELETE FROM category WHERE id = $1 RETURNING id, name`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' })
    }

    socket.getIO().emit('category:deleted', { id: parseInt(id, 10) })
    return res.json({ message: `Categoria "${rows[0].name}" excluída.` })
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Não é possível excluir: existem produtos nesta categoria (inclusive inativos). Mova ou exclua os produtos antes.' })
    }
    console.error('[categories.remove]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

module.exports = { getAll, create, remove }
