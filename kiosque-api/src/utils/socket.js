const { Server } = require('socket.io')

let _io = null

function init(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  _io.on('connection', (socket) => {
    console.log(`[Socket.IO] Cliente conectado: ${socket.id}`)
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`)
    })
  })

  return _io
}

function getIO() {
  if (!_io) throw new Error('Socket.IO não foi inicializado.')
  return _io
}

module.exports = { init, getIO }
