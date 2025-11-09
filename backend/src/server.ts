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
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Vite dev server ports
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
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'VirtualScenario Backend API' });
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
