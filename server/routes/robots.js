const express = require('express');
const router = express.Router();
const pool = require('../db');

const authMiddleware = require('../middleware/auth');
const onlyAdmin = require('../middleware/onlyAdmin');
// POST /api/robots - Crear un nuevo robot
router.post('/', authMiddleware, onlyAdmin, async (req, res, next) => {
  const { id, name, state } = req.body;

  if (!id || !name || typeof state !== 'string' || !state.trim()) {
    return res.status(400).json({
      error: 'Los campos id (string), name (string) y state (string no vacío) son obligatorios.'
    });
  }

  try {
    // Verificar si el ID o nombre ya existen
    const check = await pool.query('SELECT 1 FROM robots WHERE id = $1 OR name = $2', [id, name]);
    if (check.rowCount > 0) {
      return res.status(409).json({ error: 'Conflicto: Ya existe un robot con ese ID o nombre.' });
    }

    const insert = await pool.query(
      `INSERT INTO robots (id, name, state) VALUES ($1, $2, $3) RETURNING *`,
      [id, name, state.trim()]
    );
    res.status(201).json(insert.rows[0]);
  } catch (error) {
    console.error('Error en POST /api/robots:', error);
    next(error);
  }
});

// GET /api/robots - Obtener todos los robots con incidentes pendientes
router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.state,
        COUNT(i.*) FILTER (WHERE i.status NOT IN ('Resuelto', 'Firmado')) AS unresolved_incidents
      FROM robots r
      LEFT JOIN incidents i ON i.robot_id = r.id
      GROUP BY r.id
      ORDER BY r.name;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /api/robots:', error);
    next(error);
  }
});

// GET /api/robots/:id - Obtener un robot específico
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.state,
        COUNT(i.*) FILTER (WHERE i.status NOT IN ('Resuelto', 'Firmado')) AS unresolved_incidents
      FROM robots r
      LEFT JOIN incidents i ON i.robot_id = r.id
      WHERE r.id = $1
      GROUP BY r.id;
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Robot no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error en GET /api/robots/${id}:`, error);
    next(error);
  }
});

// PUT /api/robots/:id - Actualizar un robot
router.put('/:id', authMiddleware, onlyAdmin, async (req, res, next) => {
  const { id } = req.params;
  const { name, state } = req.body;

  if (name === undefined && state === undefined) {
    return res.status(400).json({ error: 'Se debe proporcionar al menos un campo (name o state) para actualizar.' });
  }
  if (state !== undefined && (typeof state !== 'string' || !state.trim())) {
    return res.status(400).json({ error: 'El campo state debe ser un string no vacío.' });
  }

  try {
    const fields = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(name);
    }

    if (state !== undefined) {
      fields.push(`state = $${index++}`);
      values.push(state.trim());
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE robots 
      SET ${fields.join(', ')} 
      WHERE id = $${index}
      RETURNING *;
    `;

    values.push(id);
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Robot no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error en PUT /api/robots/${id}:`, error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Conflicto: Ya existe otro robot con ese nombre.' });
    }
    next(error);
  }
});

// DELETE /api/robots/:id - Eliminar un robot
router.delete('/:id', authMiddleware, onlyAdmin, async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM robots WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Robot no encontrado.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(`Error en DELETE /api/robots/${id}:`, error);
    if (error.code === '23503') {
      return res.status(409).json({ error: 'Conflicto: El robot no puede ser eliminado porque tiene incidentes asociados.' });
    }
    next(error);
  }
});

module.exports = router;