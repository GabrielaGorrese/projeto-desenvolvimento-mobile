const express = require('express')
const router  = express.Router()
const tables  = require('../controllers/tableController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

// Listagem: qualquer usuário autenticado pode ver as mesas
router.get('/', authMiddleware, tables.getAll)

// Modificações: apenas gerente
router.post(  '/',              authMiddleware, roleMiddleware('manager'), tables.create)
router.patch( '/:id',          authMiddleware, roleMiddleware('manager'), tables.update)
router.patch( '/:id/toggle',   authMiddleware, roleMiddleware('manager'), tables.toggleStatus)
router.delete('/:id',          authMiddleware, roleMiddleware('manager'), tables.deleteTable)

module.exports = router
