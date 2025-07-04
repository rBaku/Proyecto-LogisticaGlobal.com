const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/report?period=monthly&month=6&year=2025
router.get('/', async (req, res) => {
  const { period, month, year } = req.query;

  let startDate, endDate;

  if (period === 'monthly') {
    if (!month || !year) return res.status(400).json({ error: 'Debe especificar mes y año' });
    const m = parseInt(month);
    const y = parseInt(year);
    if (m < 1 || m > 12) return res.status(400).json({ error: 'Mes inválido' });
    startDate = new Date(y, m - 1, 1);
    endDate = new Date(y, m, 1);
  } else if (period === 'yearly') {
    if (!year) return res.status(400).json({ error: 'Debe especificar el año' });
    const y = parseInt(year);
    startDate = new Date(y, 0, 1);
    endDate = new Date(y + 1, 0, 1);
  } else {
    return res.status(400).json({ error: 'Periodo inválido' });
  }

  try {
    const detailQuery = `
      SELECT 
        i.id,
        i.robot_id,
        i.incident_timestamp,
        i.type,
        i.gravity,
        i.status,
        ARRAY(
          SELECT u.username
          FROM incident_technicians it
          JOIN users u ON u.id = it.technician_user_id
          WHERE it.incident_id = i.id
        ) AS technicians
      FROM incidents i
      WHERE i.incident_timestamp BETWEEN $1 AND $2
    `;
    const detailResult = await pool.query(detailQuery, [startDate, endDate]);
    const incidents = detailResult.rows;

    const summaryQuery = `
      SELECT 
        COUNT(*) AS total,
        ROUND(AVG(gravity)::numeric, 2) AS avg_gravity,
        ROUND(AVG(EXTRACT(EPOCH FROM (finished_at - incident_timestamp)) / 3600)::numeric, 2) AS avg_resolution_time_hours
      FROM incidents
      WHERE incident_timestamp BETWEEN $1 AND $2
    `;
    const summaryResult = await pool.query(summaryQuery, [startDate, endDate]);
    const summaryBase = summaryResult.rows[0];

    const typeQuery = `
      SELECT type, COUNT(*) AS count
      FROM incidents
      WHERE incident_timestamp BETWEEN $1 AND $2
      GROUP BY type
    `;
    const statusQuery = `
      SELECT status, COUNT(*) AS count
      FROM incidents
      WHERE incident_timestamp BETWEEN $1 AND $2
      GROUP BY status
    `;
    const [typeResult, statusResult] = await Promise.all([
      pool.query(typeQuery, [startDate, endDate]),
      pool.query(statusQuery, [startDate, endDate])
    ]);

    const byType = {};
    for (const row of typeResult.rows) byType[row.type] = parseInt(row.count);

    const byStatus = {};
    for (const row of statusResult.rows) byStatus[row.status] = parseInt(row.count);

    res.json({
      incidents,
      summary: {
        total: parseInt(summaryBase.total),
        avgGravity: parseFloat(summaryBase.avg_gravity) || 0,
        avgResolutionTimeHours: parseFloat(summaryBase.avg_resolution_time_hours) || 0,
        byType,
        byStatus
      }
    });
  } catch (err) {
    console.error('Error al obtener el reporte:', err);
    res.status(500).json({ error: 'Error al obtener el reporte' });
  }
});

module.exports = router;