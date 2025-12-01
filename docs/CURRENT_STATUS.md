# VirtualScenario - 현재 개발 상태

**마지막 업데이트**: 2025-12-02
**개발 방향**: Three.js 시뮬레이터 (Unity 대신)

---

## ✅ 완료된 작업

### Phase 1: 기본 CRUD (100% 완료)
- [x] **Projects CRUD**
  - 프로젝트 생성, 조회, 삭제
  - SQLite 로컬 데이터베이스
  - REST API (Express)

- [x] **Scenes CRUD**
  - 씬 생성, 조회, 삭제
  - 순서 기반 정렬 (duration 필드 제거)
  - 씬 선택 시 관련 데이터 로드

- [x] **Scene Objects CRUD**
  - 오브젝트 추가 (이름, 타입)
  - Transform 데이터 (Position, Rotation, Scale)
  - 타입별 색상 구분 (사람, 기차, 시설물, 표지판)
  - 오브젝트 삭제

- [x] **Dialogues CRUD**
  - 대화/자막 추가
  - 발화자 선택 (오브젝트 연결)
  - 시작 시간 및 지속 시간 설정
  - 타임라인 순서로 표시

### Phase 2-1: Three.js 3D 뷰어 (100% 완료)
- [x] **Canvas 구성**
  - React Three Fiber 통합
  - Camera 설정 (10,10,10 위치)
  - 조명 (Ambient, Directional, Point)

- [x] **뷰어 컨트롤**
  - OrbitControls (회전/팬/줌)
  - Grid Helper (20x20, 1m 단위)
  - Axis Gizmo (XYZ 축 표시)

- [x] **Object 렌더링**
  - 타입별 색상 구분
  - Position, Rotation, Scale 적용
  - 클릭으로 오브젝트 선택
  - 선택 시 하이라이트 (Emissive)

- [x] **UI 연동**
  - 오브젝트 목록 ↔ 3D 뷰 동기화
  - 실시간 Transform 데이터 표시

### Phase 2-2: TransformControls (100% 완료)
- [x] **TransformControls 가즈모**
  - 선택된 오브젝트에 3D 조작 가즈모
  - 마우스 드래그로 Transform 조작
  - 조작 완료 시 자동 DB 업데이트

- [x] **Transform 모드 전환**
  - 이동 모드 (Translate)
  - 회전 모드 (Rotate)
  - 스케일 모드 (Scale)
  - 상단 중앙 버튼 UI

- [x] **실시간 DB 업데이트**
  - Transform 변경 시 자동 저장
  - 오브젝트 목록 자동 새로고침

- [x] **Properties Panel**
  - Position X, Y, Z 수치 입력
  - Rotation X, Y, Z 수치 입력 (도 단위)
  - Scale X, Y, Z 수치 입력
  - 입력 즉시 3D 뷰와 DB 업데이트

---

## 🔨 진행할 작업

### Phase 3: Three.js 시뮬레이터 (1-2주) ← **다음 작업**

#### 3-1. 재생 컨트롤 시스템 (3일)
- [ ] **재생 UI 구현**
  - Simulator 페이지 또는 Scene Editor 내 탭 추가
  - 재생/일시정지/정지 버튼
  - 타임라인 스크러버 (현재 시간 표시)
  - 속도 조절 (0.5x, 1x, 2x)

- [ ] **타임라인 시스템**
  - 전체 씬 길이 계산 (대화 + 애니메이션 기준)
  - 현재 재생 시간 (currentTime) 상태 관리
  - requestAnimationFrame으로 시간 업데이트

#### 3-2. Path 애니메이션 (3-4일)
- [ ] **Path 데이터 구조**
  - Keyframe 기반 (time, position, rotation)
  - scene_objects.path_data JSON 활용

- [ ] **Path 편집 UI** (Scene Editor)
  - "애니메이션 추가" 버튼
  - Keyframe 추가/삭제
  - 시간대별 Transform 설정
  - Curve 시각화 (선으로 경로 표시)

- [ ] **애니메이션 재생** (Simulator)
  - Tween.js 또는 직접 구현
  - 선형 보간 (Lerp) / Bezier Curve
  - 부드러운 움직임

#### 3-3. 대화 자막 시스템 (2일)
- [ ] **자막 UI**
  - 화면 하단에 자막 박스
  - 발화자 이름 표시
  - Fade In/Out 애니메이션

- [ ] **타임라인 연동**
  - currentTime에 따라 대화 표시/숨김
  - start_time ~ start_time + duration
  - 여러 대화 순차 표시

#### 3-4. 카메라 전환 (2일)
- [ ] **카메라 모드**
  - 자유시점 (Free Camera): OrbitControls
  - 고정시점 (Fixed Camera): 특정 각도 고정
  - 1인칭 (First Person): 선택된 오브젝트 시점
  - 추적 모드 (Follow): 오브젝트 따라가기

- [ ] **카메라 전환 UI**
  - 카메라 모드 선택 드롭다운
  - 오브젝트 선택 (1인칭/추적)
  - 부드러운 카메라 전환 (Tween)

#### 3-5. 스크린샷 & 녹화 (선택, 2일)
- [ ] **스크린샷 캡처**
  - Canvas → PNG 변환
  - 다운로드 버튼
  - 문서 생성에 활용

- [ ] **GIF 녹화** (선택)
  - gif.js 라이브러리
  - 재생 중 프레임 캡처
  - GIF 내보내기

---

### Phase 4: 문서 생성 (1-2주)

#### 4-1. PDF Export (1주)
- [ ] **템플릿 설계**
  - 표지 (프로젝트 제목, 버전)
  - 목차 자동 생성
  - 씬별 상세 페이지
    - 씬 제목 및 설명
    - 3D 스크린샷
    - 등장 오브젝트 목록
    - 대화 스크립트

- [ ] **jsPDF 구현**
  - 한글 폰트 임베딩 (Noto Sans KR)
  - 이미지 삽입 (스크린샷)
  - 표 생성 (오브젝트 목록)
  - 자동 줄바꿈

- [ ] **Export API**
  - Backend: `/api/projects/:id/export` (이미 있음)
  - Frontend: PDF 생성 버튼
  - 진행 상태 표시 (씬 1/5 처리 중...)

#### 4-2. HWP Export (선택, 4일)
- [ ] **접근 방법 조사**
  - node-hwp 라이브러리 테스트
  - 대안: DOCX 생성 → HWP 변환 안내

- [ ] **DOCX Export**
  - docx 라이브러리
  - PDF와 동일한 템플릿
  - `.hwp` 변환 방법 안내 문서

---

### Phase 5: Electron 패키징 (1주)

#### 5-1. Electron 통합 (3일)
- [ ] **Main Process 구현**
  - Express 서버 자동 시작
  - BrowserWindow 생성
  - Frontend 로드 (개발: localhost, 빌드: 정적 파일)

- [ ] **SQLite 경로 설정**
  - `app.getPath('userData')` 사용
  - 사용자 데이터 디렉토리에 DB 저장

- [ ] **메뉴바 & 트레이**
  - 파일 메뉴 (새 프로젝트, 열기, 저장)
  - 편집 메뉴 (실행 취소, 다시 실행)
  - 트레이 아이콘 (최소화 시)

#### 5-2. Packaging (2일)
- [ ] **Electron Builder 설정**
  - Windows NSIS 인스톨러
  - 아이콘 설정
  - 자동 업데이트 (선택)

- [ ] **Frontend 빌드 통합**
  - `npm run build` → `backend/dist-frontend`
  - 정적 파일 서빙

- [ ] **테스트 & 배포**
  - Windows 10/11 테스트
  - 설치 프로그램 생성
  - 사용자 매뉴얼 작성

---

### Phase 6: 최적화 & 마무리 (1주)

#### 6-1. 성능 최적화 (3일)
- [ ] **Three.js 최적화**
  - Object Instancing (동일 모델 여러 개)
  - Frustum Culling
  - LOD (Level of Detail)

- [ ] **Frontend 최적화**
  - React.memo 적용
  - Lazy Loading
  - Virtualized List (긴 목록)

- [ ] **Backend 최적화**
  - SQLite Indexing
  - Connection Pooling

#### 6-2. 버그 수정 & 테스트 (2일)
- [ ] Unit Test (API)
- [ ] E2E Test
- [ ] 메모리 누수 확인
- [ ] 크로스 브라우저 테스트

#### 6-3. 문서화 (2일)
- [ ] 사용자 매뉴얼 (PDF)
- [ ] 개발자 문서 (API 명세)
- [ ] 설치 가이드
- [ ] FAQ

---

## 📊 전체 진행률

```
Phase 1: CRUD             ████████████████████ 100%
Phase 2: 3D Editor        ████████████████████ 100%
Phase 3: Simulator        ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: Document         ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: Packaging        ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: Optimization     ░░░░░░░░░░░░░░░░░░░░   0%

전체 진행률: 33%
```

---

## 🎯 예상 개발 기간

| Phase | 예상 시간 | 상태 |
|-------|----------|------|
| Phase 1-2 | 2주 | ✅ 완료 |
| Phase 3 | 1-2주 | ⏳ 대기 |
| Phase 4 | 1-2주 | ⏳ 대기 |
| Phase 5 | 1주 | ⏳ 대기 |
| Phase 6 | 1주 | ⏳ 대기 |
| **총계** | **6-8주** | **33% 완료** |

---

## 📁 프로젝트 구조

```
VirtualScenario/
├── frontend/              # React + Vite + Three.js ✅
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      ✅ (프로젝트 목록)
│   │   │   ├── SceneEditor.tsx    ✅ (씬 편집 + 3D 뷰어)
│   │   │   └── Simulator.tsx      🔨 (시뮬레이터 - 다음 작업)
│   │   ├── components/
│   │   │   ├── ThreeViewer.tsx    ✅ (3D 뷰어)
│   │   │   └── Timeline.tsx       🔨 (타임라인 - 다음 작업)
│   │   └── lib/
│   │       └── api.ts             ✅ (API 클라이언트)
│   └── package.json
│
├── backend/               # Express + SQLite ✅
│   ├── src/
│   │   ├── server.ts              ✅ (Express 서버)
│   │   ├── database.ts            ✅ (SQLite 관리)
│   │   └── routes/                ✅ (REST API)
│   ├── database/
│   │   └── schema.sql             ✅ (DB 스키마)
│   └── package.json
│
├── docs/                  # 문서
│   ├── CURRENT_STATUS.md          📄 (현재 파일)
│   ├── DEVELOPMENT_ROADMAP.md     ✅
│   └── PROJECT_PLANNING_V2.md     ✅
│
└── README.md
```

---

## 🚀 다음 작업 시작

**Phase 3-1: 재생 컨트롤 시스템** 부터 시작하시겠습니까?

구현 순서:
1. Simulator 페이지 생성
2. 재생/일시정지/정지 버튼
3. 타임라인 스크러버
4. currentTime 상태 관리

준비되셨으면 말씀해주세요!
