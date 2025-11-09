# VirtualScenario - 프로젝트 상세 기획서 (Electron + SQLite)

## 1. 프로젝트 개요

### 1.1 프로젝트 목표
코레일 안전교육 및 업무 시나리오를 **작성-시각화-문서화**하는 통합 솔루션 개발 (데스크톱 앱)

### 1.2 핵심 가치
- **오프라인**: 인터넷 연결 없이 독립 실행
- **직관성**: 비개발자도 쉽게 시나리오 작성 가능
- **시각화**: 3D 환경에서 인터랙티브한 시뮬레이션
- **문서화**: 교육 자료용 PDF/HWP 자동 생성

### 1.3 아키텍처 변경사항
- ~~Supabase (BaaS)~~ → **SQLite (로컬 DB)**
- ~~Next.js (웹앱)~~ → **Electron + React (데스크톱 앱)**
- ~~온라인 협업~~ → **로컬 파일 기반 작업**

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌────────────────────────────────────────────────────┐
│         Electron Desktop App (Main Process)        │
├────────────────────────────────────────────────────┤
│  - SQLite Database (better-sqlite3)                │
│  - File System Access                              │
│  - IPC Communication                               │
│  - Window Management                               │
└────────────────────────────────────────────────────┘
                      ▲ IPC
                      │
┌────────────────────────────────────────────────────┐
│      Renderer Process (React + TypeScript)         │
├────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   Project    │  │    Scene     │  │  Object  │ │
│  │  Management  │  │    Editor    │  │  Library │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │        Three.js 3D Viewer (Top-down)        │  │
│  │  - Drag & Drop object placement             │  │
│  │  - Path editing                              │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │   Timeline   │  │   Document   │  │   JSON  │ │
│  │   Editor     │  │   Exporter   │  │ Exporter│ │
│  └──────────────┘  └──────────────┘  └─────────┘ │
└────────────────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  Local Files  │
              ├───────────────┤
              │ - SQLite DB   │
              │ - JSON exports│
              │ - PDF docs    │
              │ - Assets      │
              └───────────────┘
                      │
                      ▼ JSON Import
┌────────────────────────────────────────────────────┐
│     Unity 3D Simulator (Standalone Desktop)        │
├────────────────────────────────────────────────────┤
│  - JSON Importer                                   │
│  - Interactive 3D Simulation                       │
│  - Drag to move objects                            │
│  - Path animation                                  │
│  - Dialogue timeline                               │
│  - Export (MP4/PNG)                                │
└────────────────────────────────────────────────────┘
```

### 2.2 기술 스택

#### Desktop Editor (Electron)

```typescript
// Main Process (Node.js)
- Runtime: Electron 33+
- Database: better-sqlite3
- File System: Node.js fs/promises
- IPC: electron.ipcMain / ipcRenderer

// Renderer Process (Frontend)
- Framework: React 18 + TypeScript
- Build Tool: Vite 6
- State Management: Zustand
- 3D Library: Three.js + @react-three/fiber
- UI Components: Tailwind CSS + shadcn/ui
- Form Validation: Zod
- PDF Generation: jsPDF
```

#### Unity Simulator
```csharp
// Unity
- Version: Unity 2022.3 LTS
- Scripting: C# (.NET Standard 2.1)
- JSON Parsing: Newtonsoft.Json
- 3D Interaction: Custom Raycast Drag System
```

---

## 3. 데이터베이스 스키마 (SQLite)

### 3.1 ERD

```sql
-- Database File: scenario.db

projects
  ├── id (TEXT PRIMARY KEY)
  ├── title (TEXT NOT NULL)
  ├── description (TEXT)
  ├── version (TEXT DEFAULT '1.0')
  ├── thumbnail_path (TEXT)
  ├── created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)
  ├── updated_at (DATETIME DEFAULT CURRENT_TIMESTAMP)
  └── is_deleted (INTEGER DEFAULT 0)

scenes
  ├── id (TEXT PRIMARY KEY)
  ├── project_id (TEXT, FK -> projects.id)
  ├── order_index (INTEGER NOT NULL)
  ├── title (TEXT NOT NULL)
  ├── description (TEXT)
  ├── duration (INTEGER DEFAULT 30)
  ├── participant_count (INTEGER)
  ├── created_at (DATETIME)
  └── updated_at (DATETIME)

scene_objects
  ├── id (TEXT PRIMARY KEY)
  ├── scene_id (TEXT, FK -> scenes.id)
  ├── type (TEXT NOT NULL)
  ├── name (TEXT NOT NULL)
  ├── model_id (TEXT NOT NULL)
  ├── position_x (REAL)
  ├── position_y (REAL)
  ├── position_z (REAL)
  ├── rotation_x (REAL)
  ├── rotation_y (REAL)
  ├── rotation_z (REAL)
  ├── scale_x (REAL DEFAULT 1.0)
  ├── scale_y (REAL DEFAULT 1.0)
  ├── scale_z (REAL DEFAULT 1.0)
  ├── path_data (TEXT) -- JSON string
  ├── metadata (TEXT)   -- JSON string
  └── created_at (DATETIME)

dialogues
  ├── id (TEXT PRIMARY KEY)
  ├── scene_id (TEXT, FK -> scenes.id)
  ├── object_id (TEXT, FK -> scene_objects.id)
  ├── text (TEXT NOT NULL)
  ├── start_time (REAL NOT NULL)
  ├── duration (REAL NOT NULL)
  ├── audio_path (TEXT)
  └── created_at (DATETIME)

asset_library
  ├── id (TEXT PRIMARY KEY)
  ├── category (TEXT NOT NULL)
  ├── name (TEXT NOT NULL)
  ├── thumbnail_path (TEXT)
  ├── model_path (TEXT)
  ├── three_js_model_path (TEXT)
  └── metadata (TEXT) -- JSON string
```

### 3.2 SQLite 스키마 생성 SQL

```sql
-- File: resources/schema.sql

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

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  participant_count INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Scene objects table
CREATE TABLE IF NOT EXISTS scene_objects (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
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
  thumbnail_path TEXT,
  model_path TEXT,
  three_js_model_path TEXT,
  metadata TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scene_objects_scene_id ON scene_objects(scene_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_scene_id ON dialogues(scene_id);
CREATE INDEX IF NOT EXISTS idx_asset_library_category ON asset_library(category);

-- Trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
  UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_scenes_timestamp
AFTER UPDATE ON scenes
FOR EACH ROW
BEGIN
  UPDATE scenes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Sample data for asset library
INSERT OR IGNORE INTO asset_library (id, category, name, thumbnail_path, metadata) VALUES
  ('person_passenger', 'person', '승객', 'assets/thumbs/person_passenger.png', '{"description": "일반 승객"}'),
  ('person_staff', 'person', '역무원', 'assets/thumbs/person_staff.png', '{"description": "코레일 직원"}'),
  ('person_child', 'person', '어린이', 'assets/thumbs/person_child.png', '{"description": "어린이 승객"}'),
  ('train_ktx', 'train', 'KTX', 'assets/thumbs/train_ktx.png', '{"description": "고속열차"}'),
  ('facility_platform', 'facility', '플랫폼', 'assets/thumbs/platform.png', '{"description": "승강장"}'),
  ('facility_bench', 'facility', '의자', 'assets/thumbs/bench.png', '{"description": "대기 의자"}'),
  ('sign_safety', 'sign', '안전선 표지판', 'assets/thumbs/sign_safety.png', '{"description": "안전선 안내"}');
```

---

## 4. Electron 프로젝트 구조

### 4.1 폴더 구조

```
electron-editor/
├── src/
│   ├── main/                   # Main Process
│   │   ├── index.ts           # Electron 진입점
│   │   ├── database.ts        # SQLite 연결 및 쿼리
│   │   ├── ipc-handlers.ts    # IPC 핸들러
│   │   └── window.ts          # Window 관리
│   │
│   ├── renderer/              # Renderer Process (React)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   ├── SceneEditor.tsx
│   │   │   │   ├── ThreeViewer.tsx
│   │   │   │   ├── ObjectLibrary.tsx
│   │   │   │   ├── PropertyPanel.tsx
│   │   │   │   ├── TimelineEditor.tsx
│   │   │   │   └── ExportPanel.tsx
│   │   │   │
│   │   │   ├── store/
│   │   │   │   └── editorStore.ts   # Zustand store
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── ipc.ts           # IPC 통신 래퍼
│   │   │   │   ├── types.ts         # TypeScript types
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   │
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── preload/
│       └── index.ts           # Preload script (contextBridge)
│
├── resources/
│   ├── schema.sql             # Database schema
│   ├── icon.png
│   └── installer/
│
├── assets/
│   ├── models/                # 3D models (GLB/FBX)
│   ├── thumbs/                # Thumbnails
│   └── templates/             # PDF templates
│
├── package.json
├── electron-builder.config.js
└── tsconfig.json
```

### 4.2 Main Process - Database 연결

```typescript
// src/main/database.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'scenario.db');

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
    this.initialize();
  }

  private initialize() {
    const schemaPath = path.join(__dirname, '../../resources/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  // Projects
  getProjects() {
    return this.db.prepare('SELECT * FROM projects WHERE is_deleted = 0 ORDER BY updated_at DESC').all();
  }

  getProject(id: string) {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  }

  createProject(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, title, description, version)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(data.id, data.title, data.description, data.version);
  }

  updateProject(id: string, data: any) {
    const stmt = this.db.prepare(`
      UPDATE projects
      SET title = ?, description = ?, version = ?
      WHERE id = ?
    `);
    return stmt.run(data.title, data.description, data.version, id);
  }

  deleteProject(id: string) {
    const stmt = this.db.prepare('UPDATE projects SET is_deleted = 1 WHERE id = ?');
    return stmt.run(id);
  }

  // Scenes
  getScenes(projectId: string) {
    return this.db.prepare('SELECT * FROM scenes WHERE project_id = ? ORDER BY order_index').all(projectId);
  }

  createScene(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO scenes (id, project_id, order_index, title, description, duration, participant_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.id,
      data.projectId,
      data.order,
      data.title,
      data.description,
      data.duration,
      data.participantCount
    );
  }

  // Scene Objects
  getSceneObjects(sceneId: string) {
    return this.db.prepare('SELECT * FROM scene_objects WHERE scene_id = ?').all(sceneId);
  }

  createSceneObject(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO scene_objects (
        id, scene_id, type, name, model_id,
        position_x, position_y, position_z,
        rotation_x, rotation_y, rotation_z,
        scale_x, scale_y, scale_z,
        path_data, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.id,
      data.sceneId,
      data.type,
      data.name,
      data.modelId,
      data.position[0], data.position[1], data.position[2],
      data.rotation[0], data.rotation[1], data.rotation[2],
      data.scale[0], data.scale[1], data.scale[2],
      JSON.stringify(data.path),
      JSON.stringify(data.metadata)
    );
  }

  // Dialogues
  getDialogues(sceneId: string) {
    return this.db.prepare('SELECT * FROM dialogues WHERE scene_id = ? ORDER BY start_time').all(sceneId);
  }

  // Asset Library
  getAssetLibrary() {
    return this.db.prepare('SELECT * FROM asset_library ORDER BY category, name').all();
  }

  // Full project export
  getProjectWithScenes(projectId: string) {
    const project = this.getProject(projectId);
    if (!project) return null;

    const scenes = this.getScenes(projectId).map(scene => ({
      ...scene,
      objects: this.getSceneObjects(scene.id).map(obj => ({
        ...obj,
        position: [obj.position_x, obj.position_y, obj.position_z],
        rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
        scale: [obj.scale_x, obj.scale_y, obj.scale_z],
        path: obj.path_data ? JSON.parse(obj.path_data) : null,
        metadata: obj.metadata ? JSON.parse(obj.metadata) : null,
      })),
      dialogues: this.getDialogues(scene.id),
    }));

    return { ...project, scenes };
  }

  close() {
    this.db.close();
  }
}
```

### 4.3 Main Process - IPC Handlers

```typescript
// src/main/ipc-handlers.ts
import { ipcMain } from 'electron';
import { DatabaseManager } from './database';
import { v4 as uuidv4 } from 'uuid';

export function setupIpcHandlers(db: DatabaseManager) {
  // Projects
  ipcMain.handle('db:getProjects', () => {
    return db.getProjects();
  });

  ipcMain.handle('db:getProject', (_, id: string) => {
    return db.getProject(id);
  });

  ipcMain.handle('db:createProject', (_, data) => {
    const id = uuidv4();
    db.createProject({ ...data, id });
    return db.getProject(id);
  });

  ipcMain.handle('db:updateProject', (_, id: string, data) => {
    db.updateProject(id, data);
    return db.getProject(id);
  });

  ipcMain.handle('db:deleteProject', (_, id: string) => {
    return db.deleteProject(id);
  });

  // Scenes
  ipcMain.handle('db:getScenes', (_, projectId: string) => {
    return db.getScenes(projectId);
  });

  ipcMain.handle('db:createScene', (_, data) => {
    const id = uuidv4();
    db.createScene({ ...data, id });
    return db.getSceneObjects(id);
  });

  // Scene Objects
  ipcMain.handle('db:getSceneObjects', (_, sceneId: string) => {
    return db.getSceneObjects(sceneId);
  });

  ipcMain.handle('db:createSceneObject', (_, data) => {
    const id = uuidv4();
    return db.createSceneObject({ ...data, id });
  });

  // Dialogues
  ipcMain.handle('db:getDialogues', (_, sceneId: string) => {
    return db.getDialogues(sceneId);
  });

  // Asset Library
  ipcMain.handle('db:getAssetLibrary', () => {
    return db.getAssetLibrary();
  });

  // Export
  ipcMain.handle('db:exportProject', (_, projectId: string) => {
    return db.getProjectWithScenes(projectId);
  });

  // File operations
  ipcMain.handle('file:saveJSON', async (_, { path, data }) => {
    const fs = await import('fs/promises');
    await fs.writeFile(path, JSON.stringify(data, null, 2));
    return { success: true };
  });

  ipcMain.handle('file:showSaveDialog', async (_, options) => {
    const { dialog } = await import('electron');
    return dialog.showSaveDialog(options);
  });
}
```

### 4.4 Preload Script

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Database
  db: {
    getProjects: () => ipcRenderer.invoke('db:getProjects'),
    getProject: (id: string) => ipcRenderer.invoke('db:getProject', id),
    createProject: (data: any) => ipcRenderer.invoke('db:createProject', data),
    updateProject: (id: string, data: any) => ipcRenderer.invoke('db:updateProject', id, data),
    deleteProject: (id: string) => ipcRenderer.invoke('db:deleteProject', id),

    getScenes: (projectId: string) => ipcRenderer.invoke('db:getScenes', projectId),
    createScene: (data: any) => ipcRenderer.invoke('db:createScene', data),

    getSceneObjects: (sceneId: string) => ipcRenderer.invoke('db:getSceneObjects', sceneId),
    createSceneObject: (data: any) => ipcRenderer.invoke('db:createSceneObject', data),

    getDialogues: (sceneId: string) => ipcRenderer.invoke('db:getDialogues', sceneId),

    getAssetLibrary: () => ipcRenderer.invoke('db:getAssetLibrary'),

    exportProject: (projectId: string) => ipcRenderer.invoke('db:exportProject', projectId),
  },

  // File operations
  file: {
    saveJSON: (path: string, data: any) => ipcRenderer.invoke('file:saveJSON', { path, data }),
    showSaveDialog: (options: any) => ipcRenderer.invoke('file:showSaveDialog', options),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
```

### 4.5 Renderer - IPC 래퍼

```typescript
// src/renderer/src/lib/ipc.ts
export const db = (window as any).electronAPI.db;
export const file = (window as any).electronAPI.file;

// Type-safe wrapper
export interface Project {
  id: string;
  title: string;
  description?: string;
  version: string;
  thumbnail_path?: string;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  project_id: string;
  order_index: number;
  title: string;
  description?: string;
  duration: number;
  participant_count?: number;
}

export const projectAPI = {
  getAll: (): Promise<Project[]> => db.getProjects(),
  getById: (id: string): Promise<Project> => db.getProject(id),
  create: (data: Partial<Project>): Promise<Project> => db.createProject(data),
  update: (id: string, data: Partial<Project>): Promise<Project> => db.updateProject(id, data),
  delete: (id: string): Promise<void> => db.deleteProject(id),
  export: (id: string): Promise<any> => db.exportProject(id),
};
```

---

## 5. 개발 로드맵 (Electron 버전)

### Phase 1: Electron 기본 구조 (2주)

#### Week 1: Electron 셋업
- [ ] Electron + Vite + React 프로젝트 구성
- [ ] SQLite 데이터베이스 연결
- [ ] IPC 통신 구조 구축
- [ ] 기본 Window UI

#### Week 2: 프로젝트 관리
- [ ] 프로젝트 CRUD UI
- [ ] Scene CRUD UI
- [ ] Asset Library 표시
- [ ] 기본 레이아웃 구성

**Milestone 1**: 프로젝트 생성 및 씬 관리 가능

---

### Phase 2: 3D 에디터 (3주)

#### Week 3-4: Three.js 통합
- [ ] Three.js 캔버스 셋업
- [ ] 오브젝트 드래그 앤 드롭
- [ ] Transform controls
- [ ] Grid & snapping

#### Week 5: JSON Export
- [ ] JSON 스키마 구현
- [ ] Export 기능
- [ ] 파일 저장 다이얼로그

**Milestone 2**: 3D 씬 구성 및 JSON 내보내기

---

### Phase 3: Unity 연동 (2주)

#### Week 6-7: Unity Importer
- [ ] Unity JSON importer
- [ ] Scene builder
- [ ] Drag interaction
- [ ] Path animation

**Milestone 3**: Electron → Unity 파이프라인 완성

---

### Phase 4: 문서화 & 고도화 (2주)

#### Week 8-9: PDF Export
- [ ] jsPDF 통합
- [ ] 템플릿 시스템
- [ ] 미리보기 기능

**Milestone 4**: End-to-End 완성

---

## 6. 배포

### 6.1 Electron Builder 설정

```javascript
// electron-builder.config.js
module.exports = {
  appId: 'com.korail.virtualscenario',
  productName: 'VirtualScenario',
  directories: {
    output: 'dist',
  },
  files: [
    'dist-electron/**/*',
    'dist-renderer/**/*',
    'resources/**/*',
    'assets/**/*',
  ],
  win: {
    target: ['nsis', 'portable'],
    icon: 'resources/icon.ico',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
};
```

### 6.2 빌드 명령

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "build:win": "npm run build -- --win",
    "build:mac": "npm run build -- --mac",
    "build:linux": "npm run build -- --linux"
  }
}
```

---

## 7. 데이터 흐름

```
사용자 액션
   ↓
React Component
   ↓
IPC invoke (preload)
   ↓
Main Process Handler
   ↓
SQLite Query (better-sqlite3)
   ↓
Result
   ↓
IPC return
   ↓
React State Update
   ↓
UI Re-render
```

---

## 8. 주요 차이점 (Web vs Electron)

| 항목 | Web (Supabase) | Electron (SQLite) |
|------|----------------|-------------------|
| 실행 환경 | 브라우저 (온라인) | 데스크톱 (오프라인) |
| 데이터 저장 | Supabase (클라우드) | SQLite (로컬) |
| 인증 | Supabase Auth | 불필요 |
| 파일 접근 | 제한적 (Storage API) | 전체 파일 시스템 |
| 배포 | Vercel/Netlify | Installer (EXE/DMG) |
| 협업 | 실시간 가능 | 파일 공유 방식 |
| 업데이트 | 자동 (새로고침) | 수동 (업데이트 체크) |

---

이제 Electron 기반으로 개발을 시작합니다!
