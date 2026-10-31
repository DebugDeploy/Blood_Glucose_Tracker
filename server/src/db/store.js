import { pool } from './pool.js';

export async function initializeStore() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS readings (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, reading_date DATE NOT NULL, slot TEXT NOT NULL CHECK (slot IN ('Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner')), value INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, reading_date, slot));
    CREATE INDEX IF NOT EXISTS readings_user_date_idx ON readings(user_id, reading_date);
  `);
  console.log('PostgreSQL tables are ready.');
}

export async function createUser({ name, email, passwordHash }) {
  const { rows } = await pool.query('INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email', [name,email,passwordHash]);
  return rows[0];
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT id,name,email,password_hash FROM users WHERE email=$1', [email]);
  return rows[0] || null;
}

export async function listReadings(userId, limit = 100, offset = 0) {
  const { rows } = await pool.query('SELECT id,reading_date AS date,slot,value FROM readings WHERE user_id=$1 ORDER BY reading_date DESC,slot ASC LIMIT $2 OFFSET $3', [userId,limit,offset]);
  return rows;
}

export async function saveReading(userId, { id, date, slot, value }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize writes for this user's date so concurrent requests cannot exceed four readings.
    await client.query('SELECT pg_advisory_xact_lock($1, hashtext($2))', [userId, date]);
    const { rows: existing } = await client.query('SELECT id FROM readings WHERE user_id=$1 AND reading_date=$2 AND slot=$3 AND ($4::int IS NULL OR id<>$4)', [userId,date,slot,id || null]);
    if (existing.length) { const error = new Error(`You already have an ${slot} reading for this date.`); error.status = 409; throw error; }
    const { rows: count } = await client.query('SELECT COUNT(*)::int AS count FROM readings WHERE user_id=$1 AND reading_date=$2 AND ($3::int IS NULL OR id<>$3)', [userId,date,id || null]);
    if (count[0].count >= 4) { const error = new Error('You can add only 4 readings per day.'); error.status = 409; throw error; }
    const result = id
      ? await client.query('UPDATE readings SET reading_date=$1,slot=$2,value=$3 WHERE id=$4 AND user_id=$5 RETURNING id,reading_date AS date,slot,value', [date,slot,value,id,userId])
      : await client.query('INSERT INTO readings(reading_date,slot,value,user_id) VALUES($1,$2,$3,$4) RETURNING id,reading_date AS date,slot,value', [date,slot,value,userId]);
    if (!result.rows[0]) { const error = new Error('Reading not found.'); error.status = 404; throw error; }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') { error.status = 409; error.message = `You already have an ${slot} reading for this date.`; }
    throw error;
  } finally { client.release(); }
}

export async function deleteReading(userId, id) {
  const result = await pool.query('DELETE FROM readings WHERE id=$1 AND user_id=$2', [id,userId]);
  return result.rowCount > 0;
}

export async function getReportReadings(userId, start, end) {
  const { rows } = await pool.query('SELECT id,reading_date AS date,slot,value FROM readings WHERE user_id=$1 AND reading_date BETWEEN $2 AND $3 ORDER BY reading_date,slot', [userId,start,end]);
  return rows;
}
