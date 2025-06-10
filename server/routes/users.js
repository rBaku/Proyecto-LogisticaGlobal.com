const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const authMiddleware = require('../middleware/auth');
const onlyAdmin = require('../middleware/onlyAdmin');

/*async function crearHash() {
  const hashed = await bcrypt.hash('miclave123', 10);
  console.log('Hash generado:', hashed);
}
crearHash();*/

// POST /api/users - Crear un nuevo usuario
router.post('/', authMiddleware, onlyAdmin, async (req, res, next) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Los campos username, email y password son obligatorios.' });
  }

  try {
    // Verificar unicidad de username y email
    const checkQuery = 'SELECT id FROM users WHERE username = $1 OR email = $2';
    const checkResult = await pool.query(checkQuery, [username, email]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Conflicto: El username o el email ya están en uso.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const insertQuery = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role;
    `;
    const result = await pool.query(insertQuery, [username, email, hashedPassword, role || 'user']);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en POST /api/users:', error);
    next(error);
  }
});

// GET /api/users - Obtener todos los usuarios
router.get('/', authMiddleware, onlyAdmin, async (_req, res, next) => {
  console.log(_req.user); // Esto sí mostrará el usuario
  try {
    const result = await pool.query('SELECT id, username, email, role FROM users ORDER BY id;');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /api/users:', error);
    next(error);
  }
});

// GET /api/users/:id - Obtener un usuario por ID
router.get('/:id', authMiddleware, onlyAdmin,async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error en GET /api/users/${id}:`, error);
    next(error);
  }
});

// PUT /api/users/:id - Actualizar un usuario
router.put('/:id', authMiddleware, onlyAdmin,async (req, res, next) => {
  const { id } = req.params;
  const { username, email, password, role } = req.body;

  if (!username && !email && !password && !role) {
    return res.status(400).json({ error: 'Se debe proporcionar al menos un campo para actualizar.' });
  }

  try {
    let queryFields = [];
    let values = [];
    let paramIndex = 1;

    if (username !== undefined) {
      queryFields.push(`username = $${paramIndex++}`);
      values.push(username);
    }
    if (email !== undefined) {
      queryFields.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      queryFields.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }
    if (role !== undefined) {
      queryFields.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    values.push(id);
    const queryText = `
      UPDATE users 
      SET ${queryFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, username, email, role;
    `;

    const result = await pool.query(queryText, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error en PUT /api/users/${id}:`, error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Conflicto: Username o email ya están en uso.' });
    }
    next(error);
  }
});

// DELETE /api/users/:id - Eliminar un usuario
router.delete('/:id', authMiddleware, onlyAdmin,async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(`Error en DELETE /api/users/${id}:`, error);
    next(error);
  }
});
module.exports = router;