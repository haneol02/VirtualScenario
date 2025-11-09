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
        backgroundMapId: mapId,
        name,
        type,
        modelId: asset_id,
        color,
        positionX: position_x,
        positionY: position_y,
        positionZ: position_z,
        rotationX: rotation_x,
        rotationY: rotation_y,
        rotationZ: rotation_z,
        scaleX: scale_x,
        scaleY: scale_y,
        scaleZ: scale_z,
        metadata: null,
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
      const updateData: any = {};

      // Convert snake_case from frontend to camelCase for DatabaseManager
      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.modelId !== undefined) updateData.modelId = data.modelId;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.showNametag !== undefined) updateData.showNametag = data.showNametag;

      // Convert flat position/rotation/scale to transform object
      const hasPosition = data.position_x !== undefined || data.position_y !== undefined || data.position_z !== undefined;
      const hasRotation = data.rotation_x !== undefined || data.rotation_y !== undefined || data.rotation_z !== undefined;
      const hasScale = data.scale_x !== undefined || data.scale_y !== undefined || data.scale_z !== undefined;

      if (hasPosition || hasRotation || hasScale) {
        updateData.transform = {};
        if (hasPosition) {
          updateData.transform.position = [
            data.position_x !== undefined ? data.position_x : 0,
            data.position_y !== undefined ? data.position_y : 0,
            data.position_z !== undefined ? data.position_z : 0
          ];
        }
        if (hasRotation) {
          updateData.transform.rotation = [
            data.rotation_x !== undefined ? data.rotation_x : 0,
            data.rotation_y !== undefined ? data.rotation_y : 0,
            data.rotation_z !== undefined ? data.rotation_z : 0
          ];
        }
        if (hasScale) {
          updateData.transform.scale = [
            data.scale_x !== undefined ? data.scale_x : 1,
            data.scale_y !== undefined ? data.scale_y : 1,
            data.scale_z !== undefined ? data.scale_z : 1
          ];
        }
      }

      if (data.metadata !== undefined) updateData.metadata = data.metadata;

      db.updateBackgroundObject(id, updateData);
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
