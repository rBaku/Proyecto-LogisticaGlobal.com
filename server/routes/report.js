const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener incidentes con técnicos por año o mes
router.get('/', async (req, res) => {
  const { period } = req.query; // "monthly" o "yearly"

  try {
    const result = await pool.query(`
      SELECT 
        i.id,
        i.robot_id,
        i.incident_timestamp,
        i.type,
        i.gravity,
        i.status,
        i.cause,
        i.technician_comment,
        DATE_TRUNC($1, i.incident_timestamp) AS period,
        ARRAY_AGG(it.technician_user_id) AS technicians
      FROM incidents i
      LEFT JOIN incident_technicians it ON i.id = it.incident_id
      GROUP BY i.id, period
      ORDER BY period DESC
    `, [period === 'yearly' ? 'year' : 'month']);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener incidentes para reporte:', err);
    res.status(500).json({ error: 'Error al obtener el reporte' });
  }
});

module.exports = router;