const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const pool   = require('../db/pool')
const middlewares = require('../middlewares/auth')

async function login(req, res) {

    const { username, password } = req.body
    
    //ver se as infos do user vinheram no body
    if (!username || !password){
        return res.status(400).json({ error: "Username e senha são obrigatórios" })
    }
    
    try{


        //pegar o usuario no banco + role
        const {rows} = await pool.query(
            `SELECT u.id, u.username, u.password_hash, r.name AS role
            FROM "users" u
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

async function register(req, res) {

    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    if(!middlewares.isManager(token)){
        return res.status(403).json({ error: "Você não é gerente" })
    }

    const {username,password,role_id} = req.body

    if (!username || !password || !role_id){
        return res.status(400).json({ error: "Username, senha e role_id são obrigatórios" })
    }
    


    try{

        const password_hash = await bcrypt.hash(password, 10);


        const { rows } = await pool.query(
        `INSERT INTO "users" (username, password_hash, role_id, created_at) 
         VALUES ($1, $2, $3, now()) 
         RETURNING *;`, 
        [username, password_hash, role_id]
        );


        return res.status(201).json({
            message: 'Usuário criado com sucesso.',
            user: rows[0]
        })


    }catch (err){
        console.error(err)
        return res.status(500).json({error: 'Erro interno no servidor.' })
    }


}


async function delete_user(req, res) {

    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const token = authHeader.split(' ')[1];

    if(!middlewares.isManager(token)){
        return res.status(403).json({ error: "Você não é gerente" })
    }

    const {username} = req.body

    if (!username){
        return res.status(400).json({ error: "Username é obrigatório" })
    }

    try{
        
        const checkUser = await pool.query(
            `SELECT id FROM "users" WHERE username = $1`,
            [username]
        )

        if (checkUser.rows.length === 0) {
            return res.status(404).json({error: 'Usuário não encontrado.'})
        }

        
        await pool.query(
            `DELETE FROM "users" WHERE username = $1`,
            [username]
        )

        return res.status(200).json({ message: 'Usuário deletado com sucesso.' })


    }catch(err){
        console.error(err)
        return res.status(500).json({error: 'Erro, não foi possível deletar usuário.' })
    }
}









module.exports = { login, register, delete_user }