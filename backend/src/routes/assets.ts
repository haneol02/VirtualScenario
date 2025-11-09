import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

// Configure multer storage for models
const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/models'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

// Configure multer storage for images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/images'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

// File filter for 3D models
const modelFilter = (req: any, file: any, cb: any) => {
  const allowedFormats = ['.glb', '.gltf', '.obj', '.fbx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed: ${allowedFormats.join(', ')}`));
  }
};

// File filter for images
const imageFilter = (req: any, file: any, cb: any) => {
  const allowedFormats = ['.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed: ${allowedFormats.join(', ')}`));
  }
};

const uploadModel = multer({
  storage: modelStorage,
  fileFilter: modelFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  }
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
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
  router.post('/upload/model', uploadModel.single('file'), (req, res) => {
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
      console.error('Failed to upload model:', error);
      res.status(500).json({ error: 'Failed to upload model' });
    }
  });

  // Upload image
  router.post('/upload/image', uploadImage.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { name, category } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name and category are required' });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileFormat = ext.substring(1); // Remove dot (.png -> png)
      const filePath = `/uploads/images/${req.file.filename}`;

      const asset = db.createAsset({
        name,
        category,
        type: 'image',
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
      console.error('Failed to upload image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Create text asset
  router.post('/text', (req, res) => {
    try {
      const { name, category, text_content, text_font_size, text_color } = req.body;

      if (!name || !category || !text_content) {
        return res.status(400).json({ error: 'Name, category, and text_content are required' });
      }

      const asset = db.createAsset({
        name,
        category,
        type: 'text',
        text_content,
        text_font_size: text_font_size || 1.0,
        text_color: text_color || '#ffffff',
        metadata: JSON.stringify({
          createdAt: new Date().toISOString()
        })
      });

      res.json(asset);
    } catch (error) {
      console.error('Failed to create text asset:', error);
      res.status(500).json({ error: 'Failed to create text asset' });
    }
  });

  // Update asset
  router.put('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { name, category } = req.body;

      const updatedAsset = db.updateAsset(id, { name, category });
      res.json(updatedAsset);
    } catch (error) {
      console.error('Failed to update asset:', error);
      res.status(500).json({ error: 'Failed to update asset' });
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
