import { pool } from './pool.js';

// Create database tables if they don't exist
export async function initializeStore() {
  await pool.query(`
    -- Users table: stores user accounts
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Readings table: stores blood glucose readings
    CREATE TABLE IF NOT EXISTS readings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reading_date DATE NOT NULL,
      slot TEXT NOT NULL CHECK (
        slot IN ('Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner')
      ),
      value INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, reading_date, slot)
    );

    -- Index for faster queries by user and date
    CREATE INDEX IF NOT EXISTS readings_user_date_idx
      ON readings (user_id, reading_date);
  `);

  console.log('✅ PostgreSQL tables are ready.');
}

// Create a new user account
export async function createUser({ name, email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email`,
    [name, email, passwordHash]
  );

  return result.rows[0];
}

// Find a user by email address
export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT id, name, email, password_hash
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
}

// Get list of readings for a user (with pagination)
export async function listReadings(userId, limit = 100, offset = 0) {
  const result = await pool.query(
    `SELECT id, reading_date::text AS date, slot, value
     FROM readings
     WHERE user_id = $1
     ORDER BY reading_date DESC, slot ASC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
}

// Save a new reading or update an existing one
export async function saveReading(userId, { id, date, slot, value }) {
  try {
    // If editing, update the existing reading
    if (id) {
      // Check if another reading exists with same date/slot (but different id)
      const duplicate = await pool.query(
        `SELECT id FROM readings
         WHERE user_id = $1 AND reading_date = $2 AND slot = $3 AND id <> $4`,
        [userId, date, slot, id]
      );

      if (duplicate.rows.length > 0) {
        const error = new Error(`You already have an ${slot} reading for this date.`);
        error.status = 409;
        throw error;
      }

      // Update the reading
      const result = await pool.query(
        `UPDATE readings
         SET reading_date = $1, slot = $2, value = $3
         WHERE id = $4 AND user_id = $5
         RETURNING id, reading_date::text AS date, slot, value`,
        [date, slot, value, id, userId]
      );

      if (!result.rows[0]) {
        const error = new Error('Reading not found.');
        error.status = 404;
        throw error;
      }

      return result.rows[0];
    }

    // If adding new, check for duplicate slot
    const duplicate = await pool.query(
      `SELECT id FROM readings
       WHERE user_id = $1 AND reading_date = $2 AND slot = $3`,
      [userId, date, slot]
    );

    if (duplicate.rows.length > 0) {
      const error = new Error(`You already have an ${slot} reading for this date.`);
      error.status = 409;
      throw error;
    }

    // Check if user already has 4 readings for this day
    const dailyCount = await pool.query(
      `SELECT COUNT(*)::int AS count FROM readings
       WHERE user_id = $1 AND reading_date = $2`,
      [userId, date]
    );

    if (dailyCount.rows[0].count >= 4) {
      const error = new Error('You can add only 4 readings per day.');
      error.status = 409;
      throw error;
    }

    // Insert the new reading
    const result = await pool.query(
      `INSERT INTO readings (reading_date, slot, value, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, reading_date::text AS date, slot, value`,
      [date, slot, value, userId]
    );

    return result.rows[0];
  } catch (error) {
    // Handle unique constraint violation (duplicate reading)
    if (error.code === '23505') {
      error.status = 409;
      error.message = `You already have an ${slot} reading for this date.`;
    }
    throw error;
  }
}

// Delete a reading
export async function deleteReading(userId, id) {
  const result = await pool.query(
    'DELETE FROM readings WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  // Return true if a row was deleted
  return result.rowCount > 0;
}

// Get readings for a date range (used for reports)
export async function getReportReadings(userId, startDate, endDate) {
  const result = await pool.query(
    `SELECT id, reading_date::text AS date, slot, value
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
     ORDER BY reading_date, slot`,
    [userId, startDate, endDate]
  );

  return result.rows;
}
