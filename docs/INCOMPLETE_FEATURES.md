# 미구현 기능 및 문제점 리스트

**작성일**: 2025-11-08
**프로젝트**: VirtualScenario - 코레일 안전교육 시나리오 에디터

---

## ✅ 방금 구현 완료한 기능 (2025-11-08)

1. **재생 기능** - `requestAnimationFrame`으로 currentTime 업데이트
2. **키프레임 애니메이션** - ThreeViewer에서 currentTime에 따라 위치/회전 보간 (Lerp/Slerp)
3. **타임라인 maxTime 자동 계산** - 키프레임/대화 종료 시간 기준
4. **키프레임 추가 버튼** - TimelinePanel에 "◆ 키프레임 추가" 버튼 (단축키: K)
5. **currentTime 연동** - SceneEditor → ThreeViewer로 currentTime 전달

---

## 🐛 현재 확인된 문제점

### 1. **Transform 변경 시 애니메이션 충돌 가능성**
- **문제**: 키프레임이 있는 오브젝트를 TransformControls로 이동 시, currentTime에 따라 다시 원래 위치로 돌아갈 수 있음
- **원인**: `useEffect`가 currentTime 변경 시 키프레임 위치로 오브젝트를 강제 이동
- **해결 방안**:
  - 재생 중일 때만 애니메이션 적용하도록 `isPlaying` 조건 추가
  - 또는 선택된 오브젝트는 애니메이션 제외

### 2. **배경 오브젝트도 애니메이션 적용됨**
- **문제**: BackgroundObject는 path_data가 없지만, SceneObjectMesh에서 동일하게 처리됨
- **영향**: 없음 (path_data가 없으면 애니메이션 스킵)
- **개선**: TypeScript 타입 가드로 명확히 구분

### 3. **키프레임 없는 오브젝트 초기 위치 문제**
- **문제**: path_data가 비어있으면 DB의 초기 위치를 사용하지만, 애니메이션 시작 시 0,0,0으로 이동할 수 있음
- **해결 방안**: path_data가 없으면 항상 DB의 transform 값 사용

### 4. **Undo/Redo 시 키프레임 데이터 손실 가능성**
- **문제**: Transform 변경 undo 시 path_data가 같이 복원되지 않을 수 있음
- **해결 방안**: Undo 액션에 path_data도 포함

### 5. **대화 편집 UI 부족**
- **문제**: InspectorPanel에서 대화 편집이 가능하지만 시작 시간/길이 조정이 직관적이지 않음
- **해결 방안**: 타임라인에서 대화 바를 드래그로 이동/크기 조절 가능하게

---

## 🚧 미구현 주요 기능

### Phase 3 (부분 완료)

#### 3-1. Path 애니메이션 (80% 완료)
✅ **완료**:
- 키프레임 추가/삭제
- 타임라인 UI에 키프레임 표시
- currentTime 기반 애니메이션 (Lerp/Slerp)
- 재생/일시정지 기능

❌ **미완료**:
- [ ] **키프레임 드래그로 시간 이동** - 타임라인에서 키프레임을 좌우로 드래그하여 시간 변경
- [ ] **키프레임 값 직접 편집** - 특정 키프레임의 position/rotation을 Inspector에서 수정
- [ ] **곡선 보간 (Ease In/Out)** - 현재는 Linear만 지원, Bezier 곡선 추가
- [ ] **속도 그래프 편집** - Unity Animator처럼 애니메이션 커브 에디터
- [ ] **키프레임 복사/붙여넣기**

#### 3-2. 3D 모델 Import (100% 완료)
✅ **완료**:
- GLB/GLTF/OBJ/FBX 지원
- Asset Library UI
- 파일 업로드 API
- ModelLoader 컴포넌트

❌ **미완료**:
- [ ] **모델 프리뷰 썸네일** - Asset Library에 3D 미리보기 이미지
- [ ] **애니메이션 포함 모델 지원** - GLB에 포함된 애니메이션 재생
- [ ] **텍스처 지원** - 현재는 단색만, 모델의 텍스처 로드
- [ ] **Material 커스터마이징** - 색상 외 Metalness, Roughness 등

#### 3-3. 카메라 시스템 (0% 완료)
❌ **미완료**:
- [ ] **씬별 카메라 위치 저장** - DB에 camera_position, camera_target 컬럼 추가
- [ ] **"현재 카메라 저장" 버튼**
- [ ] **씬 전환 시 카메라 자동 이동**
- [ ] **카메라 애니메이션** - 부드러운 전환 (lerp)
- [ ] **카메라 키프레임** - 카메라도 타임라인에서 애니메이션 가능

---

### Phase 4 (0% 완료)

#### 4-1. JSON Export (Unity 연동)
❌ **미완료**:
- [ ] **전체 프로젝트 직렬화** - Projects, Scenes, Objects, Dialogues, Paths 포함
- [ ] **JSON 구조 설계** - Unity에서 Import 가능한 포맷 정의
- [ ] **"Export" 버튼** - Dashboard 또는 SceneEditor에 추가
- [ ] **JSON 다운로드 기능**

**예상 JSON 구조**:
```json
{
  "project": {
    "title": "코레일 안전교육",
    "version": "1.0.0"
  },
  "scenes": [
    {
      "id": "scene1",
      "title": "승강장 대기",
      "backgroundMap": { "name": "승강장", "objects": [...] },
      "objects": [
        {
          "name": "직원",
          "type": "person",
          "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] },
          "pathData": [ { "time": 0, "position": [0, 0, 0], "rotation": [0, 0, 0] } ]
        }
      ],
      "dialogues": [
        { "text": "안전선 밖으로 물러서 주세요", "startTime": 2.0, "duration": 3.0, "objectId": "obj1" }
      ]
    }
  ]
}
```

#### 4-2. PDF 문서 생성
❌ **미완료**:
- [ ] **jsPDF 통합** - `npm install jspdf jspdf-autotable`
- [ ] **PDF 템플릿 디자인** - 교육 시나리오 문서 양식
- [ ] **문서 내용 생성**:
  - 프로젝트 정보 (제목, 버전, 날짜)
  - 씬별 섹션 (제목, 설명, 오브젝트 목록, 대화 목록)
  - 3D 뷰 스크린샷 (선택)
- [ ] **"PDF 다운로드" 버튼** - Dashboard 또는 SceneEditor

#### 4-3. HWP Export (낮은 우선순위)
❌ **미완료**:
- [ ] **DOCX 형식 Export** - `docx` 라이브러리 사용
- [ ] **또는 PDF → HWP 변환 도구** - 외부 도구 활용

---

### Phase 5 (0% 완료)

#### 5-1. Electron 데스크톱 앱
❌ **미완료**:
- [ ] **Electron 설정 완성** - 현재 기본 구조만 있음
- [ ] **Backend 자동 실행** - child_process로 Express 서버 시작
- [ ] **Frontend 로드** - BrowserWindow로 React 앱 로드
- [ ] **개발/프로덕션 분기** - 환경별 로직
- [ ] **메뉴바 & 단축키**:
  - File: 새 프로젝트, 열기, 저장, 종료
  - Edit: Undo, Redo, Copy, Paste
  - View: 전체화면, 개발자 도구
- [ ] **빌드 & 패키징**:
  - electron-builder 설정
  - Windows installer (.exe) 생성
  - 아이콘, 앱 이름 설정

---

## 🎨 UI/UX 개선 필요 사항

### 1. **드래그 앤 드롭 기능**
- [ ] **씬 순서 변경** - 장면 목록에서 드래그로 순서 조정
- [ ] **타임라인에서 대화 바 드래그** - 시작 시간 이동
- [ ] **타임라인에서 대화 바 크기 조절** - duration 변경
- [ ] **키프레임 드래그** - 시간 이동

### 2. **키보드 단축키 확장**
✅ **완료**:
- Ctrl+Z / Ctrl+Shift+Z (Undo/Redo)
- K (키프레임 추가)

❌ **미완료**:
- [ ] Delete - 선택된 오브젝트/대화 삭제
- [ ] Ctrl+D - 오브젝트 복제
- [ ] Ctrl+C / Ctrl+V - 복사/붙여넣기
- [ ] F2 - 이름 변경
- [ ] Space - 재생/일시정지
- [ ] Home / End - 타임라인 처음/끝으로 이동
- [ ] Arrow Keys - 프레임 이동 (좌우), 오브젝트 선택 (상하)

### 3. **복사/붙여넣기 기능**
- [ ] **오브젝트 복사** - 같은 씬에 복제
- [ ] **오브젝트 잘라내기** - 다른 씬으로 이동
- [ ] **키프레임 복사** - 다른 오브젝트에 적용

### 4. **다중 선택**
- [ ] **Shift+Click으로 여러 오브젝트 선택**
- [ ] **선택된 오브젝트들 일괄 Transform**
- [ ] **선택된 오브젝트들 일괄 삭제**

### 5. **검색 및 필터**
- [ ] **오브젝트 검색** - 이름으로 필터링
- [ ] **씬 검색** - 제목으로 필터링
- [ ] **태그 시스템** - 오브젝트에 태그 추가 후 필터

### 6. **테마 전환**
- [ ] **Dark/Light 모드** - 현재는 Dark만 지원
- [ ] **색상 테마 커스터마이징**

### 7. **다국어 지원**
- [ ] **영어 (English)** - UI 텍스트 번역
- [ ] **i18n 라이브러리 통합** - react-i18next

---

## ⚡ 성능 최적화 필요 사항

### 1. **Three.js 최적화**
- [ ] **LOD (Level of Detail)** - 카메라 거리에 따라 모델 품질 조정
- [ ] **Object Pooling** - 재사용 가능한 오브젝트 풀
- [ ] **Frustum Culling** - 화면 밖 오브젝트 렌더링 제외
- [ ] **Instanced Rendering** - 동일 모델 여러 개 렌더링 최적화

### 2. **React 최적화**
- [ ] **Virtual Scrolling** - 오브젝트 목록이 길 때 일부만 렌더링
- [ ] **Lazy Loading** - 씬별 데이터 지연 로딩
- [ ] **useMemo / useCallback** - 불필요한 리렌더링 방지
- [ ] **React.memo** - 컴포넌트 메모이제이션

### 3. **데이터베이스 최적화**
- [ ] **인덱스 추가** - scene_id, project_id에 인덱스
- [ ] **쿼리 최적화** - N+1 문제 해결
- [ ] **페이지네이션** - 대량 데이터 조회 시 페이징

---

## 🔒 협업 기능 (미래)

### 1. **프로젝트 공유**
- [ ] **클라우드 스토리지 연동** - Google Drive, Dropbox
- [ ] **프로젝트 Import/Export** - .zip 파일로 공유
- [ ] **프로젝트 템플릿** - 기본 구조 제공

### 2. **버전 관리**
- [ ] **Git 통합** - 프로젝트를 Git 저장소로 관리
- [ ] **변경 이력 확인** - 씬별 수정 기록
- [ ] **브랜치 지원** - 여러 버전 동시 작업

### 3. **멀티 유저 편집**
- [ ] **WebSocket 기반 실시간 동기화**
- [ ] **Conflict 해결** - 동시 수정 시 충돌 처리
- [ ] **사용자 권한 관리** - 읽기 전용, 편집 가능 등

---

## 📋 우선순위별 작업 순서

### **🔥 High Priority (즉시 수정 필요)**
1. ✅ 재생 기능 구현 (완료)
2. ✅ 키프레임 애니메이션 적용 (완료)
3. ✅ 타임라인 자동 길이 계산 (완료)
4. ⚠️ **Transform 변경 시 애니메이션 충돌 수정** - 재생 중일 때만 애니메이션 적용
5. ⚠️ **대화 바 드래그 기능** - 타임라인에서 대화 시간 조정

### **🟡 Medium Priority (1-2주 내)**
6. 키프레임 드래그로 시간 이동
7. JSON Export (Unity 연동)
8. 키보드 단축키 확장 (Delete, Ctrl+D, Space 등)
9. 오브젝트 복사/붙여넣기
10. PDF 문서 생성

### **🟢 Low Priority (추후)**
11. 카메라 시스템
12. 3D 모델 썸네일
13. 곡선 보간 (Ease In/Out)
14. Dark/Light 테마
15. 다국어 지원
16. Electron 패키징

---

## 🧪 테스트 필요 항목

### 기능 테스트
- [ ] 재생 중 키프레임 애니메이션 부드러움 확인
- [ ] 키프레임 없는 오브젝트도 정상 표시되는지 확인
- [ ] 대화 자막이 currentTime에 맞춰 표시되는지 확인
- [ ] Undo/Redo 시 키프레임 데이터 유지 확인
- [ ] 여러 오브젝트 동시 애니메이션 성능 테스트

### 버그 테스트
- [ ] 재생 중 TransformControls 사용 시 충돌 확인
- [ ] 매우 긴 타임라인 (100초+) 성능 확인
- [ ] 키프레임이 100개 이상일 때 성능 확인
- [ ] 브라우저 새로고침 후 데이터 유지 확인

---

## 📝 개발자 노트

### 알려진 제약사항
1. **SQLite 제약**: ALTER TABLE로 NOT NULL 컬럼 추가 불가 → 마이그레이션 시 nullable로 추가
2. **Three.js 메모리**: 대량 3D 모델 로드 시 메모리 증가 → LOD 필요
3. **Undo/Redo 한계**: 오브젝트 삭제 후 복원 시 동일 ID 복원 불가 → "(복원됨)" 텍스트 추가

### 참고 자료
- [Three.js 공식 문서](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Unity JSON Format](https://docs.unity3d.com/ScriptReference/JsonUtility.html)
- [jsPDF 문서](https://github.com/parallax/jsPDF)

---

**마지막 업데이트**: 2025-11-08 19:30
