const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/tecnicos - Crear un nuevo técnico
router.post('/', async (req, res, next) => {
  const { id, full_name } = req.body;

  if (!id || !full_name) {
    return res.status(400).json({ error: 'Los campos id (string) y full_name (string) son obligatorios.' });
  }

  try {
    const queryText = `
      INSERT INTO Technicians (id, full_name) 
      VALUES ($1, $2)
      RETURNING *;`;
    const values = [id, full_name];
    const result = await pool.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en POST /api/tecnicos:', error);
     if (error.code === '23505') { // Error de violación de unicidad (ej. id o full_name duplicado)
        return res.status(409).json({ error: 'Conflicto: Ya existe un técnico con ese ID o nombre.' });
    }
    next(error);
  }
});

// GET /api/tecnicos - Obtener todos los técnicos
router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT id, full_name FROM Technicians ORDER BY full_name;');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /api/tecnicos:', error);
    next(error);
  }
});

// GET /api/tecnicos/:id - Obtener un técnico por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, full_name FROM Technicians WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Técnico no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error en GET /api/tecnicos/${id}:`, error);
    next(error);
  }
});

// PUT /api/tecnicos/:id - Actualizar un técnico
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { full_name } = req.body;

  if (!full_name) {
    return res.status(400).json({ error: 'El campo full_name es obligatorio para actualizar.' });
  }

  try {
    const queryText = `
      UPDATE Technicians 
      SET full_name = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;`;
    const values = [full_name, id];
    const result = await pool.query(queryText, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Técnico no encontrado para actualizar.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error en PUT /api/tecnicos/${id}:`, error);
    if (error.code === '23505') { // Error de violación de unicidad (ej. full_name duplicado)
        return res.status(409).json({ error: 'Conflicto: Ya existe otro técnico con ese nombre.' });
    }
    next(error);
  }
});

// DELETE /api/tecnicos/:id - Eliminar un técnico
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Technicians WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Técnico no encontrado para eliminar.' });
    }
    res.status(200).json({ message: 'Técnico eliminado exitosamente.', id: result.rows[0].id });
  } catch (error) {
    console.error(`Error en DELETE /api/tecnicos/${id}:`, error);
    if (error.code === '23503') { // Error de FK, el técnico está referenciado en Incidents
        return res.status(409).json({ error: 'Conflicto: El técnico no puede ser eliminado porque tiene incidentes asociados.'});
    }
    next(error);
  }
});

module.exports = router;
//test 