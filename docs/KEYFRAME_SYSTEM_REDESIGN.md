# 키프레임 시스템 재설계 문서

**작성일**: 2025-11-08
**현재 상태**: ❌ 심각한 설계 결함 발견

---

## 🔴 현재 구현의 심각한 문제점

### 문제 1: **키프레임이 현재 Transform을 저장하지 않음**

```typescript
// 현재 구현 (SceneEditor.tsx:389)
const newKeyframe: PathKeyframe = { time, position, rotation };
```

**문제**:
- 키프레임 추가 시 **현재 오브젝트의 실제 Transform을 읽어오지 않음**
- `position`, `rotation` 파라미터를 그대로 사용 → 이 값이 어디서 오는가?
- 호출하는 곳에서 `obj.position_x, obj.position_y, obj.position_z`를 전달하지만, **이 값은 DB의 초기값일 뿐**

**결과**:
- 사용자가 TransformControls로 오브젝트를 이동시켜도, 키프레임 추가 시 **DB의 초기 위치가 저장됨**
- 실제 3D 뷰에서 변경한 위치는 무시됨

**예시 시나리오**:
1. 오브젝트 생성 (DB: position = [0, 0, 0])
2. TransformControls로 오브젝트를 [5, 2, 3]으로 이동
3. "키프레임 추가" 버튼 클릭
4. **실제 저장되는 값**: [0, 0, 0] ← ❌ 잘못됨!
5. **저장되어야 할 값**: [5, 2, 3] ← ✅ 올바름

---

### 문제 2: **DB의 Transform과 Path 데이터가 분리됨**

**현재 데이터 구조**:
```sql
CREATE TABLE scene_objects (
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  position_z REAL DEFAULT 0,
  rotation_x REAL DEFAULT 0,
  rotation_y REAL DEFAULT 0,
  rotation_z REAL DEFAULT 0,
  scale_x REAL DEFAULT 1,
  scale_y REAL DEFAULT 1,
  scale_z REAL DEFAULT 1,
  path_data TEXT  -- JSON: [{ time, position, rotation }]
);
```

**문제**:
- `position_x, position_y, position_z`는 **초기 위치**를 의미하는가? **현재 위치**를 의미하는가?
- `path_data`에 키프레임이 있으면, DB의 position 값은 무시되어야 하는가?
- 키프레임이 없으면 DB의 position을 사용하는가?

**혼란스러운 동작**:
- TransformControls로 오브젝트 이동 → DB의 `position_x, position_y, position_z` 업데이트
- 키프레임 추가 → `path_data`에 저장
- **결과**: 같은 오브젝트의 위치가 2곳에 저장됨 (DB 컬럼 vs JSON)

---

### 문제 3: **Scale이 키프레임에 저장되지 않음**

```typescript
const newKeyframe: PathKeyframe = { time, position, rotation };
// scale은 어디로? ❌
```

**문제**:
- 키프레임에 position, rotation만 저장
- **scale 애니메이션이 불가능**

**Unity/Blender 등 표준 애니메이션 시스템**:
- TRS (Transform, Rotation, Scale) 모두 키프레임 가능
- 예: 오브젝트가 시간에 따라 커지거나 작아지는 애니메이션

---

### 문제 4: **키프레임 편집 UI 없음**

**현재 가능한 것**:
- ✅ 키프레임 추가 (현재 시간에)
- ✅ 키프레임 삭제 (우클릭 메뉴)

**불가능한 것**:
- ❌ 키프레임의 시간 변경 (드래그 또는 입력창)
- ❌ 키프레임의 Transform 값 직접 편집
- ❌ 키프레임 복사/붙여넣기
- ❌ 키프레임을 선택하여 3D 뷰에서 확인

---

### 문제 5: **재생 중 편집 충돌**

**현재 동작**:
1. 재생 시작
2. currentTime이 증가하면서 오브젝트가 키프레임에 따라 이동
3. 사용자가 TransformControls로 오브젝트를 잡으려고 함
4. **useEffect가 계속 위치를 덮어씀** → 오브젝트를 잡을 수 없음

**필요한 기능**:
- 재생 중에는 TransformControls 비활성화
- 또는 선택된 오브젝트는 애니메이션 제외

---

## ✅ 올바른 키프레임 시스템 설계

### 1. **데이터 모델 재정의**

#### 개념 정리
```
오브젝트 Transform =
  - path_data가 비어있으면 → DB의 position/rotation/scale 사용 (정적)
  - path_data가 있으면 → currentTime에 따라 키프레임 보간 (동적)
```

#### DB 스키마 (변경 없음, 의미만 명확화)
```sql
CREATE TABLE scene_objects (
  -- 정적 Transform (path_data가 없을 때 사용)
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  position_z REAL DEFAULT 0,
  rotation_x REAL DEFAULT 0,
  rotation_y REAL DEFAULT 0,
  rotation_z REAL DEFAULT 0,
  scale_x REAL DEFAULT 1,
  scale_y REAL DEFAULT 1,
  scale_z REAL DEFAULT 1,

  -- 동적 Transform (애니메이션 데이터)
  path_data TEXT  -- JSON: [{ time, position, rotation, scale }]
);
```

#### PathKeyframe 타입 수정
```typescript
// 현재
interface PathKeyframe {
  time: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

// 수정 후
interface PathKeyframe {
  time: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];  // 추가!
}
```

---

### 2. **키프레임 추가 로직 수정**

#### AS-IS (현재 - 잘못됨)
```typescript
const handleAddKeyframe = async (objectId: string, time: number, position: [number, number, number], rotation: [number, number, number]) => {
  const newKeyframe: PathKeyframe = { time, position, rotation };
  // position, rotation은 DB 값을 그대로 전달받음 (문제!)
}
```

#### TO-BE (수정 후)
```typescript
const handleAddKeyframe = async (objectId: string, time: number) => {
  const obj = objects.find(o => o.id === objectId);
  if (!obj) return;

  // 현재 3D 뷰의 실제 Transform 읽기
  const currentTransform = getCurrentTransformFromThreeJS(objectId);

  // 또는 path_data가 있으면 currentTime의 보간값 사용
  const position = currentTransform?.position ?? [obj.position_x, obj.position_y, obj.position_z];
  const rotation = currentTransform?.rotation ?? [obj.rotation_x, obj.rotation_y, obj.rotation_z];
  const scale = currentTransform?.scale ?? [obj.scale_x, obj.scale_y, obj.scale_z];

  const newKeyframe: PathKeyframe = {
    time,
    position,
    rotation,
    scale  // 추가!
  };

  // 기존 키프레임에 추가
  const existingKeyframes = obj.path_data ? JSON.parse(obj.path_data) : [];
  const updatedKeyframes = [...existingKeyframes, newKeyframe].sort((a, b) => a.time - b.time);

  await scenesAPI.updateObject(sceneId, objectId, {
    pathData: updatedKeyframes
  });
}
```

**핵심**:
- 3D 뷰의 실제 Transform을 읽어야 함
- Three.js의 `mesh.position`, `mesh.rotation`, `mesh.scale`을 읽어서 저장

---

### 3. **3D 뷰에서 Transform 읽기 구현**

#### ThreeViewer에 ref 노출
```typescript
// ThreeViewer.tsx
export const ThreeViewer = forwardRef<ThreeViewerHandle, ThreeViewerProps>((props, ref) => {
  const objectRefs = useRef<Map<string, THREE.Mesh>>(new Map());

  useImperativeHandle(ref, () => ({
    getObjectTransform: (objectId: string) => {
      const mesh = objectRefs.current.get(objectId);
      if (!mesh) return null;

      return {
        position: mesh.position.toArray() as [number, number, number],
        rotation: [
          (mesh.rotation.x * 180) / Math.PI,
          (mesh.rotation.y * 180) / Math.PI,
          (mesh.rotation.z * 180) / Math.PI,
        ] as [number, number, number],
        scale: mesh.scale.toArray() as [number, number, number],
      };
    }
  }));

  // SceneObjectMesh에서 ref 등록
  const handleMeshCreated = (objectId: string, mesh: THREE.Mesh) => {
    objectRefs.current.set(objectId, mesh);
  };

  return (
    // ... render
  );
});

export interface ThreeViewerHandle {
  getObjectTransform: (objectId: string) => {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  } | null;
}
```

#### SceneEditor에서 사용
```typescript
const threeViewerRef = useRef<ThreeViewerHandle>(null);

const handleAddKeyframe = async (objectId: string, time: number) => {
  const currentTransform = threeViewerRef.current?.getObjectTransform(objectId);

  if (!currentTransform) {
    console.error('Failed to get object transform');
    return;
  }

  const newKeyframe: PathKeyframe = {
    time,
    position: currentTransform.position,
    rotation: currentTransform.rotation,
    scale: currentTransform.scale,
  };

  // ... 저장
};
```

---

### 4. **키프레임 편집 UI 설계**

#### Inspector Panel에 "Keyframes" 섹션 추가

```
┌─────────────────────────────────┐
│ 인스펙터                        │
├─────────────────────────────────┤
│ 오브젝트: 직원                   │
│                                 │
│ Transform                       │
│ ├ Position: [5, 2, 3]           │
│ ├ Rotation: [0, 45, 0]          │
│ └ Scale: [1, 1, 1]              │
│                                 │
│ Keyframes (3)                   │
│ ┌───────────────────────────┐   │
│ │ ◆ 0.00s                   │   │
│ │   Pos: [0, 0, 0]          │   │
│ │   Rot: [0, 0, 0]          │   │
│ │   Scale: [1, 1, 1]        │   │
│ │   [편집] [삭제]             │   │
│ ├───────────────────────────┤   │
│ │ ◆ 2.50s ← 선택됨          │   │
│ │   Pos: [5, 2, 3]          │   │
│ │   Rot: [0, 45, 0]         │   │
│ │   Scale: [1, 1, 1]        │   │
│ │   시간: [2.50] [적용]      │   │
│ │   [편집] [삭제]             │   │
│ ├───────────────────────────┤   │
│ │ ◆ 5.00s                   │   │
│ │   Pos: [10, 0, 5]         │   │
│ │   Rot: [0, 90, 0]         │   │
│ │   Scale: [1.5, 1.5, 1.5]  │   │
│ │   [편집] [삭제]             │   │
│ └───────────────────────────┘   │
│                                 │
│ [+ 현재 위치로 키프레임 추가]     │
└─────────────────────────────────┘
```

#### 기능
1. **키프레임 목록 표시**
   - 시간 순서대로 정렬
   - 각 키프레임의 Transform 값 표시
   - 선택된 키프레임 하이라이트

2. **키프레임 시간 편집**
   - 입력창에 시간 직접 입력 (예: 2.50 → 3.00)
   - [적용] 버튼 클릭 시 저장
   - 또는 타임라인에서 드래그로 이동

3. **키프레임 Transform 편집**
   - [편집] 버튼 클릭
   - Position/Rotation/Scale 값을 입력창으로 수정
   - [저장] 버튼 클릭 시 적용

4. **키프레임 추가**
   - [+ 현재 위치로 키프레임 추가] 버튼
   - 현재 currentTime과 3D 뷰의 Transform으로 키프레임 생성

5. **키프레임 삭제**
   - [삭제] 버튼 클릭
   - 또는 타임라인에서 우클릭 → "키프레임 삭제"

---

### 5. **타임라인 키프레임 드래그**

#### 현재 (드래그 불가)
```
Timeline
├─ Object Track: 직원
│  └─ ◆ (0s)  ◆ (2.5s)  ◆ (5s)  ← 고정됨
```

#### 개선 (드래그 가능)
```
Timeline
├─ Object Track: 직원
│  └─ ◆ (0s)  ◆ (2.5s)  ◆ (5s)
       ↑        ↑ 마우스로 드래그하여 시간 이동
```

**구현 방법**:
```typescript
// TimelinePanel.tsx
const [draggingKeyframe, setDraggingKeyframe] = useState<{
  objectId: string;
  keyframeIndex: number;
  initialTime: number;
} | null>(null);

const handleKeyframeMouseDown = (objectId: string, keyframeIndex: number, time: number) => {
  setDraggingKeyframe({ objectId, keyframeIndex, initialTime: time });
};

const handleKeyframeMouseMove = (e: React.MouseEvent) => {
  if (!draggingKeyframe) return;

  const newTime = getTimeFromMouseX(e.clientX);

  // 실시간으로 키프레임 위치 업데이트 (로컬 상태)
  // 또는 마우스를 놓을 때 한 번에 저장
};

const handleKeyframeMouseUp = async () => {
  if (!draggingKeyframe) return;

  // 서버에 변경된 시간 저장
  await updateKeyframeTime(
    draggingKeyframe.objectId,
    draggingKeyframe.keyframeIndex,
    newTime
  );

  setDraggingKeyframe(null);
};
```

---

### 6. **재생 중 편집 방지**

#### AS-IS (현재 - 충돌 발생)
```typescript
// ThreeViewer.tsx
useEffect(() => {
  if (!meshRef.current || currentTime === undefined) return;

  // 항상 애니메이션 적용 → 사용자가 편집 불가
  applyKeyframeAnimation(meshRef.current, currentTime);
}, [currentTime]);
```

#### TO-BE (수정 후)
```typescript
useEffect(() => {
  if (!meshRef.current || currentTime === undefined) return;

  // 재생 중일 때만 애니메이션 적용
  if (!isPlaying) return;

  // 선택된 오브젝트는 애니메이션 제외 (편집 가능하게)
  if (isSelected) return;

  applyKeyframeAnimation(meshRef.current, currentTime);
}, [currentTime, isPlaying, isSelected]);
```

**추가 개선**:
- 재생 중에는 TransformControls를 숨김
- "재생 중에는 편집할 수 없습니다" 안내 표시

---

### 7. **Scale 애니메이션 지원**

#### ThreeViewer에서 scale 보간 추가
```typescript
// 현재 - position, rotation만 보간
useEffect(() => {
  // ... position lerp
  // ... rotation slerp
  // scale 보간 없음 ❌
}, [currentTime]);

// 수정 후
useEffect(() => {
  // ... position lerp
  // ... rotation slerp

  // Scale 보간 추가
  if (prevKeyframe.scale && nextKeyframe.scale) {
    meshRef.current.scale.set(
      THREE.MathUtils.lerp(prevKeyframe.scale[0], nextKeyframe.scale[0], t),
      THREE.MathUtils.lerp(prevKeyframe.scale[1], nextKeyframe.scale[1], t),
      THREE.MathUtils.lerp(prevKeyframe.scale[2], nextKeyframe.scale[2], t)
    );
  }
}, [currentTime]);
```

---

## 📋 구현 우선순위

### Phase A: 긴급 수정 (High Priority)
1. ✅ **PathKeyframe에 scale 필드 추가** (타입 정의)
2. ✅ **handleAddKeyframe에서 3D 뷰의 실제 Transform 읽기**
   - ThreeViewer에 ref와 `getObjectTransform()` 메서드 추가
   - SceneEditor에서 threeViewerRef로 현재 Transform 읽기
3. ✅ **ThreeViewer에서 scale 애니메이션 적용**
4. ✅ **재생 중 편집 방지** (isPlaying 체크)

### Phase B: 키프레임 편집 UI (Medium Priority)
5. **InspectorPanel에 "Keyframes" 섹션 추가**
   - 키프레임 목록 표시
   - 시간 입력창으로 편집
   - Transform 값 표시
6. **키프레임 시간 업데이트 API 추가**
   ```typescript
   const updateKeyframeTime = async (objectId: string, keyframeIndex: number, newTime: number) => {
     const keyframes = [...existing];
     keyframes[keyframeIndex].time = newTime;
     keyframes.sort((a, b) => a.time - b.time);
     await scenesAPI.updateObject(sceneId, objectId, { pathData: keyframes });
   };
   ```

### Phase C: 타임라인 드래그 (Low Priority)
7. **타임라인에서 키프레임 드래그로 시간 이동**
8. **키프레임 복사/붙여넣기**

---

## 🧪 테스트 시나리오

### 시나리오 1: 기본 키프레임 애니메이션
1. 새 오브젝트 생성 (위치: [0, 0, 0])
2. TransformControls로 [5, 0, 0]으로 이동
3. "키프레임 추가" 버튼 클릭 (시간: 0s)
4. **검증**: `path_data[0].position == [5, 0, 0]` ✅
5. currentTime을 2초로 이동
6. TransformControls로 [10, 0, 0]으로 이동
7. "키프레임 추가" 버튼 클릭 (시간: 2s)
8. **검증**: `path_data[1].position == [10, 0, 0]` ✅
9. 재생 시작
10. **검증**: 0초에 [5, 0, 0], 1초에 [7.5, 0, 0], 2초에 [10, 0, 0] ✅

### 시나리오 2: Scale 애니메이션
1. 오브젝트 생성
2. Scale을 [1, 1, 1]로 설정, 키프레임 추가 (0s)
3. Scale을 [2, 2, 2]로 설정, 키프레임 추가 (2s)
4. 재생 시작
5. **검증**: 0초에 크기 1, 1초에 크기 1.5, 2초에 크기 2 ✅

### 시나리오 3: 재생 중 편집 방지
1. 키프레임 2개 있는 오브젝트 선택
2. 재생 시작
3. TransformControls로 오브젝트를 잡으려고 시도
4. **검증**: Gizmo가 표시되지 않거나, 움직이지 않음 ✅

---

## 📊 현재 vs 목표 비교표

| 기능 | 현재 구현 | 목표 |
|------|----------|------|
| 키프레임 추가 | ❌ DB 값 저장 (잘못됨) | ✅ 3D 뷰의 실제 Transform 저장 |
| Scale 애니메이션 | ❌ 미지원 | ✅ Position/Rotation과 동일하게 지원 |
| 키프레임 시간 편집 | ❌ 불가능 | ✅ Inspector 입력창 또는 드래그 |
| 키프레임 Transform 편집 | ❌ 불가능 | ✅ Inspector에서 값 직접 수정 |
| 재생 중 편집 | ❌ 충돌 발생 | ✅ 편집 불가 또는 애니메이션 제외 |
| 키프레임 목록 표시 | ⚠️ 타임라인에만 표시 | ✅ Inspector에 상세 정보 표시 |
| 키프레임 드래그 | ❌ 불가능 | ✅ 타임라인에서 좌우 드래그 |

---

**결론**: 현재 키프레임 시스템은 기본 구조만 있고, 핵심 기능이 작동하지 않음. Phase A (긴급 수정)를 즉시 진행해야 함.
