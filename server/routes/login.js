const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db'); 
const router = express.Router(); 
const jwt = require('jsonwebtoken');

//  LA CONTRASEÑA DE TODOS ES miclave123, admin, tecnico y supervisor


const JWT_SECRET = process.env.JWT_SECRET;


// POST /login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
  console.log('Intento de login:', username);

  if (!username || !password) {
    return res.status(400).json({ error: 'Username o email y password son obligatorios.' });
  }

  try {
    // Buscar por username o email
    const result = await pool.query(
      'SELECT id, username, email, role, password, full_name FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Excluir la contraseña
    const { password: _, ...userWithoutPassword } = user;

    // Crear token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name // Opcional: solo si lo necesitas en el token
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Establecer cookie con el token
    res.cookie('access_token', token, {
      httpOnly: true,
      maxAge: 1 * 60 * 60 * 1000, // 1 hora
    });

    // Enviar datos del usuario
    res.json({
      user: userWithoutPassword,
      token,
      role: user.role
    });

  } catch (error) {
    console.error('Error en POST /login:', error);
    next(error);
  }
});
router.post('/logout',(req,res)=>{
    res
        .clearCookie('access_token')
        .json({message: 'Logout seccesful'})
})
router.get('/protected', (req, res)=>{
    const token = req.cookies.access_token
    if (!token){
        return res.status(403).send('Acceso no autorizado')
    }
    try {
        const data = jwt.verify(token,JWT_SECRET)
        res.render('protected', data)
    } catch(error){
        res.status(401).send('Acceso no autorizado')
    }
})
router.get('/protected2', (req, res)=>{
    const { user } = req.session
    if(!user) {
      console.timeLog("AAAAAAAA")
      console.log(user)
      return res.statu(403).send("Acceso no autorizado")}
})


module.exports = router;