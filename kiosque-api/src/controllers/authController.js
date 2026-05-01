const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const pool   = require('../db/pool')

async function login(req, res) {

    const { username, password } = req.body
    
    //ver se as infos do user vinheram no body
    if (!username || !password){
        return res.status(400).json({ error: "Username senha são obrigatórios" })
    }
    
    try{
        //pegar o usuario no banco + role
        const {rows} = await pool.query(
            `SELECT u.id, u.username, u.password_hash, r.name AS role
            FROM "user" u
            JOIN role r on r.id = u.role_id
            WHERE u.username = $1`,
            [username]
        )

        const user = rows[0]

        if (!user) {
            return res.status(401).json({error: 'Credenciais inválidas.'})
        }

        const senhaCorreta = await bcrypt.compare(password, user.password_hash)

        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas.' })
        }

        const token = jwt.sign(
            {id:user.id, username: user.username, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN}
        )
        
        return res.json({ token, role: user.role, username: user.username})


    } catch (err) {
        console.error(err)
        return res.status(500).json({error: 'Erro interno no servidor.' })
    }


}

module.exports = { login }