import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, scenesAPI, backgroundMapsAPI, type Project, type Scene, type SceneObject, type Dialogue, type BackgroundObject, type PathKeyframe } from '../lib/api';
import ThreeViewer from '../components/ThreeViewer';
import { getTransformAtTime } from '../utils/pathInterpolation';

export default function Simulator() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [backgroundObjects, setBackgroundObjects] = useState<BackgroundObject[]>([]);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [loading, setLoading] = useState(true);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sceneDuration, setSceneDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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
      const [projectData, scenesData] = await Promise.all([
        projectsAPI.getById(projectId!),
        scenesAPI.getAll(projectId!),
      ]);
      setProject(projectData);
      setScenes(scenesData);
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

      // Load background objects if background map is set
      if (scene.background_map_id) {
        const bgObjects = await backgroundMapsAPI.getObjects(scene.background_map_id);
        setBackgroundObjects(bgObjects);
      } else {
        setBackgroundObjects([]);
      }

      // Calculate scene duration based on dialogues
      const maxDialogueTime = dialoguesData.reduce((max, dlg) => {
        return Math.max(max, dlg.start_time + dlg.duration);
      }, 10); // Minimum 10 seconds

      setSceneDuration(maxDialogueTime);
    } catch (error) {
      console.error('Failed to load scene data:', error);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentSceneIndex(0);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handlePreviousScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
      setCurrentTime(0);
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
      setCurrentTime(0);
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

  // Apply path animation to objects
  const animatedObjects = useMemo(() => {
    return objects.map(obj => {
      // Skip if no path data
      if (!obj.path_data) {
        return obj;
      }

      try {
        const keyframes: PathKeyframe[] = JSON.parse(obj.path_data);
        if (keyframes.length === 0) {
          return obj;
        }

        // Get interpolated transform at current time
        const transform = getTransformAtTime(
          keyframes,
          currentTime,
          [obj.position_x, obj.position_y, obj.position_z],
          [obj.rotation_x, obj.rotation_y, obj.rotation_z],
          [obj.scale_x, obj.scale_y, obj.scale_z]
        );

        // Return object with updated transform
        return {
          ...obj,
          position_x: transform.position[0],
          position_y: transform.position[1],
          position_z: transform.position[2],
          rotation_x: transform.rotation[0],
          rotation_y: transform.rotation[1],
          rotation_z: transform.rotation[2],
          scale_x: transform.scale[0],
          scale_y: transform.scale[1],
          scale_z: transform.scale[2],
        };
      } catch (error) {
        console.error('Failed to parse path data for object:', obj.id, error);
        return obj;
      }
    });
  }, [objects, currentTime]);

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
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
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

      {/* 3D Viewer */}
      <main className="flex-1 relative">
        <ThreeViewer
          objects={[...backgroundObjects, ...animatedObjects]}
          selectedObjectId={undefined}
          onObjectSelect={() => {}}
          onObjectTransform={() => {}}
        />

        {/* Subtitles */}
        {activeDialogues.length > 0 && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-3/4 max-w-3xl">
            {activeDialogues.map(dlg => {
              const speaker = objects.find(obj => obj.id === dlg.object_id);
              return (
                <div
                  key={dlg.id}
                  className="bg-black bg-opacity-80 rounded-lg p-4 mb-2 animate-fade-in"
                >
                  {speaker && (
                    <div className="text-blue-400 font-semibold mb-1 text-sm">
                      {speaker.name}
                    </div>
                  )}
                  <div className="text-white text-lg">{dlg.text}</div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Playback Controls */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4">
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
    </div>
  );
}
