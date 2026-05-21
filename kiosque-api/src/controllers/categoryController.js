const pool = require('../db/pool')

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

module.exports = { getAll }
