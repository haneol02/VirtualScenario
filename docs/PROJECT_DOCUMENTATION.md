# VirtualScenario - 코레일 안전교육 시나리오 에디터 & 3D 시뮬레이터

![Project Status](https://img.shields.io/badge/Status-Phase%202%20Complete-success)
![Version](https://img.shields.io/badge/Version-0.4.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [기술 스택 및 아키텍처](#-기술-스택-및-아키텍처)
3. [주요 기능](#-주요-기능)
4. [데이터베이스 설계](#-데이터베이스-설계)
5. [API 명세](#-api-명세)
6. [사용자 가이드](#-사용자-가이드)
7. [개발 로드맵 및 향후 계획](#-개발-로드맵-및-향후-계획)
8. [기술적 도전과 해결](#-기술적-도전과-해결)
9. [설치 및 실행](#-설치-및-실행)

---

## 📌 프로젝트 개요

### 프로젝트 소개

**VirtualScenario**는 코레일(한국철도공사) 안전교육을 위한 **3D 시나리오 에디터 및 시뮬레이터**입니다. 교육 담당자가 직관적인 웹 기반 인터페이스에서 3D 교육 시나리오를 제작하고, 실시간으로 시뮬레이션할 수 있는 통합 플랫폼을 제공합니다.

### 개발 배경 및 필요성

철도 안전교육은 다양한 위험 상황을 실제로 체험하기 어렵고, 비용과 시간이 많이 소요됩니다. VirtualScenario는 다음과 같은 문제를 해결하고자 개발되었습니다:

- **실제 체험의 한계**: 위험한 상황을 실제로 재현하는 것은 불가능하거나 위험
- **교육 비용 절감**: 물리적 시설 없이 가상 환경에서 반복 학습 가능
- **시나리오 재사용성**: 한 번 제작한 시나리오를 여러 교육 세션에서 재활용
- **빠른 프로토타이핑**: 복잡한 3D 모델링 없이 프리미티브로 빠른 제작
- **Unity 연동**: 고품질 시뮬레이터로 확장 가능한 JSON Export 지원

### 핵심 목표

1. **직관적인 에디터**: 비전문가도 쉽게 사용할 수 있는 드래그 앤 드롭 기반 3D 에디터
2. **실시간 시뮬레이션**: 제작한 시나리오를 즉시 재생하고 검증
3. **확장 가능한 아키텍처**: Unity, Unreal Engine 등 외부 시뮬레이터와 연동 가능
4. **오프라인 실행**: Electron 기반 데스크톱 앱으로 인터넷 없이 사용 가능
5. **문서화 자동화**: 시나리오를 PDF/HWP 문서로 자동 생성

### 주요 특징

#### ✨ 하이라이트

- **🎨 배경 맵 시스템**: 재사용 가능한 배경 환경 (승강장, 선로 등)
- **🎬 키프레임 애니메이션**: 오브젝트의 경로를 타임라인으로 설계
- **🔄 Undo/Redo**: 모든 편집 작업을 실행 취소/다시 실행 (최대 50단계)
- **🏷️ 네임태그 시스템**: 3D 공간에서 오브젝트 이름 실시간 표시
- **🎮 시뮬레이터**: 재생 컨트롤, 타임라인, 자막 시스템 완비
- **🎨 6가지 프리미티브**: Box, Sphere, Cylinder, Cone, Plane, Torus
- **🎨 색상 커스터마이징**: HEX Color Picker로 오브젝트 색상 자유 변경
- **📦 RESTful API**: Frontend/Backend 완전 분리 구조

### 개발 현황 (2025-11-08)

#### ✅ 완료된 Phase (Phase 1-2): **100%**

- ✅ **Core Infrastructure**: 프로젝트 구조 설계, DB 스키마
- ✅ **Backend**: Express + SQLite + RESTful API
- ✅ **Frontend**: React 18 + TypeScript + Vite
- ✅ **3D System**: Three.js 뷰어, TransformControls (Gizmo)
- ✅ **4개 페이지 완성**: Dashboard, SceneEditor, BackgroundMapEditor, Simulator
- ✅ **고급 기능**: 배경 맵, 네임태그, Undo/Redo, 키프레임 애니메이션

#### 🔨 진행 중인 작업

- 현재 안정화 단계 (버그 수정, UX 개선)

#### ⏳ 향후 계획 (Phase 3-4)

- Path 애니메이션 고급 기능 (타임라인 드래그, 커브 에디팅)
- JSON Export for Unity
- PDF/HWP 문서 생성
- Electron 데스크톱 앱 패키징

### 프로젝트 정보

- **개발자**: 동아대학교 AI학과 3년차
- **개발 기간**: 2025-11-01 ~ 현재 (진행 중)
- **라이선스**: MIT License
- **Repository**: [GitHub](https://github.com/haneol02/VirtualScenario) *(예시)*
- **사용 기술**: React, Three.js, Express, SQLite, TypeScript

---

## 🏗️ 기술 스택 및 아키텍처

### 시스템 아키텍처

VirtualScenario는 **3-Tier 아키텍처**로 설계되어 있으며, Frontend와 Backend가 완전히 분리된 구조입니다.

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │          React 18 Frontend (Port 3000)            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │  │
│  │  │  Dashboard  │  │ SceneEditor │  │Simulator │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │        Three.js 3D Viewer                   │  │  │
│  │  │  - TransformControls (Gizmo)                │  │  │
│  │  │  - OrbitControls (Camera)                   │  │  │
│  │  │  - Primitive Rendering                      │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP REST API
                       │ (Axios)
┌──────────────────────▼──────────────────────────────────┐
│                  Application Layer                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │        Express.js Backend (Port 3001)             │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │  │
│  │  │  Projects   │  │    Scenes    │  │ Objects  │ │  │
│  │  │   Router    │  │   Router     │  │  Router  │ │  │
│  │  └─────────────┘  └──────────────┘  └──────────┘ │  │
│  │  ┌─────────────┐  ┌──────────────┐               │  │
│  │  │  Dialogues  │  │  Background  │               │  │
│  │  │   Router    │  │ Maps Router  │               │  │
│  │  └─────────────┘  └──────────────┘               │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ SQL Queries
                       │ (better-sqlite3)
┌──────────────────────▼──────────────────────────────────┐
│                     Data Layer                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              SQLite Database                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │  │
│  │  │ projects │ │  scenes  │ │  scene_objects   │  │  │
│  │  └──────────┘ └──────────┘ └──────────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │  │
│  │  │dialogues │ │background│ │background_objects│  │  │
│  │  │          │ │  _maps   │ │                  │  │  │
│  │  └──────────┘ └──────────┘ └──────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Frontend 기술 스택 (상세 설명)

#### 1. **React 18** - UI 라이브러리
```json
{
  "version": "18.3.1",
  "description": "선언적 UI 프레임워크"
}
```

**선택 이유**:
- **Concurrent Rendering**: 우선순위 기반 렌더링으로 3D 뷰와 UI 업데이트 동시 처리
- **Hooks API**: useState, useEffect 등으로 컴포넌트 로직 간소화
- **Virtual DOM**: 효율적인 DOM 업데이트로 성능 최적화
- **Ecosystem**: 풍부한 라이브러리 생태계 (React Router, Zustand 등)

**주요 사용 패턴**:
- Functional Components + Hooks
- Custom Hooks (useUndoRedo, useKeyboardShortcuts)
- Context API (테마, 설정 등)

#### 2. **TypeScript 5** - 타입 안정성
```json
{
  "version": "5.6.2",
  "description": "정적 타입 검사"
}
```

**장점**:
- **컴파일 타임 오류 감지**: 런타임 오류를 사전에 방지
- **자동 완성**: IDE에서 코드 작성 시 타입 힌트 제공
- **리팩토링 안전성**: 타입 기반으로 코드 변경 시 영향 범위 파악
- **인터페이스 정의**: API 응답, DB 스키마를 타입으로 명확히 정의

**타입 정의 예시**:
```typescript
interface SceneObject {
  id: number;
  scene_id: number;
  name: string;
  type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'torus';
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
  color: string | null;
  path_data: PathKeyframe[] | null;
  show_nametag: number; // SQLite boolean (0 or 1)
}
```

#### 3. **Vite 6** - 빌드 도구
```json
{
  "version": "6.0.1",
  "description": "차세대 프론트엔드 빌드 도구"
}
```

**선택 이유**:
- **빠른 HMR (Hot Module Replacement)**: 코드 수정 시 즉시 반영 (< 100ms)
- **ESBuild 기반**: Go 언어로 작성되어 Webpack보다 10~100배 빠름
- **Native ES Modules**: 브라우저 네이티브 모듈 시스템 활용
- **TypeScript 내장 지원**: 별도 설정 없이 TS 컴파일

**성능 비교**:
| 빌드 도구 | 개발 서버 시작 | HMR 속도 |
|-----------|---------------|----------|
| Webpack   | ~30초         | ~500ms   |
| Vite      | ~1.5초        | ~50ms    |

#### 4. **Three.js** - 3D 렌더링 엔진
```json
{
  "version": "0.170.0",
  "description": "WebGL 기반 3D 라이브러리"
}
```

**핵심 역할**:
- **Scene Graph**: 3D 오브젝트 계층 구조 관리
- **Geometry 렌더링**: 6가지 프리미티브 지오메트리 생성
- **Material System**: 색상, 질감, 조명 처리
- **Camera Controls**: 시점 이동, 회전, 줌
- **Animation Loop**: requestAnimationFrame으로 60fps 렌더링

**사용 컴포넌트**:
```typescript
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  DirectionalLight,
  AmbientLight
} from 'three';
```

**주요 기능 구현**:
- **TransformControls**: Gizmo를 통한 3D 오브젝트 조작
- **OrbitControls**: 마우스로 카메라 회전/이동
- **Raycaster**: 마우스 클릭으로 오브젝트 선택

#### 5. **@react-three/fiber** - React용 Three.js
```json
{
  "version": "8.17.10",
  "description": "React Renderer for Three.js"
}
```

**장점**:
- **선언적 문법**: JSX로 3D 씬 정의
- **Hooks 통합**: useFrame, useThree 등으로 Three.js API 접근
- **자동 메모리 관리**: 컴포넌트 언마운트 시 리소스 자동 정리

**코드 예시**:
```typescript
<Canvas>
  <ambientLight intensity={0.5} />
  <directionalLight position={[10, 10, 5]} />
  <mesh position={[0, 0, 0]}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="orange" />
  </mesh>
  <OrbitControls />
</Canvas>
```

#### 6. **@react-three/drei** - Three.js 유틸리티
```json
{
  "version": "9.117.3",
  "description": "Three.js 헬퍼 컴포넌트 모음"
}
```

**주요 사용 컴포넌트**:
- **Html**: 3D 공간에 HTML 요소 렌더링 (네임태그 표시)
- **OrbitControls**: 카메라 컨트롤 간편 구현
- **TransformControls**: Gizmo 컨트롤 간편 구현
- **Grid**: 바닥 그리드 표시

#### 7. **TailwindCSS** - 유틸리티 우선 CSS 프레임워크
```json
{
  "version": "3.4.17",
  "description": "Utility-first CSS framework"
}
```

**장점**:
- **빠른 스타일링**: 클래스명만으로 즉시 스타일 적용
- **일관성**: 디자인 시스템 자동 적용 (색상, 간격, 타이포그래피)
- **Tree Shaking**: 사용하지 않는 CSS 자동 제거 (최종 빌드 크기 최소화)
- **반응형 디자인**: `sm:`, `md:`, `lg:` 등 브레이크포인트 지원

**사용 예시**:
```tsx
<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  저장
</button>
```

#### 8. **Zustand** - 경량 상태 관리
```json
{
  "version": "5.0.2",
  "description": "작은 번들 크기의 상태 관리 라이브러리"
}
```

**선택 이유**:
- **간단한 API**: Redux보다 훨씬 적은 보일러플레이트
- **TypeScript 지원**: 타입 안정성 보장
- **DevTools 통합**: Redux DevTools로 디버깅 가능
- **번들 크기**: Redux (11KB) vs Zustand (1KB)

**사용 예시**:
```typescript
const useSceneStore = create<SceneState>((set) => ({
  selectedObject: null,
  setSelectedObject: (obj) => set({ selectedObject: obj }),
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing })
}));
```

#### 9. **Axios** - HTTP 클라이언트
```json
{
  "version": "1.7.9",
  "description": "Promise 기반 HTTP 클라이언트"
}
```

**장점**:
- **Interceptors**: 요청/응답 전처리 (인증, 에러 핸들링)
- **자동 JSON 변환**: response.data 자동 파싱
- **Timeout 지원**: 네트워크 오류 방지
- **Cancel Token**: 불필요한 요청 취소

#### 10. **React Router DOM** - 라우팅
```json
{
  "version": "6.28.0",
  "description": "React용 라우팅 라이브러리"
}
```

**주요 라우트**:
```typescript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/scene-editor/:sceneId" element={<SceneEditor />} />
  <Route path="/background-maps" element={<BackgroundMapEditor />} />
  <Route path="/simulator/:projectId" element={<Simulator />} />
</Routes>
```

---

### Backend 기술 스택 (상세 설명)

#### 1. **Node.js 20** - JavaScript 런타임
```json
{
  "version": "20.x",
  "description": "V8 엔진 기반 서버 사이드 JavaScript"
}
```

**선택 이유**:
- **비동기 I/O**: 이벤트 루프로 효율적인 DB 쿼리 처리
- **단일 언어**: Frontend와 Backend 모두 JavaScript/TypeScript 사용
- **NPM 생태계**: 방대한 패키지 라이브러리
- **경량 프로세스**: Electron 앱에 쉽게 번들링 가능

#### 2. **Express 4** - 웹 프레임워크
```json
{
  "version": "4.21.1",
  "description": "Node.js용 미니멀 웹 프레임워크"
}
```

**핵심 기능**:
- **미들웨어 시스템**: 요청 파이프라인 구성 (CORS, Body Parser 등)
- **라우팅**: RESTful API 엔드포인트 정의
- **에러 핸들링**: 중앙화된 에러 처리

**미들웨어 구성**:
```typescript
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/api/projects', projectsRouter);
app.use('/api/scenes', scenesRouter);
app.use('/api/background-maps', backgroundMapsRouter);
```

#### 3. **better-sqlite3** - SQLite 드라이버
```json
{
  "version": "11.8.1",
  "description": "동기식 SQLite 바인딩"
}
```

**선택 이유**:
- **동기식 API**: async/await 없이 간단한 쿼리
- **빠른 성능**: 네이티브 C++ 바인딩으로 속도 향상
- **트랜잭션 지원**: ACID 보장
- **파일 기반**: 서버 없이 단일 파일로 데이터 저장

**사용 예시**:
```typescript
const db = new Database('./database/scenario.db');
const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
const project = stmt.get(projectId);
```

#### 4. **SQLite** - 데이터베이스
```json
{
  "version": "3.x",
  "description": "서버리스 관계형 데이터베이스"
}
```

**장점**:
- **Zero Configuration**: 설치 및 설정 불필요
- **포터블**: 단일 파일로 모든 데이터 저장
- **크로스 플랫폼**: Windows, macOS, Linux 모두 지원
- **ACID 트랜잭션**: 데이터 무결성 보장
- **경량**: 임베디드 시스템에 적합

**스키마 관리**:
- `backend/database/schema.sql`: 전체 스키마 정의
- `backend/database/migrations/`: 마이그레이션 스크립트

#### 5. **CORS** - Cross-Origin 지원
```json
{
  "version": "2.8.5",
  "description": "CORS 미들웨어"
}
```

**설정**:
```typescript
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true
}));
```

#### 6. **Electron 33** - 데스크톱 앱 (계획)
```json
{
  "version": "33.2.1",
  "description": "크로스 플랫폼 데스크톱 앱 프레임워크"
}
```

**역할**:
- **Backend 자동 실행**: child_process로 Express 서버 시작
- **Frontend 로드**: BrowserWindow로 React 앱 표시
- **네이티브 기능**: 파일 시스템, 메뉴바, 단축키 등

---

### 개발 도구

#### **ESLint** - 코드 품질 검사
- TypeScript 규칙 적용
- React Hooks 규칙 검사
- 일관된 코드 스타일 유지

#### **Prettier** - 코드 포맷터
- 자동 코드 정렬
- 팀 협업 시 스타일 충돌 방지

#### **Git** - 버전 관리
- Feature 브랜치 전략
- 커밋 메시지 컨벤션

---

### 디렉토리 구조

```
VirtualScenario/
├── frontend/                  # React 앱
│   ├── src/
│   │   ├── components/        # 재사용 컴포넌트
│   │   │   ├── ThreeViewer.tsx      # 3D 렌더링
│   │   │   ├── InspectorPanel.tsx   # 속성 편집
│   │   │   ├── TimelinePanel.tsx    # 타임라인
│   │   │   └── ObjectList.tsx       # 오브젝트 목록
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SceneEditor.tsx
│   │   │   ├── BackgroundMapEditor.tsx
│   │   │   └── Simulator.tsx
│   │   ├── hooks/             # 커스텀 Hooks
│   │   │   └── useUndoRedo.ts
│   │   ├── api/               # API 클라이언트
│   │   │   └── client.ts
│   │   └── types/             # TypeScript 타입
│   │       └── index.ts
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # Express 서버
│   ├── src/
│   │   ├── server.ts          # Express 앱 진입점
│   │   ├── database.ts        # SQLite 관리
│   │   └── routes/            # API 라우터
│   │       ├── projects.ts
│   │       ├── scenes.ts
│   │       ├── objects.ts
│   │       ├── dialogues.ts
│   │       └── backgroundMaps.ts
│   ├── database/
│   │   ├── schema.sql         # DB 스키마
│   │   ├── scenario.db        # SQLite 파일
│   │   └── migrations/        # 마이그레이션
│   └── package.json
│
├── shared/                    # 공통 타입
│   └── types.ts
│
├── docs/                      # 문서
│   ├── PROJECT_DOCUMENTATION.md
│   ├── PROJECT_PLANNING_V2.md
│   └── PROJECT_STRUCTURE.md
│
└── README.md
```

---

## 🎯 주요 기능

VirtualScenario는 4개의 핵심 페이지로 구성되어 있으며, 각 페이지는 시나리오 제작 워크플로우의 특정 단계를 담당합니다.

### 1. Dashboard - 프로젝트 관리

**역할**: 프로젝트 생성, 조회, 편집, 삭제 및 시뮬레이터 실행

#### 주요 기능

##### 1.1 프로젝트 목록 보기
- 모든 프로젝트를 카드 형태로 표시
- 각 카드에는 제목, 설명, 버전, 생성일, 수정일 표시
- 씬 개수 카운트 표시

##### 1.2 프로젝트 생성
- "새 프로젝트 만들기" 버튼 클릭
- 입력 항목:
  - 제목 (필수)
  - 설명 (선택)
  - 버전 (기본값: "1.0.0")

##### 1.3 프로젝트 편집
- ✏️ 아이콘 클릭으로 Scene Editor 진입
- 프로젝트 삭제 (🗑️ 아이콘)

##### 1.4 시뮬레이터 실행
- ▶️ "재생" 버튼으로 Simulator 페이지 이동
- 완성된 시나리오 전체 재생

#### 기술 구현

```typescript
// API 호출
const projects = await axios.get('/api/projects');

// 프로젝트 카드 렌더링
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {projects.map(project => (
    <ProjectCard key={project.id} project={project} />
  ))}
</div>
```

#### 파일 위치
- `frontend/src/pages/Dashboard.tsx`

---

### 2. Scene Editor - 씬 편집 (핵심 기능)

**역할**: 3D 씬 구성, 오브젝트 배치 및 애니메이션, 대화 작성

#### UI 구성

Scene Editor는 4개 패널로 구성되어 있습니다:

```
┌─────────────────────────────────────────────────────────┐
│                   상단 툴바                              │
│  [씬 선택] [새 씬] [저장] [Undo] [Redo] [재생/정지]      │
├─────────────┬───────────────────────────┬───────────────┤
│             │                           │               │
│  왼쪽 패널  │      3D 뷰어 (중앙)        │  우측 패널    │
│             │                           │               │
│ - 씬 목록   │   Three.js 렌더링         │ - Inspector   │
│ - 오브젝트  │   - 카메라 컨트롤         │ - Transform   │
│   목록      │   - Gizmo (Transform)     │ - 색상 변경   │
│ - 배경 설정 │   - 오브젝트 선택         │ - 키프레임    │
│             │   - 네임태그 표시         │               │
│             │                           │               │
├─────────────┴───────────────────────────┴───────────────┤
│                   하단 패널                              │
│            타임라인 & 대화 관리                          │
│  [재생 컨트롤] [타임라인 슬라이더] [대화 목록]           │
└─────────────────────────────────────────────────────────┘
```

#### 주요 기능

##### 2.1 씬 관리
- **씬 생성**: "새 씬" 버튼으로 씬 추가
- **씬 선택**: 드롭다운에서 현재 편집할 씬 선택
- **씬 삭제**: 현재 씬 삭제 (확인 대화상자)
- **씬 속성**: 제목, 설명, 재생 시간 편집

##### 2.2 오브젝트 배치 및 편집

**오브젝트 추가**:
1. 좌측 패널에서 "오브젝트 추가" 클릭
2. 오브젝트 타입 선택:
   - 📦 Box (정육면체)
   - ⚪ Sphere (구)
   - 🔴 Cylinder (원기둥)
   - 🔺 Cone (원뿔)
   - ▫️ Plane (평면)
   - 🍩 Torus (도넛)
3. 이름 입력 후 생성

**Transform 편집**:
- **Gizmo 조작**: 3D 뷰에서 오브젝트 선택 시 Gizmo 표시
  - 빨간색 축 (X): 좌우 이동/회전
  - 녹색 축 (Y): 상하 이동/회전
  - 파란색 축 (Z): 앞뒤 이동/회전
- **Inspector 패널**: 수치 입력으로 정밀 조절
  - Position (위치): X, Y, Z
  - Rotation (회전): X, Y, Z (도 단위)
  - Scale (크기): X, Y, Z

**색상 변경**:
- HEX Color Picker로 오브젝트 색상 선택
- 실시간 3D 뷰 반영

**네임태그 표시**:
- "네임태그 표시" 체크박스로 On/Off
- 3D 공간에서 오브젝트 위에 이름 표시

##### 2.3 키프레임 애니메이션 (Path Animation)

**키프레임 추가**:
1. 오브젝트 선택
2. 타임라인에서 원하는 시간 설정
3. 'K' 키 또는 "키프레임 추가" 버튼 클릭
4. 현재 Transform (위치, 회전, 스케일) 저장

**키프레임 목록**:
- Inspector 패널 하단에 키프레임 카드 표시
- 각 카드에 시간, 위치, 회전 정보 표시
- 🗑️ 아이콘으로 개별 삭제 가능

**애니메이션 재생**:
- 타임라인 재생 시 오브젝트가 키프레임 사이를 보간 이동
- 선형 보간 (Lerp) 사용

**재생 중 편집 방지**:
- 재생 중에는 편집 불가
- 화면 중앙에 경고 메시지 표시

**구현 코드**:
```typescript
// 키프레임 추가
const handleAddKeyframe = () => {
  const newKeyframe: PathKeyframe = {
    time: currentTime,
    position: [obj.position_x, obj.position_y, obj.position_z],
    rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
    scale: [obj.scale_x, obj.scale_y, obj.scale_z]
  };

  const updatedPath = [...(obj.path_data || []), newKeyframe]
    .sort((a, b) => a.time - b.time);

  await updateObject(obj.id, { path_data: updatedPath });
};

// 애니메이션 보간
function interpolateKeyframes(keyframes: PathKeyframe[], time: number) {
  // 현재 시간의 이전/이후 키프레임 찾기
  const prev = keyframes.filter(k => k.time <= time).pop();
  const next = keyframes.find(k => k.time > time);

  if (!next) return prev;
  if (!prev) return next;

  // 선형 보간
  const t = (time - prev.time) / (next.time - prev.time);
  return {
    position: lerp(prev.position, next.position, t),
    rotation: lerp(prev.rotation, next.rotation, t),
    scale: lerp(prev.scale, next.scale, t)
  };
}
```

##### 2.4 배경 맵 시스템

**배경 맵 선택**:
1. 좌측 패널에서 "배경 설정" 탭 클릭
2. 드롭다운에서 배경 맵 선택
3. 3D 뷰에 배경 오브젝트 자동 로드

**배경 맵 vs 씬 오브젝트**:
- **배경 오브젝트**: 읽기 전용, 회색으로 표시, 편집 불가
- **씬 오브젝트**: 편집 가능, 정상 색상

**배경 맵 생성**:
- "배경 맵 관리" 버튼으로 BackgroundMapEditor 이동
- 새 배경 맵 생성 및 오브젝트 배치

##### 2.5 대화 및 자막 관리

**대화 추가**:
1. 하단 패널에서 "대화 추가" 버튼 클릭
2. 입력 항목:
   - 발화자 이름 (또는 오브젝트 선택)
   - 대화 내용
   - 시작 시간 (초)
   - 종료 시간 (초)

**대화 편집**:
- 대화 카드 클릭으로 편집 모드 진입
- 시간, 내용 수정
- 삭제 가능

**타임라인 표시**:
- 대화가 타임라인에 파란색 바로 표시
- 재생 시 자막으로 화면에 표시

##### 2.6 Undo/Redo 시스템

**지원 작업**:
- Transform 변경 (위치, 회전, 스케일)
- 오브젝트 생성
- 오브젝트 삭제
- 키프레임 추가/삭제

**단축키**:
- **Ctrl+Z** (Mac: Cmd+Z): 실행 취소
- **Ctrl+Shift+Z** (Mac: Cmd+Shift+Z): 다시 실행

**UI 버튼**:
- 좌측 상단에 "↶ 실행 취소 / ↷ 다시 실행" 버튼
- 불가능할 때 비활성화 (회색)

**구현 원리**:
```typescript
// useUndoRedo Hook
const useUndoRedo = (maxHistory = 50) => {
  const [history, setHistory] = useState<UndoAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const pushAction = (action: UndoAction) => {
    // 현재 인덱스 이후의 히스토리 제거
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(action);

    // 최대 개수 제한
    if (newHistory.length > maxHistory) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (currentIndex >= 0) {
      const action = history[currentIndex];
      action.undo(); // 역작업 실행
      setCurrentIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      const action = history[currentIndex + 1];
      action.redo(); // 재작업 실행
      setCurrentIndex(currentIndex + 1);
    }
  };

  return { pushAction, undo, redo, canUndo, canRedo };
};
```

#### 파일 위치
- `frontend/src/pages/SceneEditor.tsx` (메인 페이지)
- `frontend/src/components/ThreeViewer.tsx` (3D 뷰어)
- `frontend/src/components/InspectorPanel.tsx` (속성 패널)
- `frontend/src/components/TimelinePanel.tsx` (타임라인)
- `frontend/src/components/ObjectList.tsx` (오브젝트 목록)
- `frontend/src/hooks/useUndoRedo.ts` (Undo/Redo Hook)

---

### 3. Background Map Editor - 배경 맵 관리

**역할**: 재사용 가능한 배경 환경 생성 및 편집

#### 주요 기능

##### 3.1 배경 맵 목록
- 모든 배경 맵을 목록으로 표시
- 각 항목에 이름, 설명, 생성일 표시

##### 3.2 배경 맵 생성
1. "새 배경 맵" 버튼 클릭
2. 입력 항목:
   - 이름 (예: "승강장", "선로", "사무실")
   - 설명

##### 3.3 배경 오브젝트 편집
- Scene Editor와 동일한 UI/UX
- 3D 뷰어, Inspector, 오브젝트 목록
- Transform 편집, 색상 변경, 네임태그 표시
- Undo/Redo 지원

##### 3.4 배경 맵 삭제
- 삭제 시 해당 배경 맵을 사용하는 씬에 영향
- 삭제 확인 대화상자

#### 사용 예시

**승강장 배경 제작**:
1. "새 배경 맵" 생성 (이름: "승강장")
2. 오브젝트 추가:
   - Plane (바닥): 스케일 (20, 0.1, 5), 색상: 회색
   - Box (선로): 여러 개 배치, 색상: 갈색
   - Cylinder (기둥): 4개 배치, 색상: 하얀색
3. 저장
4. Scene Editor에서 씬 생성 후 "승강장" 배경 선택
5. 배경 위에 씬 오브젝트 추가 (사람, 열차 등)

#### 파일 위치
- `frontend/src/pages/BackgroundMapEditor.tsx`

---

### 4. Simulator - 시뮬레이터 (시나리오 재생)

**역할**: 완성된 시나리오를 전체 재생하고 검증

#### UI 구성

```
┌─────────────────────────────────────────────────────────┐
│                  프로젝트 제목                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│                  3D 뷰어                                 │
│             (Three.js 렌더링)                            │
│                                                          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  씬: Scene 1                          1 / 5              │
│  ⏮️ ▶️ ⏸️ ⏹️ ⏭️         [========>     ] 00:05 / 00:12   │
│  속도: [0.5x] [1x] [2x]                                 │
├─────────────────────────────────────────────────────────┤
│  자막:                                                   │
│  "안전선 뒤로 물러서 주세요." - 안내원                   │
└─────────────────────────────────────────────────────────┘
```

#### 주요 기능

##### 4.1 재생 컨트롤
- **▶️ 재생**: 시뮬레이션 시작
- **⏸️ 일시정지**: 재생 일시 중지
- **⏹️ 정지**: 재생 중지 및 첫 씬으로 이동
- **⏮️ 이전 씬**: 이전 씬으로 이동
- **⏭️ 다음 씬**: 다음 씬으로 이동

##### 4.2 타임라인
- **진행 바**: 현재 씬의 재생 진행률 표시
- **드래그 Seek**: 슬라이더를 드래그하여 원하는 시간으로 이동
- **시간 표시**: 현재 시간 / 전체 시간 (MM:SS 형식)

##### 4.3 속도 조절
- **0.5x**: 느린 재생 (교육용)
- **1x**: 정상 속도
- **2x**: 빠른 재생 (빠른 검토)

##### 4.4 자막 시스템
- **자동 표시**: 대화 시작 시간에 맞춰 자막 표시
- **Fade-in 애니메이션**: 부드러운 등장 효과
- **발화자 이름**: 오브젝트와 연결된 경우 이름 표시
- **자동 숨김**: 대화 종료 시간에 맞춰 자동 숨김

##### 4.5 애니메이션 재생
- **Path 애니메이션**: 키프레임 기반 오브젝트 이동
- **보간 처리**: 키프레임 사이를 부드럽게 보간
- **60fps 렌더링**: requestAnimationFrame으로 부드러운 재생

##### 4.6 씬 자동 전환
- 현재 씬이 끝나면 자동으로 다음 씬 로드
- 마지막 씬 종료 시 재생 정지

#### 구현 코드

```typescript
// 애니메이션 루프
useEffect(() => {
  if (!isPlaying) return;

  const animate = () => {
    setCurrentTime(prev => {
      const newTime = prev + deltaTime * playbackSpeed;

      // 씬 길이 초과 시 다음 씬으로
      if (newTime >= currentScene.duration) {
        if (currentSceneIndex < scenes.length - 1) {
          loadNextScene();
          return 0;
        } else {
          stopPlayback();
          return prev;
        }
      }

      return newTime;
    });

    animationFrameId = requestAnimationFrame(animate);
  };

  animationFrameId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationFrameId);
}, [isPlaying, playbackSpeed]);

// 자막 표시 로직
const currentDialogue = dialogues.find(d =>
  d.start_time <= currentTime && currentTime <= d.end_time
);
```

#### 파일 위치
- `frontend/src/pages/Simulator.tsx`

---

### 5. 고급 기능 요약

#### 5.1 네임태그 시스템
- **기술**: @react-three/drei의 Html 컴포넌트
- **위치**: 오브젝트 위쪽 (position_y + scale_y * 0.7)
- **스타일**: 반투명 검정 배경 + 하얀 텍스트
- **DB 필드**: `show_nametag INTEGER DEFAULT 1`

#### 5.2 Undo/Redo 시스템
- **알고리즘**: 히스토리 스택 (최대 50개)
- **지원 작업**: Transform, Create, Delete, Keyframe
- **단축키**: Ctrl+Z, Ctrl+Shift+Z

#### 5.3 키프레임 애니메이션
- **데이터 구조**: JSON 배열 (time, position, rotation, scale)
- **보간 방식**: 선형 보간 (Lerp)
- **저장**: `scene_objects.path_data` 컬럼 (TEXT JSON)

#### 5.4 배경 맵 시스템
- **재사용성**: 한 번 만든 배경을 여러 씬에서 사용
- **구분**: 배경 오브젝트 vs 씬 오브젝트
- **DB 구조**: `background_maps` + `background_objects` 테이블

---

## 🗄️ 데이터베이스 설계

### 데이터베이스 개요

**DBMS**: SQLite 3.x
**특징**: 서버리스, 파일 기반, 경량, ACID 트랜잭션 지원
**파일 위치**: `backend/database/scenario.db`

### ERD (Entity-Relationship Diagram)

```
┌──────────────┐
│   projects   │
│              │
│ - id (PK)    │
│ - title      │
│ - description│
│ - version    │
│ - created_at │
│ - updated_at │
└──────┬───────┘
       │ 1:N
       │
┌──────▼───────┐         ┌────────────────┐
│    scenes    │ N:1     │ background_maps│
│              ├─────────┤                │
│ - id (PK)    │         │ - id (PK)      │
│ - project_id │         │ - name         │
│ - title      │         │ - description  │
│ - order_index│         │ - created_at   │
│ - background_│         └────────┬───────┘
│   map_id (FK)│                  │ 1:N
└──────┬───────┘                  │
       │ 1:N             ┌────────▼──────────┐
       │                 │background_objects │
┌──────▼───────┐         │                   │
│scene_objects │         │ - id (PK)         │
│              │         │ - background_map_ │
│ - id (PK)    │         │   id (FK)         │
│ - scene_id   │         │ - name            │
│   (FK)       │         │ - type            │
│ - name       │         │ - color           │
│ - type       │         │ - position_x/y/z  │
│ - color      │         │ - rotation_x/y/z  │
│ - position_  │         │ - scale_x/y/z     │
│   x/y/z      │         │ - show_nametag    │
│ - rotation_  │         └───────────────────┘
│   x/y/z      │
│ - scale_     │
│   x/y/z      │
│ - path_data  │
│   (JSON)     │
│ - show_      │
│   nametag    │
└──────┬───────┘
       │ 1:N
       │
┌──────▼───────┐
│  dialogues   │
│              │
│ - id (PK)    │
│ - scene_id   │
│   (FK)       │
│ - object_id  │
│   (FK)       │
│ - speaker_   │
│   name       │
│ - text       │
│ - start_time │
│ - duration   │
│ - order_index│
└──────────────┘

┌────────────────┐
│ asset_library  │
│                │
│ - id (PK)      │
│ - category     │
│ - name         │
│ - type         │
│   (primitive/  │
│    model/text) │
│ - model_path   │
│ - metadata     │
│   (JSON)       │
└────────────────┘
```

### 테이블 구조 상세

#### 1. **projects** - 프로젝트

**역할**: 최상위 시나리오 프로젝트

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | TEXT (PK) | UUID 형식의 고유 ID |
| `title` | TEXT | 프로젝트 제목 (필수) |
| `description` | TEXT | 프로젝트 설명 (선택) |
| `version` | TEXT | 버전 번호 (기본값: "1.0") |
| `thumbnail_path` | TEXT | 썸네일 이미지 경로 (선택) |
| `created_at` | DATETIME | 생성 시간 (자동) |
| `updated_at` | DATETIME | 수정 시간 (자동 업데이트) |
| `is_deleted` | INTEGER | 소프트 삭제 플래그 (0=활성, 1=삭제) |

**인덱스**: 없음 (작은 테이블)

**트리거**:
- `update_projects_timestamp`: UPDATE 시 `updated_at` 자동 업데이트

---

#### 2. **background_maps** - 배경 맵

**역할**: 재사용 가능한 배경 환경 템플릿

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | TEXT (PK) | UUID 형식의 고유 ID |
| `name` | TEXT | 배경 이름 (예: "승강장") |
| `description` | TEXT | 배경 설명 |
| `icon` | TEXT | 아이콘 이모지 (🚉, 🛤️ 등) |
| `background_image_path` | TEXT | 바닥 이미지 경로 (선택) |
| `created_at` | DATETIME | 생성 시간 (자동) |
| `updated_at` | DATETIME | 수정 시간 (자동 업데이트) |

**인덱스**: 없음

**샘플 데이터**:
- `map_platform`: 승강장 🚉
- `map_tracks`: 선로 🛤️
- `map_train_interior`: 열차 내부 🚊
- `map_station`: 역사 🏢
- `map_empty`: 빈 공간 📐

---

#### 3. **background_objects** - 배경 오브젝트

**역할**: 배경 맵에 속한 3D 오브젝트

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | TEXT (PK) | UUID 형식의 고유 ID |
| `background_map_id` | TEXT (FK) | 소속 배경 맵 ID |
| `name` | TEXT | 오브젝트 이름 |
| `type` | TEXT | 타입 (box, sphere, cylinder 등) |
| `model_id` | TEXT | Asset Library 참조 (선택) |
| `color` | TEXT | HEX 색상 코드 (기본값: #6b7280) |
| `show_nametag` | INTEGER | 네임태그 표시 여부 (1=표시, 0=숨김) |
| `position_x/y/z` | REAL | 위치 (x, y, z) |
| `rotation_x/y/z` | REAL | 회전 (라디안) |
| `scale_x/y/z` | REAL | 크기 (기본값: 1.0) |
| `metadata` | TEXT | JSON 추가 정보 |
| `created_at` | DATETIME | 생성 시간 (자동) |

**외래키**:
- `background_map_id` → `background_maps(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_background_objects_map_id` (background_map_id)

---

#### 4. **scenes** - 씬

**역할**: 시나리오를 구성하는 개별 장면

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | TEXT (PK) | UUID 형식의 고유 ID |
| `project_id` | TEXT (FK) | 소속 프로젝트 ID |
| `order_index` | INTEGER | 씬 순서 (0부터 시작) |
| `title` | TEXT | 씬 제목 |
| `description` | TEXT | 씬 설명 |
| `participant_count` | INTEGER | 참가자 수 (선택) |
| `background_map_id` | TEXT (FK) | 배경 맵 ID (선택) |
| `created_at` | DATETIME | 생성 시간 (자동) |
| `updated_at` | DATETIME | 수정 시간 (자동 업데이트) |

**외래키**:
- `project_id` → `projects(id)` (ON DELETE CASCADE)
- `background_map_id` → `background_maps(id)` (ON DELETE SET NULL)

**인덱스**:
- `idx_scenes_project_id` (project_id)
- `idx_scenes_background_map_id` (background_map_id)

---

#### 5. **scene_objects** - 씬 오브젝트

**역할**: 씬에 배치된 3D 오브젝트 (편집 가능)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | TEXT (PK) | UUID 형식의 고유 ID |
| `scene_id` | TEXT (FK) | 소속 씬 ID |
| `type` | TEXT | 타입 (box, sphere, cylinder 등) |
| `name` | TEXT | 오브젝트 이름 |
| `model_id` | TEXT | Asset Library 참조 (선택) |
| `color` | TEXT | HEX 색상 코드 (기본값: #6b7280) |
| `show_nametag` | INTEGER | 네임태그 표시 여부 (1=표시, 0=숨김) |
| `position_x/y/z` | REAL | 위치 (x, y, z) |
| `rotation_x/y/z` | REAL | 회전 (라디안) |
| `scale_x/y/z` | REAL | 크기 (기본값: 1.0) |
| `path_data` | TEXT | 키프레임 애니메이션 데이터 (JSON) |
| `metadata` | TEXT | JSON 추가 정보 |
| `created_at` | DATETIME | 생성 시간 (자동) |

**외래키**:
- `scene_id` → `scenes(id)` (ON DELETE CASCADE)

**인덱스**:
- `idx_scene_objects_scene_id` (scene_id)

**path_data 구조**:
```json
[
  {
    "time": 0,
    "position": [0, 0, 0],
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1]
  },
  {
    "time": 5.2,
    "position": [10, 2, 0],
    "rotation": [0, 1.57, 0],
    "scale": [1, 1, 1]
  }
]
```

---

#### 6. **dialogues** - 대화

**역할**: 씬의 자막 및 음성 대화

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | TEXT (PK) | UUID 형식의 고유 ID |
| `scene_id` | TEXT (FK) | 소속 씬 ID |
| `object_id` | TEXT (FK) | 발화 오브젝트 ID (선택) |
| `speaker_name` | TEXT | 발화자 이름 |
| `text` | TEXT | 대화 내용 (필수) |
| `start_time` | REAL | 시작 시간 (초) |
| `duration` | REAL | 지속 시간 (초) |
| `audio_path` | TEXT | 오디오 파일 경로 (선택) |
| `order_index` | INTEGER | 표시 순서 |
| `created_at` | DATETIME | 생성 시간 (자동) |

**외래키**:
- `scene_id` → `scenes(id)` (ON DELETE CASCADE)
- `object_id` → `scene_objects(id)` (ON DELETE SET NULL)

**인덱스**:
- `idx_dialogues_scene_id` (scene_id)

**종료 시간 계산**:
```typescript
const end_time = start_time + duration;
```

---

#### 7. **asset_library** - 에셋 라이브러리

**역할**: 재사용 가능한 3D 모델, 프리미티브, 이미지 등

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | TEXT (PK) | UUID 형식의 고유 ID |
| `category` | TEXT | 카테고리 (primitive, light, model 등) |
| `name` | TEXT | 에셋 이름 |
| `type` | TEXT | 타입 (primitive, model, image, text) |
| `thumbnail_path` | TEXT | 썸네일 이미지 경로 |
| `model_path` | TEXT | 3D 모델 파일 경로 (.glb/.gltf) |
| `three_js_model_path` | TEXT | Three.js용 모델 경로 |
| `file_path` | TEXT | 업로드 파일 경로 |
| `file_format` | TEXT | 파일 형식 (glb, obj, fbx, png 등) |
| `text_content` | TEXT | 텍스트 콘텐츠 (type=text 시) |
| `text_font_size` | REAL | 텍스트 폰트 크기 |
| `text_color` | TEXT | 텍스트 색상 (HEX) |
| `metadata` | TEXT | JSON 추가 정보 |
| `created_at` | DATETIME | 생성 시간 (자동) |

**인덱스**:
- `idx_asset_library_category` (category)

**프리미티브 샘플 데이터**:
- `primitive_box`: 사각형 📦
- `primitive_sphere`: 구 ⚪
- `primitive_cylinder`: 원기둥 🔴
- `primitive_cone`: 원뿔 🔺
- `primitive_plane`: 평면 ▫️
- `primitive_torus`: 도넛 🍩

---

### 관계 설명

#### 1:N 관계

1. **projects → scenes**: 하나의 프로젝트는 여러 씬을 포함
2. **scenes → scene_objects**: 하나의 씬은 여러 오브젝트를 포함
3. **scenes → dialogues**: 하나의 씬은 여러 대화를 포함
4. **background_maps → background_objects**: 하나의 배경 맵은 여러 오브젝트를 포함

#### N:1 관계

5. **scenes → background_maps**: 여러 씬이 하나의 배경 맵을 참조 (재사용)

#### Cascade 동작

- **ON DELETE CASCADE**: 부모 삭제 시 자식도 삭제
  - project 삭제 → scenes 삭제
  - scene 삭제 → scene_objects, dialogues 삭제
  - background_map 삭제 → background_objects 삭제

- **ON DELETE SET NULL**: 부모 삭제 시 자식의 FK를 NULL로 설정
  - background_map 삭제 → scene의 background_map_id = NULL
  - scene_object 삭제 → dialogue의 object_id = NULL

---

### 데이터베이스 마이그레이션

#### 마이그레이션 히스토리

**2025-11-08**: 네임태그 시스템 추가
```sql
ALTER TABLE scene_objects ADD COLUMN show_nametag INTEGER DEFAULT 1;
ALTER TABLE background_objects ADD COLUMN show_nametag INTEGER DEFAULT 1;
```

**마이그레이션 파일 위치**:
- `backend/database/migrations/001_add_nametag_column.sql`

---

### 성능 최적화

#### 인덱스 전략

1. **외래키 인덱스**: 모든 FK 컬럼에 인덱스 생성 (JOIN 성능 향상)
2. **카테고리 인덱스**: asset_library의 category (필터링 빈도 높음)

#### 쿼리 최적화 예시

**씬 로드 (오브젝트 + 배경 포함)**:
```sql
-- 씬 정보
SELECT * FROM scenes WHERE id = ?;

-- 배경 오브젝트 (읽기 전용)
SELECT bo.*
FROM background_objects bo
JOIN scenes s ON s.background_map_id = bo.background_map_id
WHERE s.id = ?;

-- 씬 오브젝트 (편집 가능)
SELECT * FROM scene_objects WHERE scene_id = ?;

-- 대화
SELECT * FROM dialogues WHERE scene_id = ? ORDER BY start_time;
```

---

### 데이터 무결성

#### Foreign Key Constraints

```sql
PRAGMA foreign_keys = ON;
```

- SQLite는 기본적으로 FK 제약조건이 비활성화되어 있으므로 반드시 활성화 필요
- 서버 시작 시 자동 활성화

#### Trigger로 자동 업데이트

```sql
CREATE TRIGGER update_projects_timestamp
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
  UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

---

## 🔌 API 명세

### API 개요

**Base URL**: `http://localhost:3001/api`
**응답 형식**: JSON
**HTTP 메서드**: GET, POST, PUT, DELETE

### 엔드포인트 목록

#### Projects API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/projects` | 프로젝트 목록 조회 |
| GET | `/projects/:id` | 프로젝트 상세 조회 |
| POST | `/projects` | 프로젝트 생성 |
| PUT | `/projects/:id` | 프로젝트 수정 |
| DELETE | `/projects/:id` | 프로젝트 삭제 |
| GET | `/projects/:id/export` | JSON Export (Unity 연동용) |

**GET /projects - 프로젝트 목록 조회**
```typescript
// Response
{
  "projects": [
    {
      "id": "uuid-1234",
      "title": "승강장 안전교육",
      "description": "승강장에서의 안전 수칙",
      "version": "1.0",
      "created_at": "2025-11-08T10:00:00Z",
      "updated_at": "2025-11-08T15:30:00Z",
      "scene_count": 5
    }
  ]
}
```

**POST /projects - 프로젝트 생성**
```typescript
// Request
{
  "title": "새 프로젝트",
  "description": "설명",
  "version": "1.0"
}

// Response
{
  "id": "uuid-5678",
  "title": "새 프로젝트",
  ...
}
```

#### Scenes API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/projects/:id/scenes` | 프로젝트의 씬 목록 |
| POST | `/projects/:id/scenes` | 씬 생성 |
| PUT | `/scenes/:id` | 씬 수정 |
| DELETE | `/scenes/:id` | 씬 삭제 |

#### Scene Objects API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/scenes/:id/objects` | 씬의 오브젝트 목록 |
| POST | `/scenes/:id/objects` | 오브젝트 추가 |
| PUT | `/scenes/:sceneId/objects/:id` | 오브젝트 수정 |
| DELETE | `/scenes/:sceneId/objects/:id` | 오브젝트 삭제 |

**PUT /scenes/:sceneId/objects/:id - 오브젝트 수정**
```typescript
// Request
{
  "name": "승객1",
  "position_x": 5.0,
  "position_y": 1.0,
  "position_z": 0.0,
  "rotation_x": 0.0,
  "rotation_y": 1.57,
  "rotation_z": 0.0,
  "scale_x": 1.0,
  "scale_y": 1.0,
  "scale_z": 1.0,
  "color": "#ff5733",
  "show_nametag": 1,
  "path_data": [
    { "time": 0, "position": [5, 1, 0], "rotation": [0, 1.57, 0], "scale": [1, 1, 1] },
    { "time": 5, "position": [10, 1, 0], "rotation": [0, 1.57, 0], "scale": [1, 1, 1] }
  ]
}
```

#### Dialogues API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/scenes/:id/dialogues` | 씬의 대화 목록 |
| POST | `/scenes/:id/dialogues` | 대화 추가 |
| PUT | `/scenes/:sceneId/dialogues/:id` | 대화 수정 |
| DELETE | `/scenes/:sceneId/dialogues/:id` | 대화 삭제 |

#### Background Maps API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/background-maps` | 배경 맵 목록 |
| GET | `/background-maps/:id` | 배경 맵 상세 |
| POST | `/background-maps` | 배경 맵 생성 |
| PUT | `/background-maps/:id` | 배경 맵 수정 |
| DELETE | `/background-maps/:id` | 배경 맵 삭제 |
| GET | `/background-maps/:id/objects` | 배경 오브젝트 목록 |
| POST | `/background-maps/:id/objects` | 배경 오브젝트 추가 |
| PUT | `/background-maps/objects/:id` | 배경 오브젝트 수정 |
| DELETE | `/background-maps/objects/:id` | 배경 오브젝트 삭제 |

### 에러 응답

```typescript
{
  "error": "Not Found",
  "message": "Scene with id 'invalid-id' not found",
  "status": 404
}
```

**HTTP 상태 코드**:
- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청
- `404 Not Found`: 리소스 없음
- `500 Internal Server Error`: 서버 오류

---

## 📖 사용자 가이드

### 설치 및 실행

#### 시스템 요구사항

- **Node.js**: 20.x 이상
- **npm**: 9.x 이상
- **OS**: Windows 10/11, macOS 12+, Ubuntu 20.04+
- **RAM**: 최소 4GB (권장 8GB)
- **GPU**: WebGL 지원 그래픽 카드

#### 설치 방법

**1. 저장소 클론**
```bash
git clone https://github.com/haneol02/VirtualScenario.git
cd VirtualScenario
```

**2. Backend 설치 및 실행**
```bash
cd backend
npm install
npm run dev   # 개발 모드 (포트 3001)
```

**3. Frontend 설치 및 실행 (새 터미널)**
```bash
cd frontend
npm install
npm run dev   # 개발 모드 (포트 3000)
```

**4. 브라우저에서 접속**
```
http://localhost:3000
```

#### 프로덕션 빌드

```bash
# Backend 빌드
cd backend
npm run build

# Frontend 빌드
cd frontend
npm run build

# Electron 앱 패키징 (향후 지원)
cd backend
npm run package
```

---

### 주요 기능 사용법

#### 1. 프로젝트 생성

1. Dashboard에서 "새 프로젝트 만들기" 클릭
2. 제목, 설명, 버전 입력
3. "저장" 클릭

#### 2. 씬 편집

1. Dashboard에서 프로젝트의 ✏️ 아이콘 클릭
2. "새 씬" 버튼으로 씬 추가
3. 좌측 패널에서 오브젝트 추가
4. 3D 뷰에서 Gizmo로 Transform 조작
5. 우측 Inspector에서 속성 편집

#### 3. 키프레임 애니메이션

1. 오브젝트 선택
2. 타임라인에서 원하는 시간 설정
3. 오브젝트 위치/회전 조정
4. 'K' 키 또는 "키프레임 추가" 버튼 클릭
5. 재생 버튼으로 애니메이션 확인

#### 4. 배경 맵 활용

1. Dashboard → "배경 맵 관리"
2. "새 배경 맵" 생성 (예: "승강장")
3. 오브젝트 배치 (바닥, 벽, 기둥 등)
4. Scene Editor → "배경 설정" 탭 → 배경 맵 선택

#### 5. 대화 추가

1. Scene Editor 하단 패널 → "대화 추가"
2. 발화자 이름, 내용, 시작/종료 시간 입력
3. 타임라인에 대화 바 표시 확인

#### 6. 시뮬레이터 실행

1. Dashboard → 프로젝트의 ▶️ 버튼 클릭
2. 재생 컨트롤로 시나리오 재생
3. 속도 조절 (0.5x/1x/2x)

---

### 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| **Ctrl+Z** | 실행 취소 (Undo) |
| **Ctrl+Shift+Z** | 다시 실행 (Redo) |
| **K** | 키프레임 추가 |
| **Space** | 재생/일시정지 (Simulator, Editor) |
| **Delete** | 선택한 오브젝트 삭제 |
| **Esc** | 선택 해제 |
| **W** | Gizmo 이동 모드 |
| **E** | Gizmo 회전 모드 |
| **R** | Gizmo 스케일 모드 |

---

## 🚀 개발 로드맵 및 향후 계획

### 완료된 Phase (Phase 1-2): 100% ✅

**기간**: 2025-11-01 ~ 2025-11-08 (1주)

**달성 사항**:
- ✅ Full-Stack 아키텍처 구축 (Express + React + SQLite)
- ✅ 4개 페이지 완성 (Dashboard, SceneEditor, BackgroundMapEditor, Simulator)
- ✅ 3D 에디터 시스템 (Three.js, Transform Controls)
- ✅ 배경 맵 시스템
- ✅ 네임태그 시스템
- ✅ Undo/Redo 시스템
- ✅ 키프레임 애니메이션 (기본)

---

### Phase 3: Path 애니메이션 고급 기능 (예상 2-3주)

#### 우선순위 1: 타임라인 UI 개선
- [ ] 키프레임을 타임라인에 마커로 표시
- [ ] 드래그로 키프레임 시간 조정
- [ ] 키프레임 간 커브 에디팅 (Bezier)
- [ ] 재생 헤드 표시

#### 우선순위 2: 3D 모델 Import
- [ ] GLB/GLTF 파일 업로드
- [ ] Asset Library 통합
- [ ] 모델 프리뷰 썸네일

#### 우선순위 3: 카메라 시스템
- [ ] 씬별 카메라 위치 저장
- [ ] 카메라 애니메이션
- [ ] "현재 카메라 저장" 버튼

---

### Phase 4: Export & 문서화 (예상 2주)

#### 우선순위 1: JSON Export (Unity 연동) ⭐
- [ ] `/api/projects/:id/export` 완성
- [ ] Unity Import 포맷 정의
- [ ] JSON 다운로드 기능

#### 우선순위 2: PDF 문서 생성
- [ ] jsPDF 통합
- [ ] PDF 템플릿 디자인
- [ ] 프로젝트 정보 + 씬 목록 + 대화 목록 출력

#### 우선순위 3: HWP Export (선택)
- [ ] DOCX 형식 우선 구현
- [ ] HWP 변환 도구 연동

---

### Phase 5: Electron 데스크톱 앱 (예상 1주)

- [ ] Electron 설정 완료
- [ ] Backend 자동 실행
- [ ] 메뉴바 & 단축키
- [ ] Windows installer 생성

---

### Phase 6: 추가 개선 사항 (선택)

#### UI/UX 고도화
- [ ] 드래그 앤 드롭으로 씬 순서 변경
- [ ] 오브젝트 복사/붙여넣기 (Ctrl+C/V)
- [ ] Dark/Light 테마 전환
- [ ] 다국어 지원 (영어/한국어)

#### 성능 최적화
- [ ] Three.js LOD (Level of Detail)
- [ ] Object Pooling
- [ ] Virtual Scrolling

---

### 전체 진행률

```
Phase 1-2: 기본 구조 & 3D 에디터      [████████████████████] 100%
Phase 3:   Path 애니메이션 고급         [████░░░░░░░░░░░░░░░░]  20%
Phase 4:   Export & 문서화             [░░░░░░░░░░░░░░░░░░░░]   0%
Phase 5:   Electron 패키징             [░░░░░░░░░░░░░░░░░░░░]   0%

전체 진행률: ██████████░░░░░░░░░░ 50%
```

---

## 🛠️ 기술적 도전과 해결

### 1. Electron IPC 통신 문제 (2025-11-07)

**문제**:
- Electron IPC 통신이 복잡하고 디버깅 어려움
- Git Bash 환경에서 `require('electron')` 실행 오류
- Renderer Process와 Main Process 간 데이터 전달 복잡

**해결**:
- **REST API 방식으로 전환**: Express 서버를 별도 프로세스로 실행
- **Frontend/Backend 완전 분리**: HTTP 통신으로 단순화
- **장점**:
  - 디버깅 용이 (Chrome DevTools + Postman)
  - 웹 브라우저에서도 실행 가능 (개발 중)
  - Electron은 향후 패키징 단계에서만 사용

**파일**:
- `backend/src/server.ts` (Express 서버)
- `frontend/src/api/client.ts` (Axios 클라이언트)

---

### 2. 배경 맵 시스템 재설계 (2025-11-08)

**문제**:
- 기존 배경 프리셋은 단순 색상 변경만 가능
- 오브젝트가 배치된 배경 환경을 재사용할 수 없음

**요구사항**:
- 승강장, 선로 등 배경을 한 번 만들면 여러 씬에서 재사용
- 배경 오브젝트는 씬에서 편집 불가 (읽기 전용)

**해결**:
- **background_maps 테이블**: 재사용 가능한 배경 정의
- **background_objects 테이블**: 배경에 속한 오브젝트
- **BackgroundMapEditor 페이지**: 배경 맵 전용 에디터
- **3D 뷰어 개선**: 배경 오브젝트와 씬 오브젝트 동시 렌더링

**구현**:
```typescript
// SceneEditor에서 배경 맵 로드
const backgroundObjects = await fetchBackgroundObjects(scene.background_map_id);

// 3D 뷰어에서 구분하여 렌더링
<group name="background" opacity={0.5}>
  {backgroundObjects.map(obj => <BackgroundObject key={obj.id} object={obj} />)}
</group>
<group name="scene">
  {sceneObjects.map(obj => <SceneObject key={obj.id} object={obj} />)}
</group>
```

---

### 3. 키프레임 애니메이션 초기 위치 버그 (2025-11-08)

**문제**:
- 키프레임이 있는 오브젝트가 재렌더링 시 DB 위치로 리셋됨
- 애니메이션 첫 프레임과 DB 위치가 불일치

**원인**:
- ThreeViewer에서 초기 위치를 항상 DB 값으로 설정
- path_data의 첫 키프레임을 무시

**해결**:
```typescript
// getInitialTransform 함수 추가
function getInitialTransform(obj: SceneObject) {
  if (obj.path_data && obj.path_data.length > 0) {
    // 첫 키프레임 우선 사용
    const firstKeyframe = obj.path_data[0];
    return {
      position: firstKeyframe.position,
      rotation: firstKeyframe.rotation,
      scale: firstKeyframe.scale ?? [obj.scale_x, obj.scale_y, obj.scale_z]
    };
  }

  // 키프레임 없으면 DB 값 사용
  return {
    position: [obj.position_x, obj.position_y, obj.position_z],
    rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
    scale: [obj.scale_x, obj.scale_y, obj.scale_z]
  };
}
```

---

### 4. Undo/Redo 히스토리 스택 설계

**문제**:
- 모든 편집 작업을 취소/복구할 수 있어야 함
- 메모리 효율적으로 히스토리 관리 필요

**해결**:
- **Command Pattern** 적용: 각 작업을 `undo()`, `redo()` 메서드를 가진 객체로 캡슐화
- **최대 50개 히스토리**: 메모리 오버플로우 방지
- **Deep Copy**: 오브젝트 상태를 스냅샷으로 저장 (참조가 아닌 값 복사)

**구현**:
```typescript
interface UndoAction {
  undo: () => void;
  redo: () => void;
  description: string;
}

// Transform 변경 예시
const action: UndoAction = {
  description: 'Transform 변경',
  undo: () => updateObject(obj.id, oldTransform),
  redo: () => updateObject(obj.id, newTransform)
};

pushAction(action);
```

---

### 5. Three.js 성능 최적화

**문제**:
- 오브젝트 수가 많아지면 FPS 저하 (50개 이상 시 30fps 미만)

**해결 방안 (향후)**:
- **Frustum Culling**: 카메라 밖 오브젝트 렌더링 생략
- **Instanced Mesh**: 동일한 지오메트리를 가진 오브젝트 일괄 렌더링
- **LOD (Level of Detail)**: 거리에 따라 상세도 조절

---

## 📝 프로젝트 구조

```
VirtualScenario/
├── frontend/                  # React 앱 (포트 3000)
│   ├── src/
│   │   ├── components/        # 재사용 컴포넌트
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── hooks/             # 커스텀 Hooks
│   │   ├── api/               # API 클라이언트
│   │   └── types/             # TypeScript 타입
│   └── package.json
│
├── backend/                   # Express 서버 (포트 3001)
│   ├── src/
│   │   ├── server.ts          # 진입점
│   │   ├── database.ts        # SQLite 관리
│   │   └── routes/            # API 라우터
│   ├── database/
│   │   ├── schema.sql         # DB 스키마
│   │   ├── scenario.db        # SQLite 파일
│   │   └── migrations/        # 마이그레이션
│   └── package.json
│
├── shared/                    # 공통 타입
│   └── types.ts
│
├── docs/                      # 문서
│   ├── PROJECT_DOCUMENTATION.md
│   ├── PROJECT_PLANNING_V2.md
│   └── PROJECT_STRUCTURE.md
│
├── CLAUDE.md                  # Claude 작업 기록
└── README.md                  # 프로젝트 소개
```

---

## 🎓 프로젝트 학습 내용

### 기술적 성과

1. **Full-Stack 개발**: Frontend (React) + Backend (Express) + DB (SQLite) 통합
2. **3D 웹 그래픽**: Three.js로 실시간 3D 렌더링 및 상호작용
3. **RESTful API 설계**: 효율적인 CRUD 엔드포인트 구성
4. **상태 관리**: Zustand로 경량 상태 관리
5. **타입 안정성**: TypeScript로 런타임 오류 최소화
6. **애니메이션 시스템**: 키프레임 보간 알고리즘 구현
7. **Undo/Redo 패턴**: Command Pattern 적용

### 개발 방법론

- **Git 버전 관리**: Feature 브랜치 전략
- **문서화**: 상세한 기술 문서 작성
- **점진적 개발**: Phase별 단계적 구현

---

## 📄 라이선스

MIT License

Copyright (c) 2025 동아대학교 AI학과

---

## 📧 문의

- **개발자**: 동아대학교 AI학과 3년차
- **Email**: [이메일 주소]
- **Repository**: [GitHub 링크]

---

**마지막 업데이트**: 2025-11-10

---

## 🙏 감사의 말

이 프로젝트는 코레일 안전교육의 효율성을 높이기 위해 개발되었습니다. Three.js, React, Express 등 오픈소스 커뮤니티에 감사드립니다.

---

**프로젝트 문서 끝**
