import express from 'express';
import cors from 'cors';
import path from 'path';
import { DatabaseManager } from './database';
import { createProjectsRouter } from './routes/projects';
import { createScenesRouter } from './routes/scenes';
import { createBackgroundMapsRouter } from './routes/backgroundMaps';
import { createAssetsRouter } from './routes/assets';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development (change in production)
  credentials: true
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize database
const db = new DatabaseManager();

// Routes
app.use('/api/projects', createProjectsRouter(db));
app.use('/api/scenes', createScenesRouter(db));
app.use('/api/background-maps', createBackgroundMapsRouter(db));
app.use('/api/assets', createAssetsRouter(db));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VirtualScenario Backend API' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://0.0.0.0:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close();
  process.exit(0);
});
