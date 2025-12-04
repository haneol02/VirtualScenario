# VirtualScenario - Claude 작업 기록

## 프로젝트 개요
- **목적**: 코레일 안전교육 시나리오 에디터 & 3D 시뮬레이터
- **아키텍처**: Frontend(React) + Backend(Express + SQLite) + Electron 데스크톱 앱
- **개발자**: 동아대 AI학과 3년차

---

## 현재 상태 (2025-11-08)

### ✅ Phase 1-2 완료 (100%)

#### Core Infrastructure
- ✅ 프로젝트 기획서 작성 (docs/PROJECT_PLANNING_V2.md)
- ✅ 데이터베이스 스키마 설계 (SQLite)
- ✅ 프로젝트 구조 재설계 (Frontend/Backend 분리)

#### Backend (100%)
- ✅ Express API 서버 완성
- ✅ Projects, Scenes, Objects, Dialogues CRUD
- ✅ Background Maps & Objects CRUD
- ✅ SQLite 데이터베이스 (better-sqlite3)
- ✅ RESTful API 엔드포인트

#### Frontend (100%)
- ✅ React 18 + TypeScript + Vite
- ✅ Dashboard (프로젝트 관리)
- ✅ SceneEditor (씬 편집)
- ✅ BackgroundMapEditor (배경 맵 관리)
- ✅ Simulator (시나리오 재생)

#### 3D System (100%)
- ✅ Three.js 3D 뷰어
- ✅ TransformControls (Gizmo)
- ✅ 6가지 프리미티브 렌더링 (box, sphere, cylinder, cone, plane, torus)
- ✅ 색상 커스터마이징
- ✅ 카메라 컨트롤 (OrbitControls)

#### Advanced Features (100%)
- ✅ **배경 맵 시스템**: 재사용 가능한 배경 환경
- ✅ **네임태그 시스템**: 오브젝트 이름 3D 표시 (토글 가능)
- ✅ **Undo/Redo**: Ctrl+Z/Ctrl+Shift+Z 지원 (Transform, Create, Delete, Keyframes)
- ✅ **시뮬레이터**: 재생 컨트롤, 타임라인, 자막 시스템
- ✅ **Path 애니메이션 시스템** (Phase A 완료):
  - 키프레임 기반 애니메이션 (위치, 회전, 스케일)
  - 'K' 키로 키프레임 추가
  - Inspector에서 키프레임 목록 표시 및 삭제
  - 타임라인에서 수동 장면 길이 조절
  - 재생 중 편집 방지 경고 메시지
  - 키프레임 Undo/Redo 지원
- ✅ **UI/UX 개선**:
  - 오브젝트 편집 토글 (클릭 시 열기/닫기)
  - Undo/Redo 버튼 위치 최적화 (좌측 상단)

### 🔨 진행 중 (0%)
- 없음

### ✅ Phase 3-4 완료 (100%)
- ✅ Path 애니메이션 시스템 (키프레임 기반)
- ✅ JSON Export (시나리오 데이터)
- ✅ MP4 내보내기 (ffmpeg)
- ✅ Excel 내보내기 (ExcelJS)
- ✅ Electron 데스크톱 앱 패키징

---

## 프로젝트 구조

```
VirtualScenario/
├── frontend/              # React + Vite (포트 3000)
│   └── (진행 중)
│
├── backend/               # Express API + SQLite (포트 3001)
│   ├── src/
│   │   ├── server.ts     # Express 서버
│   │   ├── database.ts   # SQLite 관리
│   │   └── routes/       # REST API 라우트
│   ├── database/
│   │   └── schema.sql    # DB 스키마
│   └── package.json
│
├── shared/                # 공통 타입 정의
│   └── types.ts
│
├── docs/                  # 문서
│   ├── PROJECT_PLANNING_V2.md
│   ├── PROJECT_STRUCTURE.md
│   └── SUPABASE_SETUP.md (폐기)
│
└── README.md
```

---

## 기술 스택

### Frontend
```json
{
  "framework": "React 18 + TypeScript",
  "build": "Vite 6",
  "styling": "TailwindCSS",
  "3d": "Three.js + @react-three/fiber",
  "state": "Zustand",
  "http": "Axios"
}
```

### Backend
```json
{
  "runtime": "Node.js 20",
  "server": "Express 4",
  "database": "SQLite (better-sqlite3)",
  "electron": "Electron 33",
  "language": "TypeScript 5"
}
```

---

## 데이터베이스 스키마

### 주요 테이블
- `projects`: 프로젝트 정보
- `scenes`: 씬 목록 (background_map_id 외래키)
- `scene_objects`: 3D 오브젝트 (위치, 회전, 스케일, color, path)
- `dialogues`: 대화/자막
- `background_maps`: 배경 맵 정의 ✨
- `background_objects`: 배경 맵의 오브젝트들 ✨
- `asset_library`: 에셋 라이브러리 (프리미티브 포함)

전체 스키마: `backend/database/schema.sql`

---

## API 엔드포인트 (구현 완료)

### Projects
```
GET    /api/projects           # 프로젝트 목록
GET    /api/projects/:id       # 프로젝트 상세
POST   /api/projects           # 프로젝트 생성
PUT    /api/projects/:id       # 프로젝트 수정
DELETE /api/projects/:id       # 프로젝트 삭제
GET    /api/projects/:id/export  # JSON 내보내기
```

### Scenes
```
GET    /api/projects/:id/scenes
POST   /api/projects/:id/scenes
PUT    /api/scenes/:id
DELETE /api/scenes/:id
```

### Scene Objects
```
GET    /api/scenes/:id/objects
POST   /api/scenes/:id/objects
PUT    /api/scenes/:sceneId/objects/:id
DELETE /api/scenes/:sceneId/objects/:id
```

### Dialogues
```
GET    /api/scenes/:id/dialogues
POST   /api/scenes/:id/dialogues
PUT    /api/scenes/:sceneId/dialogues/:id
DELETE /api/scenes/:sceneId/dialogues/:id
```

### Background Maps ✨
```
GET    /api/background-maps              # 배경 맵 목록
GET    /api/background-maps/:id          # 배경 맵 상세
POST   /api/background-maps              # 배경 맵 생성
PUT    /api/background-maps/:id          # 배경 맵 수정
DELETE /api/background-maps/:id          # 배경 맵 삭제
GET    /api/background-maps/:id/objects  # 배경 오브젝트 목록
POST   /api/background-maps/:id/objects  # 배경 오브젝트 추가
PUT    /api/background-maps/objects/:id  # 배경 오브젝트 수정
DELETE /api/background-maps/objects/:id  # 배경 오브젝트 삭제
```

---

## 실행 방법

### 개발 모드
```bash
# Backend (터미널 1)
cd backend
npm install
npm run dev         # http://localhost:3001

# Frontend (터미널 2)
cd frontend
npm install
npm run dev         # http://localhost:3000

# Electron (터미널 3 - 선택)
cd backend
npm run electron
```

### 프로덕션 빌드
```bash
cd backend
npm run build && npm run package
```

---

## 개발 로드맵

### Phase 1: 기본 구조 (1-2주) ← 현재
- [x] 프로젝트 구조 설계
- [ ] Backend Express API 서버
- [ ] Frontend React 앱
- [ ] 프로젝트 CRUD 기능
- [ ] Scene CRUD 기능

### Phase 2: 3D 에디터 (2-3주)
- [ ] Three.js 3D 뷰어
- [ ] Object 드래그 앤 드롭
- [ ] Transform controls
- [ ] Asset library UI

### Phase 3: Unity 연동 (2주)
- [ ] JSON Export
- [ ] Unity Importer
- [ ] Scene Builder
- [ ] Path Animation

### Phase 4: 문서화 (2주)
- [ ] PDF Template
- [ ] jsPDF 통합
- [ ] HWP Export

---

## 문제 해결 기록

### 2025-11-07: Electron IPC 문제
- **문제**: Electron IPC 통신 복잡, `require('electron')` 실행 오류
- **원인**: Git Bash 환경에서 Electron 바이너리 실행 문제
- **해결**: REST API 방식으로 전환 (Express + HTTP)
- **장점**: Frontend/Backend 완전 분리, 디버깅 용이, 웹 전환 가능

### 2025-11-08: 배경 맵 시스템 재설계
- **문제**: 기존 배경 프리셋은 단순 색상 변경만 가능, 재사용 불가
- **요구사항**: 오브젝트를 배치한 배경 환경을 만들어 여러 씬에서 재사용
- **해결**:
  - `background_maps` 테이블: 재사용 가능한 배경 환경 정의
  - `background_objects` 테이블: 배경에 속한 오브젝트들 (color 필드 포함)
  - 3D 프리미티브 (box, sphere, cylinder, cone, plane, torus) 추가
  - BackgroundMapEditor 페이지로 배경 맵 관리
  - SceneEditor에서 배경 맵 선택 시 자동으로 배경 오브젝트 로드
- **장점**:
  - 승강장, 선로 등 배경을 한 번 만들면 여러 씬에서 재사용
  - 프리미티브 + 색상으로 빠른 프로토타이핑
  - 배경 오브젝트와 씬 오브젝트를 3D 뷰에서 함께 표시

### 2025-11-08: 네임태그 시스템 구현
- **요구사항**: 3D 씬에서 오브젝트 이름을 네임태그로 표시, 오브젝트별 On/Off 가능
- **구현**:
  - 데이터베이스: `show_nametag INTEGER DEFAULT 1` 컬럼 추가 (scene_objects, background_objects)
  - Backend: `updateSceneObject()` / `updateBackgroundObject()` 메서드에 showNametag 처리
  - Frontend: @react-three/drei의 `Html` 컴포넌트로 3D 레이블 렌더링
  - UI: SceneEditor, BackgroundMapEditor에 "네임태그 표시" 체크박스 추가
- **스타일**:
  - 오브젝트 위쪽에 표시 (position_y + scale_y * 0.7)
  - 반투명 검정 배경 + 하얀 텍스트
  - 12px 크기, 둥근 모서리, 테두리
- **파일**:
  - [ThreeViewer.tsx](frontend/src/components/ThreeViewer.tsx#L107-L132)
  - [SceneEditor.tsx](frontend/src/pages/SceneEditor.tsx#L533-L547)
  - [BackgroundMapEditor.tsx](frontend/src/pages/BackgroundMapEditor.tsx)

### 2025-11-08: Undo/Redo 시스템 구현
- **요구사항**: Ctrl+Z로 작업 취소, Ctrl+Shift+Z로 다시 실행
- **구현**:
  - **useUndoRedo Hook** ([frontend/src/hooks/useUndoRedo.ts](frontend/src/hooks/useUndoRedo.ts)):
    - 히스토리 스택 기반 (최대 50개)
    - `pushAction()`: 작업 기록
    - `undo()`: 작업 취소
    - `redo()`: 다시 실행
    - `canUndo`, `canRedo`: 상태 플래그
  - **지원 작업**:
    - Transform 변경 (위치, 회전, 스케일)
    - 오브젝트 생성
    - 오브젝트 삭제
  - **키보드 단축키**:
    - Ctrl+Z (Mac: Cmd+Z): 실행 취소
    - Ctrl+Shift+Z (Mac: Cmd+Shift+Z): 다시 실행
  - **UI**:
    - 우측 하단에 "실행 취소 / 다시 실행" 버튼
    - 불가능할 때 비활성화 (회색)
- **적용 위치**:
  - SceneEditor: 씬 오브젝트 편집
  - BackgroundMapEditor: 배경 맵 오브젝트 편집
- **제약사항**:
  - 오브젝트 생성/삭제 undo 시 동일 ID 복원 불가 (새 ID로 재생성)
  - "(복원됨)" 텍스트 추가로 구분

### 2025-11-08: 시뮬레이터 (Simulator) 구현
- **요구사항**: 완성된 시나리오를 재생하고 확인할 수 있는 시뮬레이터
- **구현**:
  - **Simulator 페이지** ([frontend/src/pages/Simulator.tsx](frontend/src/pages/Simulator.tsx)):
    - `/simulator/:projectId` 라우트
    - 프로젝트의 모든 씬을 순서대로 재생
  - **재생 컨트롤**:
    - ▶️ 재생 / ⏸️ 일시정지 / ⏹️ 정지
    - ⏮️ 이전 씬 / ⏭️ 다음 씬
    - 타임라인 슬라이더 (드래그로 Seek)
    - 현재 시간 / 전체 시간 표시 (MM:SS)
    - 재생 속도 조절 (0.5x, 1x, 2x)
  - **자막 시스템**:
    - 화면 하단에 대화 자막 표시
    - 발화자 이름 포함 (오브젝트 연결 시)
    - Fade-in 애니메이션
    - currentTime 기반 자동 표시/숨김
  - **타임라인 로직**:
    - `requestAnimationFrame`으로 실시간 업데이트
    - 씬 길이는 마지막 대화 종료 시간 기준 (최소 10초)
    - 씬 종료 시 자동으로 다음 씬 로드
- **Dashboard 연동**:
  - 프로젝트 카드에 "✏️ 편집" / "▶️ 재생" 버튼 추가
- **스타일링**:
  - Tailwind CSS로 fade-in 애니메이션 추가
  - 타임라인 슬라이더 커스텀 스타일 (파란색 Thumb)

---

## 📋 이후 개발 계획

---

### **Phase 3: Path 애니메이션 & 고급 기능** (예상 소요: 2-3주)

#### 3-1. Path 애니메이션 시스템 ⭐ 최우선
**목표**: 오브젝트가 시간에 따라 이동하는 애니메이션 구현

**구현 항목**:
1. **데이터 구조**:
   - `scene_objects.path_data` JSON 필드 활용
   - Keyframe 구조: `[{ time: 0, position: [x, y, z], rotation: [x, y, z] }, ...]`

2. **SceneEditor - Path 편집 모드**:
   - "Path 모드" 토글 버튼 추가
   - 타임라인 UI (0초 ~ 씬 길이)
   - 키프레임 추가/삭제 버튼
   - 현재 시간에서 오브젝트 위치를 키프레임으로 저장
   - 키프레임 리스트 표시 (시간, 위치 정보)

3. **Simulator - 애니메이션 재생**:
   - currentTime에 따라 오브젝트 위치 보간 (Lerp)
   - 회전 보간 (Slerp)
   - 부드러운 이동 효과

**예상 작업량**: 5-7일

---

#### 3-2. 3D 모델 Import 지원 (선택)
**목표**: 프리미티브 대신 실제 3D 모델 사용

**구현 항목**:
- GLB/GLTF 파일 업로드 기능
- Asset Library에 3D 모델 저장
- ThreeViewer에서 GLTFLoader로 렌더링
- 모델 프리뷰 썸네일 생성

**예상 작업량**: 3-4일

---

#### 3-3. 카메라 시스템 개선 (선택)
**목표**: 씬별 카메라 설정 저장

**구현 항목**:
- 씬별 카메라 위치/각도 저장 (DB)
- "현재 카메라 저장" 버튼
- Simulator에서 씬 전환 시 카메라 자동 이동
- 카메라 애니메이션 (부드러운 전환)

**예상 작업량**: 2-3일

---

### **Phase 4: Export & 문서화** ✅ (완료)

#### 4-1. JSON Export ✅
- ✅ `/api/projects/:id/export` API 구현
- ✅ 전체 프로젝트 데이터 직렬화
- ✅ Scene, Objects, Dialogues, Paths 포함
- ✅ Frontend "Export" 버튼 및 다운로드

#### 4-2. MP4 영상 내보내기 ✅
- ✅ 시뮬레이터 녹화 기능
- ✅ ffmpeg를 통한 MP4 변환
- ✅ Electron 환경에서 파일 저장

#### 4-3. Excel 문서 생성 ✅
- ✅ ExcelJS 통합
- ✅ 프로젝트/씬/오브젝트/대화 정보 포함
- ✅ Excel 파일 다운로드 기능

---

### **Phase 5: Electron 데스크톱 앱** ✅ (완료)

#### 5-1. Electron 앱 구성 ✅
- ✅ Backend 서버 자동 실행
- ✅ Frontend 로드 (BrowserWindow)
- ✅ 개발/프로덕션 모드 분기
- ✅ 메뉴바 & 단축키
- ✅ electron-builder 설정
- ✅ Windows installer (.exe) 생성
- ✅ 아이콘, 앱 이름 설정

---

### **Phase 6: 추가 개선 사항** (선택)

#### 6-1. UI/UX 고도화
- 드래그 앤 드롭으로 씬 순서 변경
- 오브젝트 복사/붙여넣기 (Ctrl+C/Ctrl+V)
- 키보드 단축키 확장 (Delete, Duplicate, F2 이름 변경 등)
- Dark/Light 테마 전환
- 다국어 지원 (영어/한국어)

#### 6-2. 성능 최적화
- Three.js LOD (Level of Detail)
- Object Pooling
- Virtual Scrolling (오브젝트 목록)
- Lazy Loading (씬별)

#### 6-3. 협업 기능
- 프로젝트 공유 (클라우드 스토리지)
- 버전 관리 (Git 통합)
- 멀티 유저 편집 (WebSocket)

---

### **우선순위 요약**

| 순위 | 작업 | 상태 |
|------|------|------|
| 1 | Path 애니메이션 시스템 | ✅ 완료 |
| 2 | JSON Export | ✅ 완료 |
| 3 | MP4 내보내기 | ✅ 완료 |
| 4 | Excel 내보내기 | ✅ 완료 |
| 5 | Electron 앱 패키징 | ✅ 완료 |
| 6 | 3D 모델 Import | ⏳ 선택사항 |
| 7 | 카메라 시스템 개선 | ⏳ 선택사항 |

**현재 상태**: 프로덕션 레벨 완성 ✅

---

## 참고 문서
- [상세 기획서](docs/PROJECT_PLANNING_V2.md)
- [프로젝트 구조](docs/PROJECT_STRUCTURE.md)
- [메인 README](README.md)

---

## 팁

### TypeScript Path Aliases
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### CORS 설정
```typescript
// Backend: 모든 Origin 허용 (개발 중)
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

### Electron 개발 모드
```typescript
// Backend에서 Frontend 로드
if (process.env.NODE_ENV === 'development') {
  mainWindow.loadURL('http://localhost:3000');
} else {
  mainWindow.loadFile('../frontend/dist/index.html');
}
```

---

## 2025-11-08 작업 요약 (Phase A - 키프레임 기본 개선)

### 🎯 Phase A: 긴급 수정 사항 (완료)

**목표**: 키프레임 시스템의 주요 버그 및 불편사항 수정

#### 구현 완료한 수정사항

1. **Scale 필드 Fallback 로직** ✅
   - **문제**: 기존 키프레임에 scale 필드가 없어 오류 발생
   - **해결**: ThreeViewer.tsx에서 nullish coalescing (??)로 DB 값 사용
   - **파일**: [ThreeViewer.tsx](frontend/src/components/ThreeViewer.tsx#L155-L171)

2. **오브젝트 초기 위치 로직 개선** ✅
   - **문제**: 키프레임이 있어도 재렌더링 시 DB 위치로 리셋됨
   - **해결**: getInitialTransform() 함수로 첫 키프레임 우선 사용
   - **파일**: [ThreeViewer.tsx](frontend/src/components/ThreeViewer.tsx#L198-L224)

3. **재생 중 편집 방지 경고** ✅
   - **문제**: 재생 중 편집 불가하지만 안내 없음
   - **해결**: isPlaying 시 화면 중앙에 노란색 경고 메시지 표시
   - **파일**: [SceneEditor.tsx](frontend/src/pages/SceneEditor.tsx#L720-L726)

4. **수동 장면 길이 조절** ✅
   - **문제**: 장면 길이가 자동 계산되어 수동 조절 불가
   - **해결**: 타임라인에 숫자 입력 필드 추가 (10-600초 범위)
   - **파일**: [TimelinePanel.tsx](frontend/src/components/TimelinePanel.tsx#L180-L203)

5. **Inspector에 키프레임 섹션 추가** ✅
   - **문제**: 키프레임 목록을 볼 수 없음
   - **해결**: InspectorPanel에 키프레임 카드 UI 추가, 개별 삭제 가능
   - **파일**: [InspectorPanel.tsx](frontend/src/components/InspectorPanel.tsx#L196-L258)

6. **키프레임 Undo/Redo 지원** ✅
   - **문제**: 키프레임 추가/삭제 작업 취소 불가
   - **해결**: handleAddKeyframe, handleDeleteKeyframe에 pushAction 통합
   - **파일**: [SceneEditor.tsx](frontend/src/pages/SceneEditor.tsx#L397-L429, #L452-L468)

---

## 2025-11-08 작업 요약 (이전 작업)

### 구현 완료한 기능
1. **배경 맵 시스템** (Backend + Frontend 전체)
   - 데이터베이스 스키마 재설계
   - Background Maps & Objects CRUD API
   - BackgroundMapEditor 페이지 (배경 맵 관리)
   - SceneEditor 배경 탭 수정 (배경 맵 선택)
   - 3D 프리미티브 6종 렌더링
   - 색상 커스터마이징 (HEX color picker)

2. **ThreeViewer 개선**
   - 프리미티브 지오메트리 렌더링 함수 추가
   - color 필드 지원 (오브젝트별 색상)
   - BackgroundObject 타입 지원

3. **라우팅 & 네비게이션**
   - `/background-maps` 라우트 추가
   - Dashboard에 "배경 맵 관리" 버튼 추가

4. **네임태그 시스템** ✨
   - show_nametag 컬럼 추가 (DB migration script 포함)
   - Html 컴포넌트로 3D 레이블 렌더링
   - 체크박스로 On/Off 토글
   - Scene 및 Background 오브젝트 모두 지원

5. **Undo/Redo 시스템** ✨
   - useUndoRedo 커스텀 훅 작성
   - Transform, Create, Delete 작업 지원
   - Ctrl+Z / Ctrl+Shift+Z 키보드 단축키
   - 우측 하단 UI 버튼 (활성화 상태 표시)
   - SceneEditor 및 BackgroundMapEditor 모두 적용

6. **시뮬레이터 (Simulator)** ✨
   - 프로젝트 전체 씬 순차 재생
   - 재생/일시정지/정지, 씬 네비게이션
   - 타임라인 슬라이더 + 시간 표시
   - 재생 속도 조절 (0.5x/1x/2x)
   - 실시간 자막 표시 (Fade-in 애니메이션)
   - Dashboard에서 "▶️ 재생" 버튼으로 접근

### 서버 시작 방법
```bash
# 터미널 1: Backend
cd backend
npm run dev

# 터미널 2: Frontend
cd frontend
npm run dev
```

### 테스트 시나리오
1. Dashboard → "배경 맵 관리" 클릭
2. "새 배경 맵 만들기" (예: 승강장)
3. 오브젝트 추가 (사각형, 원기둥 등)
4. 색상 변경 및 Transform 조작
5. Dashboard → 프로젝트 생성
6. Scene Editor → 씬 생성
7. 배경 설정 탭 → 승강장 배경 선택
8. 3D 뷰에서 배경 오브젝트 자동 표시 확인

---

---

## 주요 기능 사용 방법

### 네임태그 시스템
1. SceneEditor 또는 BackgroundMapEditor에서 오브젝트 선택
2. 우측 패널에서 "네임태그 표시" 체크박스 클릭
3. 3D 뷰에서 오브젝트 위에 이름 표시 확인

### Undo/Redo 시스템
- **Ctrl+Z**: 마지막 작업 취소
- **Ctrl+Shift+Z**: 취소한 작업 다시 실행
- 또는 우측 하단 "실행 취소 / 다시 실행" 버튼 사용
- 지원 작업: Transform 변경, 오브젝트 생성/삭제

### 시뮬레이터
1. Dashboard에서 프로젝트 선택 후 "▶️ 재생" 버튼 클릭
2. 재생 컨트롤:
   - **▶️ 재생**: 시뮬레이션 시작
   - **⏸️ 일시정지**: 재생 일시 중지
   - **⏹️ 정지**: 재생 중지 및 첫 씬으로 이동
   - **⏮️ 이전 / ⏭️ 다음**: 씬 이동
   - **타임라인 슬라이더**: 드래그하여 원하는 시간으로 이동
   - **속도 조절**: 0.5x, 1x, 2x
3. 자막은 대화 시간에 맞춰 자동 표시

---

---

## 🎯 현재 진행 상황 요약 (2025-11-08)

### 완료된 Phase (Phase 1-2): 100% ✅

**핵심 달성 사항**:
1. ✅ **Full-Stack 아키텍처 구축**: Express Backend + React Frontend + SQLite DB
2. ✅ **3D 에디터 시스템**: Three.js 기반 3D 뷰어, Transform Controls, 6가지 프리미티브
3. ✅ **4개 페이지 완성**: Dashboard, SceneEditor, BackgroundMapEditor, Simulator
4. ✅ **고급 기능 완성**: 배경 맵, 네임태그, Undo/Redo, 시뮬레이터
5. ✅ **UI/UX 최적화**: 토글 편집, 버튼 위치 개선

### 완료된 단계 (Phase 3-5): 100% ✅

**완료된 작업**:
1. ✅ Path 애니메이션 시스템 (키프레임 기반)
2. ✅ JSON/MP4/Excel 내보내기
3. ✅ Electron 데스크톱 앱 패키징

**최종 상태**: 완전히 작동하는 시나리오 에디터 & 3D 시뮬레이터 & Electron 데스크톱 앱

---

## 📊 개발 진행률

```
Phase 1-2: 기본 구조 & 3D 에디터      [████████████████████] 100%
Phase 3:   Path 애니메이션 시스템      [████████████████████] 100%
Phase 4:   Export 기능                 [████████████████████] 100%
Phase 5:   Electron 패키징             [████████████████████] 100%
Phase 6:   추가 개선사항 (선택)         [░░░░░░░░░░░░░░░░░░░░]   0%

전체 진행률: ████████████████████ 100% ✅
```

---

## 버전 변경 체크리스트 (빌드/문서)
- 설치 파일명(`VirtualScenario Setup x.y.z`)은 `backend/package.json`의 `version`을 따라가므로 릴리스 전 숫자 갱신.
- 워크스페이스 루트 버전(`package.json`의 `version`)도 같은 버전으로 맞춰 관리.
- 앱/문서 노출 버전 갱신 위치:
  - `backend/src/main.ts`: 도움말 > "VirtualScenario 정보" 대화상자 문자열 `VirtualScenario v1.1.0`
  - `frontend/src/pages/Dashboard.tsx`: 푸터에 노출되는 `v1.1.0`
  - `frontend/public/USER_GUIDE.md`: "현재 버전" 표시
  - `docs/PROJECT_DOCUMENTATION.md`: Dashboard 프로젝트 생성 섹션의 기본값 `"1.1.0"`
  - `docs/INCOMPLETE_FEATURES.md`: JSON 예시의 `"version": "1.1.0"`
- 버전 갱신 후 `rg "1\\.1\\.0"` / `rg "v1\\.1\\.0"`로 잔여 문자열이 없는지 확인.

---

## Electron 패키징 백엔드 실행 메모 (2025-12-01)
- 원인: `better-sqlite3` 바이너리가 Node ABI 115로 깔려 Electron 33(Node ABI 130)에서 실패 → 백엔드 서버 미기동.
- 패키징 전 윈도우(x64) 기준 절차:
  1) `cd backend`
  2) `npm install better-sqlite3@11.10.0` (C++ 빌드 도구/파이썬 필요)
  3) `npm run rebuild:native` (`electron-builder install-app-deps --platform=win32 --arch=x64 --version=33.4.11`)
  4) `npm run package` (또는 `npm run package:win`)
- `backend/package.json`에 `asarUnpack`으로 `better-sqlite3/sqlite3` 포함, `node_modules` 포함 설정 있음.
- 성공 여부는 `%APPDATA%/virtual-scenario-backend/app.log`에서 백엔드 기동 로그 확인.

마지막 업데이트: 2025-12-04 (Unity 관련 문서 정리 완료)
