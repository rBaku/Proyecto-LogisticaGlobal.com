const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/robots - Crear un nuevo robot
router.post('/', async (req, res, next) => {
  const { id, name, is_operational } = req.body;

  if (!id || !name || typeof is_operational !== 'boolean') {
    return res.status(400).json({ error: 'Los campos id (string), name (string), y is_operational (boolean) son obligatorios.' });
  }

  try {
    // Verificar si el ID ya existe
    const checkQuery = 'SELECT id FROM Robots WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Conflicto: Ya existe un robot con ese ID.' });
    }

    // Si no existe, insertar el nuevo robot
    const queryText = `
      INSERT INTO Robots (id, name, is_operational) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    const values = [id, name, is_operational];
    const result = await pool.query(queryText, values);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    // Solo mostrar en consola si es un error inesperado
    console.error('Error en POST /api/robots:', error);
    next(error); // Pasa el error al manejador de errores
  }
});

// GET /api/robots - Obtener todos los robots
router.get('/', async (_req, res, next) => {
  try {
    // Podrías añadir filtros como ?is_operational=true
    const result = await pool.query('SELECT id, name, is_operational FROM Robots ORDER BY name;');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /api/robots:', error);
    next(error);
  }
});

// GET /api/robots/:id - Obtener un robot por ID
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, name, is_operational FROM Robots WHERE id = $1', [id]);
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
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { name, is_operational } = req.body;

  if (name === undefined && is_operational === undefined) {
    return res.status(400).json({ error: 'Se debe proporcionar al menos un campo (name o is_operational) para actualizar.' });
  }
  if (is_operational !== undefined && typeof is_operational !== 'boolean') {
    return res.status(400).json({ error: 'is_operational debe ser un valor booleano.' });
  }


  try {
    // Construimos la query y los valores dinámicamente para actualizar solo los campos provistos
    let queryFields = [];
    let values = [];
    let paramIndex = 1;

    if (name !== undefined) {
        queryFields.push(`name = $${paramIndex++}`);
        values.push(name);
    }
    if (is_operational !== undefined) {
        queryFields.push(`is_operational = $${paramIndex++}`);
        values.push(is_operational);
    }
    
    if (queryFields.length === 0) { // Doble chequeo, aunque la validación anterior debería cubrirlo
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
    }

    queryFields.push(`updated_at = NOW()`); // Siempre actualiza updated_at
    values.push(id); // El ID para la cláusula WHERE

    const queryText = `
      UPDATE Robots 
      SET ${queryFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;`;
    
    const result = await pool.query(queryText, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Robot no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error en PUT /api/robots/${id}:`, error);
     if (error.code === '23505') { // Error de violación de unicidad (ej. name duplicado)
        return res.status(409).json({ error: 'Conflicto: Ya existe otro robot con ese nombre.' });
    }
    next(error);
  }
});

// DELETE /api/robots/:id - Eliminar un robot
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Robots WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Robot no encontrado.' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error(`Error en DELETE /api/robots/${id}:`, error);
    if (error.code === '23503') { // Error de FK, el robot está referenciado en Incidents
        return res.status(409).json({ error: 'Conflicto: El robot no puede ser eliminado porque tiene incidentes asociados.'});
    }
    next(error);
  }
});

module.exports = router;