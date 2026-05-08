const jwt =  require('jsonwebtoken')

function authMiddleware(req, res, next) {

    //token da cabeça grad
    const authHeader = req.headers.authorization

    //Verifica o se é bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido'})
    
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

function isManager(token) {
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        //pego o role e verifico se é "manager"
        const role = payload.role;

        if(role === 'manager'){
            return true
        }else{
            return false
        }

    }catch(err){
        console.error('Erro ao verificar token:', err);
        return false;
    }
}




module.exports = { authMiddleware, roleMiddleware, isManager }