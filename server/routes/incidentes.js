const express = require('express');
const router = express.Router();
const pool = require('../db');

// Crear un nuevo incidente
router.post('/', async (req, res) => {
  const {
    robot_id,
    incident_timestamp,
    location,
    type,
    cause,
    gravity,
    status,
  } = req.body;

  if (!robot_id || !incident_timestamp || !location || !type || !cause || !gravity || !status) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Generar ID automáticamente
    const idResult = await pool.query('SELECT COUNT(*) FROM incidents');
    const count = parseInt(idResult.rows[0].count) + 1;
    const newId = `INC-${count.toString().padStart(3, '0')}`;

    await pool.query(
      `INSERT INTO incidents (id, robot_id, incident_timestamp, location, type, cause, gravity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [newId, robot_id, incident_timestamp, location, type, cause, gravity, status]
    );
    res.status(201).json({ mensaje: 'Incidente creado', id: newId });
  } catch (error) {
    console.error('Error en POST /incidentes:', error);
    res.status(500).json({ error: 'Error al crear incidente', details: error.message });
  }
});

// Obtener todos los incidentes
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incidents ORDER BY incident_timestamp DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en GET /incidentes:', error);
    res.status(500).json({ error: 'Error al obtener incidentes', details: error.message });
  }
});

// Obtener un incidente por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Incidente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error en GET /incidentes/${id}:`, error);
    res.status(500).json({ error: 'Error al obtener incidente', details: error.message });
  }
});

// Actualizar un incidente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    robot_id,
    incident_timestamp,
    location,
    type,
    cause,
    gravity,
    status,
  } = req.body;

  try {
    await pool.query(
      `UPDATE incidents
       SET robot_id = $1, incident_timestamp = $2, location = $3, type = $4, cause = $5, gravity = $6, status = $7
       WHERE id = $8`,
      [robot_id, incident_timestamp, location, type, cause, gravity, status, id]
    );
    res.json({ mensaje: 'Incidente actualizado' });
  } catch (error) {
    console.error(`Error en PUT /incidentes/${id}:`, error);
    res.status(500).json({ error: 'Error al actualizar incidente', details: error.message });
  }
});

// Eliminar un incidente
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM incidents WHERE id = $1', [id]);
    res.json({ mensaje: 'Incidente eliminado' });
  } catch (error) {
    console.error(`Error en DELETE /incidentes/${id}:`, error);
    res.status(500).json({ error: 'Error al eliminar incidente', details: error.message });
  }
});

module.exports = router;



/*const express = require('express');
const router = express.Router();
const pool = require('../db');

// Crear incidente
router.post('/', async (req, res) => {
  const { robots, tecnicos, fecha, ubicacion, tipo, causa, gravedad } = req.body;

  // Validaciones de campos obligatorios
  if (!fecha || !ubicacion || !tipo || !causa || gravedad === undefined || !Array.isArray(robots) || robots.length === 0) {
    return res.status(400).json({ error: 'Faltan campos obligatorios o robots' });
  }

  // Validar gravedad
  if (typeof gravedad !== 'number' || gravedad < 1 || gravedad > 10) {
    return res.status(400).json({ error: 'La gravedad debe ser un número entre 1 y 10' });
  }

  try {
    // Verificar existencia de todos los robots
    for (const nombreRobot of robots) {
      const robot = await pool.query('SELECT id FROM robots WHERE nombre = $1', [nombreRobot]);
      if (robot.rowCount === 0) {
        return res.status(400).json({ error: `Robot no encontrado: ${nombreRobot}` });
      }
    }

    // Verificar existencia de todos los técnicos (si se especifican)
    for (const nombreTecnico of tecnicos || []) {
      const tecnico = await pool.query('SELECT id FROM tecnicos WHERE nombre = $1', [nombreTecnico]);
      if (tecnico.rowCount === 0) {
        return res.status(400).json({ error: `Técnico no encontrado: ${nombreTecnico}` });
      }
    }

    // Insertar incidente
    const result = await pool.query(
      `INSERT INTO incidentes (fecha, ubicacion, tipo, causa, gravedad, estado)
       VALUES ($1, $2, $3, $4, $5, 'CREADO') RETURNING id`,
      [fecha, ubicacion, tipo, causa, gravedad]
    );

    const incidenteId = result.rows[0].id;

    // Relacionar robots
    for (const nombreRobot of robots) {
      const robot = await pool.query('SELECT id FROM robots WHERE nombre = $1', [nombreRobot]);
      await pool.query(
        'INSERT INTO incidentes_robots (incidente_id, robot_id) VALUES ($1, $2)',
        [incidenteId, robot.rows[0].id]
      );
    }

    // Relacionar técnicos (si hay)
    for (const nombreTecnico of tecnicos || []) {
      const tecnico = await pool.query('SELECT id FROM tecnicos WHERE nombre = $1', [nombreTecnico]);
      await pool.query(
        'INSERT INTO incidentes_tecnicos (incidente_id, tecnico_id) VALUES ($1, $2)',
        [incidenteId, tecnico.rows[0].id]
      );
    }

    res.status(201).json({ mensaje: 'Incidente creado', incidenteId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear incidente' });
  }
});

// Obtener todos los incidentes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, 
             array_agg(DISTINCT r.nombre) AS robots,
             array_agg(DISTINCT t.nombre) AS tecnicos
      FROM incidentes i
      LEFT JOIN incidentes_robots ir ON i.id = ir.incidente_id
      LEFT JOIN robots r ON ir.robot_id = r.id
      LEFT JOIN incidentes_tecnicos it ON i.id = it.incidente_id
      LEFT JOIN tecnicos t ON it.tecnico_id = t.id
      GROUP BY i.id
      ORDER BY i.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener incidentes' });
  }
});

// Obtener un incidente por ID
router.get('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query(`
      SELECT i.*, 
             array_agg(DISTINCT r.nombre) AS robots,
             array_agg(DISTINCT t.nombre) AS tecnicos
      FROM incidentes i
      LEFT JOIN incidentes_robots ir ON i.id = ir.incidente_id
      LEFT JOIN robots r ON ir.robot_id = r.id
      LEFT JOIN incidentes_tecnicos it ON i.id = it.incidente_id
      LEFT JOIN tecnicos t ON it.tecnico_id = t.id
      WHERE i.id = $1
      GROUP BY i.id
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Incidente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener incidente' });
  }
});

// Actualizar incidente
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { robots, tecnicos, fecha, ubicacion, tipo, causa, gravedad, estado } = req.body;

  // Validaciones
  if (!fecha || !ubicacion || !tipo || !causa || gravedad === undefined || !estado || !Array.isArray(robots) || robots.length === 0) {
    return res.status(400).json({ error: 'Faltan campos obligatorios o robots' });
  }

  if (typeof gravedad !== 'number' || gravedad < 1 || gravedad > 10) {
    return res.status(400).json({ error: 'La gravedad debe ser un número entre 1 y 10' });
  }

  try {
    // Verificar existencia de robots
    for (const nombreRobot of robots) {
      const robot = await pool.query('SELECT id FROM robots WHERE nombre = $1', [nombreRobot]);
      if (robot.rowCount === 0) {
        return res.status(400).json({ error: `Robot no encontrado: ${nombreRobot}` });
      }
    }

    // Verificar existencia de técnicos
    for (const nombreTecnico of tecnicos || []) {
      const tecnico = await pool.query('SELECT id FROM tecnicos WHERE nombre = $1', [nombreTecnico]);
      if (tecnico.rowCount === 0) {
        return res.status(400).json({ error: `Técnico no encontrado: ${nombreTecnico}` });
      }
    }

    // Actualizar incidente
    await pool.query(
      `UPDATE incidentes 
       SET fecha = $1, ubicacion = $2, tipo = $3, causa = $4, gravedad = $5, estado = $6
       WHERE id = $7`,
      [fecha, ubicacion, tipo, causa, gravedad, estado, id]
    );

    // Actualizar robots
    await pool.query('DELETE FROM incidentes_robots WHERE incidente_id = $1', [id]);
    for (const nombreRobot of robots) {
      const robot = await pool.query('SELECT id FROM robots WHERE nombre = $1', [nombreRobot]);
      await pool.query(
        'INSERT INTO incidentes_robots (incidente_id, robot_id) VALUES ($1, $2)',
        [id, robot.rows[0].id]
      );
    }

    // Actualizar técnicos
    await pool.query('DELETE FROM incidentes_tecnicos WHERE incidente_id = $1', [id]);
    for (const nombreTecnico of tecnicos || []) {
      const tecnico = await pool.query('SELECT id FROM tecnicos WHERE nombre = $1', [nombreTecnico]);
      await pool.query(
        'INSERT INTO incidentes_tecnicos (incidente_id, tecnico_id) VALUES ($1, $2)',
        [id, tecnico.rows[0].id]
      );
    }

    res.json({ mensaje: 'Incidente actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar incidente' });
  }
});

// Eliminar incidente
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query('DELETE FROM incidentes WHERE id = $1', [id]);
    res.json({ mensaje: 'Incidente eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar incidente' });
  }
});

module.exports = router;*/