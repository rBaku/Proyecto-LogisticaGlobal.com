const express = require('express');
const router = express.Router();
const pool = require('../db');

// Crear incidente
router.post('/', async (req, res) => {
  const { robots, fecha, ubicacion, tipo, causa } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO incidentes (fecha, ubicacion, tipo, causa) VALUES ($1, $2, $3, $4) RETURNING id',
      [fecha, ubicacion, tipo, causa]
    );

    const incidenteId = result.rows[0].id;

    for (const nombreRobot of robots) {
      const robot = await pool.query('SELECT id FROM robots WHERE nombre = $1', [nombreRobot]);
      if (robot.rowCount === 0) continue;
      await pool.query(
        'INSERT INTO incidentes_robots (incidente_id, robot_id) VALUES ($1, $2)',
        [incidenteId, robot.rows[0].id]
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
      SELECT i.*, array_agg(r.nombre) AS robots
      FROM incidentes i
      JOIN incidentes_robots ir ON i.id = ir.incidente_id
      JOIN robots r ON ir.robot_id = r.id
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
      SELECT i.*, array_agg(r.nombre) AS robots
      FROM incidentes i
      JOIN incidentes_robots ir ON i.id = ir.incidente_id
      JOIN robots r ON ir.robot_id = r.id
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
  const { robots, fecha, ubicacion, tipo, causa } = req.body;

  try {
    await pool.query(
      'UPDATE incidentes SET fecha = $1, ubicacion = $2, tipo = $3, causa = $4 WHERE id = $5',
      [fecha, ubicacion, tipo, causa, id]
    );

    await pool.query('DELETE FROM incidentes_robots WHERE incidente_id = $1', [id]);

    for (const nombreRobot of robots) {
      const robot = await pool.query('SELECT id FROM robots WHERE nombre = $1', [nombreRobot]);
      if (robot.rowCount === 0) continue;
      await pool.query(
        'INSERT INTO incidentes_robots (incidente_id, robot_id) VALUES ($1, $2)',
        [id, robot.rows[0].id]
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

module.exports = router;