// Electron API type declarations
// These types match the APIs exposed by preload.ts

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
      reorderSceneObjects: (sceneId: string, orderedIds: string[]) => Promise<void>;

      // Dialogues
      getDialogues: (sceneId: string) => Promise<any[]>;
      createDialogue: (sceneId: string, data: any) => Promise<any>;
      updateDialogue: (sceneId: string, id: string, data: any) => Promise<void>;
      deleteDialogue: (sceneId: string, id: string) => Promise<void>;
      reorderDialogues: (sceneId: string, orderedIds: string[]) => Promise<void>;

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
      updateAsset: (id: string, data: any) => Promise<any>;
      deleteAsset: (id: string) => Promise<void>;
      uploadModel: (fileBuffer: Uint8Array, fileName: string, name: string, category: string) => Promise<any>;
      uploadImage: (fileBuffer: Uint8Array, fileName: string, name: string, category: string) => Promise<any>;
    };
  }
}

export {};
