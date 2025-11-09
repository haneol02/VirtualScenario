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
        scene_id: sceneId,
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
        path_data: path_data ? JSON.stringify(path_data) : null,
        order_index,
        show_nametag,
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
      const updateData: any = { ...data };
      if (updateData.pathData !== undefined) {
        updateData.path_data = updateData.pathData ? JSON.stringify(updateData.pathData) : null;
        delete updateData.pathData;
      }
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

  console.log('[IPC] Objects handlers registered');
}
