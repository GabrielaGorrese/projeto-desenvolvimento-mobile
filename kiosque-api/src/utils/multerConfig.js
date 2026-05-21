const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE_MB   = 5

function createUploadConfig(folderName) {
  return {
    storage: multer.diskStorage({
      destination(req, file, cb) {
        const uploadPath = path.resolve(__dirname, '..', 'uploads', folderName)
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true })
        }
        cb(null, uploadPath)
      },
      filename(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase())
      }
    }),
    fileFilter(req, file, cb) {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error('Tipo de arquivo inválido. Apenas imagens (JPEG, PNG, WebP, GIF) são aceitas.'))
      }
    },
    limits: {
      fileSize: MAX_FILE_SIZE_MB * 1024 * 1024
    }
  }
}

module.exports = createUploadConfig
