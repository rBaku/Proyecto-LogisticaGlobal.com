
/*async function crearHash() {
  const hashed = await bcrypt.hash('miclave123', 10);
  console.log('Hash generado:', hashed);
}
crearHash();*/

const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const authMiddleware = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');
const onlyAdmin = require('../middleware/onlyAdmin');

// POST /api/users - Crear un nuevo usuario
router.post('/', authMiddleware, onlyAdmin, async (req, res, next) => {
  const { username, email, password, role, full_name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Los campos username, email y password son obligatorios.' });
  }

  try {
    const checkQuery = 'SELECT id FROM users WHERE username = $1 OR email = $2';
    const checkResult = await pool.query(checkQuery, [username, email]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Conflicto: El username o el email ya están en uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const insertQuery = `
      INSERT INTO users (username, email, password, role, full_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role, full_name;
    `;
    const result = await pool.query(insertQuery, [username, email, hashedPassword, role || 'user', full_name || null]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en POST /api/users:', error);
    next(error);
  }
});

// GET /api/users - Obtener todos los usuarios
router.get('/', authMiddleware, authorizeRoles('admin', 'supervisor', "jefe_turno"), async (req, res, next) => {
  const { role } = req.query;
  try {
    let result;
    if (role) {
      result = await pool.query(
        'SELECT id, username, email, role, full_name FROM users WHERE role = $1 ORDER BY id;',
        [role]
      );
    } else {
      result = await pool.query(
        'SELECT id, username, email, role, full_name FROM users ORDER BY id;'
      );
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /api/users:', error);
    next(error);
  }
});

// GET /api/users/:id - Obtener un usuario por ID
router.get('/:id', authMiddleware, authorizeRoles('admin', 'supervisor', "jefe_turno"), async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, username, email, role, full_name FROM users WHERE id = $1', [id]);
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
router.put('/:id', authMiddleware, onlyAdmin, async (req, res, next) => {
  const { id } = req.params;
  const { username, email, password, role, full_name } = req.body;

  if (!username && !email && !password && !role && !full_name) {
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
    if (full_name !== undefined) {
      queryFields.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }

    values.push(id);
    const queryText = `
      UPDATE users 
      SET ${queryFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, username, email, role, full_name;
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
router.delete('/:id', authMiddleware, onlyAdmin, async (req, res, next) => {
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

router.get('/username/:username', authMiddleware, async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, username, full_name, role FROM users WHERE username = $1',
      [username]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error buscando usuario por username:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;