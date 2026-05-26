const path = require('path')
const fs   = require('fs')
const pool = require('../db/pool')

// O campo image pode armazenar:
//   - filename de upload local (ex.: "1779328178446-833083768.webp")
//   - URL absoluta de imagem externa (ex.: "https://cdn.exemplo.com/x.jpg")
// Esta função normaliza: passa URLs direto, monta URL local para filenames.
function buildImageUrl(req, image) {
  if (!image) return null
  if (/^https?:\/\//i.test(image)) return image   // URL externa — retorna direto
  return `${req.protocol}://${req.get('host')}/uploads/products/${image}`
}

// Valida se uma string é URL HTTP/HTTPS válida.
function isValidImageUrl(s) {
  if (!s || typeof s !== 'string') return false
  return /^https?:\/\/[\w.-]+(:\d+)?(\/[^\s]*)?$/i.test(s.trim())
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
  const { name, description, price, category_id, image_url } = req.body
  // O upload de arquivo tem prioridade. Se não houve upload mas veio image_url,
  // salva a URL diretamente no campo image (a coluna serve para os dois casos).
  let imageField = null
  if (req.file) {
    imageField = req.file.filename
  } else if (image_url && image_url.trim()) {
    const url = image_url.trim()
    if (!isValidImageUrl(url)) {
      return res.status(400).json({ error: 'image_url inválida. Use http(s)://...' })
    }
    imageField = url
  }

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
      [name.trim(), description || null, parsedPrice, imageField, category_id]
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
  const { name, description, price, category_id, image_url } = req.body
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

    // Decide qual valor vai para o campo image, em ordem de prioridade:
    //  1. Arquivo enviado (req.file)
    //  2. image_url no body (URL externa)
    //  3. Mantém o valor atual
    let newImageField
    if (newImageFilename !== undefined) {
      newImageField = newImageFilename
    } else if (image_url !== undefined) {
      const url = (image_url || '').trim()
      if (url === '') {
        newImageField = null   // limpar imagem
      } else if (isValidImageUrl(url)) {
        newImageField = url
      } else {
        return res.status(400).json({ error: 'image_url inválida. Use http(s)://...' })
      }
    }

    const updatedName        = name        !== undefined ? name.trim()       : prod.name
    const updatedDescription = description !== undefined ? description       : prod.description
    const updatedPrice       = price       !== undefined ? parseFloat(price) : prod.price
    const updatedCategoryId  = category_id !== undefined ? category_id       : prod.category_id
    const updatedImage       = newImageField !== undefined ? newImageField   : prod.image

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

    // Remove imagem antiga do disco se a anterior era um arquivo upload e
    // a nova é diferente (outro arquivo ou URL externa).
    const oldWasFile = prod.image && !/^https?:\/\//i.test(prod.image)
    if (oldWasFile && updatedImage !== prod.image) {
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
