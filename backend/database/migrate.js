// backend/database/migrate.js
// Ejecuta todas las migraciones en orden numérico.
// Uso: node database/migrate.js
// Requiere: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME en .env

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,          // necesario para ejecutar varios statements por archivo
  });

  console.log('Conectado a MySQL');

  // Tabla de control — registra qué migraciones ya corrieron
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INT          NOT NULL AUTO_INCREMENT,
      filename   VARCHAR(255) NOT NULL,
      applied_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_migration_file (filename)
    )
  `);

  // Leer archivos .sql en orden numérico
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Obtener migraciones ya aplicadas
  const [applied] = await conn.execute('SELECT filename FROM _migrations');
  const appliedSet = new Set(applied.map(r => r.filename));

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`  ✓ ${file} (ya aplicada)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

    try {
      await conn.query(sql);
      await conn.execute(
        'INSERT INTO _migrations (filename) VALUES (?)', [file]
      );
      console.log(`  → ${file} aplicada`);
      count++;
    } catch (err) {
      console.error(`\n ERROR en ${file}:`);
      console.error(err.message);
      await conn.end();
      process.exit(1);
    }
  }

  console.log(`\nMigraciones completadas: ${count} nuevas aplicadas.`);
  await conn.end();
}

run().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
