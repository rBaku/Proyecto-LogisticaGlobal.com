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
      fall_back_type
    } = req.body;

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

        const createdBy = req.user?.id;

        const insertIncident = `
          INSERT INTO Incidents (
            company_report_id, robot_id, incident_timestamp, location,
            type, cause, gravity, status, technician_comment,
            created_by, updated_by, fall_back_type
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, 'Creado', $8,
            $9, $9, $10
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
          createdBy,
          fall_back_type ?? null
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

        // ✅ Insertar entrada en incident_history
        const insertHistory = `
          INSERT INTO incident_history (
            incident_id, change_type, changes, changed_by
          ) VALUES ($1, 'Creation', '', $2);
        `;
        await client.query(insertHistory, [incident.id, createdBy]);

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

    if (incidentes.length === 0) return res.json([]);

    // IDs de incidentes para técnicos
    const ids = incidentes.map(i => `'${i.id}'`).join(',');

    // Obtener técnicos por incidente
    const tecnicosResult = await pool.query(`
      SELECT it.incident_id, u.id, u.full_name, u.email
      FROM Incident_Technicians it
      JOIN Users u ON it.technician_user_id = u.id
      WHERE it.incident_id IN (${ids});
    `);

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

    // Obtener todos los user_ids únicos de campos relacionados
    const userIds = new Set();
    for (const inc of incidentes) {
      ['created_by', 'updated_by', 'signed_by_user_id', 'finished_by'].forEach(key => {
        if (inc[key]) userIds.add(inc[key]);
      });
    }

    const userIdList = [...userIds];
    let usuariosMap = {};
    if (userIdList.length > 0) {
      const usersQuery = await pool.query(`
        SELECT id, full_name FROM Users WHERE id = ANY($1)
      `, [userIdList]);
      usuariosMap = Object.fromEntries(usersQuery.rows.map(u => [u.id, u.full_name]));
    }

    // Agrega nombres al resultado final
    const incidentesConDatos = incidentes.map(inc => ({
      ...inc,
      assigned_technicians: tecnicosPorIncidente[inc.id] || [],
      created_by_name: usuariosMap[inc.created_by] || null,
      updated_by_name: usuariosMap[inc.updated_by] || null,
      signed_by_name: usuariosMap[inc.signed_by_user_id] || null,
      finished_by_name: usuariosMap[inc.finished_by] || null
    }));

    res.json(incidentesConDatos);
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

    // 1. Obtener el incidente
    const incidentResult = await pool.query('SELECT * FROM Incidents WHERE id = $1', [id]);
    if (incidentResult.rowCount === 0) {
      return res.status(404).json({ message: 'Incidente no encontrado.' });
    }

    const incident = incidentResult.rows[0];

    // 2. Obtener técnicos asignados
    const techsResult = await pool.query(`
      SELECT u.id, u.full_name, u.email
      FROM Incident_Technicians it
      JOIN Users u ON it.technician_user_id = u.id
      WHERE it.incident_id = $1;
    `, [id]);

    incident.assigned_technicians = techsResult.rows;

    // 3. Obtener nombres de usuarios relacionados (si hay IDs)
    const userIds = [];
    ['created_by', 'updated_by', 'signed_by_user_id', 'finished_by'].forEach(key => {
      if (incident[key]) userIds.push(incident[key]);
    });

    if (userIds.length > 0) {
      const userResult = await pool.query(
        'SELECT id, full_name FROM Users WHERE id = ANY($1)',
        [userIds]
      );

      const userMap = Object.fromEntries(userResult.rows.map(u => [u.id, u.full_name]));

      incident.created_by_name = userMap[incident.created_by] || null;
      incident.updated_by_name = userMap[incident.updated_by] || null;
      incident.signed_by_name = userMap[incident.signed_by_user_id] || null;
      incident.finished_by_name = userMap[incident.finished_by] || null;
    } else {
      incident.created_by_name = null;
      incident.updated_by_name = null;
      incident.signed_by_name = null;
      incident.finished_by_name = null;
    }

    res.json(incident);
  } catch (error) {
    console.error(`Error en GET /api/incidentes/${id}:`, error);
    next(error);
  }
});

// PUT /api/incidentes/:id
router.put('/:id', authMiddleware, async (req, res, next) => {
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
    technician_comment
  } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'El campo status es obligatorio para actualizar.' });
  }

  if (
    gravity !== undefined &&
    gravity !== null &&
    (typeof gravity !== 'number' || gravity < 1 || gravity > 10)
  ) {
    return res.status(400).json({
      error: 'La gravedad, si se especifica, debe ser un número entre 1 y 10 o null.'
    });
  }

  try {
    const pool = await initializePool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const currentUserId = req.user.id;
      const currentUserRole = req.user.role;

      // Obtener estado actual del incidente con técnicos
      const currentResult = await client.query(
        `
        SELECT i.*,
               JSON_AGG(
                 JSON_BUILD_OBJECT('id', t.technician_user_id, 'name', u.full_name)
               ) FILTER (WHERE t.technician_user_id IS NOT NULL) AS current_technicians
        FROM incidents i
        LEFT JOIN incident_technicians t ON i.id = t.incident_id
        LEFT JOIN users u ON t.technician_user_id = u.id
        WHERE i.id = $1
        GROUP BY i.id;
        `,
        [id]
      );

      if (currentResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Incidente no encontrado.' });
      }

      const currentIncident = currentResult.rows[0];

      // Cambios detectados
      let changeDescription = '';
      const addChange = (label, oldVal, newVal) => {
        if (oldVal !== newVal) {
          changeDescription += `${label}: ${oldVal ?? '—'} -> ${newVal ?? '—'}\n`;
        }
      };

      addChange('Estado', currentIncident.status, status);
      addChange('Gravedad', currentIncident.gravity, gravity);
      addChange('Ubicación', currentIncident.location, location);
      addChange('Tipo', currentIncident.type, type);
      addChange('Causa', currentIncident.cause, cause);
      addChange('Comentario Técnico', currentIncident.technician_comment, technician_comment);

      const prevTechs = (currentIncident.current_technicians || []).map(t => t.name).sort();

      let nextTechs = [];
      if (Array.isArray(assigned_technicians) && assigned_technicians.length > 0) {
        const techQuery = `
          SELECT full_name FROM users
          WHERE id = ANY($1::int[])
          ORDER BY full_name;
        `;
        const techResult = await client.query(techQuery, [assigned_technicians]);
        nextTechs = techResult.rows.map(r => r.full_name);
      }

      if (JSON.stringify(prevTechs) !== JSON.stringify(nextTechs)) {
        changeDescription += `Técnicos Asignados: ${prevTechs.join(', ') || '—'} -> ${nextTechs.join(', ') || '—'}\n`;
      }

      // Construcción del update
      const fields = [
        'robot_id = COALESCE($1, robot_id)',
        'incident_timestamp = COALESCE($2, incident_timestamp)',
        'location = COALESCE($3, location)',
        'type = COALESCE($4, type)',
        'cause = COALESCE($5, cause)',
        'status = COALESCE($6, status)',
        'gravity = $7',
        'technician_comment = COALESCE($8, technician_comment)',
        'updated_at = NOW()',
        'updated_by = $9'
      ];

      const values = [
        robot_id,
        incident_timestamp,
        location,
        type,
        cause,
        status,
        gravity,
        technician_comment,
        currentUserId
      ];

      if (status === 'Firmado') {
        fields.push(`signed_by_user_id = $${values.length + 1}`);
        values.push(currentUserId);
        fields.push(`signed_at = NOW()`);
      }

      if (status === 'Resuelto' && currentUserRole === 'tecnico') {
        fields.push(`finished_by = $${values.length + 1}`);
        values.push(currentUserId);
        fields.push(`finished_at = NOW()`);
      }

      values.push(id);

      const updateIncident = `
        UPDATE Incidents
        SET ${fields.join(', ')}
        WHERE id = $${values.length}
        RETURNING *;
      `;

      const result = await client.query(updateIncident, values);
      const updatedIncident = result.rows[0];

      // Reemplazar técnicos asignados
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

      // Guardar historial si hay cambios
      if (changeDescription.trim()) {
        const insertHistory = `
          INSERT INTO incident_history (incident_id, status, changes, changed_by)
          VALUES ($1, $2, $3, $4);
        `;
        await client.query(insertHistory, [id, status, changeDescription.trim(), currentUserId]);
      }

      await client.query('COMMIT');
      res.json(updatedIncident);
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
// GET /api/incidentes/:id/history
router.get('/:id/history', authMiddleware, async (req, res, next) => {
  const { id } = req.params;

  try {
    const pool = await initializePool();
    const query = `
      SELECT 
        h.id,
        h.status,
        h.change_date,
        h.changes,
        h.changed_by,
        u.full_name AS changed_by_name
      FROM incident_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.incident_id = $1
      ORDER BY h.change_date DESC;
    `;

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error en GET /api/incidentes/${id}/history:`, error);
    next(error);
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