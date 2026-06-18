const express    = require('express')
const router     = express.Router()
const categories = require('../controllers/categoryController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

router.get('/',     authMiddleware, categories.getAll)
router.post('/',    authMiddleware, roleMiddleware('manager'), categories.create)
router.delete('/:id', authMiddleware, roleMiddleware('manager'), categories.remove)

module.exports = router
