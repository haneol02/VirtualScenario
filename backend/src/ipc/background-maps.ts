// @ts-ignore
import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

export function registerBackgroundMapsHandlers(db: DatabaseManager) {
  // GET all background maps
  ipcMain.handle('get-background-maps', async () => {
    try {
      return db.getBackgroundMaps();
    } catch (error: any) {
      console.error('[IPC] get-background-maps error:', error);
      throw new Error(error.message);
    }
  });

  // GET background map by ID
  ipcMain.handle('get-background-map', async (_event: any, id: string) => {
    try {
      const map = db.getBackgroundMap(id);
      if (!map) {
        throw new Error('Background map not found');
      }
      return map;
    } catch (error: any) {
      console.error('[IPC] get-background-map error:', error);
      throw new Error(error.message);
    }
  });

  // CREATE background map
  ipcMain.handle('create-background-map', async (_event: any, data: any) => {
    try {
      const id = uuidv4();
      const { name, description } = data;

      if (!name) {
        throw new Error('Name is required');
      }

      db.createBackgroundMap({ id, name, description });
      const map = db.getBackgroundMap(id);
      return map;
    } catch (error: any) {
      console.error('[IPC] create-background-map error:', error);
      throw new Error(error.message);
    }
  });

  // UPDATE background map
  ipcMain.handle('update-background-map', async (_event: any, id: string, data: any) => {
    try {
      db.updateBackgroundMap(id, data);
    } catch (error: any) {
      console.error('[IPC] update-background-map error:', error);
      throw new Error(error.message);
    }
  });

  // DELETE background map
  ipcMain.handle('delete-background-map', async (_event: any, id: string) => {
    try {
      db.deleteBackgroundMap(id);
    } catch (error: any) {
      console.error('[IPC] delete-background-map error:', error);
      throw new Error(error.message);
    }
  });

  // GET background objects by map ID
  ipcMain.handle('get-background-objects', async (_event: any, mapId: string) => {
    try {
      return db.getBackgroundObjects(mapId);
    } catch (error: any) {
      console.error('[IPC] get-background-objects error:', error);
      throw new Error(error.message);
    }
  });

  // CREATE background object
  ipcMain.handle('create-background-object', async (_event: any, mapId: string, data: any) => {
    try {
      const id = uuidv4();
      const {
        name,
        type,
        asset_id,
        position_x = 0,
        position_y = 0,
        position_z = 0,
        rotation_x = 0,
        rotation_y = 0,
        rotation_z = 0,
        scale_x = 1,
        scale_y = 1,
        scale_z = 1,
        color,
        show_nametag = 1,
      } = data;

      if (!name) {
        throw new Error('Name is required');
      }

      db.createBackgroundObject({
        id,
        background_map_id: mapId,
        name,
        type,
        asset_id,
        position_x,
        position_y,
        position_z,
        rotation_x,
        rotation_y,
        rotation_z,
        scale_x,
        scale_y,
        scale_z,
        color,
        show_nametag,
      });

      const obj = db.getBackgroundObject(id);
      return obj;
    } catch (error: any) {
      console.error('[IPC] create-background-object error:', error);
      throw new Error(error.message);
    }
  });

  // UPDATE background object
  ipcMain.handle('update-background-object', async (_event: any, id: string, data: any) => {
    try {
      db.updateBackgroundObject(id, data);
    } catch (error: any) {
      console.error('[IPC] update-background-object error:', error);
      throw new Error(error.message);
    }
  });

  // DELETE background object
  ipcMain.handle('delete-background-object', async (_event: any, id: string) => {
    try {
      db.deleteBackgroundObject(id);
    } catch (error: any) {
      console.error('[IPC] delete-background-object error:', error);
      throw new Error(error.message);
    }
  });

  console.log('[IPC] Background Maps handlers registered');
}
