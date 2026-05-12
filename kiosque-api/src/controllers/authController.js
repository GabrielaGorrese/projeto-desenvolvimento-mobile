const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const pool   = require('../db/pool')
const middlewares = require('../middlewares/auth')




async function getAll(req, res) {

    try{
        const {rows} = await pool.query(
            `SELECT * FROM "users"`
        );

        return res.status(200).json({
            total: rows.length,
            users: rows
        });

    }catch(err){
        console.error(err)
        return res.status(500).json({error: 'Erro interno no servidor.' })
    }


}

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

    const {username,password,roleId} = req.body

    if (!username || !password || !roleId){
        return res.status(400).json({ error: "Username, senha e roleId são obrigatórios" })
    }
    


    try{

        const passwordHash = await bcrypt.hash(password, 10);


        const { rows } = await pool.query(
        `INSERT INTO "users" (username, password_hash, role_id) 
         VALUES ($1, $2, $3) 
         RETURNING *;`, 
        [username, passwordHash, roleId]
        );

        if (rows.rowCount === 0){
            return res.status(404).json({error: 'Usuário não registrado.'})
        }

        delete rows[0].password_hash;


        return res.status(201).json({
            message: `Usuário ${username} criado com sucesso.`,
            user: rows[0]
        })


    }catch (err){
        console.error(err)
        return res.status(500).json({error: 'Erro interno no servidor.' })
    }


}


async function deleteUser(req, res) {

    const {username} = req.body

    if (!username){
        return res.status(400).json({ error: "Username é obrigatório" })
    }

    try{
        
        const deleteResult = await pool.query(
            `DELETE FROM "users" WHERE username = $1`,
            [username]
        )

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({error: 'Usuário não encontrado ou não foi possível deletar.'})
        }

        return res.status(200).json({ message: `Usuário ${username} deletado com sucesso.` })


    }catch(err){
        console.error(err)
        return res.status(500).json({error: 'Erro, não foi possível deletar usuário.' })
    }
}

//somente o gerente pode trocar as senhas dele mesmo e dos outros usuários
async function alterPassword(req, res) {
    
    const {username, newPassword} = req.body

    if (!username || !newPassword){
        return res.status(400).json({ error: "Username, newPassword é obrigatório" })
    }

    try{

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        const { rows } = await pool.query(
        `UPDATE users
         SET password_hash = $1
         WHERE username = $2
         RETURNING *;`, 
        [newPasswordHash, username]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado ou senha não alterada.' });
        }

        delete rows[0].password_hash;

        return res.status(200).json({
        message: `Senha do usuário ${username} alterada com sucesso`,
        user: rows[0]
        })



    }catch(err){
        console.error(err)
        return res.status(500).json({error: 'Erro, não foi possível alterar a senha' })
    }




    
}


module.exports = { login, register, deleteUser,alterPassword,getAll }