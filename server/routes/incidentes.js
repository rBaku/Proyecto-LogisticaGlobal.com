const express = require('express');
const router = express.Router();
const pool = require('../db'); // Tu módulo de conexión a la BD

const authMiddleware = require('../middleware/auth'); 
const authorizeRoles = require('../middleware/authorizeRoles'); 

// POST /api/incidentes - Crear un nuevo incidente (ficha de incidente)
router.post('/', authMiddleware, authorizeRoles('admin', 'supervisor'), async (req, res, next) => {
  const {
    company_report_id, // ID manual de la empresa
    robot_id,
    incident_timestamp,
    location,
    type,
    cause,
    assigned_technician_id,
    // gravity viene como número (1-10) o null (si es "Sin asignar" desde el frontend)
    // status es 'Creado' por defecto en la BD
    gravity, // Puede ser null
  } = req.body;

  // Validación básica de campos obligatorios
  if (!company_report_id || !robot_id || !incident_timestamp || !location || !type || !cause || !assigned_technician_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para crear el incidente.' });
  }
  if (gravity !== null && (typeof gravity !== 'number' || gravity < 1 || gravity > 10)) {
    return res.status(400).json({ error: 'La gravedad, si se especifica, debe ser un número entre 1 y 10.' });
  }


  try {
    const queryText = `
      INSERT INTO Incidents (
        company_report_id, robot_id, incident_timestamp, location, 
        type, cause, assigned_technician_id, gravity, status 
        -- id, created_at, updated_at son generados/default por la BD
        -- technician_comment es NULL por defecto
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;`; // RETURNING * devuelve la fila insertada completa

    const values = [
      company_report_id,
      robot_id,
      incident_timestamp, // Frontend debe enviar en formato ISO 8601
      location,
      type,
      cause,
      assigned_technician_id,
      gravity, // Puede ser null
      'Creado', // Status por defecto al crear
    ];

    const result = await pool.query(queryText, values);
    res.status(201).json(result.rows[0]); // Devuelve el incidente creado
  } catch (error) {
    console.error('Error en POST /api/incidentes:', error);
    // Pasa el error al siguiente manejador de errores
    next(error); 
  }
});

// GET /api/incidentes - Obtener todos los incidentes
router.get('/', async (_req, res, next) => {
  try {
    // Considera paginación para grandes cantidades de datos en el futuro
    const result = await pool.query('SELECT * FROM Incidents ORDER BY incident_timestamp DESC, company_report_id, id;');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /api/incidentes:', error);
    next(error);
  }
});

// GET /api/incidentes/:id - Obtener un incidente específico por su ID de BD (UUID)
router.get('/:id', authMiddleware, authorizeRoles('admin', 'supervisor'), async (req, res, next) => {
  const { id } = req.params; // Este es el id UUID de la tabla Incidents
  try {
    const result = await pool.query('SELECT * FROM Incidents WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Incidente no encontrado con el ID proporcionado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error en GET /api/incidentes/${id}:`, error);
    next(error);
  }
});

// PUT /api/incidentes/:id - Actualizar un incidente existente
router.put('/:id', authMiddleware, authorizeRoles('admin', 'supervisor'), async (req, res, next) => {
  const { id } = req.params; // ID (UUID) de la ficha de incidente a actualizar
  const {
    // company_report_id, // Generalmente no se cambia, pero depende de la lógica de negocio
    robot_id, // Podría cambiar si se reasigna el robot (raro para un incidente existente)
    incident_timestamp,
    location,
    type,
    cause,
    assigned_technician_id,
    status,
    gravity, // Numérico 1-10 o null
    technician_comment, // Nuevo campo para actualizar
  } = req.body;

  // Validación (puedes expandirla)
  if (!status) { // Un ejemplo, puedes validar más campos según tu lógica
    return res.status(400).json({ error: 'El campo status es obligatorio para actualizar.' });
  }
   if (gravity !== undefined && gravity !== null && (typeof gravity !== 'number' || gravity < 1 || gravity > 10)) {
    return res.status(400).json({ error: 'La gravedad, si se especifica, debe ser un número entre 1 y 10 o null.' });
  }

  try {
    // Construir la query dinámicamente es más complejo y propenso a errores.
    // Es más simple actualizar todos los campos permitidos.
    // El frontend debería enviar el estado actual de todos los campos editables.
    const queryText = `
      UPDATE Incidents 
      SET 
        robot_id = COALESCE($1, robot_id), 
        incident_timestamp = COALESCE($2, incident_timestamp), 
        location = COALESCE($3, location), 
        type = COALESCE($4, type), 
        cause = COALESCE($5, cause), 
        assigned_technician_id = COALESCE($6, assigned_technician_id), 
        status = COALESCE($7, status), 
        gravity = $8, -- Se permite NULL para gravity
        technician_comment = COALESCE($9, technician_comment),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *;`;
      // COALESCE se usa para mantener el valor actual si no se envía uno nuevo,
      // pero para gravity, si se envía null, se actualiza a null.

    const values = [
      robot_id, 
      incident_timestamp, 
      location, 
      type, 
      cause, 
      assigned_technician_id, 
      status, 
      gravity, // Se pasa directamente (puede ser null)
      technician_comment,
      id
    ];
    
    const result = await pool.query(queryText, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Incidente no encontrado para actualizar.' });
    }
    res.json(result.rows[0]); // Devuelve el incidente actualizado
  } catch (error) {
    console.error(`Error en PUT /api/incidentes/${id}:`, error);
    next(error);
  }
});

// DELETE /api/incidentes/:id - Eliminar una ficha de incidente
router.delete('/:id', authMiddleware, authorizeRoles('admin', 'supervisor'), async (req, res, next) => {
  const { id } = req.params; // ID (UUID) de la ficha
  try {
    const result = await pool.query('DELETE FROM Incidents WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Incidente no encontrado para eliminar.' });
    }
    res.status(200).json({ message: 'Incidente eliminado exitosamente.', id: result.rows[0].id });
  } catch (error) {
    console.error(`Error en DELETE /api/incidentes/${id}:`, error);
    // Manejo específico de errores de FK podría ir aquí si es necesario
    if (error.code === '23503') { // Código de error de violación de FK en PostgreSQL
        return res.status(409).json({ error: 'Conflicto: El incidente no puede ser eliminado debido a referencias existentes.'});
    }
    next(error);
  }
});

module.exports = router;