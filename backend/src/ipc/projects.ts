// @ts-ignore
import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

export function registerProjectsHandlers(db: DatabaseManager) {
  // GET all projects
  ipcMain.handle('get-projects', async () => {
    try {
      return db.getProjects();
    } catch (error: any) {
      console.error('[IPC] get-projects error:', error);
      throw new Error(error.message);
    }
  });

  // GET project by ID
  ipcMain.handle('get-project', async (_event, id: string) => {
    try {
      const project = db.getProject(id);
      if (!project) {
        throw new Error('Project not found');
      }
      return project;
    } catch (error: any) {
      console.error('[IPC] get-project error:', error);
      throw new Error(error.message);
    }
  });

  // CREATE project
  ipcMain.handle('create-project', async (_event, data: any) => {
    try {
      const id = uuidv4();
      const { title, description, version = '1.0' } = data;

      if (!title) {
        throw new Error('Title is required');
      }

      db.createProject({ id, title, description, version });
      const project = db.getProject(id);
      return project;
    } catch (error: any) {
      console.error('[IPC] create-project error:', error);
      throw new Error(error.message);
    }
  });

  // UPDATE project
  ipcMain.handle('update-project', async (_event, id: string, data: any) => {
    try {
      db.updateProject(id, data);
    } catch (error: any) {
      console.error('[IPC] update-project error:', error);
      throw new Error(error.message);
    }
  });

  // DELETE project
  ipcMain.handle('delete-project', async (_event, id: string) => {
    try {
      db.deleteProject(id);
    } catch (error: any) {
      console.error('[IPC] delete-project error:', error);
      throw new Error(error.message);
    }
  });

  // EXPORT project
  ipcMain.handle('export-project', async (_event, id: string) => {
    try {
      const project = db.getProject(id);
      if (!project) {
        throw new Error('Project not found');
      }

      const scenes = db.getScenes(id);
      const scenesWithDetails = scenes.map((scene: any) => {
        const objects = db.getSceneObjects(scene.id);
        const dialogues = db.getDialogues(scene.id);
        return { ...scene, objects, dialogues };
      });

      return {
        project,
        scenes: scenesWithDetails,
      };
    } catch (error: any) {
      console.error('[IPC] export-project error:', error);
      throw new Error(error.message);
    }
  });

  console.log('[IPC] Projects handlers registered');
}
