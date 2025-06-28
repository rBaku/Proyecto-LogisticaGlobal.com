const express = require('express');
const router = express.Router();
const { initializePool } = require('../db');
const authMiddleware = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');

// POST /api/incidentes
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'supervisor', 'jefe_turno'),
  async (req, res, next) => {
    const {
      company_report_id,
      robot_id,
      incident_timestamp,
      location,
      type,
      cause,
      assigned_technicians,
      gravity,
      technician_comment,
      signed_by_user_id,
      signed_at,
      created_by,
      updated_by,
      fall_back_type,
      finished_by,
      finished_at
    } = req.body;

    // Validaciones básicas
    if (
      !company_report_id ||
      !robot_id ||
      !incident_timestamp ||
      !location ||
      !type ||
      !cause ||
      !Array.isArray(assigned_technicians) ||
      assigned_technicians.length === 0
    ) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios para crear el incidente.'
      });
    }

    if (
      gravity !== null &&
      gravity !== undefined &&
      (typeof gravity !== 'number' || gravity < 1 || gravity > 10)
    ) {
      return res.status(400).json({
        error: 'La gravedad, si se especifica, debe ser un número entre 1 y 10.'
      });
    }

    try {
      const pool = await initializePool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const insertIncident = `
          INSERT INTO Incidents (
            company_report_id, robot_id, incident_timestamp, location,
            type, cause, gravity, status, technician_comment,
            signed_by_user_id, signed_at, created_by, updated_by,
            fall_back_type, finished_by, finished_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, 'Creado', $8,
            $9, $10, $11, $12,
            $13, $14, $15
          ) RETURNING *;
        `;

        const incidentValues = [
          company_report_id,
          robot_id,
          incident_timestamp,
          location,
          type,
          cause,
          gravity ?? null,
          technician_comment ?? null,
          signed_by_user_id ?? null,
          signed_at ?? null,
          created_by ?? null,
          updated_by ?? null,
          fall_back_type ?? null,
          finished_by ?? null,
          finished_at ?? null
        ];

        const result = await client.query(insertIncident, incidentValues);
        const incident = result.rows[0];

        const insertTech = `
          INSERT INTO Incident_Technicians (incident_id, technician_user_id)
          VALUES ($1, $2);
        `;

        for (const technicianId of assigned_technicians) {
          await client.query(insertTech, [incident.id, technicianId]);
        }

        await client.query('COMMIT');
        res.status(201).json(incident);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en POST /api/incidentes:', error);
        next(error);
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error al inicializar pool:', err);
      next(err);
    }
  }
);

// GET /api/incidentes - Obtener todos los incidentes con técnicos asignados
router.get('/', authMiddleware, async (_req, res, next) => {
  try {
    // Obtener todos los incidentes
    const pool = await initializePool();
    const incidentesResult = await pool.query('SELECT * FROM Incidents ORDER BY incident_timestamp DESC, company_report_id, id;');
    const incidentes = incidentesResult.rows;

    // Si no hay incidentes, responder directamente
    if (incidentes.length === 0) return res.json([]);

    // Obtener todos los técnicos asignados a esos incidentes
    const ids = incidentes.map(i => `'${i.id}'`).join(',');
    const tecnicosResult = await pool.query(`
      SELECT it.incident_id, u.id, u.full_name, u.email
      FROM Incident_Technicians it
      JOIN Users u ON it.technician_user_id = u.id
      WHERE it.incident_id IN (${ids});
    `);

    // Agrupar técnicos por incidente_id
    const tecnicosPorIncidente = {};
    for (const row of tecnicosResult.rows) {
      if (!tecnicosPorIncidente[row.incident_id]) {
        tecnicosPorIncidente[row.incident_id] = [];
      }
      tecnicosPorIncidente[row.incident_id].push({
        id: row.id,
        full_name: row.full_name,
        email: row.email
      });
    }

    // Agregar array de técnicos a cada incidente
    const incidentesConTecnicos = incidentes.map(inc => ({
      ...inc,
      assigned_technicians: tecnicosPorIncidente[inc.id] || []
    }));

    res.json(incidentesConTecnicos);
  } catch (error) {
    console.error('Error en GET /api/incidentes:', error);
    next(error);
  }
});

// GET /api/incidentes/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  try {
    const pool = await initializePool();
    const incidentResult = await pool.query('SELECT * FROM Incidents WHERE id = $1', [id]);
    if (incidentResult.rowCount === 0) {
      return res.status(404).json({ message: 'Incidente no encontrado.' });
    }

    const techsResult = await pool.query(`
      SELECT u.id, u.full_name, u.email
      FROM Incident_Technicians it
      JOIN Users u ON it.technician_user_id = u.id
      WHERE it.incident_id = $1;
    `, [id]);

    const incident = incidentResult.rows[0];
    incident.assigned_technicians = techsResult.rows;
    res.json(incident);
  } catch (error) {
    console.error(`Error en GET /api/incidentes/${id}:`, error);
    next(error);
  }
});

// PUT /api/incidentes/:id
router.put('/:id', authMiddleware, authorizeRoles('admin', 'supervisor'), async (req, res, next) => {
  const { id } = req.params;
  const {
    robot_id,
    incident_timestamp,
    location,
    type,
    cause,
    assigned_technicians,
    status,
    gravity,
    technician_comment,
  } = req.body;
  // console.log('BODY:', req.body);

  if (!status) {
    return res.status(400).json({ error: 'El campo status es obligatorio para actualizar.' });
  }

  if (
    gravity !== undefined &&
    gravity !== null &&
    (typeof gravity !== 'number' || gravity < 1 || gravity > 10)
  ) {
    return res.status(400).json({
      error: 'La gravedad, si se especifica, debe ser un número entre 1 y 10 o null.',
    });
  }

  try {
    const pool = await initializePool(); // <- usa initializePool correctamente
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const updateIncident = `
        UPDATE Incidents
        SET 
          robot_id = COALESCE($1, robot_id),
          incident_timestamp = COALESCE($2, incident_timestamp),
          location = COALESCE($3, location),
          type = COALESCE($4, type),
          cause = COALESCE($5, cause),
          status = COALESCE($6, status),
          gravity = $7,
          technician_comment = COALESCE($8, technician_comment),
          updated_at = NOW()
        WHERE id = $9
        RETURNING *;
      `;

      const values = [
        robot_id,
        incident_timestamp,
        location,
        type,
        cause,
        status,
        gravity,
        technician_comment,
        id,
      ];

      const result = await client.query(updateIncident, values);

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Incidente no encontrado para actualizar.' });
      }

      if (Array.isArray(assigned_technicians)) {
        await client.query('DELETE FROM Incident_Technicians WHERE incident_id = $1', [id]);

        const insertTech = `
          INSERT INTO Incident_Technicians (incident_id, technician_user_id)
          VALUES ($1, $2);
        `;

        for (const technicianId of assigned_technicians) {
          await client.query(insertTech, [id, technicianId]);
        }
      }

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error en PUT /api/incidentes/${id}:`, error);
      next(error);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al inicializar pool:', err);
    next(err);
  }
});

// DELETE /api/incidentes/:id
router.delete('/:id', authMiddleware, authorizeRoles('admin', 'supervisor'), async (req, res, next) => {
  const { id } = req.params;
  try {
    const pool = await initializePool();
    const result = await pool.query('DELETE FROM Incidents WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Incidente no encontrado para eliminar.' });
    }
    res.status(200).json({ message: 'Incidente eliminado exitosamente.', id: result.rows[0].id });
  } catch (error) {
    console.error(`Error en DELETE /api/incidentes/${id}:`, error);
    if (error.code === '23503') {
      return res.status(409).json({ error: 'Conflicto: El incidente no puede ser eliminado debido a referencias existentes.' });
    }
    next(error);
  }
});

module.exports = router;