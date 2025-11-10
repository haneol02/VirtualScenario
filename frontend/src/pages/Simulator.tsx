import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, scenesAPI, backgroundMapsAPI, assetsAPI, type Project, type Scene, type SceneObject, type Dialogue, type BackgroundObject, type Asset, type BackgroundMap } from '../lib/api';
import ThreeViewer from '../components/ThreeViewer';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function Simulator() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [backgroundObjects, setBackgroundObjects] = useState<BackgroundObject[]>([]);
  const [backgroundMap, setBackgroundMap] = useState<BackgroundMap | null>(null);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sceneDuration, setSceneDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedObjectId, setSelectedObjectId] = useState<string | undefined>();
  const [manualTransforms, setManualTransforms] = useState<Map<string, { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }>>(new Map());

  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Load project and scenes
  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // Load current scene data
  useEffect(() => {
    if (scenes.length > 0 && currentSceneIndex >= 0 && currentSceneIndex < scenes.length) {
      loadSceneData(scenes[currentSceneIndex]);
      setCurrentTime(0); // Reset time when scene changes
    }
  }, [currentSceneIndex, scenes]);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(updatePlayback);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, sceneDuration]);

  const updatePlayback = (timestamp: number) => {
    const deltaTime = (timestamp - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = timestamp;

    setCurrentTime(prev => {
      const newTime = prev + deltaTime * playbackSpeed;

      // Check if scene finished
      if (newTime >= sceneDuration) {
        // Move to next scene
        if (currentSceneIndex < scenes.length - 1) {
          setCurrentSceneIndex(prev => prev + 1);
          return 0;
        } else {
          // End of all scenes
          setIsPlaying(false);
          return sceneDuration;
        }
      }

      return newTime;
    });

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePlayback);
    }
  };

  const loadProjectData = async () => {
    try {
      const [projectData, scenesData, assetsData] = await Promise.all([
        projectsAPI.getById(projectId!),
        scenesAPI.getAll(projectId!),
        assetsAPI.getAll(),
      ]);
      setProject(projectData);
      setScenes(scenesData);
      setAssets(assetsData);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSceneData = async (scene: Scene) => {
    try {
      const [objectsData, dialoguesData] = await Promise.all([
        scenesAPI.getObjects(scene.id),
        scenesAPI.getDialogues(scene.id),
      ]);

      setObjects(objectsData);
      setDialogues(dialoguesData);

      // Load background map and objects if background map is set
      if (scene.background_map_id) {
        const [bgMap, bgObjects] = await Promise.all([
          backgroundMapsAPI.getById(scene.background_map_id),
          backgroundMapsAPI.getObjects(scene.background_map_id),
        ]);
        setBackgroundMap(bgMap);
        setBackgroundObjects(bgObjects);
      } else {
        setBackgroundMap(null);
        setBackgroundObjects([]);
      }

      // Use scene duration if available, otherwise calculate from dialogues and keyframes
      if (scene.duration !== undefined && scene.duration !== null && scene.duration > 0) {
        setSceneDuration(scene.duration);
      } else {
        // Calculate scene duration based on dialogues and keyframes
        let maxTime = 10; // Minimum 10 seconds

        // Check dialogues
        dialoguesData.forEach(dlg => {
          const endTime = dlg.start_time + dlg.duration;
          if (endTime > maxTime) {
            maxTime = endTime;
          }
        });

        // Check keyframes in scene objects
        objectsData.forEach(obj => {
          if (obj.path_data) {
            try {
              const keyframes = JSON.parse(obj.path_data);
              keyframes.forEach((kf: any) => {
                if (kf.time > maxTime) {
                  maxTime = kf.time;
                }
              });
            } catch (e) {
              console.error('Failed to parse path_data for duration calculation:', e);
            }
          }
        });

        // Add 5 second buffer
        setSceneDuration(Math.max(10, maxTime + 5));
      }
    } catch (error) {
      console.error('Failed to load scene data:', error);
    }
  };

  const handlePlayPause = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);

    // 재생 시작 시 수동 변경사항 초기화
    if (newIsPlaying) {
      setManualTransforms(new Map());
      setSelectedObjectId(undefined);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentSceneIndex(0);
    setManualTransforms(new Map());
    setSelectedObjectId(undefined);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handlePreviousScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
      setCurrentTime(0);
      setManualTransforms(new Map());
      setSelectedObjectId(undefined);
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
      setCurrentTime(0);
      setManualTransforms(new Map());
      setSelectedObjectId(undefined);
    }
  };

  const handleObjectSelect = (objectId: string) => {
    // 일시정지 상태에서만 선택 가능
    if (!isPlaying) {
      setSelectedObjectId(objectId);
    }
  };

  const handleObjectTransform = (objectId: string, transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }) => {
    // 일시정지 상태에서만 변환 가능
    if (!isPlaying) {
      setManualTransforms(prev => {
        const newMap = new Map(prev);
        newMap.set(objectId, transform);
        return newMap;
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get active dialogues at current time
  const activeDialogues = dialogues.filter(dlg =>
    currentTime >= dlg.start_time && currentTime < dlg.start_time + dlg.duration
  );

  // Apply manual transforms to objects (일시정지 시 수동 변경사항)
  const displayObjects = useMemo(() => {
    return objects.map(obj => {
      const manualTransform = manualTransforms.get(obj.id);
      if (manualTransform) {
        return {
          ...obj,
          position_x: manualTransform.position[0],
          position_y: manualTransform.position[1],
          position_z: manualTransform.position[2],
          rotation_x: manualTransform.rotation[0],
          rotation_y: manualTransform.rotation[1],
          rotation_z: manualTransform.rotation[2],
          scale_x: manualTransform.scale[0],
          scale_y: manualTransform.scale[1],
          scale_z: manualTransform.scale[2],
        };
      }
      return obj;
    });
  }, [objects, manualTransforms]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!project || scenes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">시뮬레이션할 씬이 없습니다</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentScene = scenes[currentSceneIndex];

  return (
    <div className="h-screen bg-gray-900 text-white">
      <PanelGroup direction="vertical">
        {/* Header - Fixed Size */}
        <Panel defaultSize={10} minSize={8} maxSize={15}>
          <header className="h-full bg-gray-800 border-b border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => navigate('/')}
                  className="text-blue-400 hover:text-blue-300 mb-1 text-sm"
                >
                  ← 대시보드
                </button>
                <h1 className="text-2xl font-bold">{project.title} - 시뮬레이터</h1>
                <p className="text-sm text-gray-400">
                  씬 {currentSceneIndex + 1} / {scenes.length}: {currentScene.title}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Playback Speed */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">속도:</span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                  </select>
                </div>
              </div>
            </div>
          </header>
        </Panel>

        {/* Main 3D Viewer - Resizable */}
        <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-blue-500 transition-colors cursor-row-resize" />
        <Panel defaultSize={75} minSize={50}>
          <main className="h-full relative">
            <ThreeViewer
              objects={[...backgroundObjects, ...displayObjects]}
              selectedObjectId={selectedObjectId}
              onObjectSelect={handleObjectSelect}
              onObjectTransform={handleObjectTransform}
              currentTime={currentTime}
              isPlaying={isPlaying}
              assets={assets}
              gridSize={backgroundMap ? { width: backgroundMap.grid_width, depth: backgroundMap.grid_depth } : undefined}
            />

            {/* Pause Instruction */}
            {!isPlaying && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-2xl z-[10000] font-medium flex items-center gap-2 select-none pointer-events-none">
                <span className="text-2xl">ℹ️</span>
                <span>일시정지 중 - 오브젝트를 클릭하고 드래그하여 동선을 설명할 수 있습니다</span>
              </div>
            )}

            {/* Subtitles */}
            {activeDialogues.length > 0 && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-3/4 max-w-3xl">
                {activeDialogues.map(dlg => {
                  const speaker = dlg.speaker_name || (dlg.object_id ? displayObjects.find(obj => obj.id === dlg.object_id)?.name : null);
                  return (
                    <div
                      key={dlg.id}
                      className="bg-black bg-opacity-80 rounded-lg p-4 mb-2 animate-fade-in"
                    >
                      {speaker && (
                        <div className="text-blue-400 font-semibold mb-1 text-sm">
                          {speaker}
                        </div>
                      )}
                      <div className="text-white text-lg">{dlg.text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </Panel>

        {/* Footer Controls - Resizable */}
        <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-blue-500 transition-colors cursor-row-resize" />
        <Panel defaultSize={15} minSize={10} maxSize={30}>
          <footer className="h-full bg-gray-800 border-t border-gray-700 px-6 py-4">
            {/* Timeline */}
            <div className="mb-3">
              <input
                type="range"
                min="0"
                max={sceneDuration}
                step="0.1"
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(sceneDuration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {/* Previous Scene */}
              <button
                onClick={handlePreviousScene}
                disabled={currentSceneIndex === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSceneIndex === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title="이전 씬"
              >
                ⏮️ 이전
              </button>

              {/* Stop */}
              <button
                onClick={handleStop}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium"
                title="정지"
              >
                ⏹️ 정지
              </button>

              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg"
                title={isPlaying ? "일시정지" : "재생"}
              >
                {isPlaying ? '⏸️ 일시정지' : '▶️ 재생'}
              </button>

              {/* Next Scene */}
              <button
                onClick={handleNextScene}
                disabled={currentSceneIndex === scenes.length - 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSceneIndex === scenes.length - 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title="다음 씬"
              >
                다음 ⏭️
              </button>
            </div>
          </footer>
        </Panel>
      </PanelGroup>
    </div>
  );
}
