// @ts-ignore
import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
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

  // DELETE asset
  ipcMain.handle('delete-asset', async (_event: any, id: string) => {
    try {
      db.deleteAsset(id);
    } catch (error: any) {
      console.error('[IPC] delete-asset error:', error);
      throw new Error(error.message);
    }
  });

  console.log('[IPC] Assets handlers registered');
}
