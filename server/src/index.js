// Load environment variables before importing code that reads them.
import './config.js';

// Import Express framework and middleware
import express from 'express';
import cors from 'cors';

// Import route handlers
import authRoutes from './routes/auth.js';
import readingRoutes from './routes/readings.js';
import reportRoutes from './routes/reports.js';

// Import authentication middleware
import { requireAuth } from './middleware/auth.js';

// Import database initialization
import { initializeStore } from './db/store.js';

// Check if JWT_SECRET is set (required for authentication)
if (!process.env.JWT_SECRET) {
  console.error('Set JWT_SECRET in .env before starting the server.');
  process.exit(1);
}

// Initialize database tables before starting the server
try {
  await initializeStore();
} catch (error) {
  console.error('Could not connect to PostgreSQL or create its tables:', error.message);
  process.exit(1);
}

// Create Express application
const app = express();

// Enable CORS - allows frontend to make requests to API
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
}));

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint - test if server is running
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Mount route handlers
app.use('/api/auth', authRoutes);                      // Login and register (no auth required)
app.use('/api/readings', requireAuth, readingRoutes);  // CRUD readings (auth required)
app.use('/api/reports', requireAuth, reportRoutes);    // Get reports (auth required)

// Error handling middleware - catches all errors
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: 'Something went wrong. Please try again.'
  });
});

// Start the server
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`\n✅ Blood Glucose Tracker API listening on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🎨 Frontend: http://localhost:5173\n`);
});
