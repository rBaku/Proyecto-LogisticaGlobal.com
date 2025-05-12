const { Pool } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
require('dotenv').config();

async function getAzureToken() {
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken('https://ossrdbms-aad.database.windows.net');
  return token.token;
}

let pool;

async function initializePool() {

  const accessToken = await getAzureToken();
  
  pool = new Pool({
    host: process.env.DB_HOST, // Leído desde .env
    user: process.env.DB_USER, // Leído desde .env
    database: process.env.DB_NAME, // Leído desde .env
    port: parseInt(process.env.DB_PORT, 10), // Leído desde .env y convertido a número
    password: accessToken,
    ssl: {
      rejectUnauthorized: false,
    },
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  return pool;
}

// Inicializar el pool al cargar el módulo
initializePool().catch(err => {
  console.error('Error al inicializar el pool de conexiones:', err);
  process.exit(1);
});

module.exports = {
  async query(text, params) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (err) {
      console.error(`Error en la consulta "${text}":`, err);
      throw err;
    }
  }
};