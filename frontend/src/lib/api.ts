// IPC-based API for Electron
// Using window.electronAPI exposed by preload script

// Types
export interface PathKeyframe {
  time: number;  // 시간 (초 단위)
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];  // Scale 애니메이션 지원
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  version: string;
  thumbnail_path?: string;
  created_at: string;
  updated_at: string;
  is_deleted: number;
}

export interface Scene {
  id: string;
  project_id: string;
  order_index: number;
  title: string;
  description?: string;
  participant_count?: number;
  background_map_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SceneObject {
  id: string;
  scene_id: string;
  type: string;
  name: string;
  model_id?: string;
  color: string;
  show_nametag: number;  // 1=표시, 0=숨김
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
  path_data?: string;
  metadata?: string;
  created_at: string;
}

export interface BackgroundMap {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  background_image_path?: string;
  created_at: string;
  updated_at: string;
}

export interface BackgroundObject {
  id: string;
  background_map_id: string;
  name: string;
  type: string;
  model_id?: string;
  color: string;
  show_nametag: number;  // 1=표시, 0=숨김
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
  metadata?: string;
  created_at: string;
}

export interface Dialogue {
  id: string;
  scene_id: string;
  object_id?: string;
  speaker_name?: string;
  text: string;
  start_time: number;
  duration: number;
  audio_path?: string;
  created_at: string;
}

export interface Asset {
  id: string;
  category: string;
  name: string;
  type: 'primitive' | 'model' | 'image' | 'text';
  thumbnail_path?: string;
  model_path?: string;
  three_js_model_path?: string;
  file_path?: string;
  file_format?: 'glb' | 'gltf' | 'obj' | 'fbx' | 'png' | 'jpg' | 'jpeg';
  text_content?: string;
  text_font_size?: number;
  text_color?: string;
  metadata?: string;
  created_at: string;
}

// Projects API
export const projectsAPI = {
  getAll: () => window.electronAPI.getProjects(),

  getById: (id: string) => window.electronAPI.getProject(id),

  create: (data: { title: string; description?: string; version?: string }) =>
    window.electronAPI.createProject(data),

  update: (id: string, data: { title?: string; description?: string; version?: string }) =>
    window.electronAPI.updateProject(id, data),

  delete: (id: string) =>
    window.electronAPI.deleteProject(id),

  export: (id: string) =>
    window.electronAPI.exportProject(id),
};

// Scenes API
export const scenesAPI = {
  getAll: (projectId: string) =>
    window.electronAPI.getScenes(projectId),

  create: (projectId: string, data: {
    title: string;
    description?: string;
    participantCount?: number;
    order?: number;
  }) =>
    window.electronAPI.createScene(projectId, data),

  update: (id: string, data: any) =>
    window.electronAPI.updateScene(id, data),

  delete: (id: string) =>
    window.electronAPI.deleteScene(id),

  // Scene Objects
  getObjects: (sceneId: string) =>
    window.electronAPI.getSceneObjects(sceneId),

  createObject: (sceneId: string, data: {
    type: string;
    name: string;
    assetId?: string;
    model_id?: string;
    color?: string;
    transform?: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    };
    metadata?: any;
  }) =>
    window.electronAPI.createSceneObject(sceneId, {
      type: data.type,
      name: data.name,
      asset_id: data.model_id || data.assetId,  // Convert to snake_case for IPC
      color: data.color,
      metadata: data.metadata,
      position_x: data.transform?.position[0] ?? 0,
      position_y: data.transform?.position[1] ?? 0,
      position_z: data.transform?.position[2] ?? 0,
      rotation_x: data.transform?.rotation[0] ?? 0,
      rotation_y: data.transform?.rotation[1] ?? 0,
      rotation_z: data.transform?.rotation[2] ?? 0,
      scale_x: data.transform?.scale[0] ?? 1,
      scale_y: data.transform?.scale[1] ?? 1,
      scale_z: data.transform?.scale[2] ?? 1,
    }),

  updateObject: (sceneId: string, objectId: string, data: {
    name?: string;
    modelId?: string | null;
    showNametag?: boolean;
    transform?: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    };
    pathData?: any;
    metadata?: any;
  }) => {
    const updateData: any = { ...data };
    if (data.transform?.position) {
      updateData.position_x = data.transform.position[0];
      updateData.position_y = data.transform.position[1];
      updateData.position_z = data.transform.position[2];
    }
    if (data.transform?.rotation) {
      updateData.rotation_x = data.transform.rotation[0];
      updateData.rotation_y = data.transform.rotation[1];
      updateData.rotation_z = data.transform.rotation[2];
    }
    if (data.transform?.scale) {
      updateData.scale_x = data.transform.scale[0];
      updateData.scale_y = data.transform.scale[1];
      updateData.scale_z = data.transform.scale[2];
    }
    delete updateData.transform;
    return window.electronAPI.updateSceneObject(sceneId, objectId, updateData);
  },

  deleteObject: (sceneId: string, objectId: string) =>
    window.electronAPI.deleteSceneObject(sceneId, objectId),

  // Scene Dialogues
  getDialogues: (sceneId: string) =>
    window.electronAPI.getDialogues(sceneId),

  createDialogue: (sceneId: string, data: {
    objectId?: string;
    speakerName?: string;
    text: string;
    startTime?: number;
    duration?: number;
    audioPath?: string;
  }) =>
    window.electronAPI.createDialogue(sceneId, {
      object_id: data.objectId,
      speaker: data.speakerName,
      text: data.text,
      start_time: data.startTime ?? 0,
      end_time: (data.startTime ?? 0) + (data.duration ?? 5),
      audio_path: data.audioPath,
    }),

  updateDialogue: (sceneId: string, dialogueId: string, data: {
    objectId?: string;
    speakerName?: string;
    text?: string;
    startTime?: number;
    duration?: number;
    audioPath?: string;
  }) => {
    const updateData: any = {};
    if (data.objectId !== undefined) updateData.object_id = data.objectId;
    if (data.speakerName !== undefined) updateData.speaker = data.speakerName;
    if (data.text !== undefined) updateData.text = data.text;
    if (data.startTime !== undefined) {
      updateData.start_time = data.startTime;
      if (data.duration !== undefined) {
        updateData.end_time = data.startTime + data.duration;
      }
    }
    if (data.audioPath !== undefined) updateData.audio_path = data.audioPath;
    return window.electronAPI.updateDialogue(sceneId, dialogueId, updateData);
  },

  deleteDialogue: (sceneId: string, dialogueId: string) =>
    window.electronAPI.deleteDialogue(sceneId, dialogueId),

  // Reorder objects and dialogues
  reorderObjects: (sceneId: string, orderedIds: string[]) =>
    window.electronAPI.reorderSceneObjects(sceneId, orderedIds),

  reorderDialogues: (sceneId: string, orderedIds: string[]) =>
    window.electronAPI.reorderDialogues(sceneId, orderedIds),
};

// Background Maps API
export const backgroundMapsAPI = {
  getAll: () =>
    window.electronAPI.getBackgroundMaps(),

  getById: (id: string) =>
    window.electronAPI.getBackgroundMap(id),

  create: (data: {
    name: string;
    description?: string;
    icon?: string;
    backgroundImagePath?: string;
  }) =>
    window.electronAPI.createBackgroundMap(data),

  update: (id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    backgroundImagePath?: string;
  }) =>
    window.electronAPI.updateBackgroundMap(id, data),

  delete: (id: string) =>
    window.electronAPI.deleteBackgroundMap(id),

  // Background Objects
  getObjects: (mapId: string) =>
    window.electronAPI.getBackgroundObjects(mapId),

  createObject: (mapId: string, data: {
    type: string;
    name: string;
    modelId?: string;
    color?: string;
    positionX?: number;
    positionY?: number;
    positionZ?: number;
    rotationX?: number;
    rotationY?: number;
    rotationZ?: number;
    scaleX?: number;
    scaleY?: number;
    scaleZ?: number;
    metadata?: any;
  }) =>
    window.electronAPI.createBackgroundObject(mapId, {
      type: data.type,
      name: data.name,
      asset_id: data.modelId,  // Convert to snake_case for IPC
      color: data.color,
      metadata: data.metadata,
      position_x: data.positionX ?? 0,
      position_y: data.positionY ?? 0,
      position_z: data.positionZ ?? 0,
      rotation_x: data.rotationX ?? 0,
      rotation_y: data.rotationY ?? 0,
      rotation_z: data.rotationZ ?? 0,
      scale_x: data.scaleX ?? 1,
      scale_y: data.scaleY ?? 1,
      scale_z: data.scaleZ ?? 1,
    }),

  updateObject: (objectId: string, data: {
    name?: string;
    type?: string;
    modelId?: string;
    color?: string;
    showNametag?: boolean;
    transform?: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    };
    metadata?: any;
  }) => {
    const updateData: any = { ...data };
    if (data.transform?.position) {
      updateData.position_x = data.transform.position[0];
      updateData.position_y = data.transform.position[1];
      updateData.position_z = data.transform.position[2];
    }
    if (data.transform?.rotation) {
      updateData.rotation_x = data.transform.rotation[0];
      updateData.rotation_y = data.transform.rotation[1];
      updateData.rotation_z = data.transform.rotation[2];
    }
    if (data.transform?.scale) {
      updateData.scale_x = data.transform.scale[0];
      updateData.scale_y = data.transform.scale[1];
      updateData.scale_z = data.transform.scale[2];
    }
    delete updateData.transform;
    return window.electronAPI.updateBackgroundObject(objectId, updateData);
  },

  deleteObject: (objectId: string) =>
    window.electronAPI.deleteBackgroundObject(objectId),
};

// Asset Library API
export const assetsAPI = {
  getAll: () => window.electronAPI.getAssets(),

  getByCategory: (category: string) =>
    window.electronAPI.getAssets().then((assets: Asset[]) =>
      assets.filter((a) => a.category === category)
    ),

  // File uploads - Convert File to Uint8Array for IPC transmission
  uploadModel: async (file: File, name: string, category: string) => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return window.electronAPI.uploadModel(uint8Array, file.name, name, category);
  },

  uploadImage: async (file: File, name: string, category: string) => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return window.electronAPI.uploadImage(uint8Array, file.name, name, category);
  },

  createText: (name: string, category: string, text_content: string, text_font_size?: number, text_color?: string) =>
    window.electronAPI.createAsset({
      name,
      category,
      type: 'text',
      text_content,
      text_font_size: text_font_size || 1.0,
      text_color: text_color || '#ffffff',
    }),

  update: (id: string, data: { name?: string; category?: string }) =>
    window.electronAPI.updateAsset(id, data),

  delete: (id: string) =>
    window.electronAPI.deleteAsset(id),
};

// Fallback for development mode (when window.electronAPI is not available)
if (typeof window !== 'undefined' && !window.electronAPI) {
  console.warn('[API] Running without Electron IPC - API calls will fail');
  console.warn('[API] Please run: npm run dev in both backend and frontend folders');
}
