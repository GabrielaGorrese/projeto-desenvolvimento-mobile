const http   = require('http')
const socket = require('../../src/utils/socket')

describe('socket utils', () => {
  let server

  afterEach(() => {
    if (server && server.listening) server.close()
  })

  it('getIO() lança erro se chamado antes de init()', () => {
    jest.resetModules()
    const freshSocket = require('../../src/utils/socket')
    expect(() => freshSocket.getIO()).toThrow('Socket.IO não foi inicializado.')
  })

  it('init() retorna instância de Server e getIO() devolve a mesma', () => {
    server = http.createServer()
    const io = socket.init(server)
    expect(io).toBeDefined()
    expect(socket.getIO()).toBe(io)
  })
})
