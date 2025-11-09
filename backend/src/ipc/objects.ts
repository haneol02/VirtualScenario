// @ts-ignore
import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

export function registerObjectsHandlers(db: DatabaseManager) {
  // GET scene objects
  ipcMain.handle('get-scene-objects', async (_event: any, sceneId: string) => {
    try {
      return db.getSceneObjects(sceneId);
    } catch (error: any) {
      console.error('[IPC] get-scene-objects error:', error);
      throw new Error(error.message);
    }
  });

  // CREATE scene object
  ipcMain.handle('create-scene-object', async (_event: any, sceneId: string, data: any) => {
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
        path_data,
        order_index = 0,
        show_nametag = 1,
      } = data;

      if (!name) {
        throw new Error('Name is required');
      }

      db.createSceneObject({
        id,
        sceneId: sceneId,
        name,
        type,
        assetId: asset_id,
        transform: {
          position: [position_x, position_y, position_z],
          rotation: [rotation_x, rotation_y, rotation_z],
          scale: [scale_x, scale_y, scale_z],
        },
        color,
        pathData: path_data,
        metadata: null,
      });

      const obj = db.getSceneObject(id);
      return obj;
    } catch (error: any) {
      console.error('[IPC] create-scene-object error:', error);
      throw new Error(error.message);
    }
  });

  // UPDATE scene object
  ipcMain.handle('update-scene-object', async (_event: any, sceneId: string, id: string, data: any) => {
    try {
      const updateData: any = {};

      // Convert snake_case from frontend to camelCase for DatabaseManager
      if (data.name !== undefined) updateData.name = data.name;
      if (data.modelId !== undefined) updateData.modelId = data.modelId;
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

      if (data.pathData !== undefined) updateData.pathData = data.pathData;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;

      db.updateSceneObject(id, updateData);
    } catch (error: any) {
      console.error('[IPC] update-scene-object error:', error);
      throw new Error(error.message);
    }
  });

  // DELETE scene object
  ipcMain.handle('delete-scene-object', async (_event: any, sceneId: string, id: string) => {
    try {
      db.deleteSceneObject(id);
    } catch (error: any) {
      console.error('[IPC] delete-scene-object error:', error);
      throw new Error(error.message);
    }
  });

  // REORDER scene objects
  ipcMain.handle('reorder-scene-objects', async (_event: any, sceneId: string, orderedIds: string[]) => {
    try {
      db.reorderSceneObjects(sceneId, orderedIds);
    } catch (error: any) {
      console.error('[IPC] reorder-scene-objects error:', error);
      throw new Error(error.message);
    }
  });

  console.log('[IPC] Objects handlers registered');
}
