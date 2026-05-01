require('dotenv').config()

const express = require('express')
const cors    = require('cors')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// teste apagar depois 
app.get('/ping', (req, res) => {
  res.json({ message: 'servidor funcionando' })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})