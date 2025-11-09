# VirtualScenario 빌드 가이드

## 🚀 빌드 및 실행 방법

### 1️⃣ 개발 환경 설정

#### 전체 의존성 설치
```bash
npm run install:all
```

또는 개별 설치:
```bash
cd backend && npm install
cd ../frontend && npm install
```

#### better-sqlite3 네이티브 모듈 재빌드 (Node.js 버전 변경 시)
```bash
npm run rebuild:sqlite
```

---

### 2️⃣ 개발 모드 실행

#### 방법 1: 통합 실행 (추천)
```bash
npm run dev
```
- Backend (http://localhost:3001) + Frontend (http://localhost:3000) 동시 실행
- 파일 변경 시 자동 리로드

#### 방법 2: 개별 실행
```bash
# 터미널 1: Backend
npm run dev:backend

# 터미널 2: Frontend
npm run dev:frontend
```

---

### 3️⃣ 프로덕션 빌드

#### Electron 데스크톱 앱 패키징

**Windows:**
```bash
npm run package:win
```

**macOS:**
```bash
npm run package:mac
```

**Linux:**
```bash
npm run package:linux
```

**모든 플랫폼:**
```bash
npm run package
```

#### 빌드 산출물 위치
```
backend/release/
├── VirtualScenario Setup 0.1.0.exe  (Windows)
└── ...
```

---

### 4️⃣ 빌드 정리

```bash
npm run clean
```

다음 폴더들이 삭제됩니다:
- `backend/dist/`
- `backend/frontend-dist/`
- `backend/release/`
- `frontend/dist/`

---

## 📁 프로젝트 구조

```
VirtualScenario/
├── package.json           # 루트 빌드 스크립트
├── backend/
│   ├── src/
│   │   ├── main.ts       # Electron 메인 프로세스
│   │   ├── server.ts     # Express API 서버
│   │   ├── database.ts   # SQLite 관리
│   │   └── routes/       # API 라우트
│   ├── dist/             # TypeScript 컴파일 결과
│   ├── frontend-dist/    # Frontend 빌드 복사본
│   ├── release/          # Electron 패키징 결과
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/        # React 페이지
│   │   ├── components/   # React 컴포넌트
│   │   └── api/          # API 클라이언트
│   ├── dist/             # Vite 빌드 결과
│   └── package.json
└── shared/
    └── types.ts          # 공통 타입 정의
```

---

## 🔧 NPM 스크립트 전체 목록

### 루트 폴더 (VirtualScenario/)

| 명령어 | 설명 |
|--------|------|
| `npm run install:all` | Backend + Frontend 의존성 설치 |
| `npm run dev` | Backend + Frontend 동시 실행 |
| `npm run dev:backend` | Backend만 실행 |
| `npm run dev:frontend` | Frontend만 실행 |
| `npm run build:all` | Backend + Frontend + 복사 |
| `npm run package:win` | Windows 앱 빌드 |
| `npm run package:mac` | macOS 앱 빌드 |
| `npm run package:linux` | Linux 앱 빌드 |
| `npm run clean` | 빌드 결과물 삭제 |
| `npm run rebuild:sqlite` | better-sqlite3 재빌드 |

### Backend 폴더 (backend/)

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | Express 서버 실행 (tsx watch) |
| `npm run build` | TypeScript 컴파일 |
| `npm start` | 컴파일된 서버 실행 |

### Frontend 폴더 (frontend/)

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | Vite 개발 서버 실행 |
| `npm run build` | Vite 프로덕션 빌드 |

---

## ⚙️ 환경 요구사항

- **Node.js**: 18.0.0 이상
- **npm**: 9.0.0 이상
- **OS**: Windows 10+, macOS 11+, Ubuntu 20.04+

---

## 🐛 문제 해결

### 1. better-sqlite3 에러 (NODE_MODULE_VERSION 불일치)
```bash
npm run rebuild:sqlite
```

### 2. Electron 흰 화면
- 개발자 도구 (Ctrl+Shift+I)에서 콘솔 확인
- `[Electron] Loading frontend from:` 로그 확인
- `frontend-dist` 폴더가 존재하는지 확인

### 3. 포트 충돌
Backend(3001) 또는 Frontend(3000) 포트가 이미 사용 중인 경우:
```bash
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001
```

---

## 📝 참고 문서

- [프로젝트 기획서](docs/PROJECT_PLANNING_V2.md)
- [개발 로그](CLAUDE.md)
- [메인 README](README.md)
