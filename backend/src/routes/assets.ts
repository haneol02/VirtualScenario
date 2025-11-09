import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/models'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

// File filter for allowed 3D formats
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedFormats = ['.glb', '.gltf', '.obj', '.fbx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed: ${allowedFormats.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  }
});

export function createAssetsRouter(db: DatabaseManager) {
  const router = express.Router();

  // Get all assets
  router.get('/', (req, res) => {
    try {
      const assets = db.getAllAssets();
      res.json(assets);
    } catch (error) {
      console.error('Failed to get assets:', error);
      res.status(500).json({ error: 'Failed to get assets' });
    }
  });

  // Get assets by category
  router.get('/category/:category', (req, res) => {
    try {
      const { category } = req.params;
      const assets = db.getAssetsByCategory(category);
      res.json(assets);
    } catch (error) {
      console.error('Failed to get assets by category:', error);
      res.status(500).json({ error: 'Failed to get assets' });
    }
  });

  // Upload 3D model
  router.post('/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { name, category } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name and category are required' });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileFormat = ext.substring(1); // Remove dot (.glb -> glb)
      const filePath = `/uploads/models/${req.file.filename}`;

      const asset = db.createAsset({
        name,
        category,
        type: 'model',
        file_path: filePath,
        file_format: fileFormat,
        metadata: JSON.stringify({
          originalName: req.file.originalname,
          size: req.file.size,
          uploadedAt: new Date().toISOString()
        })
      });

      res.json(asset);
    } catch (error) {
      console.error('Failed to upload asset:', error);
      res.status(500).json({ error: 'Failed to upload asset' });
    }
  });

  // Delete asset
  router.delete('/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.deleteAsset(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete asset:', error);
      res.status(500).json({ error: 'Failed to delete asset' });
    }
  });

  return router;
}
