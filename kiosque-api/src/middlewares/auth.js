const jwt =  require('jsonwebtoken')

function authMiddleaware(req, res, next) {

    //token da cabeça grad
    const authHeader = req.headers.authorization

    //Verifica o se é bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não Não fornecido'})
    
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        
        req.user = decoded

        next()

    } catch {
        return res.status(401).json({ error: 'Token inválido ou expirado.'})
    }

}

function roleMiddleware(...roles) {
    return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso não autorizado para este perfil.' })
    }
    next()
  }
}

module.exports = { authMiddleaware, roleMiddleware }