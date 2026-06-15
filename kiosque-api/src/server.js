require('dotenv').config()
process.env.TZ = process.env.TZ || 'America/Sao_Paulo'

const http         = require('http')
const path         = require('path')
const express      = require('express')
const cors         = require('cors')
const swaggerUi    = require('swagger-ui-express')
const routes       = require('./routes')
const socket       = require('./utils/socket')
const swaggerSpec  = require('./config/swagger')

const app    = express()
const server = http.createServer(app)

const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Serve imagens de produtos e outros uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Swagger UI — documentação interativa da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Comandou API — Docs',
  swaggerOptions: {
    persistAuthorization: true,   // mantém o token após reload da página
    displayRequestDuration: true, // mostra tempo de resposta nas chamadas de teste
    docExpansion: 'none',         // colapsa todas as seções por padrão
    filter: true                  // habilita campo de busca no topo
  }
}))

app.use('/api', routes)

socket.init(server)

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`Documentação: http://localhost:${PORT}/api-docs`)
  console.log(`Socket.IO ativo`)
})
