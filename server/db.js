const { Pool } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
require('dotenv').config();

let pool;
let mailUser='jorge.morenot@sansano.usm.cl'

async function initializePool() {

  const credential = new DefaultAzureCredential();
  const token = await credential.getToken("https://ossrdbms-aad.database.windows.net/.default");
  
  pool = new Pool({
    host: 'logisticabasedatos.postgres.database.azure.com',
    user: mailUser,
    database: 'postgres',
    port: 5432,
    password: token.token,
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