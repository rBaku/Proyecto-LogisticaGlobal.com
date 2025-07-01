// db.js
const { Pool } = require('pg');

// Pool global para usar en todas las pruebas/rutas
let pool;

/**
 * Inicializa el pool de conexiones con los valores del entorno.
 */
async function initializePool() {
  if (!pool) {
    pool = new Pool({
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    try {
      await pool.query('SELECT 1'); // Verifica conexión
      console.log('✅ Conexión a base de datos exitosa');
    } catch (err) {
      console.error('❌ Error conectando a la base de datos:', err.message);
      throw err;
    }
  }
}

/**
 * Realiza una consulta SQL utilizando el pool.
 * @param {string} text - Consulta SQL.
 * @param {Array} params - Parámetros opcionales.
 */
async function query(text, params) {
  if (!pool) {
    throw new Error('El pool no ha sido inicializado. Llama a initializePool primero.');
  }
  return pool.query(text, params);
}

module.exports = {
  initializePool,
  query,
};
