import { initializeStore } from './store.js';
import { pool } from './pool.js';

// The PostgreSQL database must already exist. This command creates its tables.
try {
  await initializeStore();
} finally {
  await pool.end();
}
