# VirtualScenario - 코레일 시나리오 에디터 & 3D 시뮬레이터

> 부산광역시 코레일 직원분의 요청으로 개발된 프로젝트입니다.
> 코레일에서 진행하는 훈련 시행 전, 안내를 위한 시나리오를 3D 시뮬레이션으로 시각화해주는 서비스입니다.

## 📋 프로젝트 개요

코레일 안전교육 및 업무 시나리오를 **작성-시각화-재생**하는 웹/데스크톱 애플리케이션

### 핵심 기능 (2025-12-04 기준)
- ✅ **REST API Backend**: Express + SQLite (오프라인 DB)
- ✅ **React Frontend**: Three.js 기반 3D 에디터 & 시뮬레이터
- ✅ **배경 맵 시스템**: 재사용 가능한 3D 배경 환경
- ✅ **시뮬레이터**: 실시간 재생, 타임라인, 자막
- ✅ **영상 내보내기 (MP4)**: 시뮬레이터 재생을 녹화해 MP4로 저장 (Electron)
- ✅ **Undo/Redo**: Ctrl+Z/Ctrl+Shift+Z 지원
- ✅ **JSON Export**: 시나리오 데이터 내보내기
- ✅ **Excel Export**: 시나리오를 엑셀 파일로 내보내기

---

## 🚀 빠른 시작

### Backend 실행 (필수)

```bash
cd backend
npm install
npm run dev
```

서버가 실행됩니다:
- 🌐 API: http://localhost:3001/api
- 🗄️ Database: `backend/data/scenario.db`

### API 테스트

```bash
# Health check
curl http://localhost:3001/api/health

# 프로젝트 생성
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트 프로젝트","version":"1.1.0"}'
```

---

## 📡 API 엔드포인트

```
GET    /api/projects                  # 프로젝트 목록
POST   /api/projects                  # 프로젝트 생성
GET    /api/projects/:id              # 프로젝트 상세
PUT    /api/projects/:id              # 프로젝트 수정
DELETE /api/projects/:id              # 프로젝트 삭제
GET    /api/projects/:id/scenes       # 씬 목록
POST   /api/projects/:id/scenes       # 씬 생성
GET    /api/projects/:id/export       # JSON Export
```

---

## 🎞️ 영상 내보내기 (MP4)

- 지원 환경: Electron 앱(패키지 또는 `npm run electron`)
- 사용 방법:
  1) 대시보드 → 프로젝트 → **시뮬레이터** 진입
  2) 우측 상단 **"📹 MP4 내보내기"** 클릭 → 캔버스 로드 후 자동 녹화
  3) 저장 위치를 선택하면 WebM → MP4로 변환해 파일로 저장
- 브라우저 개발 서버에서는 MP4 변환이 동작하지 않습니다.

---

## 🛠️ 기술 스택

**Backend** ✅
- Express 4 + TypeScript
- SQLite (better-sqlite3)
- Node.js 20

**Frontend** ✅
- React 18 + Vite
- Three.js
- TailwindCSS

**Desktop** ✅
- Electron 33
- MP4 내보내기 (ffmpeg)

---

## 📚 문서

- [claude.md](claude.md) - AI 작업 기록
- [docs/PROJECT_PLANNING_V2.md](docs/PROJECT_PLANNING_V2.md) - 상세 기획서
- [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) - 프로젝트 구조

---

**현재 상태**: Backend/Frontend/시뮬레이터/Electron 앱 동작 ✅ | MP4/Excel 내보내기 포함 (v1.1.0)

마지막 업데이트: 2025-12-04
