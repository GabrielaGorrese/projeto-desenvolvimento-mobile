const express    = require('express')
const router     = express.Router()
const categories = require('../controllers/categoryController')
const { authMiddleware } = require('../middlewares/auth')

// Categorias são somente leitura via API (gerenciadas internamente via seed)
router.get('/', authMiddleware, categories.getAll)

module.exports = router
