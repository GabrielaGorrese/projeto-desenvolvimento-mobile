const express = require('express')
const router  = express.Router()
const orders  = require('../controllers/orderController')
const { authMiddleware } = require('../middlewares/auth')

// Todas as rotas de comanda exigem autenticação
router.use(authMiddleware)

router.get(   '/',         orders.getOpenOrders)
router.get(   '/closed',   orders.getClosedToday)
router.get(   '/:id',      orders.getOne)
router.post(  '/',         orders.create)
router.patch( '/:id',      orders.update)
router.post(  '/:id/close', orders.close)
router.delete('/:id',      orders.remove)

module.exports = router
