const express  = require('express')
const multer   = require('multer')
const router   = express.Router()
const products = require('../controllers/productController')
const createUploadConfig = require('../utils/multerConfig')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

const upload = multer(createUploadConfig('products'))

// Wrapper para tratar erros do multer de forma amigável
function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Imagem muito grande. Limite: 5 MB.' })
      }
      return res.status(400).json({ error: err.message })
    }
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}

// Listagem: qualquer autenticado pode ver produtos
router.get('/',    authMiddleware, products.getAll)
router.get('/:id', authMiddleware, products.getOne)

// Modificações: apenas gerente
router.post(  '/',             authMiddleware, roleMiddleware('manager'), handleUpload, products.create)
router.put(   '/:id',         authMiddleware, roleMiddleware('manager'), handleUpload, products.update)
router.delete('/:id',         authMiddleware, roleMiddleware('manager'), products.remove)
router.patch( '/:id/restore', authMiddleware, roleMiddleware('manager'), products.restore)

module.exports = router
