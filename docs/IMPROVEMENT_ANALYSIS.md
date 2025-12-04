# 개선 필요 사항 및 기획 불일치 분석

**작성일**: 2025-11-08
**Phase A 완료 후 분석**
**최종 수정**: 2025-12-04 (Unity 관련 내용 없음, 그대로 유지)

---

## 🔴 심각한 문제점 (High Priority)

### 1. **기존 키프레임이 scale 필드가 없음 (마이그레이션 필요)**

**문제**:
- PathKeyframe 타입에 `scale` 필드를 추가했지만, 기존 DB의 path_data는 `{ time, position, rotation }` 형태
- 새로 추가한 scale 애니메이션 코드가 `prevKeyframe.scale`을 읽으려고 하지만 undefined

**영향**:
```typescript
// ThreeViewer.tsx:156
if (prevKeyframe.scale && nextKeyframe.scale) {
  // 기존 키프레임에는 scale이 없음 → 이 코드가 실행되지 않음
  meshRef.current.scale.set(...);
}
```

**결과**:
- 기존 키프레임이 있는 오브젝트는 scale이 [1, 1, 1]로 고정됨
- 애니메이션 중에 DB의 scale_x, scale_y, scale_z 값을 무시함

**해결 방안**:
1. **데이터 마이그레이션**:
   ```typescript
   // 모든 scene_objects의 path_data를 읽어서
   // scale 필드가 없으면 DB의 scale 값 추가
   const keyframes = JSON.parse(obj.path_data);
   const updated = keyframes.map(kf => ({
     ...kf,
     scale: kf.scale ?? [obj.scale_x, obj.scale_y, obj.scale_z]
   }));
   ```

2. **Fallback 로직 추가**:
   ```typescript
   // ThreeViewer.tsx - scale 보간 시
   const prevScale = prevKeyframe.scale ?? [obj.scale_x, obj.scale_y, obj.scale_z];
   const nextScale = nextKeyframe.scale ?? [obj.scale_x, obj.scale_y, obj.scale_z];
   ```

---

### 2. **DB Transform과 키프레임 Transform의 역할 불명확**

**문제**:
- `scene_objects.position_x/y/z`, `rotation_x/y/z`, `scale_x/y/z`는 무엇을 의미하는가?
  - A) 오브젝트의 초기 위치 (키프레임 0초의 값)?
  - B) 키프레임이 없을 때만 사용하는 정적 위치?
  - C) 마지막으로 편집된 위치 (항상 업데이트)?

**현재 동작**:
- TransformControls로 이동 시 → DB의 position 업데이트 (`handleObjectTransform`)
- 키프레임 추가 시 → path_data에 저장하지만 DB의 position은 그대로
- **결과**: DB와 path_data가 불일치

**혼란스러운 시나리오**:
```
1. 오브젝트 생성 → DB: position = [0, 0, 0]
2. TransformControls로 [5, 0, 0]로 이동 → DB: position = [5, 0, 0]
3. 키프레임 추가 (0초) → path_data: [{ time: 0, position: [5, 0, 0] }]
4. [10, 0, 0]로 이동 → DB: position = [10, 0, 0]
5. 키프레임 추가 (2초) → path_data: [{ time: 0, position: [5, 0, 0] }, { time: 2, position: [10, 0, 0] }]

Q: 이제 DB의 position = [10, 0, 0]은 무슨 의미인가?
```

**제안**:
- **Option A (권장)**: DB Transform은 초기값으로만 사용
  - path_data가 없으면 DB 값 사용
  - path_data가 있으면 DB 값 무시
  - TransformControls로 이동 시 DB 업데이트 하지 않음 (키프레임만 업데이트)

- **Option B**: DB Transform은 현재 시간의 값
  - currentTime이 바뀔 때마다 DB 업데이트 (비효율적)
  - 키프레임은 특정 시간의 스냅샷

---

### 3. **재생 중 오브젝트 위치가 DB 값으로 리셋될 수 있음**

**문제**:
```typescript
// SceneObjectMesh의 mesh 초기 position 설정
<mesh
  ref={meshRef}
  position={[obj.position_x, obj.position_y, obj.position_z]}
  rotation={...}
  scale={...}
>
```

**동작**:
1. 오브젝트가 렌더링될 때 DB 값으로 초기화
2. useEffect로 currentTime에 따라 애니메이션 위치 적용
3. **문제**: 리렌더링 시 다시 DB 값으로 리셋될 수 있음

**해결 방안**:
- 초기 position은 키프레임이 있으면 첫 번째 키프레임 값 사용
- 또는 useEffect에서 초기 위치도 설정

---

### 4. **키프레임이 없을 때 오브젝트 위치 불일치**

**시나리오**:
1. 오브젝트 생성 (DB: position = [0, 0, 0])
2. TransformControls로 [5, 2, 3]으로 이동
3. DB 업데이트 → position = [5, 2, 3]
4. 키프레임 추가하지 않음
5. **씬 새로고침** (handleSelectScene)
6. **문제**: DB에서 [5, 2, 3]을 불러오지만, Three.js 메쉬는 [0, 0, 0]에 있을 수 있음

**원인**:
- `handleObjectTransform`에서 DB만 업데이트하고 ThreeViewer를 강제 리렌더링하지 않음

**해결 방안**:
- DB 업데이트 후 `objects` 상태를 새로 불러오기 (현재 구현됨)
- 하지만 ThreeViewer는 props가 변경되어도 mesh.position을 업데이트하지 않을 수 있음

---

## 🟡 중요한 개선 사항 (Medium Priority)

### 5. **키프레임 편집 UI 부재**

**현재 가능**:
- ✅ 키프레임 추가 (현재 시간 + 현재 위치)
- ✅ 키프레임 삭제 (우클릭 메뉴)

**불가능**:
- ❌ 키프레임 시간 변경 (예: 2.5초 → 3.0초로 이동)
- ❌ 키프레임 Transform 값 직접 편집 (예: position [5, 2, 3] → [6, 2, 3])
- ❌ 키프레임 선택 시 3D 뷰에서 해당 위치 확인
- ❌ 키프레임 복사/붙여넣기

**사용자 불편함**:
```
사용자: "키프레임을 2.5초에서 3.0초로 옮기고 싶은데..."
현재: 키프레임 삭제 → 3.0초로 이동 → 다시 키프레임 추가
이상적: 키프레임 드래그 또는 시간 입력창에서 수정
```

**구현 필요**:
- InspectorPanel에 "Keyframes" 섹션 추가 (Phase B)
- 각 키프레임마다:
  - 시간 입력창
  - Position/Rotation/Scale 표시 및 편집
  - [편집] [삭제] 버튼

---

### 6. **타임라인에서 키프레임 드래그 불가**

**현재**:
- 키프레임은 타임라인에 다이아몬드(◆)로 표시됨
- 클릭하면 오브젝트 선택
- 우클릭하면 컨텍스트 메뉴

**불가능**:
- 좌우로 드래그하여 시간 이동

**Unity/Blender 등 표준 타임라인**:
- 키프레임을 마우스로 잡아서 드래그 가능
- 드래그 중 시간 실시간 표시
- 마우스를 놓으면 새 시간으로 저장

**구현 복잡도**: Medium
- 드래그 상태 관리 (`isDraggingKeyframe`)
- 마우스 이동 중 시간 계산 (`getTimeFromMouseX`)
- 드래그 중 시각적 피드백 (반투명, 시간 표시)

---

### 7. **재생 중 편집 불가 안내 부족**

**현재 동작**:
- 재생 중에는 선택되지 않은 오브젝트에만 애니메이션 적용
- 선택된 오브젝트는 편집 가능

**문제**:
- 사용자가 왜 다른 오브젝트를 선택할 수 없는지 모름
- TransformControls는 표시되지만, 다른 오브젝트는 클릭이 안 됨

**개선안**:
1. **재생 중에는 오브젝트 선택 불가**:
   ```typescript
   const handleObjectClick = (id: string) => {
     if (isPlaying) {
       // 안내 메시지 표시
       return;
     }
     onObjectSelect(id);
   };
   ```

2. **안내 메시지 표시**:
   ```jsx
   {isPlaying && (
     <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                     bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg z-50">
       ⚠️ 재생 중에는 편집할 수 없습니다
     </div>
   )}
   ```

3. **또는 재생 중에도 편집 허용**:
   - isPlaying일 때는 애니메이션 일시 중지
   - 편집 완료 후 다시 재생

---

### 8. **장면 길이 자동 계산 로직 개선 필요**

**현재 구현**:
```typescript
// SceneEditor.tsx:85-114
useEffect(() => {
  let calculatedMaxTime = 30;

  // 모든 키프레임 확인
  objects.forEach(obj => {
    if (obj.path_data) {
      const keyframes = JSON.parse(obj.path_data);
      keyframes.forEach(kf => {
        if (kf.time > calculatedMaxTime) {
          calculatedMaxTime = kf.time;
        }
      });
    }
  });

  // 모든 대화 확인
  dialogues.forEach(dlg => {
    const endTime = dlg.start_time + dlg.duration;
    if (endTime > calculatedMaxTime) {
      calculatedMaxTime = endTime;
    }
  });

  // +5초 버퍼
  setMaxTime(Math.max(30, calculatedMaxTime + 5));
}, [objects, dialogues]);
```

**문제점**:
1. **+5초 버퍼가 항상 추가됨**:
   - 마지막 키프레임이 100초면 → maxTime = 105초
   - 하지만 사용자는 100초까지만 보고 싶을 수 있음

2. **최소 30초 제약**:
   - 짧은 씬(5초)도 30초로 강제됨
   - 불필요한 공백이 많음

3. **사용자가 maxTime을 수동으로 조정할 수 없음**:
   - 타임라인 끝에 "+" 버튼이나 입력창 필요

**개선안**:
```typescript
// 1. 버퍼를 선택적으로
const autoMaxTime = Math.max(10, calculatedMaxTime + 2); // 최소 10초, +2초 버퍼

// 2. 사용자가 수동 조정 가능
const [manualMaxTime, setManualMaxTime] = useState<number | null>(null);
const effectiveMaxTime = manualMaxTime ?? autoMaxTime;

// 3. UI에 "장면 길이" 입력창 추가
<input
  type="number"
  value={effectiveMaxTime}
  onChange={(e) => setManualMaxTime(parseFloat(e.target.value))}
  min={10}
  max={600}
/>
```

---

### 9. **대화 바를 타임라인에서 드래그로 이동/크기 조절 불가**

**현재**:
- 대화 바는 타임라인에 녹색 바로 표시
- 클릭하면 InspectorPanel에서 편집

**불가능**:
- 대화 바를 좌우로 드래그하여 시작 시간 변경
- 대화 바의 끝을 드래그하여 duration 변경

**Adobe Premiere / Final Cut Pro 등 표준 UI**:
- 클립을 드래그로 이동
- 클립의 끝을 드래그하여 길이 조절

**구현 방법**:
```typescript
// 대화 바를 3개 영역으로 나눔
// ┌─────────────────────┐
// │◀ 시작 │ 중간 │ 끝 ▶│
// └─────────────────────┘

const [draggingDialogue, setDraggingDialogue] = useState<{
  id: string;
  type: 'move' | 'resize-start' | 'resize-end';
  initialTime: number;
  initialDuration: number;
} | null>(null);

// 좌측 10px: 시작 시간 조정
// 중간: 전체 이동
// 우측 10px: 종료 시간 조정 (duration 변경)
```

---

### 10. **오브젝트 복사/붙여넣기 기능 부재**

**현재**:
- 오브젝트를 복제하려면 "오브젝트 추가" 버튼 클릭 → 이름/타입 입력 → Transform 수동 설정

**이상적**:
- 오브젝트 선택 → Ctrl+C → Ctrl+V
- 키프레임도 함께 복사됨

**Unity/Blender 등 표준 기능**:
- Duplicate (Ctrl+D) - 같은 위치에 복제
- Copy/Paste (Ctrl+C/V) - 클립보드 사용

**구현 필요**:
```typescript
const [clipboard, setClipboard] = useState<SceneObject | null>(null);

const handleCopy = () => {
  if (selectedObjectId) {
    const obj = objects.find(o => o.id === selectedObjectId);
    setClipboard(obj);
  }
};

const handlePaste = async () => {
  if (!clipboard) return;
  await scenesAPI.createObject(sceneId, {
    ...clipboard,
    name: clipboard.name + ' (복사본)'
  });
};
```

---

## 🟢 사소한 개선 사항 (Low Priority)

### 11. **키프레임 시간 표시 불일치**

**현재**:
- TimelinePanel: 키프레임 위치로만 표시
- 마우스 오버 시 tooltip: "키프레임 X.XXs"

**개선**:
- 키프레임 위에 작은 라벨로 시간 표시 (0.5s, 2.0s 등)
- 여러 키프레임이 겹칠 때는 숨김

---

### 12. **오브젝트 이름 중복 허용**

**현재**:
- "직원" 이름으로 여러 오브젝트 생성 가능
- 구분하기 어려움

**개선**:
- 자동으로 번호 추가 (직원 1, 직원 2, ...)
- 또는 중복 이름 경고 표시

---

### 13. **키프레임이 없는 오브젝트도 타임라인에 트랙 표시**

**현재**:
- 모든 오브젝트가 타임라인에 트랙으로 표시됨
- 키프레임이 없으면 빈 트랙

**혼란**:
- 정적 오브젝트(배경 요소)와 동적 오브젝트 구분 어려움

**개선안 1**:
- 키프레임이 없는 오브젝트는 트랙 숨김
- "숨긴 오브젝트 보기" 토글 버튼

**개선안 2**:
- 정적/동적 오브젝트 구분 표시
- 정적 오브젝트는 회색으로 표시

---

### 14. **타임라인 줌 레벨 부족**

**현재**:
- 줌: 25%, 50%, 100%, 200%
- 1초 = 50px * zoom

**문제**:
- 긴 씬(100초+)에서는 200%도 너무 좁음
- 짧은 씬(5초)에서는 25%도 너무 넓음

**개선**:
- 더 많은 줌 레벨 (10%, 25%, 50%, 100%, 200%, 400%, 800%)
- 마우스 휠로 줌 조정
- "Fit to window" 버튼 (전체 씬이 화면에 맞춰짐)

---

### 15. **currentTime 표시 개선**

**현재**:
- TimelinePanel 상단: "X.XXs / YYs"
- 작은 폰트, 눈에 잘 안 띔

**개선**:
- 더 크고 명확한 시간 표시
- 분:초 형식 (MM:SS.MS)
- 현재 시간 입력창 (직접 이동 가능)

```jsx
<div className="flex items-center gap-2">
  <span className="text-lg font-mono font-bold">
    {formatTime(currentTime)}
  </span>
  <span className="text-gray-500">/</span>
  <input
    type="number"
    value={currentTime.toFixed(2)}
    onChange={(e) => onTimeChange(parseFloat(e.target.value))}
    className="w-20 px-2 py-1 bg-gray-700 rounded"
  />
</div>
```

---

### 16. **Undo/Redo가 키프레임 작업을 추적하지 않음**

**현재 Undo/Redo 지원**:
- ✅ Transform 변경
- ✅ 오브젝트 생성
- ✅ 오브젝트 삭제

**미지원**:
- ❌ 키프레임 추가
- ❌ 키프레임 삭제
- ❌ 키프레임 시간 변경

**개선**:
```typescript
const handleAddKeyframe = async (...) => {
  // ... 키프레임 추가

  // Undo 액션 기록
  pushAction({
    type: 'add_keyframe',
    undo: async () => {
      await handleDeleteKeyframe(objectId, newKeyframeIndex);
    },
    redo: async () => {
      await handleAddKeyframe(objectId, time);
    }
  });
};
```

---

## 🎯 기획 불일치 사항

### 17. **"씬" vs "장면" 용어 불일치**

**현재 상태**:
- 코드: `Scene`, `scenes`, `selectedScene`
- UI (일부): "장면"
- UI (일부): "씬"

**불일치 예시**:
- SceneEditor 탭: "🎬 장면"
- 대화 생성 다이얼로그: "씬 선택"
- 변수명: `selectedScene`

**결정 필요**:
- 모두 "장면"으로 통일할 것인가?
- 또는 "씬"으로 통일할 것인가?

**제안**: "장면"으로 통일 (한국어 UI이므로)

---

### 18. **배경 맵 vs 배경 오브젝트의 애니메이션 가능 여부**

**현재 구현**:
- `BackgroundObject`: 배경 맵에 속한 정적 오브젝트
- `SceneObject`: 씬에 속한 동적 오브젝트 (path_data 가능)

**기획 질문**:
1. 배경 오브젝트도 애니메이션이 가능해야 하는가?
   - 예: 배경의 문이 열리는 애니메이션
   - 현재: 불가능 (path_data 없음)

2. 씬마다 배경 오브젝트를 다르게 배치할 수 있는가?
   - 예: 승강장 배경은 공통, 하지만 A씬에서는 벤치 추가
   - 현재: 불가능 (배경 맵 전체가 공유됨)

**제안**:
- 배경 오브젝트는 항상 정적
- 애니메이션이 필요하면 SceneObject로 추가

---

### 19. **대화/자막의 발화자 연결 방식**

**현재**:
- `dialogues.object_id`: nullable
- object_id가 있으면 "XXX: 대화 내용" 형식
- object_id가 없으면 "대화 내용"만 표시

**기획 질문**:
1. 여러 오브젝트가 동시에 말하는 경우?
   - 현재: 불가능 (1 대화 = 1 발화자)

2. 내레이션 (발화자 없음) vs 자막 (발화자 있음) 구분?
   - 현재: object_id 유무로만 구분

**제안**:
- `dialogue_type`: 'narration' | 'subtitle' | 'thought'
- 여러 발화자: 대화를 나눠서 생성

---

### 20. **시뮬레이터 vs 씬 에디터의 재생 기능 중복**

**현재**:
- SceneEditor: 타임라인 재생 가능 (편집 중 미리보기)
- Simulator: 전체 프로젝트 재생 (최종 확인)

**문제**:
- SceneEditor의 재생은 단일 씬만 재생
- Simulator는 여러 씬을 순차 재생

**혼란**:
- 사용자가 어느 것을 사용해야 할지 모름

**제안**:
- SceneEditor 재생: "미리보기" 라벨 추가
- Simulator: "최종 재생" 또는 "시뮬레이션"으로 명확히 구분

---

## 📊 우선순위 요약

### 🔴 즉시 수정 필요 (Critical)
1. **기존 키프레임 scale 마이그레이션** - 데이터 손상 방지
2. **DB Transform 역할 명확화** - 로직 개선
3. **재생 중 오브젝트 위치 리셋 방지** - 버그 수정

### 🟡 1-2주 내 구현 (High)
4. **키프레임 편집 UI** (InspectorPanel)
5. **타임라인 키프레임 드래그**
6. **대화 바 드래그로 이동/크기 조절**
7. **재생 중 편집 불가 안내**
8. **장면 길이 수동 조정**

### 🟢 추후 개선 (Medium)
9. **오브젝트 복사/붙여넣기**
10. **키프레임 Undo/Redo**
11. **타임라인 줌 개선**
12. **currentTime 표시 개선**

### ⚪ 선택적 개선 (Low)
13. 오브젝트 이름 중복 방지
14. 키프레임 시간 라벨 표시
15. 정적/동적 오브젝트 구분
16. 용어 통일 (씬 vs 장면)

---

## 🎬 다음 작업 제안

### Phase B-1: 데이터 무결성 수정 (1-2일)
1. ✅ 기존 키프레임에 scale fallback 추가
2. ✅ DB Transform 역할 재정의
3. ✅ 오브젝트 초기 위치 로직 수정

### Phase B-2: 키프레임 편집 UI (3-4일)
4. InspectorPanel에 Keyframes 섹션 추가
5. 키프레임 목록 표시
6. 시간 입력창
7. Transform 값 표시 및 편집

### Phase B-3: 타임라인 고급 기능 (3-5일)
8. 키프레임 드래그
9. 대화 바 드래그
10. 장면 길이 수동 조정 UI

**총 예상 소요 시간**: 7-11일

---

**결론**: Phase A는 완료했지만, 데이터 무결성과 UX 관점에서 추가 개선이 많이 필요합니다.
