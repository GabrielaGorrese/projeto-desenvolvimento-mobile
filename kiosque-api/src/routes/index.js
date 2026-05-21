const express = require('express')
const router  = express.Router()

const authRoutes     = require('./authRoutes')
const tableRoutes    = require('./tableRoutes')
const categoryRoutes = require('./categoryRoutes')
const productRoutes  = require('./productRoutes')
const orderRoutes    = require('./orderRoutes')
const { authMiddleware } = require('../middlewares/auth')

router.use('/auth',       authRoutes)
router.use('/tables',     tableRoutes)
router.use('/categories', categoryRoutes)
router.use('/products',   productRoutes)
router.use('/orders',     orderRoutes)

// Rota de verificação do token / perfil do usuário logado
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
