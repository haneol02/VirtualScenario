// REST API for both Electron and Browser
// All communication uses HTTP requests to Express server

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

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

console.log('[API] Using REST API mode (HTTP)');

// Projects API
export const projectsAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/projects`).then(res => res.data),

  getById: (id: string) => axios.get(`${API_BASE_URL}/projects/${id}`).then(res => res.data),

  create: (data: { title: string; description?: string; version?: string }) =>
    axios.post(`${API_BASE_URL}/projects`, data).then(res => res.data),

  update: (id: string, data: { title?: string; description?: string; version?: string }) =>
    axios.put(`${API_BASE_URL}/projects/${id}`, data).then(res => res.data),

  delete: (id: string) => axios.delete(`${API_BASE_URL}/projects/${id}`).then(res => res.data),

  export: (id: string) => axios.get(`${API_BASE_URL}/projects/${id}/export`).then(res => res.data),
};

// Scenes API
export const scenesAPI = {
  getAll: (projectId: string) =>
    axios.get(`${API_BASE_URL}/projects/${projectId}/scenes`).then(res => res.data),

  create: (projectId: string, data: {
    title: string;
    description?: string;
    participantCount?: number;
    order?: number;
    backgroundMapId?: string;
  }) =>
    axios.post(`${API_BASE_URL}/projects/${projectId}/scenes`, {
      title: data.title,
      description: data.description,
      participant_count: data.participantCount,
      order_index: data.order,
      background_map_id: data.backgroundMapId,
    }).then(res => res.data),

  update: (id: string, data: any) =>
    axios.put(`${API_BASE_URL}/scenes/${id}`, data).then(res => res.data),

  delete: (id: string) => axios.delete(`${API_BASE_URL}/scenes/${id}`).then(res => res.data),

  // Scene Objects
  getObjects: (sceneId: string) =>
    axios.get(`${API_BASE_URL}/scenes/${sceneId}/objects`).then(res => res.data),

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
    axios.post(`${API_BASE_URL}/scenes/${sceneId}/objects`, {
      type: data.type,
      name: data.name,
      model_id: data.model_id || data.assetId,
      color: data.color,
      position_x: data.transform?.position[0] ?? 0,
      position_y: data.transform?.position[1] ?? 0,
      position_z: data.transform?.position[2] ?? 0,
      rotation_x: data.transform?.rotation[0] ?? 0,
      rotation_y: data.transform?.rotation[1] ?? 0,
      rotation_z: data.transform?.rotation[2] ?? 0,
      scale_x: data.transform?.scale[0] ?? 1,
      scale_y: data.transform?.scale[1] ?? 1,
      scale_z: data.transform?.scale[2] ?? 1,
      metadata: data.metadata,
    }).then(res => res.data),

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
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.modelId !== undefined) updateData.model_id = data.modelId;
    if (data.showNametag !== undefined) updateData.show_nametag = data.showNametag ? 1 : 0;
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
    if (data.pathData !== undefined) updateData.path_data = data.pathData;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    return axios.put(`${API_BASE_URL}/scenes/${sceneId}/objects/${objectId}`, updateData).then(res => res.data);
  },

  deleteObject: (sceneId: string, objectId: string) =>
    axios.delete(`${API_BASE_URL}/scenes/${sceneId}/objects/${objectId}`).then(res => res.data),

  // Scene Dialogues
  getDialogues: (sceneId: string) =>
    axios.get(`${API_BASE_URL}/scenes/${sceneId}/dialogues`).then(res => res.data),

  createDialogue: (sceneId: string, data: {
    objectId?: string;
    speakerName?: string;
    text: string;
    startTime?: number;
    duration?: number;
    audioPath?: string;
  }) =>
    axios.post(`${API_BASE_URL}/scenes/${sceneId}/dialogues`, {
      object_id: data.objectId,
      speaker_name: data.speakerName,
      text: data.text,
      start_time: data.startTime ?? 0,
      duration: data.duration ?? 5,
      audio_path: data.audioPath,
    }).then(res => res.data),

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
    if (data.speakerName !== undefined) updateData.speaker_name = data.speakerName;
    if (data.text !== undefined) updateData.text = data.text;
    if (data.startTime !== undefined) updateData.start_time = data.startTime;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.audioPath !== undefined) updateData.audio_path = data.audioPath;
    return axios.put(`${API_BASE_URL}/scenes/${sceneId}/dialogues/${dialogueId}`, updateData).then(res => res.data);
  },

  deleteDialogue: (sceneId: string, dialogueId: string) =>
    axios.delete(`${API_BASE_URL}/scenes/${sceneId}/dialogues/${dialogueId}`).then(res => res.data),

  // Reorder objects and dialogues
  reorderObjects: (sceneId: string, orderedIds: string[]) =>
    axios.post(`${API_BASE_URL}/scenes/${sceneId}/objects/reorder`, { orderedIds }).then(res => res.data),

  reorderDialogues: (sceneId: string, orderedIds: string[]) =>
    axios.post(`${API_BASE_URL}/scenes/${sceneId}/dialogues/reorder`, { orderedIds }).then(res => res.data),
};

// Background Maps API
export const backgroundMapsAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/background-maps`).then(res => res.data),

  getById: (id: string) => axios.get(`${API_BASE_URL}/background-maps/${id}`).then(res => res.data),

  create: (data: {
    name: string;
    description?: string;
    icon?: string;
    backgroundImagePath?: string;
  }) =>
    axios.post(`${API_BASE_URL}/background-maps`, {
      name: data.name,
      description: data.description,
      icon: data.icon,
      background_image_path: data.backgroundImagePath,
    }).then(res => res.data),

  update: (id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    backgroundImagePath?: string;
  }) =>
    axios.put(`${API_BASE_URL}/background-maps/${id}`, {
      name: data.name,
      description: data.description,
      icon: data.icon,
      background_image_path: data.backgroundImagePath,
    }).then(res => res.data),

  delete: (id: string) => axios.delete(`${API_BASE_URL}/background-maps/${id}`).then(res => res.data),

  // Background Objects
  getObjects: (mapId: string) =>
    axios.get(`${API_BASE_URL}/background-maps/${mapId}/objects`).then(res => res.data),

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
    axios.post(`${API_BASE_URL}/background-maps/${mapId}/objects`, {
      type: data.type,
      name: data.name,
      model_id: data.modelId,
      color: data.color,
      position_x: data.positionX ?? 0,
      position_y: data.positionY ?? 0,
      position_z: data.positionZ ?? 0,
      rotation_x: data.rotationX ?? 0,
      rotation_y: data.rotationY ?? 0,
      rotation_z: data.rotationZ ?? 0,
      scale_x: data.scaleX ?? 1,
      scale_y: data.scaleY ?? 1,
      scale_z: data.scaleZ ?? 1,
      metadata: data.metadata,
    }).then(res => res.data),

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
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.modelId !== undefined) updateData.model_id = data.modelId;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.showNametag !== undefined) updateData.show_nametag = data.showNametag ? 1 : 0;
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
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    return axios.put(`${API_BASE_URL}/background-maps/objects/${objectId}`, updateData).then(res => res.data);
  },

  deleteObject: (objectId: string) =>
    axios.delete(`${API_BASE_URL}/background-maps/objects/${objectId}`).then(res => res.data),
};

// Asset Library API
export const assetsAPI = {
  getAll: () => axios.get(`${API_BASE_URL}/assets`).then(res => res.data),

  getByCategory: (category: string) =>
    axios.get(`${API_BASE_URL}/assets?category=${category}`).then(res => res.data),

  // File uploads
  uploadModel: async (file: File, name: string, category: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('category', category);
    return axios.post(`${API_BASE_URL}/assets/upload-model`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  uploadImage: async (file: File, name: string, category: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('category', category);
    return axios.post(`${API_BASE_URL}/assets/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },

  createText: (name: string, category: string, text_content: string, text_font_size?: number, text_color?: string) =>
    axios.post(`${API_BASE_URL}/assets`, {
      name,
      category,
      type: 'text',
      text_content,
      text_font_size: text_font_size || 1.0,
      text_color: text_color || '#ffffff',
    }).then(res => res.data),

  update: (id: string, data: { name?: string; category?: string }) =>
    axios.put(`${API_BASE_URL}/assets/${id}`, data).then(res => res.data),

  delete: (id: string) => axios.delete(`${API_BASE_URL}/assets/${id}`).then(res => res.data),
};
