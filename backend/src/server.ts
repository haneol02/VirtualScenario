import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { DatabaseManager } from './database';
import { createProjectsRouter } from './routes/projects';
import { createScenesRouter } from './routes/scenes';
import { createBackgroundMapsRouter } from './routes/backgroundMaps';
import { createAssetsRouter } from './routes/assets';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Determine base directory (for Electron, use app data folder)
const isElectron = process.env.ELECTRON_RUN_AS_NODE || process.versions.electron;
const baseDir = isElectron
  ? path.join(process.env.APPDATA || process.env.HOME || __dirname, 'VirtualScenario')
  : __dirname;

// Ensure upload directories exist
const uploadsDir = path.join(baseDir, 'uploads');
const modelsDir = path.join(uploadsDir, 'models');
const imagesDir = path.join(uploadsDir, 'images');

[uploadsDir, modelsDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development (change in production)
  credentials: true
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Initialize database (use app data folder in Electron)
const dbPath = isElectron
  ? path.join(baseDir, 'data', 'scenario.db')
  : undefined; // Will use default path
const db = new DatabaseManager(dbPath);

// Routes
app.use('/api/projects', createProjectsRouter(db));
app.use('/api/scenes', createScenesRouter(db));
app.use('/api/background-maps', createBackgroundMapsRouter(db));
app.use('/api/assets', createAssetsRouter(db, uploadsDir));

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
