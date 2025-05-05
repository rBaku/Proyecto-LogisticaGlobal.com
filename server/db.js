const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'logistica',
  password: 'psql',
  port: 5432
});

module.exports = pool;