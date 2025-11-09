// @ts-ignore
import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../database';

export function registerDialoguesHandlers(db: DatabaseManager) {
  // GET dialogues by scene ID
  ipcMain.handle('get-dialogues', async (_event: any, sceneId: string) => {
    try {
      return db.getDialogues(sceneId);
    } catch (error: any) {
      console.error('[IPC] get-dialogues error:', error);
      throw new Error(error.message);
    }
  });

  // CREATE dialogue
  ipcMain.handle('create-dialogue', async (_event: any, sceneId: string, data: any) => {
    try {
      const id = uuidv4();
      const { speaker, text, start_time = 0, end_time = 5, object_id, order_index = 0 } = data;

      if (!text) {
        throw new Error('Text is required');
      }

      db.createDialogue({
        id,
        sceneId: sceneId,
        objectId: object_id,
        speakerName: speaker,
        text,
        startTime: start_time,
        duration: end_time - start_time,
        audioPath: null,
      });

      const dialogue = db.getDialogue(id);
      return dialogue;
    } catch (error: any) {
      console.error('[IPC] create-dialogue error:', error);
      throw new Error(error.message);
    }
  });

  // UPDATE dialogue
  ipcMain.handle('update-dialogue', async (_event: any, sceneId: string, id: string, data: any) => {
    try {
      db.updateDialogue(id, data);
    } catch (error: any) {
      console.error('[IPC] update-dialogue error:', error);
      throw new Error(error.message);
    }
  });

  // DELETE dialogue
  ipcMain.handle('delete-dialogue', async (_event: any, sceneId: string, id: string) => {
    try {
      db.deleteDialogue(id);
    } catch (error: any) {
      console.error('[IPC] delete-dialogue error:', error);
      throw new Error(error.message);
    }
  });

  // REORDER dialogues
  ipcMain.handle('reorder-dialogues', async (_event: any, sceneId: string, orderedIds: string[]) => {
    try {
      db.reorderDialogues(sceneId, orderedIds);
    } catch (error: any) {
      console.error('[IPC] reorder-dialogues error:', error);
      throw new Error(error.message);
    }
  });

  console.log('[IPC] Dialogues handlers registered');
}
