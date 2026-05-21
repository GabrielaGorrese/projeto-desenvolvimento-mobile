const express = require('express')
const router  = express.Router()
const auth    = require('../controllers/authController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.post('/login', auth.login)

// Gerenciar usuários: apenas gerente
router.post(  '/users',           authMiddleware, roleMiddleware('manager'), auth.register)
router.get(   '/users',           authMiddleware, roleMiddleware('manager'), auth.getAll)
router.delete('/users/:id',       authMiddleware, roleMiddleware('manager'), auth.deleteUser)
router.patch( '/users/:id/password', authMiddleware, roleMiddleware('manager'), auth.changePassword)

module.exports = router
