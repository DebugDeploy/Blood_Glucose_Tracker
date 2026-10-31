import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Test connection and provide helpful error message
pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.error('\n💡 Quick fix:');
    console.error('   1. Make sure PostgreSQL is installed and running');
    console.error('   2. Check your DATABASE_URL in .env file');
    console.error('   3. See SETUP_GUIDE.md for detailed instructions\n');
  }
});
