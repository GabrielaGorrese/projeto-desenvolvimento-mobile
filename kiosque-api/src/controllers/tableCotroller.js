const pool = require('../db/pool')

async function getAllTables(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM "table_seat"`
    )

    return res.status(200).json({
      total: rows.length,
      tables: rows
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function create(req, res) {
  const { label } = req.body

  if (!label) {
    return res.status(400).json({ error: 'label é obrigatório' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO "table_seat" (label, is_active)
       VALUES ($1, $2)
       RETURNING *`,
      [label, true]
    )

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Table não registrada.' })
    }

    return res.status(201).json({
      message: `Table ${label} criada com sucesso.`,
      table: result.rows[0]
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function update(req, res) {
  const { id, new_label } = req.body

  if (!id || !new_label) {
    return res.status(400).json({ error: 'id e new_label são obrigatórios' })
  }

  try {
    const result = await pool.query(
      `UPDATE "table_seat"
       SET label = $1
       WHERE id = $2
       RETURNING *`,
      [new_label, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table não encontrada ou não alterada.' })
    }

    return res.status(200).json({
      message: `Table ${id} atualizada com sucesso.`,
      table: result.rows[0]
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function deleteTable(req, res) {
  const { id } = req.body

  if (!id) {
    return res.status(400).json({ error: 'id é obrigatório' })
  }

  try {
    const deleteResult = await pool.query(
      `DELETE FROM "table_seat" WHERE id = $1`,
      [id]
    )

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Table não encontrada ou não foi possível deletar.' })
    }

    return res.status(200).json({ message: `Table ${id} deletada com sucesso.` })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function statusTable(req, res) {
  const { id } = req.body

  if (!id) {
    return res.status(400).json({ error: 'id é obrigatório' })
  }

  try {
    const selectResult = await pool.query(
      `SELECT is_active FROM "table_seat" WHERE id = $1`,
      [id]
    )

    if (selectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Table não encontrada.' })
    }

    const currentStatus = selectResult.rows[0].is_active
    const updatedResult = await pool.query(
      `UPDATE "table_seat"
       SET is_active = $1
       WHERE id = $2
       RETURNING *`,
      [!currentStatus, id]
    )

    if (updatedResult.rows.length === 0) {
      return res.status(404).json({ error: 'Table não encontrada ou status não alterado.' })
    }

    return res.status(200).json({
      message: 'Status da Table alterado com sucesso.',
      table: updatedResult.rows[0]
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

module.exports = {getAllTables, create, update, deleteTable, statusTable}
