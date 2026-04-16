const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // ⚠️ cambia si usas otra clave
  database: 'app'
});

module.exports = pool;