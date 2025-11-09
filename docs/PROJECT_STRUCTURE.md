# VirtualScenario - 새로운 프로젝트 구조

## 개요

Frontend와 Backend를 완전히 분리한 명확한 구조

```
VirtualScenario/
├── frontend/              # React UI (포트 3000)
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── pages/        # 페이지
│   │   ├── store/        # Zustand 상태 관리
│   │   └── lib/          # API 클라이언트
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/               # Electron Main + Express API (포트 3001)
│   ├── src/
│   │   ├── main.ts       # Electron 진입점
│   │   ├── api/          # Express REST API
│   │   ├── database/     # SQLite 관리
│   │   └── ipc/          # Electron IPC (대안)
│   ├── database/
│   │   └── schema.sql
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                # 공통 타입
│   └── types.ts
│
├── docs/                  # 문서
├── assets/                # 3D 모델, 에셋
├── unity-simulator/       # Unity 프로젝트 (나중에)
│
├── package.json          # Root workspace
└── README.md
```

## 아키텍처

### Option 1: Electron IPC (기존 방식)
```
Frontend (React) ←→ IPC ←→ Backend (Electron Main + SQLite)
```

### Option 2: REST API (추천) ⭐
```
Frontend (React) ←→ HTTP (localhost:3001) ←→ Backend (Express + SQLite)
                                               ↓
                                         Electron Main (창 관리)
```

## 장점

1. **명확한 책임 분리**
   - Frontend: UI만 담당
   - Backend: 데이터 + 비즈니스 로직

2. **독립 개발 가능**
   - Frontend만 따로 개발/테스트
   - Backend만 따로 개발/테스트

3. **웹 변환 용이**
   - 나중에 웹앱으로 전환 쉬움
   - Backend를 그대로 웹 서버로 사용

4. **디버깅 편리**
   - Frontend: 브라우저 개발자 도구
   - Backend: Node.js 디버거

## 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** (빌드 도구)
- **TailwindCSS** (스타일)
- **Three.js** (3D 렌더링)
- **Zustand** (상태 관리)
- **Axios** (HTTP 클라이언트)

### Backend
- **Electron** (데스크톱 앱)
- **Express** (REST API)
- **better-sqlite3** (SQLite)
- **TypeScript**

## 개발 순서

1. ✅ Backend 먼저 구성
   - Express API 서버
   - SQLite 데이터베이스
   - REST API 엔드포인트

2. ✅ Frontend 개발
   - React UI
   - API 클라이언트
   - 3D 뷰어

3. ✅ Electron 통합
   - BrowserWindow로 Frontend 로드
   - Backend API 서버 자동 실행

## 실행 방법

### 개발 모드
```bash
# Terminal 1: Backend
cd backend
npm run dev         # Express API 서버 실행 (포트 3001)

# Terminal 2: Frontend
cd frontend
npm run dev         # Vite 개발 서버 (포트 3000)

# Terminal 3 (Optional): Electron
cd backend
npm run electron    # Electron 창 열기
```

### 프로덕션 빌드
```bash
# Root에서 한번에
npm run build       # Frontend + Backend 빌드
npm run package     # Electron 패키징
```

---

이 구조가 훨씬 간단하고 명확합니다!
