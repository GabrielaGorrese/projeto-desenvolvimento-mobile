const express   = require('express')
const rateLimit = require('express-rate-limit')
const router    = express.Router()
const auth      = require('../controllers/authController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

// Protege contra força bruta: 10 tentativas / 15 min por IP.
// Conta inclusive logins bem-sucedidos para evitar enumeração de timing.
const loginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
})


const registerLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Muitas criações de usuário. Tente novamente em 15 minutos.' }
})

router.post('/login', loginLimiter, auth.login)

// Auto-cadastro PÚBLICO de atendente (role forçado a 'attendant' no controller).
router.post(  '/users/attendant', registerLimiter, auth.registerAttendant)

// Criar usuário com qualquer perfil (inclui gerente): apenas gerente autenticado.
router.post(  '/users',           registerLimiter, authMiddleware, roleMiddleware('manager'), auth.register)
router.get(   '/users',           authMiddleware, roleMiddleware('manager'), auth.getAll)
router.delete('/users/:id',       authMiddleware, roleMiddleware('manager'), auth.deleteUser)
router.patch( '/users/:id/password', authMiddleware, roleMiddleware('manager'), auth.changePassword)

module.exports = router
