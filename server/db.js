const { Pool } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
require('dotenv').config();

let pool;

async function initializePool() {
  if (pool) return pool; // Si ya está inicializado, retorna el pool

  const credential = new DefaultAzureCredential();
  try {
    const token = await credential.getToken("https://ossrdbms-aad.database.windows.net/.default");

    pool = new Pool({
      host: process.env.DB_HOST, // Leído desde .env
      user: process.env.DB_USER, // Leído desde .env
      database: process.env.DB_NAME, // Leído desde .env
      port: parseInt(process.env.DB_PORT, 10), // Leído desde .env y convertido a número
      password: token.token,
      ssl: { rejectUnauthorized: false },
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    //console.log('Pool de base de datos inicializado');
    return pool;
  } catch (error) {
    console.error('Error al obtener el token de Azure:', error);
    throw error; // Re-lanzamos el error para que se maneje donde se llama la función
  }
}

module.exports = {
  initializePool,
  query: async (text, params) => {
    if (!pool) {
      // Asegurarnos de que el pool ha sido inicializado
      await initializePool(); // Llamamos a initializePool si no se ha hecho previamente
    }

    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error(`Error en la consulta "${text}":`, err);
      throw err;
    }
  }
};
