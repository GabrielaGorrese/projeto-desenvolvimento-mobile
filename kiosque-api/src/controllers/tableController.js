const pool   = require('../db/pool')
const socket = require('../utils/socket')

async function getAll(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM table_seat ORDER BY label ASC`
    )
    return res.json({ total: rows.length, tables: rows })
  } catch (err) {
    console.error('[tables.getAll]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function create(req, res) {
  const { label } = req.body

  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'label é obrigatório.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO table_seat (label) VALUES ($1) RETURNING *`,
      [label.trim()]
    )
    socket.getIO().emit('table:created', rows[0])
    return res.status(201).json({ message: `Mesa "${label}" criada.`, table: rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Já existe uma mesa com esse nome.' })
    }
    console.error('[tables.create]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function update(req, res) {
  const { id } = req.params
  const { label } = req.body

  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'label é obrigatório.' })
  }

  try {
    const { rows } = await pool.query(
      `UPDATE table_seat SET label = $1 WHERE id = $2 RETURNING *`,
      [label.trim(), id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mesa não encontrada.' })
    }
    return res.json({ message: 'Mesa atualizada.', table: rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Já existe uma mesa com esse nome.' })
    }
    console.error('[tables.update]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function toggleStatus(req, res) {
  const { id } = req.params

  try {
    const { rows: current } = await pool.query(
      `SELECT is_active FROM table_seat WHERE id = $1`, [id]
    )
    if (current.length === 0) {
      return res.status(404).json({ error: 'Mesa não encontrada.' })
    }

    const { rows } = await pool.query(
      `UPDATE table_seat SET is_active = $1 WHERE id = $2 RETURNING *`,
      [!current[0].is_active, id]
    )
    return res.json({ message: 'Status da mesa alterado.', table: rows[0] })
  } catch (err) {
    console.error('[tables.toggleStatus]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function deleteTable(req, res) {
  const { id } = req.params

  try {
    // O trigger trg_prevent_delete_table_open_orders lança exceção
    // se houver comandas abertas — capturamos e retornamos 409.
    const result = await pool.query(
      `DELETE FROM table_seat WHERE id = $1`, [id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Mesa não encontrada.' })
    }
    socket.getIO().emit('table:deleted', { id: parseInt(id, 10) })
    return res.json({ message: 'Mesa excluída com sucesso.' })
  } catch (err) {
    if (err.message && err.message.includes('comandas abertas')) {
      return res.status(409).json({ error: err.message })
    }
    console.error('[tables.deleteTable]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

module.exports = { getAll, create, update, toggleStatus, deleteTable }
