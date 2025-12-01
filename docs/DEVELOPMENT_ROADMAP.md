# VirtualScenario 개발 로드맵

## 프로젝트 개요
코레일 안전교육 시나리오 에디터 & 3D 시뮬레이터

**전체 개발 기간**: 약 3개월 (12주)

---

## Phase 1: 기본 CRUD 완성 (1-2주) ← 현재 70% 완료

### 완료
- [x] Backend Express + SQLite 구축
- [x] Frontend React + Router 구축
- [x] Projects CRUD (생성, 조회, 삭제)
- [x] Scenes CRUD UI (Scene Editor 페이지)
- [x] Scene 테이블에서 duration 필드 제거 (순서만 관리)

### 진행 중
- [ ] **Scene Objects CRUD** (3D 오브젝트 배치 데이터)
  - API 엔드포인트: `/api/scenes/:id/objects`
  - UI: Object 목록, 추가/수정/삭제
  - Transform 데이터 (position, rotation, scale)

- [ ] **Dialogues CRUD** (대화/자막)
  - API 엔드포인트: `/api/scenes/:id/dialogues`
  - UI: 대화 목록, 타임라인
  - Object 연결 (누가 말하는지)

---

## Phase 2: 3D 에디터 (2-3주)

### 목표
Three.js로 3D 씬 편집 기능 구현

### 2-1. Three.js 뷰어 기본 (1주)
- [ ] 패키지 설치
  ```bash
  npm install three @react-three/fiber @react-three/drei
  ```
- [ ] 3D 캔버스 컴포넌트 생성 (`components/ThreeViewer.tsx`)
- [ ] 카메라 OrbitControls (회전, 줌, 팬)
- [ ] Grid + Axis Helper (바닥 격자, XYZ 축 표시)
- [ ] 조명 설정
  - AmbientLight (전역 조명)
  - DirectionalLight (그림자)
- [ ] 기본 모델 로드 테스트 (GLB/GLTF)

### 2-2. Object 배치 시스템 (1주)
- [ ] **Asset Library UI** (왼쪽 사이드바)
  - Asset 카테고리 탭 (사람, 기차, 시설물, 표지판)
  - 썸네일 그리드 뷰
  - 검색 기능

- [ ] **Drag & Drop 구현**
  - Asset 드래그 → 3D 뷰에 Drop
  - 3D 공간 좌표 계산 (Raycaster)
  - `scene_objects` 테이블에 저장

- [ ] **Transform Controls**
  - Object 선택 (클릭)
  - TransformControls (이동/회전/스케일 가즈모)
  - 실시간 DB 업데이트
  - Delete 키로 삭제

- [ ] **Properties Panel** (오른쪽 사이드바)
  - 선택된 Object 정보 표시
  - Transform 수치 입력
  - Metadata 편집

### 2-3. Path Animation (선택 사항) (1주)
- [ ] Curve Editor (Bezier/Spline 경로)
- [ ] Keyframe 타임라인
- [ ] Path Preview (재생/일시정지)
- [ ] `path_data` 필드에 JSON 저장

---

## Phase 3: Unity 시뮬레이터 연동 (2주)

### 목표
JSON 내보내기 → Unity에서 씬 재생

### 3-1. Export 시스템 (3일)

**JSON 스키마 설계**:
```json
{
  "project": {
    "id": "uuid",
    "title": "승강장 안전교육",
    "version": "1.0"
  },
  "scenes": [
    {
      "id": "scene1",
      "order_index": 0,
      "title": "안전선 준수",
      "objects": [
        {
          "id": "obj1",
          "type": "person",
          "model_id": "person_passenger",
          "transform": {
            "position": [0, 0, 0],
            "rotation": [0, 90, 0],
            "scale": [1, 1, 1]
          },
          "path": [
            {"time": 0, "position": [0, 0, 0]},
            {"time": 2, "position": [5, 0, 0]}
          ]
        }
      ],
      "dialogues": [
        {
          "id": "dlg1",
          "object_id": "obj1",
          "text": "안전선 밖에서 기다려 주세요",
          "start_time": 0.5,
          "duration": 3.0
        }
      ]
    }
  ]
}
```

**작업**:
- [ ] Backend `/api/projects/:id/export` 구현
- [ ] 전체 프로젝트 데이터 직렬화
- [ ] Frontend Export 버튼 + JSON 다운로드

### 3-2. Unity Importer (1주)

**Unity 프로젝트 생성**:
- [ ] Unity 2022.3 LTS 설치
- [ ] `unity-simulator` 폴더 초기화
- [ ] Asset Store에서 기본 모델 다운로드

**JSON → Scene Converter**:
- [ ] `ScenarioImporter.cs` 스크립트 작성
  - JSON 파싱 (Newtonsoft.Json)
  - Scene 생성
  - GameObject Instantiate

- [ ] Asset Bundle 연동
  - 모델 파일 로드 (GLB → FBX 변환)
  - Prefab 자동 매칭

- [ ] Timeline으로 Path Animation
  - Animation Track 생성
  - Keyframe 자동 생성

### 3-3. 시뮬레이터 UI (4일)

- [ ] Scene 선택 UI (Canvas)
- [ ] 재생/일시정지/리셋 버튼
- [ ] 진행 바 (Timeline Scrubber)
- [ ] 카메라 전환
  - 1인칭 (Object 시점)
  - 3인칭 (Follow Cam)
  - 자유시점 (Freecam)
- [ ] 자막 표시 (Dialogue 연동)
  - TextMeshPro UI
  - Fade In/Out

---

## Phase 4: 문서 생성 (2주)

### 목표
안전교육 시나리오 PDF/HWP 출력

### 4-1. Template 설계 (3일)

- [ ] 코레일 공문 형식 조사
- [ ] 문서 구조 설계
  ```
  1. 표지
  2. 목차
  3. 프로젝트 개요
  4. 씬별 상세 설명
     - 씬 제목
     - 스크린샷 (3D 뷰)
     - 등장 인물/시설물 목록
     - 대화 스크립트
  5. 부록 (전체 Object 목록)
  ```
- [ ] Markdown → HTML 변환 템플릿 작성

### 4-2. PDF Export (1주)

**라이브러리 선택**:
- Option 1: `jsPDF` (클라이언트)
- Option 2: `pdfmake` (Node.js)
- Option 3: `puppeteer` (HTML → PDF)

**작업**:
- [ ] 라이브러리 설치 및 테스트
- [ ] 3D Scene → 스크린샷 캡처
  - Three.js `renderer.domElement.toDataURL()`
- [ ] 템플릿 렌더링
  - 표지 생성
  - 목차 자동 생성
  - 씬별 페이지 구성
- [ ] 한글 폰트 임베딩 (Noto Sans KR)
- [ ] Backend `/api/projects/:id/pdf` 엔드포인트
- [ ] Frontend PDF 다운로드 버튼

### 4-3. HWP Export (4일)

**접근 방법**:
- [ ] `hwp.js` 또는 `node-hwp` 조사
- [ ] 대안: HWP 템플릿 + ODT/DOCX 변환
  - LibreOffice CLI 사용
  - Pandoc 사용

**작업**:
- [ ] HWP 생성 가능 여부 검증
- [ ] 불가능 시: DOCX 생성 (`.docx` → `.hwp` 변환 안내)

---

## Phase 5: Electron 패키징 (1주)

### 목표
단일 실행 파일로 배포 (`.exe`)

### 작업

- [ ] **Electron Builder 설정**
  ```bash
  npm install --save-dev electron-builder
  ```

- [ ] **Main Process 구현** (`backend/src/electron-main.ts`)
  - Express 서버 자동 시작 (포트 3001)
  - BrowserWindow 생성
  - Frontend 로드 (`http://localhost:3000` → `dist/index.html`)

- [ ] **SQLite DB 경로 설정**
  ```typescript
  const dbPath = path.join(app.getPath('userData'), 'scenario.db');
  ```

- [ ] **Frontend 빌드 통합**
  - `npm run build` → `backend/dist-frontend`
  - Electron에서 정적 파일 서빙

- [ ] **Packaging**
  ```json
  // package.json
  "build": {
    "appId": "com.korail.virtualscenario",
    "productName": "VirtualScenario",
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    }
  }
  ```

- [ ] **Windows Installer 생성**
  ```bash
  npm run package
  ```

- [ ] **코드 서명** (선택 사항)
  - 인증서 구매 및 서명

---

## Phase 6: 최적화 & 테스트 (2주)

### 6-1. 성능 최적화 (1주)

- [ ] **Three.js 최적화**
  - LOD (Level of Detail) 적용
  - Object Instancing (같은 모델 여러 개)
  - Frustum Culling
  - Texture Compression

- [ ] **Frontend 최적화**
  - React.memo 적용
  - Lazy Loading (Asset Library)
  - Virtualized List (긴 목록)

- [ ] **Backend 최적화**
  - SQLite Indexing
  - Connection Pooling
  - Response Caching

### 6-2. 버그 수정 & 테스트 (1주)

- [ ] Unit Test 작성 (API)
- [ ] E2E Test (Playwright)
- [ ] 메모리 누수 확인
- [ ] 크로스 플랫폼 테스트 (Windows 10/11)
- [ ] 사용자 테스트 (코레일 담당자)

### 6-3. 문서화

- [ ] 사용자 매뉴얼 작성 (PDF)
- [ ] 개발자 문서 (API 명세)
- [ ] 설치 가이드
- [ ] 문제 해결 (FAQ)

---

## 전체 타임라인

```
Week 1-2:   Phase 1 (CRUD 완성) ← 현재
Week 3-5:   Phase 2 (3D 에디터)
Week 6-7:   Phase 3 (Unity 연동)
Week 8-9:   Phase 4 (문서 생성)
Week 10:    Phase 5 (Electron 패키징)
Week 11-12: Phase 6 (최적화 & 테스트)
```

---

## 현재 다음 작업

**Scene Objects CRUD 구현**:
1. Backend API 라우트 작성 (`/api/scenes/:id/objects`)
2. Frontend Object 목록 UI
3. Object 추가/수정/삭제 기능
4. Transform 데이터 표시 (position, rotation, scale)

---

## 기술 스택 요약

| 영역 | 기술 |
|------|------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Axios, React Router |
| **Backend** | Node.js 20, Express 4, SQLite (better-sqlite3) |
| **3D** | Three.js, @react-three/fiber, @react-three/drei |
| **Desktop** | Electron 33 |
| **Simulator** | Unity 2022.3 LTS |
| **Document** | jsPDF / pdfmake, node-hwp |

---

최종 업데이트: 2025-12-02
