# VirtualScenario 프로젝트 진행사항

## 📋 프로젝트 개요
- **목적**: 코레일 안전교육 시나리오 에디터 & 3D 시뮬레이터
- **아키텍처**: React Frontend + Express Backend + SQLite + Three.js
- **개발 기간**: 2025-11 ~ 진행중

---

## ✅ Phase 1-2: 기본 인프라 & 에디터 (100% 완료)

### 1. 백엔드 시스템
- Express API 서버 구축
- SQLite 데이터베이스 설계
- RESTful API (Projects, Scenes, Objects, Dialogues, BackgroundMaps)

### 2. 프론트엔드 구조
- React 18 + TypeScript + Vite
- TailwindCSS 스타일링
- 4개 주요 페이지:
  - Dashboard (프로젝트 관리)
  - SceneEditor (씬 편집)
  - BackgroundMapEditor (배경 맵 관리)
  - Simulator (시나리오 재생)

### 3. 3D 시스템
- Three.js 3D 렌더링
- 6가지 프리미티브 (Box, Sphere, Cylinder, Cone, Plane, Torus)
- Transform Controls (이동/회전/스케일)
- OrbitControls 카메라
- 색상 커스터마이징

### 4. 배경 맵 시스템
- 재사용 가능한 배경 환경
- 배경 오브젝트 배치
- 씬별 배경 맵 선택

### 5. 키프레임 애니메이션 (Phase A 완료)
- 'K' 키로 키프레임 추가
- Position, Rotation, Scale 저장
- Inspector에서 키프레임 목록 표시/삭제
- 타임라인 수동 길이 조절
- 재생 중 편집 방지 경고

### 6. 시뮬레이터
- 재생/일시정지/정지 컨트롤
- 씬 네비게이션 (이전/다음)
- 타임라인 슬라이더
- 재생 속도 조절 (0.5x/1x/2x)
- 실시간 자막 표시

### 7. 고급 기능
- 네임태그 시스템 (3D 레이블)
- Undo/Redo (Ctrl+Z/Ctrl+Shift+Z)
- 오브젝트 생성/삭제/Transform 취소

### 8. UI/UX 개선
- 오브젝트 편집 토글
- 키보드 단축키
- 반응형 레이아웃

---

## 🔨 Phase 3: Path 애니메이션 고급 기능 (진행 예정)

### 1. 타임라인 고도화
- [ ] 키프레임 드래그로 시간 이동
- [ ] 키프레임 시각화 (타임라인 마커)
- [ ] 다중 키프레임 선택/편집

### 2. 애니메이션 보간
- [ ] 선형/곡선 보간 선택
- [ ] 커브 에디터
- [ ] 이징 함수 지원

### 3. 카메라 시스템
- [ ] 씬별 카메라 위치 저장
- [ ] 카메라 애니메이션
- [ ] 카메라 프리셋

### 4. 3D 모델 지원
- [ ] GLB/GLTF 파일 Import
- [ ] 3D 모델 라이브러리
- [ ] 모델 프리뷰

---

## 📦 Phase 4: Export & 문서화 (계획)

### 1. JSON Export
- [ ] Unity 연동용 JSON 포맷
- [ ] 전체 프로젝트 직렬화
- [ ] 파일 다운로드 기능

### 2. 문서 생성
- [ ] PDF Export (jsPDF)
- [ ] 시나리오 문서 템플릿
- [ ] HWP Export (선택)

---

## 🖥️ Phase 5: Electron 패키징 (계획)

### 1. 데스크톱 앱
- [ ] Electron 설정
- [ ] 빌드 & 패키징
- [ ] Windows Installer

### 2. 메뉴 & 단축키
- [ ] 파일 메뉴
- [ ] 편집 메뉴
- [ ] 뷰 메뉴

---

## 📊 전체 진행률

```
Phase 1-2 (인프라 & 에디터)          100% ████████████████████
Phase 3   (고급 애니메이션)            0% ░░░░░░░░░░░░░░░░░░░░
Phase 4   (Export & 문서화)            0% ░░░░░░░░░░░░░░░░░░░░
Phase 5   (Electron 패키징)            0% ░░░░░░░░░░░░░░░░░░░░

전체: 40%
```

---

## 🛠️ 기술 스택

### Frontend
- React 18, TypeScript, Vite
- TailwindCSS
- Three.js, @react-three/fiber, @react-three/drei
- Zustand (상태관리)

### Backend
- Express 4, Node.js 20
- SQLite (better-sqlite3)
- TypeScript 5

### 개발 도구
- Git
- Electron (예정)

---

## 📂 프로젝트 구조

```
VirtualScenario/
├── frontend/          # React 앱
│   ├── src/
│   │   ├── pages/         # 4개 메인 페이지
│   │   ├── components/    # 재사용 컴포넌트
│   │   └── hooks/         # 커스텀 훅
│
├── backend/           # Express API
│   ├── src/
│   │   ├── server.ts
│   │   ├── database.ts
│   │   └── routes/
│   └── database/
│       └── schema.sql
│
├── shared/            # 공통 타입
├── docs/              # 문서
└── README.md
```

---

## 🎯 다음 작업 우선순위

1. **Path 애니메이션 고도화** (최우선)
2. **JSON Export 구현**
3. **PDF 문서 생성**
4. **Electron 패키징**

---

## 📝 주요 결정 사항

### 아키텍처 변경 (2025-11-07)
- Electron IPC → REST API 방식 전환
- Frontend/Backend 완전 분리
- 웹 기반 개발 → Electron은 패키징 단계로 이동

### 배경 시스템 재설계 (2025-11-08)
- 단순 색상 프리셋 → 재사용 가능한 배경 맵
- 오브젝트 배치 가능한 배경 환경
- 여러 씬에서 공유 가능

---

마지막 업데이트: 2025-11-20