import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import readingRoutes from './routes/readings.js';
import reportRoutes from './routes/reports.js';
import { requireAuth } from './middleware/auth.js';
import { initializeStore } from './db/store.js';

// Initialize database tables
try {
  await initializeStore();
} catch (error) {
  console.error('❌ Failed to initialize database:', error.message);
  console.error('\n💡 Make sure:');
  console.error('   1. PostgreSQL is running');
  console.error('   2. Database "sweety" exists');
  console.error('   3. DATABASE_URL in .env is correct');
  console.error('   4. See SETUP_GUIDE.md for help\n');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.get('/', (_req,res) => res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sweety API</title><style>body{font:16px system-ui,sans-serif;background:#0a0e1a;color:#e8ecf5;display:grid;place-items:center;min-height:100vh;margin:0}.card{max-width:520px;background:#0f1420;padding:34px;border:1px solid #1e2535;border-radius:14px}h1{margin:0 0 10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}p{line-height:1.6;color:#9ca3af}a{color:#6366f1}code{background:#1a1f2e;padding:3px 7px;border-radius:4px;color:#a5b4fc}</style></head><body><main class="card"><h1>Sweety API is running</h1><p>This is the backend service. Open the <a href="http://localhost:5173">Sweety app</a> to use the tracker.</p><p>Health check: <a href="/api/health"><code>/api/health</code></a></p></main></body></html>`));
app.get('/api/health', (_req,res) => res.json({ status:'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/readings', requireAuth, readingRoutes);
app.use('/api/reports', requireAuth, reportRoutes);
app.use((error,_req,res,_next) => { console.error(error); res.status(500).json({ error:'Something went wrong. Please try again.' }); });

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`\n✅ Sweety API listening on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🎨 Frontend: http://localhost:5173\n`);
});
