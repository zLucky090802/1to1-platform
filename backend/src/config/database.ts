// src/config/database.ts
import mysql from 'mysql2/promise';

// Pool de conexiones — reutiliza conexiones en lugar de abrir una nueva por request.
// El pool mantiene hasta 10 conexiones activas y las devuelve al pool al terminar.
export const db = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           'Z',                 // almacena siempre en UTC
  charset:            'utf8mb4',
});

// Verificar conexión al arrancar
export async function connectDB(): Promise<void> {
  try {
    const conn = await db.getConnection();
    console.log('✓ MySQL conectado');
    conn.release();
  } catch (err) {
    console.error('✗ Error conectando a MySQL:', err);
    process.exit(1);
  }
}
