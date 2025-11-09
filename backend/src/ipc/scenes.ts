// @ts-ignore
import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

export function registerScenesHandlers(db: DatabaseManager) {
  // GET scenes by project ID
  ipcMain.handle('get-scenes', async (_event: any, projectId: string) => {
    try {
      return db.getScenes(projectId);
    } catch (error: any) {
      console.error('[IPC] get-scenes error:', error);
      throw new Error(error.message);
    }
  });

  // GET scene by ID
  ipcMain.handle('get-scene', async (_event: any, id: string) => {
    try {
      const scene = db.getScene(id);
      if (!scene) {
        throw new Error('Scene not found');
      }
      return scene;
    } catch (error: any) {
      console.error('[IPC] get-scene error:', error);
      throw new Error(error.message);
    }
  });

  // CREATE scene
  ipcMain.handle('create-scene', async (_event: any, projectId: string, data: any) => {
    try {
      const id = uuidv4();
      const { title, description, duration = 10, order_index = 0, background_map_id } = data;

      if (!title) {
        throw new Error('Title is required');
      }

      db.createScene({ id, project_id: projectId, title, description, duration, order_index, background_map_id });
      const scene = db.getScene(id);
      return scene;
    } catch (error: any) {
      console.error('[IPC] create-scene error:', error);
      throw new Error(error.message);
    }
  });

  // UPDATE scene
  ipcMain.handle('update-scene', async (_event: any, id: string, data: any) => {
    try {
      db.updateScene(id, data);
    } catch (error: any) {
      console.error('[IPC] update-scene error:', error);
      throw new Error(error.message);
    }
  });

  // DELETE scene
  ipcMain.handle('delete-scene', async (_event: any, id: string) => {
    try {
      db.deleteScene(id);
    } catch (error: any) {
      console.error('[IPC] delete-scene error:', error);
      throw new Error(error.message);
    }
  });

  console.log('[IPC] Scenes handlers registered');
}
