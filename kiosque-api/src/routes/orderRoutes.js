const express = require('express')
const router  = express.Router()
const orders  = require('../controllers/orderController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

// Todas as rotas de comanda exigem autenticação
router.use(authMiddleware)

// Reset da numeração visível ("fechar caixa") — somente gerente.
// Declarado antes de '/:id' para não ser capturado como rota dinâmica.
router.post(  '/sequence/reset', roleMiddleware('manager'), orders.resetSequence)

// Sugestão do próximo número (contador + 1) — usado na criação da comanda.
router.get(   '/next-number', orders.nextNumber)

router.get(   '/',         orders.getOpenOrders)
router.get(   '/closed',   orders.getClosedOrders)
router.get(   '/:id',      orders.getOne)
router.post(  '/',         orders.create)
router.patch( '/:id',      orders.update)
router.post(  '/:id/close', orders.close)
router.delete('/:id',      orders.remove)

module.exports = router
