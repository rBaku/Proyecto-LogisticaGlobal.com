const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db'); 
const router = express.Router(); 
const jwt = require('jsonwebtoken');

//  LA CONTRASEÑA DE TODOS ES miclave123


const JWT_SECRET = process.env.JWT_SECRET;


router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username y password son obligatorios.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

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

    // Crear token JWT con info básica del usuario
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      user: userWithoutPassword,
      token,
      role: user.role
    });

    // Setear la cookie (segura en producción)
    res.cookie('access_token', token, {
      httpOnly: true, //la cookie solo se puede acceder en el servidor y no desde javascripy
      //secure: process.env.NODE_ENV === 'production', // Solo HTTPS en prod
      //sameSite: 'Strict', //la cookie solo se puede acceder en el mismo dominio
      maxAge: 1 * 60 * 60 * 1000, // 2 horas
    });

  } catch (error) {
    console.error('Error en POST /login:', error);
    next(error);
  }
});
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
router.post('/logout',(req,res)=>{
    res
        .clearCookie('access_token')
        .json({message: 'Logout seccesful'})
})

module.exports = router;