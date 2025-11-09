// @ts-ignore
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Projects
  getProjects: () => ipcRenderer.invoke('get-projects'),
  getProject: (id: string) => ipcRenderer.invoke('get-project', id),
  createProject: (data: any) => ipcRenderer.invoke('create-project', data),
  updateProject: (id: string, data: any) => ipcRenderer.invoke('update-project', id, data),
  deleteProject: (id: string) => ipcRenderer.invoke('delete-project', id),
  exportProject: (id: string) => ipcRenderer.invoke('export-project', id),

  // Scenes
  getScenes: (projectId: string) => ipcRenderer.invoke('get-scenes', projectId),
  getScene: (id: string) => ipcRenderer.invoke('get-scene', id),
  createScene: (projectId: string, data: any) => ipcRenderer.invoke('create-scene', projectId, data),
  updateScene: (id: string, data: any) => ipcRenderer.invoke('update-scene', id, data),
  deleteScene: (id: string) => ipcRenderer.invoke('delete-scene', id),

  // Scene Objects
  getSceneObjects: (sceneId: string) => ipcRenderer.invoke('get-scene-objects', sceneId),
  createSceneObject: (sceneId: string, data: any) => ipcRenderer.invoke('create-scene-object', sceneId, data),
  updateSceneObject: (sceneId: string, id: string, data: any) => ipcRenderer.invoke('update-scene-object', sceneId, id, data),
  deleteSceneObject: (sceneId: string, id: string) => ipcRenderer.invoke('delete-scene-object', sceneId, id),

  // Dialogues
  getDialogues: (sceneId: string) => ipcRenderer.invoke('get-dialogues', sceneId),
  createDialogue: (sceneId: string, data: any) => ipcRenderer.invoke('create-dialogue', sceneId, data),
  updateDialogue: (sceneId: string, id: string, data: any) => ipcRenderer.invoke('update-dialogue', sceneId, id, data),
  deleteDialogue: (sceneId: string, id: string) => ipcRenderer.invoke('delete-dialogue', sceneId, id),

  // Background Maps
  getBackgroundMaps: () => ipcRenderer.invoke('get-background-maps'),
  getBackgroundMap: (id: string) => ipcRenderer.invoke('get-background-map', id),
  createBackgroundMap: (data: any) => ipcRenderer.invoke('create-background-map', data),
  updateBackgroundMap: (id: string, data: any) => ipcRenderer.invoke('update-background-map', id, data),
  deleteBackgroundMap: (id: string) => ipcRenderer.invoke('delete-background-map', id),

  // Background Objects
  getBackgroundObjects: (mapId: string) => ipcRenderer.invoke('get-background-objects', mapId),
  createBackgroundObject: (mapId: string, data: any) => ipcRenderer.invoke('create-background-object', mapId, data),
  updateBackgroundObject: (id: string, data: any) => ipcRenderer.invoke('update-background-object', id, data),
  deleteBackgroundObject: (id: string) => ipcRenderer.invoke('delete-background-object', id),

  // Asset Library
  getAssets: () => ipcRenderer.invoke('get-assets'),
  getAsset: (id: string) => ipcRenderer.invoke('get-asset', id),
  createAsset: (data: any) => ipcRenderer.invoke('create-asset', data),
  deleteAsset: (id: string) => ipcRenderer.invoke('delete-asset', id),
});

// Type declarations for TypeScript
declare global {
  interface Window {
    electronAPI: {
      // Projects
      getProjects: () => Promise<any[]>;
      getProject: (id: string) => Promise<any>;
      createProject: (data: any) => Promise<any>;
      updateProject: (id: string, data: any) => Promise<void>;
      deleteProject: (id: string) => Promise<void>;
      exportProject: (id: string) => Promise<any>;

      // Scenes
      getScenes: (projectId: string) => Promise<any[]>;
      getScene: (id: string) => Promise<any>;
      createScene: (projectId: string, data: any) => Promise<any>;
      updateScene: (id: string, data: any) => Promise<void>;
      deleteScene: (id: string) => Promise<void>;

      // Scene Objects
      getSceneObjects: (sceneId: string) => Promise<any[]>;
      createSceneObject: (sceneId: string, data: any) => Promise<any>;
      updateSceneObject: (sceneId: string, id: string, data: any) => Promise<void>;
      deleteSceneObject: (sceneId: string, id: string) => Promise<void>;

      // Dialogues
      getDialogues: (sceneId: string) => Promise<any[]>;
      createDialogue: (sceneId: string, data: any) => Promise<any>;
      updateDialogue: (sceneId: string, id: string, data: any) => Promise<void>;
      deleteDialogue: (sceneId: string, id: string) => Promise<void>;

      // Background Maps
      getBackgroundMaps: () => Promise<any[]>;
      getBackgroundMap: (id: string) => Promise<any>;
      createBackgroundMap: (data: any) => Promise<any>;
      updateBackgroundMap: (id: string, data: any) => Promise<void>;
      deleteBackgroundMap: (id: string) => Promise<void>;

      // Background Objects
      getBackgroundObjects: (mapId: string) => Promise<any[]>;
      createBackgroundObject: (mapId: string, data: any) => Promise<any>;
      updateBackgroundObject: (id: string, data: any) => Promise<void>;
      deleteBackgroundObject: (id: string) => Promise<void>;

      // Asset Library
      getAssets: () => Promise<any[]>;
      getAsset: (id: string) => Promise<any>;
      createAsset: (data: any) => Promise<any>;
      deleteAsset: (id: string) => Promise<void>;
    };
  }
}
