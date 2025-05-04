const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'logisticaglobal',
  password: 'psql',
  port: 5432
});

module.exports = pool;