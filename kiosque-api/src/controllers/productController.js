const path = require('path')
const fs   = require('fs')
const pool = require('../db/pool')

function buildImageUrl(req, filename) {
  if (!filename) return null
  return `${req.protocol}://${req.get('host')}/uploads/products/${filename}`
}

async function getAll(req, res) {
  const { category_id, active, search } = req.query

  let query = `
    SELECT p.id, p.name, p.description, p.price, p.image, p.is_active,
           p.created_at, c.id AS category_id, c.name AS category_name
    FROM   product p
    JOIN   category c ON c.id = p.category_id
    WHERE  1=1
  `
  const params = []

  // Busca por nome: case-insensitive + acento-insensitive via unaccent.
  // ?search=bana encontra "Banana", "Bananada", "Café Banana", etc.
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`)
    query += ` AND unaccent(p.name) ILIKE unaccent($${params.length})`
  }

  if (category_id) {
    params.push(category_id)
    query += ` AND p.category_id = $${params.length}`
  }

  // Por padrão retorna apenas produtos ativos; ?active=all retorna todos
  if (active !== 'all') {
    query += ` AND p.is_active = TRUE`
  }

  query += ` ORDER BY c.name ASC, p.name ASC`

  try {
    const { rows } = await pool.query(query, params)
    const products = rows.map(p => ({
      ...p,
      image: buildImageUrl(req, p.image)
    }))
    return res.json({ total: products.length, products })
  } catch (err) {
    console.error('[products.getAll]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function getOne(req, res) {
  const { id } = req.params

  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image, p.is_active,
              p.created_at, c.id AS category_id, c.name AS category_name
       FROM   product p
       JOIN   category c ON c.id = p.category_id
       WHERE  p.id = $1`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' })
    }

    const product = { ...rows[0], image: buildImageUrl(req, rows[0].image) }
    return res.json({ product })
  } catch (err) {
    console.error('[products.getOne]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function create(req, res) {
  const { name, description, price, category_id } = req.body
  const imageFilename = req.file ? req.file.filename : null

  if (!name || !price || !category_id) {
    // Remove arquivo se houve upload mas validação falhou
    if (req.file) fs.unlink(req.file.path, () => {})
    return res.status(400).json({ error: 'name, price e category_id são obrigatórios.' })
  }

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    if (req.file) fs.unlink(req.file.path, () => {})
    return res.status(400).json({ error: 'price deve ser um número positivo.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO product (name, description, price, image, category_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), description || null, parsedPrice, imageFilename, category_id]
    )

    return res.status(201).json({
      message: `Produto "${name}" criado com sucesso.`,
      product: { ...rows[0], image: buildImageUrl(req, rows[0].image) }
    })
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {})
    if (err.code === '23503') {
      return res.status(400).json({ error: 'category_id inválido.' })
    }
    console.error('[products.create]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

async function update(req, res) {
  const { id } = req.params
  const { name, description, price, category_id } = req.body
  const newImageFilename = req.file ? req.file.filename : undefined

  try {
    // Buscar produto atual para pegar a imagem antiga caso precise deletar
    const { rows: current } = await pool.query(
      `SELECT * FROM product WHERE id = $1`, [id]
    )
    if (current.length === 0) {
      if (req.file) fs.unlink(req.file.path, () => {})
      return res.status(404).json({ error: 'Produto não encontrado.' })
    }

    const prod = current[0]

    const updatedName        = name        !== undefined ? name.trim()           : prod.name
    const updatedDescription = description !== undefined ? description           : prod.description
    const updatedPrice       = price       !== undefined ? parseFloat(price)     : prod.price
    const updatedCategoryId  = category_id !== undefined ? category_id           : prod.category_id
    const updatedImage       = newImageFilename          !== undefined ? newImageFilename : prod.image

    if (price !== undefined && (isNaN(updatedPrice) || updatedPrice < 0)) {
      if (req.file) fs.unlink(req.file.path, () => {})
      return res.status(400).json({ error: 'price deve ser um número positivo.' })
    }

    const { rows } = await pool.query(
      `UPDATE product
       SET name = $1, description = $2, price = $3, image = $4, category_id = $5
       WHERE id = $6
       RETURNING *`,
      [updatedName, updatedDescription, updatedPrice, updatedImage, updatedCategoryId, id]
    )

    // Remove imagem antiga do disco se uma nova foi enviada
    if (newImageFilename && prod.image) {
      const oldPath = path.resolve(__dirname, '..', 'uploads', 'products', prod.image)
      fs.unlink(oldPath, () => {})
    }

    return res.json({
      message: 'Produto atualizado.',
      product: { ...rows[0], image: buildImageUrl(req, rows[0].image) }
    })
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {})
    if (err.code === '23503') {
      return res.status(400).json({ error: 'category_id inválido.' })
    }
    console.error('[products.update]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// Soft delete: marca is_active = false.
// Preserva integridade de comandas históricas que referenciam o produto.
async function remove(req, res) {
  const { id } = req.params

  try {
    const { rows } = await pool.query(
      `UPDATE product SET is_active = FALSE
       WHERE id = $1 AND is_active = TRUE
       RETURNING id, name`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado ou já inativo.' })
    }

    return res.json({ message: `Produto "${rows[0].name}" desativado com sucesso.` })
  } catch (err) {
    console.error('[products.remove]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// Reativar produto
async function restore(req, res) {
  const { id } = req.params

  try {
    const { rows } = await pool.query(
      `UPDATE product SET is_active = TRUE
       WHERE id = $1 AND is_active = FALSE
       RETURNING id, name`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado ou já ativo.' })
    }

    return res.json({ message: `Produto "${rows[0].name}" reativado com sucesso.` })
  } catch (err) {
    console.error('[products.restore]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

module.exports = { getAll, getOne, create, update, remove, restore }
