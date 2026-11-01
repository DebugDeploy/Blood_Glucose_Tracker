import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// First connect to postgres database to create sweety database
const adminPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Samarth_2006',
  port: 5432,
});

try {
  // Try to create the database
  await adminPool.query('CREATE DATABASE sweety');
  console.log('✅ Database "sweety" created');
} catch (error) {
  if (error.code === '42P04') {
    console.log('✅ Database "sweety" already exists');
  } else {
    console.error('Error creating database:', error.message);
  }
}
await adminPool.end();

// Now connect to sweety database and create tables
export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sweety',
  password: 'Samarth_2006',
  port: 5432,
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    slot TEXT NOT NULL CHECK (slot IN ('Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner')),
    value INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, reading_date, slot)
  );
  CREATE INDEX IF NOT EXISTS readings_user_date_idx ON readings(user_id, reading_date);
`);
console.log('✅ Database tables are ready.');
await pool.end();
