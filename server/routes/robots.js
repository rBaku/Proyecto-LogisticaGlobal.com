const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener todos los robots
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM robots ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener robots' });
  }
});

module.exports = router;