// @ts-ignore
import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseManager } from '../database';

export function registerAssetsHandlers(db: DatabaseManager) {
  // GET all assets
  ipcMain.handle('get-assets', async () => {
    try {
      return db.getAllAssets();
    } catch (error: any) {
      console.error('[IPC] get-assets error:', error);
      throw new Error(error.message);
    }
  });

  // GET asset by ID
  ipcMain.handle('get-asset', async (_event: any, id: string) => {
    try {
      const assets = db.getAllAssets();
      const asset = assets.find((a: any) => a.id === id);
      if (!asset) {
        throw new Error('Asset not found');
      }
      return asset;
    } catch (error: any) {
      console.error('[IPC] get-asset error:', error);
      throw new Error(error.message);
    }
  });

  // CREATE asset
  ipcMain.handle('create-asset', async (_event: any, data: any) => {
    try {
      const { name, category, type, file_path, file_format, text_content, text_font_size, text_color, metadata } = data;

      if (!name || !category) {
        throw new Error('Name and category are required');
      }

      const asset = db.createAsset({
        name,
        category,
        type,
        file_path,
        file_format,
        text_content,
        text_font_size,
        text_color,
        metadata,
      });
      return asset;
    } catch (error: any) {
      console.error('[IPC] create-asset error:', error);
      throw new Error(error.message);
    }
  });

  // UPDATE asset
  ipcMain.handle('update-asset', async (_event: any, id: string, data: any) => {
    try {
      const asset = db.updateAsset(id, data);
      return asset;
    } catch (error: any) {
      console.error('[IPC] update-asset error:', error);
      throw new Error(error.message);
    }
  });

  // DELETE asset
  ipcMain.handle('delete-asset', async (_event: any, id: string) => {
    try {
      db.deleteAsset(id);
    } catch (error: any) {
      console.error('[IPC] delete-asset error:', error);
      throw new Error(error.message);
    }
  });

  // UPLOAD MODEL - Save file and create asset
  ipcMain.handle('upload-model', async (_event: any, fileBuffer: Buffer, fileName: string, name: string, category: string) => {
    try {
      // Determine upload directory
      const isPackaged = (process as any).resourcesPath !== undefined;
      let uploadsDir: string;

      if (isPackaged) {
        // Production: use app data directory
        const userDataPath = process.env.APPDATA || process.env.HOME || process.cwd();
        uploadsDir = path.join(userDataPath, 'VirtualScenario', 'uploads', 'models');
      } else {
        // Development: use local uploads directory
        uploadsDir = path.join(__dirname, '../../uploads/models');
      }

      // Ensure directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExt = path.extname(fileName);
      const baseName = path.basename(fileName, fileExt);
      const uniqueFileName = `${baseName}_${Date.now()}${fileExt}`;
      const filePath = path.join(uploadsDir, uniqueFileName);

      // Save file
      fs.writeFileSync(filePath, fileBuffer);

      // Determine file format
      const fileFormat = fileExt.slice(1).toLowerCase(); // Remove leading dot

      // Create asset in database
      const asset = db.createAsset({
        name,
        category,
        type: 'model',
        file_path: filePath,
        file_format: fileFormat,
      });

      console.log('[IPC] Model uploaded:', uniqueFileName);
      return asset;
    } catch (error: any) {
      console.error('[IPC] upload-model error:', error);
      throw new Error(error.message);
    }
  });

  // UPLOAD IMAGE - Save file and create asset
  ipcMain.handle('upload-image', async (_event: any, fileBuffer: Buffer, fileName: string, name: string, category: string) => {
    try {
      // Determine upload directory
      const isPackaged = (process as any).resourcesPath !== undefined;
      let uploadsDir: string;

      if (isPackaged) {
        // Production: use app data directory
        const userDataPath = process.env.APPDATA || process.env.HOME || process.cwd();
        uploadsDir = path.join(userDataPath, 'VirtualScenario', 'uploads', 'images');
      } else {
        // Development: use local uploads directory
        uploadsDir = path.join(__dirname, '../../uploads/images');
      }

      // Ensure directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExt = path.extname(fileName);
      const baseName = path.basename(fileName, fileExt);
      const uniqueFileName = `${baseName}_${Date.now()}${fileExt}`;
      const filePath = path.join(uploadsDir, uniqueFileName);

      // Save file
      fs.writeFileSync(filePath, fileBuffer);

      // Determine file format
      const fileFormat = fileExt.slice(1).toLowerCase(); // Remove leading dot

      // Create asset in database
      const asset = db.createAsset({
        name,
        category,
        type: 'image',
        file_path: filePath,
        file_format: fileFormat,
      });

      console.log('[IPC] Image uploaded:', uniqueFileName);
      return asset;
    } catch (error: any) {
      console.error('[IPC] upload-image error:', error);
      throw new Error(error.message);
    }
  });

  console.log('[IPC] Assets handlers registered');
}
