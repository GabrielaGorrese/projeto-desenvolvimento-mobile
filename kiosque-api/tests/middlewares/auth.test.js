const jwt = require('jsonwebtoken')
const { authMiddleware, roleMiddleware } = require('../../src/middlewares/auth')

process.env.JWT_SECRET = 'test-secret-key-for-tests'

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this }
  }
}

function signToken(payload, secret = process.env.JWT_SECRET, opts = {}) {
  return jwt.sign(payload, secret, opts)
}

describe('authMiddleware', () => {
  it('rejeita requisição sem header Authorization', () => {
    const req = { headers: {} }
    const res = mockRes()
    const next = jest.fn()

    authMiddleware(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'Token não fornecido' })
    expect(next).not.toHaveBeenCalled()
  })

  it('rejeita header sem prefixo Bearer', () => {
    const req = { headers: { authorization: 'NotBearer abc.def.ghi' } }
    const res = mockRes()
    const next = jest.fn()

    authMiddleware(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejeita token assinado com segredo diferente', () => {
    const token = signToken({ id: 1, role: 'manager' }, 'outro-segredo')
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = mockRes()
    const next = jest.fn()

    authMiddleware(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'Token inválido ou expirado.' })
    expect(next).not.toHaveBeenCalled()
  })

  it('rejeita token expirado', () => {
    const token = signToken({ id: 1, role: 'manager' }, process.env.JWT_SECRET, { expiresIn: '-1s' })
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = mockRes()
    const next = jest.fn()

    authMiddleware(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('aceita token válido e popula req.user', () => {
    const payload = { id: 42, username: 'joao', role: 'attendant' }
    const token = signToken(payload)
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = mockRes()
    const next = jest.fn()

    authMiddleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(req.user).toMatchObject(payload)
    expect(res.statusCode).toBeNull()
  })
})

describe('roleMiddleware', () => {
  it('bloqueia perfil fora da lista permitida', () => {
    const req = { user: { role: 'attendant' } }
    const res = mockRes()
    const next = jest.fn()

    roleMiddleware('manager')(req, res, next)

    expect(res.statusCode).toBe(403)
    expect(res.body).toEqual({ error: 'Acesso não autorizado para este perfil.' })
    expect(next).not.toHaveBeenCalled()
  })

  it('permite perfil presente na lista', () => {
    const req = { user: { role: 'manager' } }
    const res = mockRes()
    const next = jest.fn()

    roleMiddleware('manager', 'attendant')(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.statusCode).toBeNull()
  })

  it('aceita múltiplos perfis válidos', () => {
    const req = { user: { role: 'attendant' } }
    const res = mockRes()
    const next = jest.fn()

    roleMiddleware('manager', 'attendant')(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})
