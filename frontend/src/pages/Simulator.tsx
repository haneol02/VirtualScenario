import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, scenesAPI, backgroundMapsAPI, assetsAPI, type Project, type Scene, type SceneObject, type Dialogue, type BackgroundObject, type Asset, type BackgroundMap } from '../lib/api';
import ThreeViewer, { ThreeViewerHandle } from '../components/ThreeViewer';
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
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [exportStatus, setExportStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [autoExportRequested, setAutoExportRequested] = useState(false);

  const threeViewerRef = useRef<ThreeViewerHandle>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const copyFrameRef = useRef<number>();
  const autoExportTimeoutRef = useRef<number | null>(null);
  const autoExportAttemptsRef = useRef(0);

  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const isRecordingExport = exportStatus === 'recording';
  const isProcessingExport = exportStatus === 'processing';
  const playbackLocked = exportStatus !== 'idle';
  const isWaitingExport = autoExportRequested && exportStatus === 'idle';

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
    if (isRecordingExport) {
      setExportMessage('녹화 중에는 재생/일시정지를 변경할 수 없습니다. ⏹️ 녹화 중단을 눌러주세요.');
      return;
    }
    if (isProcessingExport) return;

    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);

    // 재생 시작 시 수동 변경사항 초기화
    if (newIsPlaying) {
      setManualTransforms(new Map());
      setSelectedObjectId(undefined);
    }
  };

  const handleStop = () => {
    if (playbackLocked) return;
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentSceneIndex(0);
    setManualTransforms(new Map());
    setSelectedObjectId(undefined);
  };

  const handleSeek = (time: number) => {
    if (playbackLocked) return;
    setCurrentTime(time);
  };

  const handlePreviousScene = () => {
    if (playbackLocked) return;
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
      setCurrentTime(0);
      setManualTransforms(new Map());
      setSelectedObjectId(undefined);
    }
  };

  const handleNextScene = () => {
    if (playbackLocked) return;
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

  const stopFrameCopy = () => {
    if (copyFrameRef.current) {
      cancelAnimationFrame(copyFrameRef.current);
      copyFrameRef.current = undefined;
    }
  };

  const drawSubtitlesToContext = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!showSubtitlesRef.current) return;
    const dialogues = activeDialoguesRef.current;
    if (!dialogues.length) return;

    const blockWidth = Math.min(width * 0.85, width - 80);
    const padding = 14;
    const speakerFontSize = Math.max(16, Math.round(width / 70));
    const textFontSize = Math.max(18, Math.round(width / 65));
    const lineSpacing = textFontSize + 6;

    dialogues.forEach((dlg, index) => {
      const lines = dlg.text.split('\n').filter(line => line.trim().length > 0);
      const speaker = dlg.speaker_name || (dlg.object_id ? displayObjectsRef.current.find(obj => obj.id === dlg.object_id)?.name : undefined);
      const blockHeight = padding * 2 + lines.length * lineSpacing + (speaker ? speakerFontSize + 8 : 0);
      const y = height - (index + 1) * (blockHeight + 12) - 16;
      const x = (width - blockWidth) / 2;

      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, blockWidth, blockHeight);
      ctx.strokeRect(x, y, blockWidth, blockHeight);

      let cursorY = y + padding;
      if (speaker) {
        ctx.fillStyle = '#93c5fd';
        ctx.font = `${speakerFontSize}px 'Noto Sans', sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(speaker, x + padding, cursorY + speakerFontSize);
        cursorY += speakerFontSize + 10;
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = `${textFontSize}px 'Noto Sans', sans-serif`;
      ctx.textBaseline = 'alphabetic';
      lines.forEach(line => {
        ctx.fillText(line, x + padding, cursorY + textFontSize);
        cursorY += lineSpacing;
      });

      ctx.restore();
    });
  };

  const startCompositeLoop = (sourceCanvas: HTMLCanvasElement) => {
    const composite = compositeCanvasRef.current;
    if (!composite) return;
    const ctx = composite.getContext('2d');
    if (!ctx) return;

    const drawFrame = () => {
      if (!compositeCanvasRef.current) return;

      if (compositeCanvasRef.current.width !== sourceCanvas.width || compositeCanvasRef.current.height !== sourceCanvas.height) {
        compositeCanvasRef.current.width = sourceCanvas.width;
        compositeCanvasRef.current.height = sourceCanvas.height;
      }

      ctx.clearRect(0, 0, compositeCanvasRef.current.width, compositeCanvasRef.current.height);
      ctx.drawImage(sourceCanvas, 0, 0, compositeCanvasRef.current.width, compositeCanvasRef.current.height);
      drawSubtitlesToContext(ctx, compositeCanvasRef.current.width, compositeCanvasRef.current.height);

      copyFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
  };

  const finalizeRecording = async () => {
    stopFrameCopy();
    const chunks = recordedChunksRef.current;
    recordedChunksRef.current = [];

    if (!chunks.length) {
      setExportStatus('idle');
      setExportMessage('녹화된 데이터가 없습니다.');
      compositeCanvasRef.current = null;
      mediaRecorderRef.current = null;
      return;
    }

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    if (totalSize === 0) {
      setExportStatus('idle');
      setExportMessage('녹화된 데이터 크기가 0바이트입니다. 다시 시도해주세요.');
      compositeCanvasRef.current = null;
      mediaRecorderRef.current = null;
      return;
    }

    setExportStatus('processing');
    setExportMessage('MP4 파일로 변환 중입니다. 잠시만 기다려주세요.');

    try {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const buffer = new Uint8Array(await blob.arrayBuffer());
      const result = await window.electronAPI?.exportVideo?.(buffer);

      if (!result) {
        setExportMessage('일렉트론 환경에서만 내보내기가 가능합니다.');
      } else if (result.canceled) {
        setExportMessage('저장이 취소되었습니다.');
      } else if (result.error) {
        setExportMessage(`내보내기 실패: ${result.error}`);
      } else {
        setExportMessage(`내보내기 완료: ${result.filePath}`);
      }
    } catch (error) {
      setExportMessage(`내보내기 실패: ${(error as Error).message}`);
    } finally {
      setExportStatus('idle');
      compositeCanvasRef.current = null;
      mediaRecorderRef.current = null;
    }
  };

  const stopExportRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      // 요청된 데이터가 모두 수집되도록 요청 후 약간의 시간 뒤 stop
      try {
        recorder.requestData();
      } catch {
        // 일부 환경에서는 requestData 미지원, 무시
      }
      setTimeout(() => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, 100);
    } else {
      stopFrameCopy();
      setExportStatus('idle');
    }
    setIsPlaying(false);
  };

  const startExportRecording = () => {
    setExportMessage(null);
    setAutoExportRequested(false);

    if (!window.electronAPI?.exportVideo) {
      setExportMessage('MP4 내보내기는 일렉트론 앱에서만 지원됩니다.');
      return;
    }

    if (exportStatus !== 'idle') {
      return;
    }

    if (scenes.length === 0) {
      setExportMessage('내보낼 씬이 없습니다.');
      return;
    }

    const sourceCanvas = threeViewerRef.current?.getCanvasElement();
    if (!sourceCanvas) {
      setExportMessage('3D 뷰어 캔버스를 찾지 못했습니다. 화면이 로드된 뒤 다시 시도해주세요.');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setExportMessage('이 환경에서는 녹화를 지원하지 않습니다.');
      return;
    }

    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = sourceCanvas.width;
    compositeCanvas.height = sourceCanvas.height;
    compositeCanvasRef.current = compositeCanvas;

    const stream = compositeCanvas.captureStream(30);
    const supportedMime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    if (!supportedMime) {
      setExportMessage('녹화 가능한 비디오 코덱을 찾을 수 없습니다.');
      compositeCanvasRef.current = null;
      return;
    }

    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: supportedMime });
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = finalizeRecording;
    recorder.onerror = (event) => {
      setExportStatus('idle');
      stopFrameCopy();
      setExportMessage(`녹화 중 오류가 발생했습니다: ${event.error?.message ?? '알 수 없는 오류'}`);
    };

    try {
      recorder.start();
    } catch (error) {
      setExportStatus('idle');
      stopFrameCopy();
      setExportMessage(`녹화를 시작하지 못했습니다: ${(error as Error).message}`);
      return;
    }
    mediaRecorderRef.current = recorder;
    startCompositeLoop(sourceCanvas);

    setExportStatus('recording');
    setExportMessage('녹화 중... 시나리오를 끝까지 재생하여 MP4로 저장합니다.');

    // Reset and start playback from the beginning for a clean export
    setManualTransforms(new Map());
    setSelectedObjectId(undefined);
    setCurrentSceneIndex(0);
    setCurrentTime(0);
    setPlaybackSpeed(1);
    setIsPlaying(true);
  };

  const scheduleAutoExportCheck = () => {
    if (autoExportTimeoutRef.current) {
      clearTimeout(autoExportTimeoutRef.current);
      autoExportTimeoutRef.current = null;
    }

    if (!autoExportRequested || exportStatus !== 'idle') {
      return;
    }

    if (loading || scenes.length === 0) {
      setExportMessage('데이터 로딩 완료 후 자동 내보내기를 시작합니다...');
      autoExportTimeoutRef.current = window.setTimeout(scheduleAutoExportCheck, 300);
      return;
    }

    const canvas = threeViewerRef.current?.getCanvasElement();
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      setExportMessage('캔버스가 준비되어 자동 녹화를 시작합니다.');
      autoExportAttemptsRef.current = 0;
      // 한 프레임 뒤에 시작하여 렌더 안정화
      requestAnimationFrame(() => startExportRecording());
      return;
    }

    autoExportAttemptsRef.current += 1;
    if (autoExportAttemptsRef.current > 50) {
      setExportMessage('캔버스 준비 대기 시간이 초과되었습니다. 다시 시도해주세요.');
      setAutoExportRequested(false);
      autoExportAttemptsRef.current = 0;
      return;
    }

    setExportMessage('캔버스/모델 로드 대기 중입니다...');
    autoExportTimeoutRef.current = window.setTimeout(scheduleAutoExportCheck, 300);
  };

  useEffect(() => {
    if (autoExportRequested && exportStatus === 'idle') {
      autoExportAttemptsRef.current = 0;
      scheduleAutoExportCheck();
    }
    return () => {
      if (autoExportTimeoutRef.current) {
        clearTimeout(autoExportTimeoutRef.current);
        autoExportTimeoutRef.current = null;
      }
    };
  }, [autoExportRequested, exportStatus, loading, scenes.length]);

  useEffect(() => {
    return () => {
      stopFrameCopy();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (
      exportStatus === 'recording' &&
      !isPlaying &&
      scenes.length > 0 &&
      currentSceneIndex === scenes.length - 1 &&
      currentTime >= sceneDuration - 0.05
    ) {
      stopExportRecording();
    }
  }, [exportStatus, isPlaying, scenes.length, currentSceneIndex, currentTime, sceneDuration]);

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

  const activeDialoguesRef = useRef<Dialogue[]>([]);
  const displayObjectsRef = useRef<(SceneObject | BackgroundObject)[]>([]);
  const showSubtitlesRef = useRef(showSubtitles);

  useEffect(() => {
    activeDialoguesRef.current = activeDialogues;
  }, [activeDialogues]);

  useEffect(() => {
    displayObjectsRef.current = displayObjects;
  }, [displayObjects]);

  useEffect(() => {
    showSubtitlesRef.current = showSubtitles;
  }, [showSubtitles]);

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
                {/* Subtitle Toggle */}
                <button
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    showSubtitles
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="자막 표시/숨김"
                >
                  {showSubtitles ? '💬 자막 ON' : '💬 자막 OFF'}
                </button>

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

                {/* Export to MP4 (자동 대기 후 녹화) */}
                <button
                  onClick={() => {
                    if (isRecordingExport) {
                      stopExportRecording();
                      return;
                    }
                    if (isProcessingExport) return;
                    if (isWaitingExport) {
                      setAutoExportRequested(false);
                      setExportMessage('자동 내보내기가 취소되었습니다.');
                      return;
                    }
                    setExportMessage('캔버스/모델 로드가 끝나면 자동으로 녹화를 시작합니다.');
                    setAutoExportRequested(true);
                  }}
                  disabled={isProcessingExport}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isRecordingExport
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : isProcessingExport
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : isWaitingExport
                          ? 'bg-emerald-600 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  title="캔버스/모델 로드 완료 시 자동으로 녹화하고 MP4로 저장"
                >
                  {isRecordingExport
                    ? '⏹️ 녹화 중단'
                    : isProcessingExport
                      ? '⚙️ MP4 변환 중'
                      : isWaitingExport
                        ? '⏳ 준비 중... (누르면 취소)'
                        : '📹 MP4 내보내기'}
                </button>
              </div>
            </div>
          </header>
        </Panel>

        {/* Main 3D Viewer with Scene List - Resizable */}
        <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-blue-500 transition-colors cursor-row-resize" />
        <Panel defaultSize={75} minSize={50}>
          <PanelGroup direction="horizontal">
            {/* 3D Viewer */}
            <Panel defaultSize={80} minSize={60}>
              <main className="h-full relative">
                <ThreeViewer
                  ref={threeViewerRef}
                  objects={[...backgroundObjects, ...displayObjects]}
                  selectedObjectId={selectedObjectId}
                  onObjectSelect={handleObjectSelect}
                  onObjectTransform={handleObjectTransform}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  assets={assets}
                  gridSize={backgroundMap ? { width: backgroundMap.grid_width, depth: backgroundMap.grid_depth } : undefined}
                  backgroundObjectIds={backgroundObjects.map(obj => obj.id)}
                />

            {/* Recording Indicator */}
            {isRecordingExport && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-[10001] flex items-center gap-2">
                <span className="animate-pulse">●</span>
                <span>녹화 중 (MP4 내보내기)</span>
              </div>
            )}

            {/* Pause Instruction */}
            {!isPlaying && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-2xl z-[10000] font-medium flex items-center gap-2 select-none pointer-events-none">
                <span className="text-2xl">ℹ️</span>
                <span>일시정지 중 - 오브젝트를 클릭하고 드래그하여 동선을 설명할 수 있습니다</span>
              </div>
            )}

                {/* Subtitles */}
                {showSubtitles && activeDialogues.length > 0 && (
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
                          <div className="text-white text-lg whitespace-pre-line">{dlg.text}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </main>
            </Panel>

            {/* Scene List Panel */}
            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors cursor-col-resize" />
            <Panel defaultSize={20} minSize={15} maxSize={40}>
              <aside className="h-full bg-gray-800 border-l border-gray-700 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">장면 목록</h3>
                  <div className="space-y-2">
                    {scenes.map((scene, index) => (
                      <button
                        key={scene.id}
                        onClick={() => {
                          setCurrentSceneIndex(index);
                          setCurrentTime(0);
                          setIsPlaying(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded transition-colors ${
                          currentSceneIndex === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{index + 1}. {scene.title}</p>
                            {scene.description && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{scene.description}</p>
                            )}
                          </div>
                          {currentSceneIndex === index && (
                            <span className="ml-2 text-xs">▶️</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </Panel>
          </PanelGroup>
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
                disabled={playbackLocked}
                className="w-full h-3 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / sceneDuration) * 100}%, #4b5563 ${(currentTime / sceneDuration) * 100}%, #4b5563 100%)`,
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(sceneDuration)}</span>
              </div>
            </div>
            <style>{`
              input[type='range']::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #3b82f6;
                cursor: pointer;
                border: 2px solid white;
              }
              input[type='range']::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #3b82f6;
                cursor: pointer;
                border: 2px solid white;
              }
            `}</style>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {/* Previous Scene */}
              <button
                onClick={handlePreviousScene}
                disabled={currentSceneIndex === 0 || playbackLocked}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSceneIndex === 0 || playbackLocked
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
                disabled={playbackLocked}
                className={`px-4 py-2 rounded-lg font-medium ${
                  playbackLocked
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                title="정지"
              >
                ⏹️ 정지
              </button>

              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                disabled={playbackLocked}
                className={`px-6 py-3 rounded-lg font-bold text-lg ${
                  playbackLocked
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title={isPlaying ? "일시정지" : "재생"}
              >
                {isPlaying ? '⏸️ 일시정지' : '▶️ 재생'}
              </button>

              {/* Next Scene */}
              <button
                onClick={handleNextScene}
                disabled={currentSceneIndex === scenes.length - 1 || playbackLocked}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSceneIndex === scenes.length - 1 || playbackLocked
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title="다음 씬"
              >
                다음 ⏭️
              </button>
            </div>

            {exportMessage && (
              <div className="mt-3 text-sm text-center text-gray-300">
                {exportMessage}
              </div>
            )}
          </footer>
        </Panel>
      </PanelGroup>
    </div>
  );
}
