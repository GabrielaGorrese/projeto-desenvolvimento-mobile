const pool   = require('../db/pool')
const socket = require('../utils/socket')

// Limites de tempo para coloração das comandas (em minutos)
const COLOR_GREEN_MAX  = 15
const COLOR_YELLOW_MAX = 30

// Query base que retorna campos enriquecidos de uma comanda
const ORDER_SELECT = `
  SELECT
    o.id,
    o.daily_number,
    o.label,
    o.created_at,
    o.closed_at,
    o.discount,
    o.total,
    o.people,
    s.name                                        AS status,
    u.username                                    AS attendant,
    o.table_id,
    t.label                                       AS table_label,
    ROUND(EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60, 1)::float
                                                  AS minutes_elapsed,
    CASE
      WHEN s.name != 'open' THEN NULL
      WHEN EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 < ${COLOR_GREEN_MAX}
           THEN 'green'
      WHEN EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 < ${COLOR_YELLOW_MAX}
           THEN 'yellow'
      ELSE 'red'
    END                                           AS color_status,
    COALESCE(SUM(oi.quantity), 0)::int            AS items_count,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS subtotal
  FROM   orders   o
  JOIN   status   s ON s.id = o.status_id
  JOIN   users    u ON u.id = o.user_id
  LEFT   JOIN table_seat t  ON t.id  = o.table_id
  LEFT   JOIN order_item oi ON oi.order_id = o.id
`

// Monta URL absoluta da imagem do produto (mesma convenção do productController).
// Retorna null se o produto não tem imagem cadastrada.
function buildImageUrl(req, filename) {
  if (!filename || !req) return null
  return `${req.protocol}://${req.get('host')}/uploads/products/${filename}`
}

// Retorna os itens de uma comanda com info do produto (incluindo imagem).
// `req` é opcional — se fornecido, retorna URL absoluta no campo image.
async function fetchItems(client, orderId, req) {
  const { rows } = await client.query(
    `SELECT oi.id, oi.quantity, oi.unit_price, oi.notes,
            p.id AS product_id, p.name AS product_name, p.image AS product_image,
            c.name AS category_name
     FROM   order_item oi
     JOIN   product  p ON p.id = oi.product_id
     JOIN   category c ON c.id = p.category_id
     WHERE  oi.order_id = $1
     ORDER  BY oi.id ASC`,
    [orderId]
  )
  return rows.map(r => ({
    ...r,
    image: buildImageUrl(req, r.product_image),
  }))
}

// GET /api/orders — comandas abertas, paginadas
// Query params:
//   ?page=1   (default 1)
//   ?limit=50 (default 50, máx 200)
// Defaults altos para não quebrar UX dos tablets em dia normal.
async function getOpenOrders(req, res) {
  const page   = Math.max(1,   parseInt(req.query.page  || '1',  10))
  const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)))
  const offset = (page - 1) * limit

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total
         FROM   orders o
         JOIN   status s ON s.id = o.status_id
         WHERE  s.name = 'open'`
      ),
      pool.query(
        ORDER_SELECT + `
        WHERE  s.name = 'open'
        GROUP  BY o.id, s.name, u.username, t.label
        ORDER  BY o.created_at ASC
        LIMIT  $1 OFFSET $2`,
        [limit, offset]
      )
    ])

    const total       = parseInt(countResult.rows[0].total, 10)
    const total_pages = Math.ceil(total / limit) || 1

    return res.json({
      page,
      limit,
      total,
      total_pages,
      has_prev: page > 1,
      has_next: page < total_pages,
      orders:   dataResult.rows
    })
  } catch (err) {
    console.error('[orders.getOpenOrders]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// GET /api/orders/closed — comandas fechadas, paginadas
// Query params:
//   ?page=1          (default 1)
//   ?limit=20        (default 20, máx 100)
//   ?date=YYYY-MM-DD (default: hoje)
async function getClosedOrders(req, res) {
  const page  = Math.max(1,   parseInt(req.query.page  || '1',  10))
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)))
  const { date } = req.query
  const offset = (page - 1) * limit

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date deve estar no formato YYYY-MM-DD.' })
  }

  // Quando date é fornecido: filtra o dia inteiro escolhido.
  // Sem date: filtra o dia de hoje (CURRENT_DATE).
  const dateFilter = date
    ? `o.closed_at >= $1::date AND o.closed_at < $1::date + INTERVAL '1 day'`
    : `o.closed_at >= CURRENT_DATE`

  const baseParams  = date ? [date]         : []
  const countParams = baseParams
  const dataParams  = date ? [date, limit, offset] : [limit, offset]
  const limitIdx    = date ? 2 : 1
  const offsetIdx   = date ? 3 : 2

  try {
    // Count e dados em paralelo para reduzir latência
    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total
         FROM   orders o
         JOIN   status s ON s.id = o.status_id
         WHERE  s.name = 'closed' AND ${dateFilter}`,
        countParams
      ),
      pool.query(
        ORDER_SELECT + `
        WHERE  s.name = 'closed' AND ${dateFilter}
        GROUP  BY o.id, s.name, u.username, t.label
        ORDER  BY o.closed_at DESC
        LIMIT  $${limitIdx} OFFSET $${offsetIdx}`,
        dataParams
      )
    ])

    const total       = parseInt(countResult.rows[0].total, 10)
    const total_pages = Math.ceil(total / limit)

    return res.json({
      page,
      limit,
      total,
      total_pages,
      has_prev: page > 1,
      has_next: page < total_pages,
      orders:   dataResult.rows
    })
  } catch (err) {
    console.error('[orders.getClosedOrders]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// GET /api/orders/:id — detalhe com itens
async function getOne(req, res) {
  const { id } = req.params

  try {
    const { rows } = await pool.query(
      ORDER_SELECT + `
      WHERE  o.id = $1
      GROUP  BY o.id, s.name, u.username, t.label
      `,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Comanda não encontrada.' })
    }

    const items = await fetchItems(pool, id, req)
    return res.json({ order: { ...rows[0], items } })
  } catch (err) {
    console.error('[orders.getOne]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// POST /api/orders — criar comanda
// Body: { label?, table_id?, people?, items: [{ product_id, quantity, notes? }] }
async function create(req, res) {
  const { label, table_id, people, items = [] } = req.body
  const userId = req.user.id
  const peopleParsed = Math.max(1, parseInt(people || 1, 10))

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Buscar status 'open'
    const { rows: statusRows } = await client.query(
      `SELECT id FROM status WHERE name = 'open'`
    )
    const statusId = statusRows[0].id

    const { rows: seqRows } = await client.query(
      `UPDATE order_sequence SET current_value = current_value + 1
       WHERE id = 1
       RETURNING current_value`
    )
    const dailyNumber = seqRows[0].current_value

    // Criar a comanda
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (label, table_id, user_id, status_id, people, daily_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [label || null, table_id || null, userId, statusId, peopleParsed, dailyNumber]
    )
    const orderId = orderRows[0].id

    // Inserir itens (se fornecidos)
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Cada item deve ter product_id e quantity >= 1.' })
      }

      // Captura snapshot do preço atual
      const { rows: prodRows } = await client.query(
        `SELECT price FROM product WHERE id = $1 AND is_active = TRUE`, [item.product_id]
      )
      if (prodRows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: `Produto ${item.product_id} não encontrado ou inativo.` })
      }

      await client.query(
        `INSERT INTO order_item (order_id, product_id, quantity, unit_price, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.quantity, prodRows[0].price, item.notes || null]
      )
    }

    await client.query('COMMIT')

    // Buscar comanda completa para resposta e broadcast
    const { rows: full } = await pool.query(
      ORDER_SELECT + `WHERE o.id = $1 GROUP BY o.id, s.name, u.username, t.label`, [orderId]
    )
    const orderItems = await fetchItems(pool, orderId, req)
    const order = { ...full[0], items: orderItems }

    socket.getIO().emit('order:created', order)

    return res.status(201).json({ message: 'Comanda criada com sucesso.', order })

  } catch (err) {
    await client.query('ROLLBACK')
    if (err.message && err.message.includes('inativo')) {
      return res.status(400).json({ error: err.message })
    }
    console.error('[orders.create]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  } finally {
    client.release()
  }
}

// PATCH /api/orders/:id — editar comanda aberta
// Body: {
//   label?, table_id?, discount?,
//   add_items?:    [{ product_id, quantity, notes? }],
//   update_items?: [{ item_id, quantity?, notes? }],
//   remove_items?: [item_id, ...]
// }
async function update(req, res) {
  const { id } = req.params
  const { label, table_id, discount, people, add_items, update_items, remove_items } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // SELECT ... FOR UPDATE OF o trava esta linha de orders pelo resto
    // da transação. Outro tablet que tente PATCH ou close() na mesma
    // comanda fica em espera até este commit/rollback — elimina race
    // entre check de status e UPDATE/INSERT de itens.
    const { rows: orderCheck } = await client.query(
      `SELECT o.id, s.name AS status
       FROM orders o JOIN status s ON s.id = o.status_id
       WHERE o.id = $1
       FOR UPDATE OF o`,
      [id]
    )
    if (orderCheck.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Comanda não encontrada.' })
    }
    if (orderCheck[0].status !== 'open') {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Comanda já está fechada.' })
    }

    // Atualizar campos da comanda
    const updates = []
    const params  = []

    if (label     !== undefined) { params.push(label);    updates.push(`label = $${params.length}`)    }
    if (table_id  !== undefined) { params.push(table_id); updates.push(`table_id = $${params.length}`) }
    if (people    !== undefined) {
      const p = Math.max(1, parseInt(people, 10))
      if (isNaN(p)) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'people deve ser um número inteiro >= 1.' })
      }
      params.push(p); updates.push(`people = $${params.length}`)
    }
    if (discount  !== undefined) {
      const d = parseFloat(discount)
      if (isNaN(d) || d < 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'discount deve ser um número >= 0.' })
      }
      params.push(d)
      updates.push(`discount = $${params.length}`)
    }

    if (updates.length > 0) {
      params.push(id)
      await client.query(
        `UPDATE orders SET ${updates.join(', ')} WHERE id = $${params.length}`,
        params
      )
    }

    // Adicionar itens
    if (Array.isArray(add_items)) {
      for (const item of add_items) {
        if (!item.product_id || !item.quantity || item.quantity < 1) {
          await client.query('ROLLBACK')
          return res.status(400).json({ error: 'Cada item em add_items deve ter product_id e quantity >= 1.' })
        }
        const { rows: prodRows } = await client.query(
          `SELECT price FROM product WHERE id = $1 AND is_active = TRUE`, [item.product_id]
        )
        if (prodRows.length === 0) {
          await client.query('ROLLBACK')
          return res.status(400).json({ error: `Produto ${item.product_id} não encontrado ou inativo.` })
        }
        await client.query(
          `INSERT INTO order_item (order_id, product_id, quantity, unit_price, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, item.product_id, item.quantity, prodRows[0].price, item.notes || null]
        )
      }
    }

    // Atualizar itens existentes
    if (Array.isArray(update_items)) {
      for (const item of update_items) {
        if (!item.item_id) {
          await client.query('ROLLBACK')
          return res.status(400).json({ error: 'Cada entrada em update_items deve ter item_id.' })
        }
        const itemUpdates = []
        const itemParams  = []

        if (item.quantity !== undefined) {
          if (item.quantity < 1) {
            await client.query('ROLLBACK')
            return res.status(400).json({ error: 'quantity deve ser >= 1.' })
          }
          itemParams.push(item.quantity)
          itemUpdates.push(`quantity = $${itemParams.length}`)
        }
        if (item.notes !== undefined) {
          itemParams.push(item.notes)
          itemUpdates.push(`notes = $${itemParams.length}`)
        }

        if (itemUpdates.length > 0) {
          itemParams.push(item.item_id, id)
          await client.query(
            `UPDATE order_item
             SET ${itemUpdates.join(', ')}
             WHERE id = $${itemParams.length - 1} AND order_id = $${itemParams.length}`,
            itemParams
          )
        }
      }
    }

    // Remover itens
    if (Array.isArray(remove_items) && remove_items.length > 0) {
      await client.query(
        `DELETE FROM order_item WHERE id = ANY($1::int[]) AND order_id = $2`,
        [remove_items, id]
      )
    }

    await client.query('COMMIT')

    // Retornar comanda atualizada
    const { rows: full } = await pool.query(
      ORDER_SELECT + `WHERE o.id = $1 GROUP BY o.id, s.name, u.username, t.label`, [id]
    )
    const orderItems = await fetchItems(pool, id, req)
    const order = { ...full[0], items: orderItems }

    socket.getIO().emit('order:updated', order)

    return res.json({ message: 'Comanda atualizada.', order })

  } catch (err) {
    await client.query('ROLLBACK')
    if (err.message && (err.message.includes('fechada') || err.message.includes('inativo'))) {
      return res.status(409).json({ error: err.message })
    }
    console.error('[orders.update]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  } finally {
    client.release()
  }
}

// POST /api/orders/:id/close — fechar comanda (trigger calcula total)
async function close(req, res) {
  const { id } = req.params

  try {
    const { rows: statusRows } = await pool.query(
      `SELECT id FROM status WHERE name = 'closed'`
    )

    const { rows } = await pool.query(
      `UPDATE orders SET status_id = $1
       WHERE  id = $2
         AND  status_id = (SELECT id FROM status WHERE name = 'open')
       RETURNING *`,
      [statusRows[0].id, id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Comanda não encontrada ou já está fechada.' })
    }

    const { rows: full } = await pool.query(
      ORDER_SELECT + `WHERE o.id = $1 GROUP BY o.id, s.name, u.username, t.label`, [id]
    )

    socket.getIO().emit('order:closed', full[0])

    return res.json({ message: 'Comanda fechada com sucesso.', order: full[0] })

  } catch (err) {
    console.error('[orders.close]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// DELETE /api/orders/:id — excluir comanda (somente se aberta)
async function remove(req, res) {
  const { id } = req.params

  try {
    const result = await pool.query(
      `DELETE FROM orders
       WHERE  id = $1
         AND  status_id = (SELECT id FROM status WHERE name = 'open')`,
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Comanda não encontrada ou já está fechada.' })
    }

    socket.getIO().emit('order:deleted', { id: parseInt(id) })

    return res.json({ message: 'Comanda excluída.' })

  } catch (err) {
    console.error('[orders.remove]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

// POST /api/orders/sequence/reset — "fechar o caixa": zera a numeração visível.
// A próxima comanda criada volta a ser nº 1. Somente gerente (rota protegida).
// Bloqueia se houver comandas abertas, para não gerar números duplicados na tela.
async function resetSequence(req, res) {
  try {
    const { rows: openRows } = await pool.query(
      `SELECT COUNT(*)::int AS n
       FROM   orders o
       JOIN   status s ON s.id = o.status_id
       WHERE  s.name = 'open'`
    )
    if (openRows[0].n > 0) {
      return res.status(409).json({
        error: `Há ${openRows[0].n} comanda(s) aberta(s). Feche todas antes de iniciar um novo dia.`,
      })
    }

    await pool.query(`UPDATE order_sequence SET current_value = 0 WHERE id = 1`)

    return res.json({ message: 'Numeração reiniciada. A próxima comanda será nº 1.' })

  } catch (err) {
    console.error('[orders.resetSequence]', err)
    return res.status(500).json({ error: 'Erro interno no servidor.' })
  }
}

module.exports = { getOpenOrders, getClosedOrders, getOne, create, update, close, remove, resetSequence }
