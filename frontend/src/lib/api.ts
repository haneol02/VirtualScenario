import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  visible?: number;  // 1=보이기, 0=숨기기 (기본값 1)
  locked?: number;  // 1=잠금, 0=잠금해제 (기본값 0)
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
  grid_size?: string;  // JSON string: {"width": number, "depth": number}
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
  visible?: number;  // 1=보이기, 0=숨기기 (기본값 1)
  locked?: number;  // 1=잠금, 0=잠금해제 (기본값 0)
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

// Projects API
export const projectsAPI = {
  getAll: () => api.get<Project[]>('/projects').then(res => res.data),

  getById: (id: string) => api.get<Project>(`/projects/${id}`).then(res => res.data),

  create: (data: { title: string; description?: string; version?: string }) =>
    api.post<Project>('/projects', data).then(res => res.data),

  update: (id: string, data: { title?: string; description?: string; version?: string }) =>
    api.put<Project>(`/projects/${id}`, data).then(res => res.data),

  delete: (id: string) =>
    api.delete(`/projects/${id}`).then(res => res.data),

  export: (id: string) =>
    api.get(`/projects/${id}/export`).then(res => res.data),
};

// Scenes API
export const scenesAPI = {
  getAll: (projectId: string) =>
    api.get<Scene[]>(`/projects/${projectId}/scenes`).then(res => res.data),

  create: (projectId: string, data: {
    title: string;
    description?: string;
    participantCount?: number;
    order?: number;
  }) =>
    api.post<Scene>(`/projects/${projectId}/scenes`, data).then(res => res.data),

  update: (id: string, data: any) =>
    api.put<Scene>(`/scenes/${id}`, data).then(res => res.data),

  delete: (id: string) =>
    api.delete(`/scenes/${id}`).then(res => res.data),

  // Scene Objects
  getObjects: (sceneId: string) =>
    api.get<SceneObject[]>(`/scenes/${sceneId}/objects`).then(res => res.data),

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
    api.post<SceneObject>(`/scenes/${sceneId}/objects`, data).then(res => res.data),

  updateObject: (sceneId: string, objectId: string, data: {
    name?: string;
    modelId?: string | null;
    color?: string;
    visible?: boolean;
    locked?: boolean;
    showNametag?: boolean;
    transform?: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    };
    pathData?: any;
    metadata?: any;
  }) =>
    api.put<SceneObject>(`/scenes/${sceneId}/objects/${objectId}`, data).then(res => res.data),

  deleteObject: (sceneId: string, objectId: string) =>
    api.delete(`/scenes/${sceneId}/objects/${objectId}`).then(res => res.data),

  // Scene Dialogues
  getDialogues: (sceneId: string) =>
    api.get<Dialogue[]>(`/scenes/${sceneId}/dialogues`).then(res => res.data),

  createDialogue: (sceneId: string, data: {
    objectId?: string;
    speakerName?: string;
    text: string;
    startTime?: number;
    duration?: number;
    audioPath?: string;
  }) =>
    api.post<Dialogue>(`/scenes/${sceneId}/dialogues`, data).then(res => res.data),

  updateDialogue: (sceneId: string, dialogueId: string, data: {
    objectId?: string;
    speakerName?: string;
    text?: string;
    startTime?: number;
    duration?: number;
    audioPath?: string;
  }) =>
    api.put<Dialogue>(`/scenes/${sceneId}/dialogues/${dialogueId}`, data).then(res => res.data),

  deleteDialogue: (sceneId: string, dialogueId: string) =>
    api.delete(`/scenes/${sceneId}/dialogues/${dialogueId}`).then(res => res.data),

  // Reorder
  reorderObjects: (sceneId: string, orderedIds: string[]) =>
    api.post(`/scenes/${sceneId}/objects/reorder`, { orderedIds }).then(res => res.data),

  reorderDialogues: (sceneId: string, orderedIds: string[]) =>
    api.post(`/scenes/${sceneId}/dialogues/reorder`, { orderedIds }).then(res => res.data),
};

// Background Maps API
export const backgroundMapsAPI = {
  getAll: () =>
    api.get<BackgroundMap[]>('/background-maps').then(res => res.data),

  getById: (id: string) =>
    api.get<BackgroundMap>(`/background-maps/${id}`).then(res => res.data),

  create: (data: {
    name: string;
    description?: string;
    icon?: string;
    backgroundImagePath?: string;
  }) =>
    api.post<BackgroundMap>('/background-maps', data).then(res => res.data),

  update: (id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    backgroundImagePath?: string;
  }) =>
    api.put<BackgroundMap>(`/background-maps/${id}`, data).then(res => res.data),

  delete: (id: string) =>
    api.delete(`/background-maps/${id}`).then(res => res.data),

  // Background Objects
  getObjects: (mapId: string) =>
    api.get<BackgroundObject[]>(`/background-maps/${mapId}/objects`).then(res => res.data),

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
    api.post<BackgroundObject>(`/background-maps/${mapId}/objects`, data).then(res => res.data),

  updateObject: (objectId: string, data: {
    name?: string;
    type?: string;
    modelId?: string;
    color?: string;
    visible?: boolean;
    locked?: boolean;
    showNametag?: boolean;
    transform?: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    };
    metadata?: any;
  }) =>
    api.put<BackgroundObject>(`/background-maps/objects/${objectId}`, data).then(res => res.data),

  deleteObject: (objectId: string) =>
    api.delete(`/background-maps/objects/${objectId}`).then(res => res.data),
};

// Asset Library Types
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

// Asset Library API
export const assetsAPI = {
  getAll: () => api.get<Asset[]>('/assets').then(res => res.data),

  getByCategory: (category: string) =>
    api.get<Asset[]>(`/assets/category/${category}`).then(res => res.data),

  uploadModel: (file: File, name: string, category: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('category', category);

    return api.post<Asset>('/assets/upload/model', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  uploadImage: (file: File, name: string, category: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('category', category);

    return api.post<Asset>('/assets/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },

  createText: (name: string, category: string, text_content: string, text_font_size?: number, text_color?: string) => {
    return api.post<Asset>('/assets/text', {
      name,
      category,
      text_content,
      text_font_size: text_font_size || 1.0,
      text_color: text_color || '#ffffff',
    }).then(res => res.data);
  },

  update: (id: string, data: { name?: string; category?: string }) =>
    api.put<Asset>(`/assets/${id}`, data).then(res => res.data),

  delete: (id: string) =>
    api.delete(`/assets/${id}`).then(res => res.data),
};

export default api;
