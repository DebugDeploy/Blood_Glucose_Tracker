import '../config.js';
import pg from 'pg';

// DATABASE_URL is read from the private .env file.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
pool.on('error', error => {
  console.error('PostgreSQL connection error:', error.message);
});
