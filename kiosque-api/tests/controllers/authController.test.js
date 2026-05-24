// Mocka o pool ANTES de carregar o controller — assim o require do
// pool dentro do controller pega o mock.
const mockQuery = jest.fn()
jest.mock('../../src/db/pool', () => ({ query: (...args) => mockQuery(...args) }))

process.env.JWT_SECRET = 'test-secret-key-for-tests'

const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const auth   = require('../../src/controllers/authController')

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this }
  }
}

beforeEach(() => mockQuery.mockReset())

describe('authController.login', () => {
  it('400 quando faltam username ou password', async () => {
    const req = { body: { username: 'admin' } }
    const res = mockRes()
    await auth.login(req, res)
    expect(res.statusCode).toBe(400)
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('401 quando usuário não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    const req = { body: { username: 'naoexiste', password: 'x' } }
    const res = mockRes()
    await auth.login(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'Credenciais inválidas.' })
  })

  it('401 quando senha está errada (mesma mensagem do usuário inexistente)', async () => {
    const hash = await bcrypt.hash('senhaCerta', 10)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'admin', password_hash: hash, is_active: true, role: 'manager' }]
    })
    const req = { body: { username: 'admin', password: 'senhaErrada' } }
    const res = mockRes()
    await auth.login(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'Credenciais inválidas.' })
  })

  it('403 quando usuário está inativo', async () => {
    const hash = await bcrypt.hash('senha', 10)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'admin', password_hash: hash, is_active: false, role: 'manager' }]
    })
    const req = { body: { username: 'admin', password: 'senha' } }
    const res = mockRes()
    await auth.login(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('200 + token JWT válido com credenciais corretas', async () => {
    const hash = await bcrypt.hash('senha', 10)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 7, username: 'maria', password_hash: hash, is_active: true, role: 'attendant' }]
    })
    const req = { body: { username: 'maria', password: 'senha' } }
    const res = mockRes()
    await auth.login(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ role: 'attendant', username: 'maria' })
    expect(res.body.token).toBeDefined()

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET)
    expect(decoded).toMatchObject({ id: 7, username: 'maria', role: 'attendant' })
  })

  it('500 quando query do banco lança exceção', async () => {
    mockQuery.mockRejectedValueOnce(new Error('connection refused'))
    const req = { body: { username: 'admin', password: 'x' } }
    const res = mockRes()
    await auth.login(req, res)
    expect(res.statusCode).toBe(500)
  })
})

describe('authController.register', () => {
  it('400 quando role é inválido', async () => {
    const req = { body: { username: 'novo', password: 'senha123', role: 'admin' } }
    const res = mockRes()
    await auth.register(req, res)
    expect(res.statusCode).toBe(400)
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('409 quando username já existe (erro 23505 do PG)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] })        // SELECT role
    const dupErr = Object.assign(new Error('duplicate'), { code: '23505' })
    mockQuery.mockRejectedValueOnce(dupErr)                       // INSERT users

    const req = { body: { username: 'admin', password: 'senha123', role: 'manager' } }
    const res = mockRes()
    await auth.register(req, res)
    expect(res.statusCode).toBe(409)
  })

  it('201 cria usuário e não devolve password_hash', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] })
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 99, username: 'maria', role_id: 2, is_active: true, created_at: new Date() }]
    })

    const req = { body: { username: 'maria', password: 'senha123', role: 'attendant' } }
    const res = mockRes()
    await auth.register(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body.user).not.toHaveProperty('password_hash')
  })
})
