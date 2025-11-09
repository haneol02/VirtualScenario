// @ts-ignore
import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

export function registerAssetsHandlers(db: DatabaseManager) {
  // GET all assets
  ipcMain.handle('get-assets', async () => {
    try {
      return db.getAssets();
    } catch (error: any) {
      console.error('[IPC] get-assets error:', error);
      throw new Error(error.message);
    }
  });

  // GET asset by ID
  ipcMain.handle('get-asset', async (_event, id: string) => {
    try {
      const asset = db.getAsset(id);
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
  ipcMain.handle('create-asset', async (_event, data: any) => {
    try {
      const id = uuidv4();
      const { name, type, file_path, thumbnail_path } = data;

      if (!name || !type) {
        throw new Error('Name and type are required');
      }

      db.createAsset({ id, name, type, file_path, thumbnail_path });
      const asset = db.getAsset(id);
      return asset;
    } catch (error: any) {
      console.error('[IPC] create-asset error:', error);
      throw new Error(error.message);
    }
  });

  // DELETE asset
  ipcMain.handle('delete-asset', async (_event, id: string) => {
    try {
      db.deleteAsset(id);
    } catch (error: any) {
      console.error('[IPC] delete-asset error:', error);
      throw new Error(error.message);
    }
  });

  console.log('[IPC] Assets handlers registered');
}
