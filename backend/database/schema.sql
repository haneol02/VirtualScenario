-- VirtualScenario Database Schema
-- SQLite Database for Electron App

PRAGMA foreign_keys = ON;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  thumbnail_path TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

-- Background maps table (reusable environment templates)
CREATE TABLE IF NOT EXISTS background_maps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  background_image_path TEXT,  -- 바닥에 깔릴 이미지/지도 경로
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Background objects table (objects in background maps)
CREATE TABLE IF NOT EXISTS background_objects (
  id TEXT PRIMARY KEY,
  background_map_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  model_id TEXT,
  color TEXT DEFAULT '#6b7280',  -- HEX 색상 코드
  show_nametag INTEGER DEFAULT 1,  -- 네임태그 표시 여부 (1=표시, 0=숨김)
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  position_z REAL NOT NULL DEFAULT 0,
  rotation_x REAL NOT NULL DEFAULT 0,
  rotation_y REAL NOT NULL DEFAULT 0,
  rotation_z REAL NOT NULL DEFAULT 0,
  scale_x REAL NOT NULL DEFAULT 1.0,
  scale_y REAL NOT NULL DEFAULT 1.0,
  scale_z REAL NOT NULL DEFAULT 1.0,
  metadata TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (background_map_id) REFERENCES background_maps(id) ON DELETE CASCADE
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  participant_count INTEGER,
  background_map_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (background_map_id) REFERENCES background_maps(id) ON DELETE SET NULL
);

-- Scene objects table
CREATE TABLE IF NOT EXISTS scene_objects (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  model_id TEXT,
  color TEXT DEFAULT '#6b7280',  -- HEX 색상 코드
  show_nametag INTEGER DEFAULT 1,  -- 네임태그 표시 여부 (1=표시, 0=숨김)
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  position_z REAL NOT NULL DEFAULT 0,
  rotation_x REAL NOT NULL DEFAULT 0,
  rotation_y REAL NOT NULL DEFAULT 0,
  rotation_z REAL NOT NULL DEFAULT 0,
  scale_x REAL NOT NULL DEFAULT 1.0,
  scale_y REAL NOT NULL DEFAULT 1.0,
  scale_z REAL NOT NULL DEFAULT 1.0,
  path_data TEXT,
  metadata TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

-- Dialogues table
CREATE TABLE IF NOT EXISTS dialogues (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  object_id TEXT,
  text TEXT NOT NULL,
  start_time REAL NOT NULL,
  duration REAL NOT NULL,
  audio_path TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (object_id) REFERENCES scene_objects(id) ON DELETE SET NULL
);

-- Asset library table
CREATE TABLE IF NOT EXISTS asset_library (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'primitive',  -- 'primitive', 'model', 'image', 'text'
  thumbnail_path TEXT,
  model_path TEXT,
  three_js_model_path TEXT,
  file_path TEXT,  -- Uploaded file path (3D model: .glb/.gltf/.obj/.fbx, Image: .png/.jpg/.jpeg)
  file_format TEXT,  -- 'glb', 'gltf', 'obj', 'fbx', 'png', 'jpg', 'jpeg'
  text_content TEXT,  -- Text content for text type
  text_font_size REAL DEFAULT 1.0,  -- Font size for text (3D scale)
  text_color TEXT DEFAULT '#ffffff',  -- Text color
  metadata TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_background_objects_map_id ON background_objects(background_map_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_background_map_id ON scenes(background_map_id);
CREATE INDEX IF NOT EXISTS idx_scene_objects_scene_id ON scene_objects(scene_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_scene_id ON dialogues(scene_id);
CREATE INDEX IF NOT EXISTS idx_asset_library_category ON asset_library(category);

-- Trigger for updated_at on projects
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
  UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Trigger for updated_at on background_maps
CREATE TRIGGER IF NOT EXISTS update_background_maps_timestamp
AFTER UPDATE ON background_maps
FOR EACH ROW
BEGIN
  UPDATE background_maps SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Trigger for updated_at on scenes
CREATE TRIGGER IF NOT EXISTS update_scenes_timestamp
AFTER UPDATE ON scenes
FOR EACH ROW
BEGIN
  UPDATE scenes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Sample data for background maps
INSERT OR IGNORE INTO background_maps (id, name, description, icon) VALUES
  ('map_platform', '승강장', '역 승강장 환경 (노란 안전선 포함)', '🚉'),
  ('map_tracks', '선로', '기차 선로 환경', '🛤️'),
  ('map_train_interior', '열차 내부', '열차 객실 내부', '🚊'),
  ('map_station', '역사', '역 건물 내부 환경', '🏢'),
  ('map_empty', '빈 공간', '배경 없음 (기본 격자)', '📐');

-- Sample data for asset library (Only primitives - models can be uploaded by user)
INSERT OR IGNORE INTO asset_library (id, category, name, thumbnail_path, metadata) VALUES
  -- 3D Primitives (기본 도형)
  ('primitive_box', 'primitive', '사각형', NULL, '{"description": "정육면체", "geometry": "box"}'),
  ('primitive_sphere', 'primitive', '구', NULL, '{"description": "구", "geometry": "sphere"}'),
  ('primitive_cylinder', 'primitive', '원기둥', NULL, '{"description": "원기둥", "geometry": "cylinder"}'),
  ('primitive_cone', 'primitive', '원뿔', NULL, '{"description": "원뿔", "geometry": "cone"}'),
  ('primitive_plane', 'primitive', '평면', NULL, '{"description": "평면", "geometry": "plane"}'),
  ('primitive_torus', 'primitive', '도넛', NULL, '{"description": "도넛 모양", "geometry": "torus"}');
