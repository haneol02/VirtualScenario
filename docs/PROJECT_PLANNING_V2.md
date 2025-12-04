# VirtualScenario - 프로젝트 상세 기획서 (Electron + SQLite)

## 1. 프로젝트 개요

### 1.1 프로젝트 목표
코레일 안전교육 및 업무 시나리오를 **작성-시각화-재생**하는 통합 솔루션 개발 (데스크톱 앱)

### 1.2 핵심 가치
- **오프라인**: 인터넷 연결 없이 독립 실행
- **직관성**: 비개발자도 쉽게 시나리오 작성 가능
- **시각화**: 3D 환경에서 인터랙티브한 편집 및 시뮬레이션
- **내보내기**: MP4 영상, Excel 문서, JSON 데이터 내보내기

### 1.3 아키텍처
- **데이터베이스**: SQLite (로컬 DB)
- **Frontend**: React + Vite (웹 기술)
- **Backend**: Express + Electron (데스크톱 앱)
- **파일 시스템**: 로컬 파일 기반 작업

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌────────────────────────────────────────────────────┐
│         Electron Desktop App (Main Process)        │
├────────────────────────────────────────────────────┤
│  - Express Server (REST API)                       │
│  - SQLite Database (better-sqlite3)                │
│  - File System Access                              │
│  - Window Management                               │
│  - MP4 Encoding (ffmpeg)                           │
└────────────────────────────────────────────────────┘
                      ▲ HTTP
                      │
┌────────────────────────────────────────────────────┐
│         Frontend (React + TypeScript)              │
├────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   Project    │  │    Scene     │  │ Background│ │
│  │  Dashboard   │  │    Editor    │  │Map Editor│ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │        Three.js 3D Viewer                   │  │
│  │  - Transform Controls (Gizmo)               │  │
│  │  - Keyframe Animation                       │  │
│  │  - 6 Primitives (box, sphere, etc.)         │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │   Timeline   │  │  Simulator   │  │ Export  │ │
│  │   Editor     │  │  (Playback)  │  │MP4/Excel│ │
│  └──────────────┘  └──────────────┘  └─────────┘ │
└────────────────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  Local Files  │
              ├───────────────┤
              │ - SQLite DB   │
              │ - JSON exports│
              │ - Excel files │
              │ - MP4 videos  │
              └───────────────┘
```

### 2.2 기술 스택

#### Desktop App (Electron)

```typescript
// Main Process (Node.js)
- Runtime: Electron 33
- Server: Express 4
- Database: better-sqlite3
- File System: Node.js fs/promises
- MP4 Encoding: ffmpeg
- Excel Export: ExcelJS

// Frontend (React)
- Framework: React 18 + TypeScript
- Build Tool: Vite 6
- 3D Library: Three.js + @react-three/fiber + @react-three/drei
- UI Components: Tailwind CSS
- HTTP Client: Axios
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

## 4. 현재 프로젝트 구조

### 4.1 폴더 구조

```
VirtualScenario/
├── frontend/                   # React 앱
│   ├── src/
│   │   ├── components/
│   │   │   ├── ThreeViewer.tsx
│   │   │   ├── InspectorPanel.tsx
│   │   │   └── TimelinePanel.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SceneEditor.tsx
│   │   │   ├── BackgroundMapEditor.tsx
│   │   │   └── Simulator.tsx
│   │   ├── hooks/
│   │   │   └── useUndoRedo.ts
│   │   ├── lib/
│   │   │   └── api.ts          # API 클라이언트
│   │   └── App.tsx
│   └── package.json
│
├── backend/                    # Electron + Express
│   ├── src/
│   │   ├── main.ts            # Electron 진입점
│   │   ├── server.ts          # Express 서버
│   │   ├── database.ts        # SQLite 관리
│   │   └── routes/            # API 라우트
│   ├── database/
│   │   ├── schema.sql
│   │   └── data/scenario.db
│   └── package.json
│
├── docs/                       # 문서
└── package.json               # Root
```

### 4.2 주요 API 엔드포인트

현재 시스템은 REST API 방식을 사용합니다.

#### Backend - Express Routes

```typescript
// Projects
GET    /api/projects               // 프로젝트 목록
POST   /api/projects               // 프로젝트 생성
GET    /api/projects/:id           // 프로젝트 조회
PUT    /api/projects/:id           // 프로젝트 수정
DELETE /api/projects/:id           // 프로젝트 삭제

// Scenes
GET    /api/projects/:id/scenes    // 씬 목록
POST   /api/projects/:id/scenes    // 씬 생성
PUT    /api/scenes/:id             // 씬 수정
DELETE /api/scenes/:id             // 씬 삭제

// Objects
GET    /api/scenes/:id/objects     // 오브젝트 목록
POST   /api/scenes/:id/objects     // 오브젝트 생성
PUT    /api/scenes/:sceneId/objects/:id
DELETE /api/scenes/:sceneId/objects/:id

// Dialogues
GET    /api/scenes/:id/dialogues
POST   /api/scenes/:id/dialogues
PUT    /api/scenes/:sceneId/dialogues/:id
DELETE /api/scenes/:sceneId/dialogues/:id

// Background Maps
GET    /api/background-maps
POST   /api/background-maps
GET    /api/background-maps/:id
PUT    /api/background-maps/:id
DELETE /api/background-maps/:id

// Export
GET    /api/projects/:id/export    // JSON 내보내기
```

#### Frontend - API Client

```typescript
// frontend/src/lib/api.ts
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const projectsAPI = {
  getAll: () => axios.get(`${API_BASE}/projects`),
  create: (data) => axios.post(`${API_BASE}/projects`, data),
  update: (id, data) => axios.put(`${API_BASE}/projects/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE}/projects/${id}`),
  export: (id) => axios.get(`${API_BASE}/projects/${id}/export`),
};
```

---

## 5. 개발 로드맵

### Phase 1-2: 기본 구조 & 3D 에디터 ✅ (완료)

#### 완료된 기능
- ✅ Electron + Vite + React 프로젝트 구성
- ✅ Express REST API + SQLite 데이터베이스
- ✅ 프로젝트/씬 CRUD
- ✅ Three.js 3D 뷰어
- ✅ Transform Controls (Gizmo)
- ✅ 배경 맵 시스템
- ✅ 시뮬레이터 (재생 기능)
- ✅ 키프레임 애니메이션
- ✅ Undo/Redo 시스템

**Milestone 1-2**: 기본 에디터 및 시뮬레이터 완성 ✅

---

### Phase 3: 내보내기 기능 ✅ (완료)

#### 완료된 기능
- ✅ JSON Export (시나리오 데이터)
- ✅ MP4 Export (영상 녹화)
- ✅ Excel Export (엑셀 문서)

**Milestone 3**: 다양한 형식으로 내보내기 완성 ✅

---

### Phase 4: Electron 패키징 ✅ (완료)

#### 완료된 기능
- ✅ Electron 앱 패키징
- ✅ Windows 인스톨러 (.exe)
- ✅ 독립 실행 가능한 데스크톱 앱

**Milestone 4**: 최종 배포 가능한 앱 완성 ✅

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
HTTP Request (Axios)
   ↓
Express API (localhost:3001)
   ↓
SQLite Query (better-sqlite3)
   ↓
JSON Response
   ↓
React State Update
   ↓
UI Re-render
```

---

## 8. 프로젝트 특징

| 항목 | 설명 |
|------|------|
| 실행 환경 | 데스크톱 앱 (오프라인) |
| 데이터 저장 | SQLite (로컬) |
| 3D 렌더링 | Three.js |
| 파일 내보내기 | MP4, Excel, JSON |
| 배포 방식 | Windows Installer (.exe) |
| 업데이트 | 독립 실행 파일 |

---

**현재 상태**: 프로덕션 레벨 완성 ✅
