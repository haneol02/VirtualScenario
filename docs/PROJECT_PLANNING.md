# VirtualScenario - 프로젝트 상세 기획서

## 1. 프로젝트 개요

### 1.1 프로젝트 목표
코레일 안전교육 및 업무 시나리오를 **작성-시각화-문서화**하는 통합 솔루션 개발

### 1.2 핵심 가치
- **직관성**: 비개발자도 쉽게 시나리오 작성 가능
- **시각화**: 3D 환경에서 인터랙티브한 시뮬레이션
- **문서화**: 교육 자료용 PDF/HWP 자동 생성

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Web Editor (Next.js)                  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Project    │  │    Scene     │  │   Object     │  │
│  │  Management  │  │    Editor    │  │   Library    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Three.js 3D Viewer (Top-down)             │  │
│  │  - Drag & Drop object placement                  │  │
│  │  - Path editing                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Timeline   │  │   Document   │  │     JSON     │  │
│  │   Editor     │  │   Exporter   │  │   Exporter   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Supabase    │
                    ├───────────────┤
                    │ - PostgreSQL  │
                    │ - Auth        │
                    │ - Storage     │
                    └───────────────┘
                            │
                            ▼ JSON
┌─────────────────────────────────────────────────────────┐
│              Unity 3D Simulator (Standalone)             │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     JSON     │  │    Scene     │  │   Object     │  │
│  │   Importer   │  │   Builder    │  │   Pooling    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Interactive 3D Simulation                  │  │
│  │  - Drag to move objects                           │  │
│  │  - Path animation                                 │  │
│  │  - Dialogue timeline                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   Camera     │  │   Export     │                    │
│  │   Control    │  │  (MP4/PNG)   │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### 2.2 기술 스택

#### Web Editor
```typescript
// Frontend
- Framework: Next.js 14+ (App Router)
- Language: TypeScript 5+
- 3D Library: Three.js + @react-three/fiber + @react-three/drei
- State Management: Zustand
- UI Components: shadcn/ui + Tailwind CSS
- Form Validation: Zod
- PDF Generation: jsPDF
- API Client: Supabase Client

// Backend
- BaaS: Supabase
  - Database: PostgreSQL
  - Auth: Row Level Security (RLS)
  - Storage: File storage for assets
  - Realtime: (Optional) Collaboration
```

#### Unity Simulator
```csharp
// Unity
- Version: Unity 2022.3 LTS
- Scripting: C# (.NET Standard 2.1)
- JSON Parsing: Newtonsoft.Json
- 3D Interaction: Custom Raycast Drag System
- Animation: DOTween (optional)
- Camera: Cinemachine
```

---

## 3. 데이터베이스 스키마 (Supabase)

### 3.1 ERD

```
users (Supabase Auth)
  ├── id (uuid, PK)
  ├── email
  └── created_at

projects
  ├── id (uuid, PK)
  ├── user_id (FK -> users.id)
  ├── title (text)
  ├── description (text, nullable)
  ├── version (text)
  ├── thumbnail_url (text, nullable)
  ├── created_at (timestamp)
  ├── updated_at (timestamp)
  └── is_deleted (boolean)

scenes
  ├── id (uuid, PK)
  ├── project_id (FK -> projects.id, CASCADE)
  ├── order (integer)
  ├── title (text)
  ├── description (text, nullable)
  ├── duration (integer, seconds)
  ├── participant_count (integer, nullable)
  ├── created_at (timestamp)
  └── updated_at (timestamp)

scene_objects
  ├── id (uuid, PK)
  ├── scene_id (FK -> scenes.id, CASCADE)
  ├── type (text: 'person', 'train', 'facility', etc.)
  ├── name (text)
  ├── model_id (text, FK to asset library)
  ├── position (jsonb: {x, y, z})
  ├── rotation (jsonb: {x, y, z})
  ├── scale (jsonb: {x, y, z})
  ├── path_data (jsonb: [{position, time}, ...])
  ├── metadata (jsonb, nullable)
  └── created_at (timestamp)

dialogues
  ├── id (uuid, PK)
  ├── scene_id (FK -> scenes.id, CASCADE)
  ├── object_id (FK -> scene_objects.id, nullable)
  ├── text (text)
  ├── start_time (float)
  ├── duration (float)
  ├── audio_url (text, nullable)
  └── created_at (timestamp)

asset_library
  ├── id (text, PK)
  ├── category (text: 'person', 'train', 'facility')
  ├── name (text)
  ├── thumbnail_url (text)
  ├── model_url (text, for Unity)
  ├── three_js_model_url (text, for Web)
  └── metadata (jsonb)
```

### 3.2 Row Level Security (RLS) 정책

```sql
-- Users can only see their own projects
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

-- Cascade policies for scenes, objects, dialogues
-- (similar pattern)
```

---

## 4. JSON 데이터 스키마

### 4.1 Export JSON Structure

```typescript
interface ScenarioData {
  projectInfo: {
    id: string;
    title: string;
    version: string;
    createdAt: string; // ISO 8601
    author?: string;
  };

  scenes: Scene[];
}

interface Scene {
  id: string;
  order: number;
  title: string;
  description?: string;
  duration: number; // seconds
  participantCount?: number;

  objects: SceneObject[];
  dialogues: Dialogue[];
  entryExitPaths?: Path[];

  cameraSettings?: {
    position: Vector3;
    target: Vector3;
    fov?: number;
  };
}

interface SceneObject {
  id: string;
  type: 'person' | 'train' | 'facility' | 'equipment' | 'sign';
  name: string;
  modelId: string; // Reference to asset library

  position: Vector3; // [x, y, z]
  rotation: Vector3; // [x, y, z] in degrees
  scale: Vector3;    // [x, y, z]

  path?: PathPoint[];

  metadata?: {
    role?: string;
    color?: string;
    tags?: string[];
  };
}

interface PathPoint {
  position: Vector3;
  time: number; // seconds from scene start
  rotation?: Vector3; // Optional rotation at this point
}

interface Dialogue {
  id: string;
  characterId?: string; // Reference to SceneObject.id
  text: string;
  startTime: number; // seconds from scene start
  duration: number;  // seconds
  audioUrl?: string;

  style?: {
    fontSize?: number;
    color?: string;
    position?: 'top' | 'bottom' | 'center';
  };
}

interface Path {
  type: 'entry' | 'exit';
  points: Vector3[];
  color?: string;
}

type Vector3 = [number, number, number];
```

### 4.2 Zod Validation Schema

```typescript
import { z } from 'zod';

const Vector3Schema = z.tuple([z.number(), z.number(), z.number()]);

const PathPointSchema = z.object({
  position: Vector3Schema,
  time: z.number().min(0),
  rotation: Vector3Schema.optional(),
});

const SceneObjectSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['person', 'train', 'facility', 'equipment', 'sign']),
  name: z.string().min(1),
  modelId: z.string(),
  position: Vector3Schema,
  rotation: Vector3Schema,
  scale: Vector3Schema,
  path: z.array(PathPointSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const DialogueSchema = z.object({
  id: z.string().uuid(),
  characterId: z.string().uuid().optional(),
  text: z.string().min(1),
  startTime: z.number().min(0),
  duration: z.number().min(0),
  audioUrl: z.string().url().optional(),
  style: z.object({
    fontSize: z.number().optional(),
    color: z.string().optional(),
    position: z.enum(['top', 'bottom', 'center']).optional(),
  }).optional(),
});

const SceneSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().min(0),
  participantCount: z.number().int().optional(),
  objects: z.array(SceneObjectSchema),
  dialogues: z.array(DialogueSchema),
  entryExitPaths: z.array(z.object({
    type: z.enum(['entry', 'exit']),
    points: z.array(Vector3Schema),
    color: z.string().optional(),
  })).optional(),
  cameraSettings: z.object({
    position: Vector3Schema,
    target: Vector3Schema,
    fov: z.number().optional(),
  }).optional(),
});

export const ScenarioDataSchema = z.object({
  projectInfo: z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    version: z.string(),
    createdAt: z.string().datetime(),
    author: z.string().optional(),
  }),
  scenes: z.array(SceneSchema).min(1),
});

export type ScenarioData = z.infer<typeof ScenarioDataSchema>;
```

---

## 5. Web Editor 상세 설계

### 5.1 페이지 구조

```
/app
  ├── (auth)
  │   ├── login/page.tsx
  │   └── signup/page.tsx
  │
  ├── dashboard/page.tsx          # Project list
  │
  └── editor/[projectId]
      ├── page.tsx                # Main editor
      ├── layout.tsx              # Editor layout
      │
      └── components/
          ├── ProjectInfo.tsx     # Header: title, version, save status
          ├── SceneList.tsx       # Left sidebar: scene thumbnails
          ├── SceneEditor.tsx     # Main area
          │   ├── ThreeViewer.tsx # Three.js canvas
          │   ├── ObjectLibrary.tsx
          │   └── PropertyPanel.tsx
          ├── TimelineEditor.tsx  # Bottom panel: dialogues
          └── ExportPanel.tsx     # Right sidebar: export options
```

### 5.2 Three.js Viewer 구현

```typescript
// components/ThreeViewer.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls } from '@react-three/drei';

export function ThreeViewer({ scene }: { scene: Scene }) {
  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  return (
    <Canvas camera={{ position: [0, 20, 0], fov: 50 }}>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 5]} intensity={1} />

      {/* Grid */}
      <Grid args={[50, 50]} cellColor="#6b7280" sectionColor="#374151" />

      {/* Scene Objects */}
      {scene.objects.map(obj => (
        <SceneObject3D
          key={obj.id}
          object={obj}
          isSelected={selectedObject === obj.id}
          onSelect={() => setSelectedObject(obj.id)}
        />
      ))}

      {/* Transform Controls for selected object */}
      {selectedObject && (
        <TransformControls
          object={getObjectByRef(selectedObject)}
          mode="translate"
          onObjectChange={handleTransform}
        />
      )}

      {/* Camera Controls */}
      <OrbitControls
        makeDefault
        enableRotate={false} // Top-down view only
        maxPolarAngle={0} // Lock to top-down
        minPolarAngle={0}
      />
    </Canvas>
  );
}
```

### 5.3 State Management (Zustand)

```typescript
// store/editorStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface EditorState {
  // Project
  project: Project | null;
  currentScene: Scene | null;

  // Selection
  selectedObjects: string[];

  // Editor mode
  mode: 'select' | 'place' | 'path';

  // Actions
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;

  addScene: (scene: Omit<Scene, 'id'>) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;

  addObject: (sceneId: string, object: Omit<SceneObject, 'id'>) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  deleteObject: (id: string) => void;

  addDialogue: (sceneId: string, dialogue: Omit<Dialogue, 'id'>) => void;
  updateDialogue: (id: string, updates: Partial<Dialogue>) => void;
  deleteDialogue: (id: string) => void;

  setSelectedObjects: (ids: string[]) => void;
  setMode: (mode: EditorState['mode']) => void;
}

export const useEditorStore = create<EditorState>()(
  devtools((set, get) => ({
    project: null,
    currentScene: null,
    selectedObjects: [],
    mode: 'select',

    loadProject: async (id) => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          scenes (
            *,
            scene_objects (*),
            dialogues (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      set({ project: data, currentScene: data.scenes[0] });
    },

    saveProject: async () => {
      const { project } = get();
      // Supabase update logic
    },

    // ... other actions
  }))
);
```

### 5.4 PDF Export

```typescript
// lib/pdfExport.ts
import { jsPDF } from 'jspdf';

export async function exportToPDF(project: Project) {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Cover page
  doc.setFontSize(24);
  doc.text(project.title, 105, 50, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Version: ${project.version}`, 105, 70, { align: 'center' });
  doc.text(`Created: ${new Date(project.createdAt).toLocaleDateString()}`, 105, 80, { align: 'center' });

  // Table of contents
  doc.addPage();
  doc.setFontSize(18);
  doc.text('Table of Contents', 20, 20);

  project.scenes.forEach((scene, index) => {
    doc.setFontSize(12);
    doc.text(`${scene.order}. ${scene.title}`, 20, 40 + index * 10);
    doc.text(`Page ${index + 3}`, 180, 40 + index * 10);
  });

  // Scene pages
  for (const scene of project.scenes) {
    doc.addPage();

    // Scene title
    doc.setFontSize(16);
    doc.text(`Scene ${scene.order}: ${scene.title}`, 20, 20);

    // Description
    doc.setFontSize(10);
    doc.text(scene.description || '', 20, 30, { maxWidth: 170 });

    // Capture Three.js screenshot
    const screenshot = await captureSceneScreenshot(scene);
    doc.addImage(screenshot, 'PNG', 20, 50, 170, 100);

    // Object list
    doc.setFontSize(12);
    doc.text('Objects:', 20, 160);
    scene.objects.forEach((obj, i) => {
      doc.setFontSize(10);
      doc.text(`- ${obj.name} (${obj.type})`, 25, 170 + i * 7);
    });

    // Dialogues
    if (scene.dialogues.length > 0) {
      doc.text('Dialogues:', 20, 200);
      scene.dialogues.forEach((dlg, i) => {
        doc.setFontSize(10);
        doc.text(`[${dlg.startTime}s] ${dlg.text}`, 25, 210 + i * 7);
      });
    }
  }

  doc.save(`${project.title}_scenario.pdf`);
}

async function captureSceneScreenshot(scene: Scene): Promise<string> {
  // Render Three.js scene to offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  // ... render scene

  return canvas.toDataURL('image/png');
}
```

---

## 6. Unity Simulator 상세 설계

### 6.1 프로젝트 구조

```
Assets/
  ├── Scripts/
  │   ├── Data/
  │   │   ├── ScenarioData.cs       # JSON data structures
  │   │   └── ScenarioImporter.cs   # JSON parsing
  │   │
  │   ├── Scene/
  │   │   ├── SceneBuilder.cs       # Build scene from data
  │   │   └── ObjectPoolManager.cs  # Object pooling
  │   │
  │   ├── Interaction/
  │   │   ├── DragController.cs     # 3D drag system
  │   │   └── PathAnimator.cs       # Path animation
  │   │
  │   ├── UI/
  │   │   ├── TimelineUI.cs         # Dialogue timeline
  │   │   └── SceneNavigator.cs     # Scene switcher
  │   │
  │   └── Export/
  │       ├── ScreenRecorder.cs     # MP4 recording
  │       └── ScreenshotCapture.cs
  │
  ├── Prefabs/
  │   ├── Characters/
  │   ├── Trains/
  │   ├── Facilities/
  │   └── UI/
  │
  ├── Materials/
  ├── Scenes/
  │   └── MainSimulator.unity
  │
  └── StreamingAssets/
      └── scenario.json             # Test data
```

### 6.2 JSON Importer

```csharp
// Scripts/Data/ScenarioData.cs
using System;
using System.Collections.Generic;
using Newtonsoft.Json;

[Serializable]
public class ScenarioData
{
    public ProjectInfo projectInfo;
    public List<Scene> scenes;
}

[Serializable]
public class ProjectInfo
{
    public string id;
    public string title;
    public string version;
    public string createdAt;
}

[Serializable]
public class Scene
{
    public string id;
    public int order;
    public string title;
    public string description;
    public float duration;
    public List<SceneObject> objects;
    public List<Dialogue> dialogues;
}

[Serializable]
public class SceneObject
{
    public string id;
    public string type;
    public string name;
    public string modelId;
    public float[] position;
    public float[] rotation;
    public float[] scale;
    public List<PathPoint> path;

    public Vector3 GetPosition() => new Vector3(position[0], position[1], -position[2]); // Z-flip
    public Vector3 GetRotation() => new Vector3(rotation[0], rotation[1], rotation[2]);
    public Vector3 GetScale() => new Vector3(scale[0], scale[1], scale[2]);
}

[Serializable]
public class PathPoint
{
    public float[] position;
    public float time;

    public Vector3 GetPosition() => new Vector3(position[0], position[1], -position[2]);
}

[Serializable]
public class Dialogue
{
    public string id;
    public string characterId;
    public string text;
    public float startTime;
    public float duration;
}

// Scripts/Data/ScenarioImporter.cs
using UnityEngine;
using Newtonsoft.Json;
using System.IO;

public class ScenarioImporter : MonoBehaviour
{
    public static ScenarioData LoadFromFile(string path)
    {
        string json = File.ReadAllText(path);
        return JsonConvert.DeserializeObject<ScenarioData>(json);
    }

    public static ScenarioData LoadFromStreamingAssets(string filename)
    {
        string path = Path.Combine(Application.streamingAssetsPath, filename);
        return LoadFromFile(path);
    }
}
```

### 6.3 Scene Builder

```csharp
// Scripts/Scene/SceneBuilder.cs
using UnityEngine;
using System.Collections.Generic;

public class SceneBuilder : MonoBehaviour
{
    [SerializeField] private Transform sceneRoot;
    [SerializeField] private ObjectPoolManager poolManager;

    private Dictionary<string, GameObject> instantiatedObjects = new();

    public void BuildScene(Scene sceneData)
    {
        ClearScene();

        foreach (var objData in sceneData.objects)
        {
            GameObject prefab = Resources.Load<GameObject>($"Prefabs/{objData.type}/{objData.modelId}");
            if (prefab == null)
            {
                Debug.LogWarning($"Prefab not found: {objData.modelId}");
                prefab = Resources.Load<GameObject>("Prefabs/Fallback");
            }

            GameObject instance = poolManager.Spawn(prefab, objData.GetPosition(), Quaternion.Euler(objData.GetRotation()));
            instance.transform.localScale = objData.GetScale();
            instance.name = objData.name;

            // Add drag controller
            var dragController = instance.AddComponent<DragController>();
            dragController.objectId = objData.id;

            // Add path animator if path exists
            if (objData.path != null && objData.path.Count > 0)
            {
                var pathAnimator = instance.AddComponent<PathAnimator>();
                pathAnimator.SetPath(objData.path);
            }

            instantiatedObjects[objData.id] = instance;
        }
    }

    public void ClearScene()
    {
        foreach (var obj in instantiatedObjects.Values)
        {
            poolManager.Despawn(obj);
        }
        instantiatedObjects.Clear();
    }

    public GameObject GetObjectById(string id)
    {
        return instantiatedObjects.TryGetValue(id, out var obj) ? obj : null;
    }
}
```

### 6.4 Drag Controller

```csharp
// Scripts/Interaction/DragController.cs
using UnityEngine;

public class DragController : MonoBehaviour
{
    public string objectId;

    private Camera mainCamera;
    private bool isDragging = false;
    private Vector3 offset;
    private Plane dragPlane;
    private PathAnimator pathAnimator;

    void Start()
    {
        mainCamera = Camera.main;
        pathAnimator = GetComponent<PathAnimator>();
    }

    void OnMouseDown()
    {
        isDragging = true;

        // Create horizontal plane at object's Y position
        dragPlane = new Plane(Vector3.up, transform.position);

        // Calculate offset
        Ray ray = mainCamera.ScreenPointToRay(Input.mousePosition);
        if (dragPlane.Raycast(ray, out float distance))
        {
            Vector3 hitPoint = ray.GetPoint(distance);
            offset = transform.position - hitPoint;
        }

        // Show path if exists
        if (pathAnimator != null)
        {
            pathAnimator.ShowPath();
        }
    }

    void OnMouseDrag()
    {
        if (!isDragging) return;

        Ray ray = mainCamera.ScreenPointToRay(Input.mousePosition);
        if (dragPlane.Raycast(ray, out float distance))
        {
            Vector3 newPosition = ray.GetPoint(distance) + offset;
            transform.position = newPosition;
        }
    }

    void OnMouseUp()
    {
        isDragging = false;

        // Play path animation
        if (pathAnimator != null)
        {
            pathAnimator.HidePath();
            pathAnimator.PlayAnimation();
        }
    }
}
```

### 6.5 Path Animator

```csharp
// Scripts/Interaction/PathAnimator.cs
using UnityEngine;
using System.Collections.Generic;
using System.Linq;

public class PathAnimator : MonoBehaviour
{
    private List<PathPoint> pathPoints;
    private LineRenderer lineRenderer;
    private bool isAnimating = false;
    private float animationStartTime;

    void Awake()
    {
        lineRenderer = gameObject.AddComponent<LineRenderer>();
        lineRenderer.startWidth = 0.1f;
        lineRenderer.endWidth = 0.1f;
        lineRenderer.material = new Material(Shader.Find("Sprites/Default"));
        lineRenderer.startColor = Color.cyan;
        lineRenderer.endColor = Color.cyan;
        lineRenderer.enabled = false;
    }

    public void SetPath(List<PathPoint> points)
    {
        pathPoints = points;
    }

    public void ShowPath()
    {
        if (pathPoints == null || pathPoints.Count == 0) return;

        lineRenderer.positionCount = pathPoints.Count;
        for (int i = 0; i < pathPoints.Count; i++)
        {
            lineRenderer.SetPosition(i, pathPoints[i].GetPosition());
        }
        lineRenderer.enabled = true;
    }

    public void HidePath()
    {
        lineRenderer.enabled = false;
    }

    public void PlayAnimation()
    {
        if (pathPoints == null || pathPoints.Count == 0) return;

        isAnimating = true;
        animationStartTime = Time.time;
    }

    void Update()
    {
        if (!isAnimating) return;

        float elapsed = Time.time - animationStartTime;

        // Find current segment
        for (int i = 0; i < pathPoints.Count - 1; i++)
        {
            if (elapsed >= pathPoints[i].time && elapsed < pathPoints[i + 1].time)
            {
                float t = (elapsed - pathPoints[i].time) / (pathPoints[i + 1].time - pathPoints[i].time);
                Vector3 pos = Vector3.Lerp(pathPoints[i].GetPosition(), pathPoints[i + 1].GetPosition(), t);
                transform.position = pos;
                return;
            }
        }

        // Animation complete
        if (elapsed >= pathPoints.Last().time)
        {
            transform.position = pathPoints.Last().GetPosition();
            isAnimating = false;
        }
    }
}
```

### 6.6 Timeline UI

```csharp
// Scripts/UI/TimelineUI.cs
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;

public class TimelineUI : MonoBehaviour
{
    [SerializeField] private RectTransform timelineContainer;
    [SerializeField] private GameObject dialogueItemPrefab;
    [SerializeField] private TextMeshProUGUI currentDialogueText;

    private List<Dialogue> dialogues;
    private float sceneStartTime;
    private bool isPlaying = false;

    public void LoadDialogues(List<Dialogue> dialogueList)
    {
        dialogues = dialogueList;

        // Clear existing items
        foreach (Transform child in timelineContainer)
        {
            Destroy(child.gameObject);
        }

        // Create timeline items
        foreach (var dialogue in dialogues)
        {
            GameObject item = Instantiate(dialogueItemPrefab, timelineContainer);
            var rectTransform = item.GetComponent<RectTransform>();

            // Position based on startTime
            rectTransform.anchoredPosition = new Vector2(dialogue.startTime * 100, 0); // 100px per second

            var text = item.GetComponentInChildren<TextMeshProUGUI>();
            text.text = dialogue.text;

            var button = item.GetComponent<Button>();
            button.onClick.AddListener(() => JumpToTime(dialogue.startTime));
        }
    }

    public void Play()
    {
        isPlaying = true;
        sceneStartTime = Time.time;
    }

    public void Pause()
    {
        isPlaying = false;
    }

    void Update()
    {
        if (!isPlaying) return;

        float elapsed = Time.time - sceneStartTime;

        // Find active dialogue
        foreach (var dialogue in dialogues)
        {
            if (elapsed >= dialogue.startTime && elapsed < dialogue.startTime + dialogue.duration)
            {
                currentDialogueText.text = dialogue.text;
                return;
            }
        }

        currentDialogueText.text = "";
    }

    void JumpToTime(float time)
    {
        sceneStartTime = Time.time - time;
    }
}
```

---

## 7. 개발 로드맵

### Phase 1: MVP (4-6주)

#### Week 1-2: 웹 에디터 기본 구조
- [ ] Next.js 프로젝트 셋업 + Supabase 연동
- [ ] 인증 시스템 (로그인/회원가입)
- [ ] 프로젝트 CRUD
- [ ] Scene CRUD
- [ ] Basic UI layout (header, sidebar, main area)

#### Week 3-4: Three.js 3D 뷰어
- [ ] Three.js 캔버스 셋업
- [ ] Asset library (5개 기본 오브젝트)
- [ ] Drag & Drop 배치
- [ ] Object selection & transform
- [ ] Grid & snapping

#### Week 5-6: JSON Export & Unity 기본
- [ ] JSON 스키마 정의
- [ ] Export 기능 구현
- [ ] Unity 프로젝트 셋업
- [ ] JSON importer
- [ ] Scene builder (basic)
- [ ] Camera controls

**Milestone 1 Deliverable:**
- 웹에서 오브젝트 배치 → JSON 다운로드 → Unity에서 확인

---

### Phase 2: 인터랙션 (3-4주)

#### Week 7-8: Path 편집
- [ ] 웹: Path point 추가/편집 UI
- [ ] 웹: Path 시각화 (LineRenderer in Three.js)
- [ ] Unity: PathAnimator 구현
- [ ] Unity: Path 재생/일시정지

#### Week 9-10: Dialogue System
- [ ] 웹: Timeline 에디터 UI
- [ ] 웹: Dialogue CRUD
- [ ] Unity: Dialogue UI
- [ ] Unity: Timeline playback
- [ ] Unity: Drag controller 통합

**Milestone 2 Deliverable:**
- 완전한 시나리오 작성 → Unity에서 인터랙티브 재생

---

### Phase 3: 문서화 (2-3주)

#### Week 11-12: PDF Export
- [ ] PDF 템플릿 디자인
- [ ] jsPDF 통합
- [ ] Three.js 씬 스크린샷 캡처
- [ ] 자동 페이지 생성
- [ ] 미리보기 기능

#### Week 13: Polishing
- [ ] UI/UX 개선
- [ ] 에러 처리 강화
- [ ] Performance 최적화
- [ ] 사용자 테스트 & 피드백

**Milestone 3 Deliverable:**
- 시나리오 작성 → 3D 시뮬레이션 → PDF 문서 생성 (End-to-End)

---

### Phase 4: 고도화 (지속)

- [ ] HWP export (서버 API)
- [ ] Collaboration (실시간 공동 편집)
- [ ] Asset library 확장 (20+ objects)
- [ ] Unity WebGL 빌드 & 웹 통합
- [ ] MP4 녹화 기능
- [ ] Version control (시나리오 버전 관리)

---

## 8. 기술적 고려사항

### 8.1 좌표계 변환

```typescript
// Web (Three.js) → Unity
function threeToUnity(position: [number, number, number]): [number, number, number] {
  return [position[0], position[1], -position[2]]; // Z-flip
}

// Unity → Web (Three.js)
function unityToThree(position: Vector3): [number, number, number] {
  return [position.x, position.y, -position.z]; // Z-flip
}
```

### 8.2 성능 최적화

#### Web
- Object pooling for Three.js instances
- Throttle transform updates (16ms)
- Lazy load asset thumbnails
- Debounce autosave (3초)

#### Unity
- Object pooling for prefabs
- Occlusion culling
- LOD groups for complex models
- Async scene loading

### 8.3 에러 처리

```typescript
// Web: Validate before export
export function validateScenario(data: ScenarioData): ValidationResult {
  try {
    ScenarioDataSchema.parse(data);

    // Custom validations
    const errors: string[] = [];

    data.scenes.forEach(scene => {
      if (scene.objects.length === 0) {
        errors.push(`Scene "${scene.title}" has no objects`);
      }

      scene.dialogues.forEach(dlg => {
        if (dlg.startTime > scene.duration) {
          errors.push(`Dialogue "${dlg.text}" starts after scene ends`);
        }
      });
    });

    return { valid: errors.length === 0, errors };
  } catch (e) {
    return { valid: false, errors: [e.message] };
  }
}
```

```csharp
// Unity: Graceful fallback
public GameObject LoadPrefab(string modelId)
{
    var prefab = Resources.Load<GameObject>($"Prefabs/{modelId}");
    if (prefab == null)
    {
        Debug.LogWarning($"Missing prefab: {modelId}, using fallback");
        prefab = Resources.Load<GameObject>("Prefabs/Fallback");
    }
    return prefab;
}
```

---

## 9. 테스트 전략

### 9.1 Unit Tests

```typescript
// Web: Vitest
describe('ScenarioExporter', () => {
  it('should export valid JSON', () => {
    const project = createMockProject();
    const json = exportToJSON(project);
    expect(() => ScenarioDataSchema.parse(json)).not.toThrow();
  });

  it('should handle empty scenes', () => {
    const project = { ...mockProject, scenes: [] };
    expect(() => exportToJSON(project)).toThrow('At least one scene required');
  });
});
```

```csharp
// Unity: Unity Test Framework
[Test]
public void ScenarioImporter_ShouldParseValidJSON()
{
    string json = File.ReadAllText("Assets/Tests/valid_scenario.json");
    ScenarioData data = JsonConvert.DeserializeObject<ScenarioData>(json);
    Assert.IsNotNull(data);
    Assert.Greater(data.scenes.Count, 0);
}
```

### 9.2 Integration Tests

- E2E: Playwright로 웹 에디터 워크플로우 테스트
- Unity Play Mode Tests: 씬 빌드 → 재생 → 검증

### 9.3 User Acceptance Tests

- 비개발자 사용자 3명에게 시나리오 작성 요청
- 목표: 30분 내 간단한 시나리오 완성 + PDF 생성

---

## 10. 배포 전략

### 10.1 Web Editor

```bash
# Vercel deployment
vercel --prod

# Environment variables
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 10.2 Unity Simulator

#### Option A: Standalone Builds
- Windows/Mac/Linux builds
- Distribution via GitHub Releases

#### Option B: WebGL
- Build to WebGL
- Host on Vercel/Netlify
- Embed in web editor

```bash
# Unity CLI build
/Applications/Unity/Hub/Editor/2022.3.x/Unity.app/Contents/MacOS/Unity \
  -quit -batchmode -projectPath . \
  -buildTarget WebGL \
  -executeMethod BuildScript.BuildWebGL
```

---

## 11. 다음 단계 (질문사항)

프로젝트 시작 전 결정이 필요한 사항:

1. **Asset Library 초기 구성**
   - 인물: 몇 종류? (예: 승객, 직원, 어린이, 노약자)
   - 기차: KTX, 무궁화호, ITX 등?
   - 시설물: 플랫폼, 안전선, 의자, 표지판 등?

2. **우선순위**
   - Unity Standalone vs WebGL 중 먼저 개발?
   - PDF vs HWP 중 먼저?

3. **협업 기능**
   - 다중 사용자 동시 편집 필요한지?
   - 아니면 단일 사용자 + 공유 기능만?

4. **PDF 템플릿**
   - 코레일 공식 문서 양식 있는지?
   - 커스텀 디자인 필요한지?

5. **3D Models**
   - 자체 제작? 에셋 스토어 구매?
   - 파일 포맷: FBX? GLB?

이 기획서를 바탕으로 개발을 시작할 수 있습니다. 우선 **Phase 1 MVP**부터 시작하는 것을 권장합니다.
