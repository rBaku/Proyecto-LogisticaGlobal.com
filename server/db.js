const { Pool } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');

async function getAzureToken() {
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken('https://ossrdbms-aad.database.windows.net');
  return token.token;
}

let pool;

async function initializePool() {
  const accessToken = await getAzureToken();
  
  pool = new Pool({
    host: 'logisticabasedatos.postgres.database.azure.com',
    user: 'rodolfo.osorio@usm.cl',
    database: 'postgres',
    port: 5432,
    password: accessToken,
    ssl: {
      rejectUnauthorized: false
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
      console.error('Error en la consulta:', err);
      throw err;
    }
  }
};