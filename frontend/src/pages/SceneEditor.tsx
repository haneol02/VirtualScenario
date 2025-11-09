import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, scenesAPI, backgroundMapsAPI, assetsAPI, type Project, type Scene, type SceneObject, type Dialogue, type BackgroundMap, type BackgroundObject, type PathKeyframe, type Asset } from '../lib/api';
import ThreeViewer, { type ThreeViewerHandle } from '../components/ThreeViewer';
import { useUndoRedo } from '../hooks/useUndoRedo';
import TimelinePanel from '../components/TimelinePanel';
import AssetLibraryPanel from '../components/AssetLibraryPanel';
import InspectorPanel from '../components/InspectorPanel';

export default function SceneEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const threeViewerRef = useRef<ThreeViewerHandle>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | undefined>();
  const [selectedDialogueId, setSelectedDialogueId] = useState<string | undefined>();
  const [leftSidebarTab, setLeftSidebarTab] = useState<'scenes' | 'background' | 'assets'>('scenes');
  const [loading, setLoading] = useState(true);
  const [backgroundMaps, setBackgroundMaps] = useState<BackgroundMap[]>([]);
  const [backgroundObjects, setBackgroundObjects] = useState<BackgroundObject[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showObjectDialog, setShowObjectDialog] = useState(false);
  const [showDialogueDialog, setShowDialogueDialog] = useState(false);
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [newObjectName, setNewObjectName] = useState('');
  const [newObjectType, setNewObjectType] = useState('person');
  const [newObjectModelId, setNewObjectModelId] = useState('');
  const [newDialogueText, setNewDialogueText] = useState('');
  const [newDialogueObjectId, setNewDialogueObjectId] = useState('');
  const [newDialogueSpeakerName, setNewDialogueSpeakerName] = useState('');
  const [newDialogueStartTime, setNewDialogueStartTime] = useState('0');
  const [newDialogueDuration, setNewDialogueDuration] = useState('3');

  // Timeline state
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTime, setMaxTime] = useState(30); // 기본 30초
  const [isPlaying, setIsPlaying] = useState(false);

  // Undo/Redo system
  const { pushAction, undo, redo, canUndo, canRedo } = useUndoRedo();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      // Delete selected object or dialogue
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedObjectId) {
          handleDeleteObject(selectedObjectId);
        } else if (selectedDialogueId) {
          handleDeleteDialogue(selectedDialogueId);
        }
      }
      // Add keyframe (K)
      else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (!isPlaying && selectedObjectId) {
          handleAddKeyframe(selectedObjectId, currentTime);
        }
      }
      // Play/Pause (Space)
      else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handlePlayPause();
      }
      // Deselect (Escape)
      else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedObjectId(undefined);
        setSelectedDialogueId(undefined);
      }
      // Duplicate (Ctrl+D)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedObjectId && selectedScene) {
          const obj = objects.find(o => o.id === selectedObjectId);
          if (obj) {
            setNewObjectName(obj.name + ' (복사본)');
            setNewObjectType(obj.type);
            setNewObjectModelId(obj.model_id || '');
            handleCreateObject();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, isPlaying, selectedObjectId, selectedDialogueId, currentTime, objects, selectedScene]);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // Load background maps and assets on mount
  useEffect(() => {
    loadBackgroundMaps();
    loadAssets();
  }, []);

  // Load background objects when scene changes
  useEffect(() => {
    if (selectedScene?.background_map_id) {
      loadBackgroundObjects(selectedScene.background_map_id);
    } else {
      setBackgroundObjects([]);
    }
  }, [selectedScene?.background_map_id]);

  // Auto-calculate maxTime based on keyframes and dialogues
  useEffect(() => {
    let calculatedMaxTime = 30; // Default 30 seconds

    // Check all keyframes
    objects.forEach(obj => {
      if (obj.path_data) {
        try {
          const keyframes: PathKeyframe[] = JSON.parse(obj.path_data);
          keyframes.forEach(kf => {
            if (kf.time > calculatedMaxTime) {
              calculatedMaxTime = kf.time;
            }
          });
        } catch (e) {
          console.error('Failed to parse path_data:', e);
        }
      }
    });

    // Check all dialogues
    dialogues.forEach(dlg => {
      const endTime = dlg.start_time + dlg.duration;
      if (endTime > calculatedMaxTime) {
        calculatedMaxTime = endTime;
      }
    });

    // Add 5 seconds buffer
    setMaxTime(Math.max(30, calculatedMaxTime + 5));
  }, [objects, dialogues]);

  // Animation playback loop
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentAnimTime: number) => {
      const deltaTime = (currentAnimTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentAnimTime;

      setCurrentTime(prevTime => {
        const newTime = prevTime + deltaTime;
        if (newTime >= maxTime) {
          setIsPlaying(false); // Stop at end
          return maxTime;
        }
        return newTime;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, maxTime]);

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

  const loadBackgroundMaps = async () => {
    try {
      const maps = await backgroundMapsAPI.getAll();
      setBackgroundMaps(maps);
    } catch (error) {
      console.error('Failed to load background maps:', error);
    }
  };

  const loadBackgroundObjects = async (mapId: string) => {
    try {
      const objs = await backgroundMapsAPI.getObjects(mapId);
      setBackgroundObjects(objs);
    } catch (error) {
      console.error('Failed to load background objects:', error);
    }
  };

  const loadAssets = async () => {
    try {
      const data = await assetsAPI.getAll();
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const handleCreateScene = async () => {
    if (!newSceneTitle.trim() || !projectId) return;

    try {
      await scenesAPI.create(projectId, {
        title: newSceneTitle,
        order: scenes.length + 1,
      });
      setNewSceneTitle('');
      setShowCreateDialog(false);
      loadProjectData();
    } catch (error) {
      console.error('Failed to create scene:', error);
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm('정말로 이 씬을 삭제하시겠습니까?')) return;

    try {
      await scenesAPI.delete(sceneId);
      if (selectedScene?.id === sceneId) {
        setSelectedScene(null);
        setObjects([]);
      }
      loadProjectData();
    } catch (error) {
      console.error('Failed to delete scene:', error);
    }
  };

  const handleSelectScene = async (scene: Scene) => {
    setSelectedScene(scene);
    try {
      const [objectsData, dialoguesData] = await Promise.all([
        scenesAPI.getObjects(scene.id),
        scenesAPI.getDialogues(scene.id)
      ]);
      setObjects(objectsData);
      setDialogues(dialoguesData);
    } catch (error) {
      console.error('Failed to load scene data:', error);
    }
  };

  const handleCreateObject = async (modelId?: string) => {
    if (!newObjectName.trim() || !selectedScene) return;

    try {
      const createdObject = await scenesAPI.createObject(selectedScene.id, {
        type: newObjectType,
        name: newObjectName,
        model_id: modelId || newObjectModelId || undefined,
      });

      setNewObjectName('');
      setNewObjectModelId('');
      setShowObjectDialog(false);
      await handleSelectScene(selectedScene);
      loadAssets(); // Reload assets in case new ones were added

      // Record undo action
      pushAction({
        type: 'create_object',
        undo: async () => {
          await scenesAPI.deleteObject(selectedScene.id, createdObject.id);
          await handleSelectScene(selectedScene);
        },
        redo: async () => {
          // Note: Re-creating with same ID might not work, this is a limitation
          await handleSelectScene(selectedScene);
        },
        data: { objectId: createdObject.id, objectName: newObjectName }
      });
    } catch (error) {
      console.error('Failed to create object:', error);
    }
  };

  const handleDeleteObject = async (objectId: string) => {
    if (!confirm('정말로 이 오브젝트를 삭제하시겠습니까?') || !selectedScene) return;

    // Save object data for undo
    const objectToDelete = objects.find(obj => obj.id === objectId);
    if (!objectToDelete) return;

    try {
      await scenesAPI.deleteObject(selectedScene.id, objectId);
      await handleSelectScene(selectedScene);

      // Record undo action (note: redo won't restore the exact same object due to ID)
      pushAction({
        type: 'delete_object',
        undo: async () => {
          // This is a limitation - we can't restore with the same ID easily
          await scenesAPI.createObject(selectedScene.id, {
            type: objectToDelete.type,
            name: objectToDelete.name + ' (복원됨)',
            transform: {
              position: [objectToDelete.position_x, objectToDelete.position_y, objectToDelete.position_z],
              rotation: [objectToDelete.rotation_x, objectToDelete.rotation_y, objectToDelete.rotation_z],
              scale: [objectToDelete.scale_x, objectToDelete.scale_y, objectToDelete.scale_z],
            }
          });
          await handleSelectScene(selectedScene);
        },
        redo: async () => {
          await handleSelectScene(selectedScene);
        },
        data: { objectId, objectData: objectToDelete }
      });
    } catch (error) {
      console.error('Failed to delete object:', error);
    }
  };

  const handleCreateDialogue = async () => {
    if (!newDialogueText.trim() || !selectedScene) return;

    try {
      await scenesAPI.createDialogue(selectedScene.id, {
        text: newDialogueText,
        objectId: newDialogueObjectId || undefined,
        speakerName: newDialogueSpeakerName.trim() || undefined,
        startTime: parseFloat(newDialogueStartTime),
        duration: parseFloat(newDialogueDuration),
      });
      setNewDialogueText('');
      setNewDialogueObjectId('');
      setNewDialogueSpeakerName('');
      setNewDialogueStartTime('0');
      setNewDialogueDuration('3');
      setShowDialogueDialog(false);
      handleSelectScene(selectedScene);
    } catch (error) {
      console.error('Failed to create dialogue:', error);
    }
  };

  const handleDeleteDialogue = async (dialogueId: string) => {
    if (!confirm('정말로 이 대화를 삭제하시겠습니까?') || !selectedScene) return;

    try {
      await scenesAPI.deleteDialogue(selectedScene.id, dialogueId);
      handleSelectScene(selectedScene);
    } catch (error) {
      console.error('Failed to delete dialogue:', error);
    }
  };

  const handleObjectTransform = async (objectId: string, transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }, recordUndo: boolean = true) => {
    if (!selectedScene) return;

    // Save previous state for undo
    const previousObject = objects.find(obj => obj.id === objectId);
    if (!previousObject) return;

    const previousTransform = {
      position: [previousObject.position_x, previousObject.position_y, previousObject.position_z] as [number, number, number],
      rotation: [previousObject.rotation_x, previousObject.rotation_y, previousObject.rotation_z] as [number, number, number],
      scale: [previousObject.scale_x, previousObject.scale_y, previousObject.scale_z] as [number, number, number],
    };

    try {
      // Check if there are existing keyframes
      const existingKeyframes: PathKeyframe[] = previousObject.path_data ? JSON.parse(previousObject.path_data) : [];

      if (existingKeyframes.length > 0) {
        // Auto-update or create keyframe at current time
        const threshold = 0.1; // 0.1초 허용 오차
        const existingKeyframeIndex = existingKeyframes.findIndex(
          kf => Math.abs(kf.time - currentTime) < threshold
        );

        let updatedKeyframes = [...existingKeyframes];

        if (existingKeyframeIndex >= 0) {
          // Update existing keyframe
          updatedKeyframes[existingKeyframeIndex] = {
            time: currentTime,
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale,
          };
        } else {
          // Create new keyframe at current time
          updatedKeyframes.push({
            time: currentTime,
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale,
          });
          updatedKeyframes.sort((a, b) => a.time - b.time);
        }

        // Update with new keyframes
        await scenesAPI.updateObject(selectedScene.id, objectId, {
          pathData: updatedKeyframes
        });
      } else {
        // No keyframes exist, just update DB transform
        await scenesAPI.updateObject(selectedScene.id, objectId, { transform });
      }

      // 오브젝트 목록 새로고침
      const objectsData = await scenesAPI.getObjects(selectedScene.id);
      setObjects(objectsData);

      // Record undo action
      if (recordUndo) {
        pushAction({
          type: 'transform',
          undo: async () => {
            await handleObjectTransform(objectId, previousTransform, false);
          },
          redo: async () => {
            await handleObjectTransform(objectId, transform, false);
          },
          data: { objectId, previousTransform, newTransform: transform }
        });
      }
    } catch (error) {
      console.error('Failed to update object transform:', error);
    }
  };

  // Timeline handlers
  const handleAddKeyframe = async (objectId: string, time: number) => {
    if (!selectedScene) return;

    const obj = objects.find(o => o.id === objectId);
    if (!obj) return;

    // Get current transform from 3D viewer
    const currentTransform = threeViewerRef.current?.getObjectTransform(objectId);

    // Fallback to DB values if 3D transform not available
    const position = currentTransform?.position ?? [obj.position_x, obj.position_y, obj.position_z] as [number, number, number];
    const rotation = currentTransform?.rotation ?? [obj.rotation_x, obj.rotation_y, obj.rotation_z] as [number, number, number];
    const scale = currentTransform?.scale ?? [obj.scale_x, obj.scale_y, obj.scale_z] as [number, number, number];

    // Parse existing keyframes
    const existingKeyframes: PathKeyframe[] = obj.path_data ? JSON.parse(obj.path_data) : [];

    // Save previous state for undo
    const previousPathData = obj.path_data;

    // Add new keyframe with scale
    const newKeyframe: PathKeyframe = { time, position, rotation, scale };
    const updatedKeyframes = [...existingKeyframes, newKeyframe].sort((a, b) => a.time - b.time);

    try {
      await scenesAPI.updateObject(selectedScene.id, objectId, {
        pathData: updatedKeyframes
      });
      await handleSelectScene(selectedScene);

      // Record undo action
      pushAction({
        type: 'add_keyframe',
        undo: async () => {
          await scenesAPI.updateObject(selectedScene.id, objectId, {
            pathData: previousPathData ? JSON.parse(previousPathData) : null
          });
          await handleSelectScene(selectedScene);
        },
        redo: async () => {
          await scenesAPI.updateObject(selectedScene.id, objectId, {
            pathData: updatedKeyframes
          });
          await handleSelectScene(selectedScene);
        },
        data: { objectId, time, previousPathData, newPathData: updatedKeyframes }
      });
    } catch (error) {
      console.error('Failed to add keyframe:', error);
    }
  };

  const handleUpdateKeyframe = async (objectId: string, keyframeIndex: number, newTime: number) => {
    if (!selectedScene) return;

    const obj = objects.find(o => o.id === objectId);
    if (!obj || !obj.path_data) return;

    const keyframes: PathKeyframe[] = JSON.parse(obj.path_data);
    if (keyframeIndex < 0 || keyframeIndex >= keyframes.length) return;

    // Save previous state for undo
    const previousPathData = obj.path_data;
    const oldTime = keyframes[keyframeIndex].time;

    // Update keyframe time
    const updatedKeyframes = [...keyframes];
    updatedKeyframes[keyframeIndex] = {
      ...updatedKeyframes[keyframeIndex],
      time: newTime
    };

    // Sort by time
    updatedKeyframes.sort((a, b) => a.time - b.time);

    try {
      await scenesAPI.updateObject(selectedScene.id, objectId, {
        pathData: updatedKeyframes
      });
      await handleSelectScene(selectedScene);

      // Record undo action
      pushAction({
        type: 'update_keyframe',
        undo: async () => {
          await scenesAPI.updateObject(selectedScene.id, objectId, {
            pathData: previousPathData ? JSON.parse(previousPathData) : null
          });
          await handleSelectScene(selectedScene);
        },
        redo: async () => {
          await scenesAPI.updateObject(selectedScene.id, objectId, {
            pathData: updatedKeyframes
          });
          await handleSelectScene(selectedScene);
        },
        data: { objectId, keyframeIndex, oldTime, newTime }
      });
    } catch (error) {
      console.error('Failed to update keyframe:', error);
    }
  };

  const handleDeleteKeyframe = async (objectId: string, keyframeIndex: number) => {
    if (!selectedScene) return;

    const obj = objects.find(o => o.id === objectId);
    if (!obj || !obj.path_data) return;

    const keyframes: PathKeyframe[] = JSON.parse(obj.path_data);

    // Save previous state for undo
    const previousPathData = obj.path_data;
    const deletedKeyframe = keyframes[keyframeIndex];

    const updatedKeyframes = keyframes.filter((_, i) => i !== keyframeIndex);

    try {
      await scenesAPI.updateObject(selectedScene.id, objectId, {
        pathData: updatedKeyframes.length > 0 ? updatedKeyframes : null
      });
      await handleSelectScene(selectedScene);

      // Record undo action
      pushAction({
        type: 'delete_keyframe',
        undo: async () => {
          await scenesAPI.updateObject(selectedScene.id, objectId, {
            pathData: previousPathData ? JSON.parse(previousPathData) : null
          });
          await handleSelectScene(selectedScene);
        },
        redo: async () => {
          await scenesAPI.updateObject(selectedScene.id, objectId, {
            pathData: updatedKeyframes.length > 0 ? updatedKeyframes : null
          });
          await handleSelectScene(selectedScene);
        },
        data: { objectId, keyframeIndex, deletedKeyframe, previousPathData }
      });
    } catch (error) {
      console.error('Failed to delete keyframe:', error);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleBackgroundMapChange = async (backgroundMapId: string | null) => {
    if (!selectedScene) return;

    try {
      await scenesAPI.update(selectedScene.id, { backgroundMapId });
      const updatedScenes = await scenesAPI.getAll(projectId!);
      setScenes(updatedScenes);
      const currentScene = updatedScenes.find((s: any) => s.id === selectedScene.id);
      if (currentScene) {
        setSelectedScene(currentScene);
      }
    } catch (error) {
      console.error('Failed to update background map:', error);
    }
  };

  const handleUpdateDialogue = async (dialogueId: string, updates: { startTime?: number; duration?: number }) => {
    if (!selectedScene) return;

    // Optimistic update: Update local state immediately
    setDialogues(prevDialogues =>
      prevDialogues.map(dlg => {
        if (dlg.id === dialogueId) {
          return {
            ...dlg,
            start_time: updates.startTime !== undefined ? updates.startTime : dlg.start_time,
            duration: updates.duration !== undefined ? updates.duration : dlg.duration,
          };
        }
        return dlg;
      })
    );

    try {
      const updatePayload: any = {};
      if (updates.startTime !== undefined) {
        updatePayload.startTime = updates.startTime;
      }
      if (updates.duration !== undefined) {
        updatePayload.duration = updates.duration;
      }

      // Update backend in background
      await scenesAPI.updateDialogue(selectedScene.id, dialogueId, updatePayload);
    } catch (error) {
      console.error('Failed to update dialogue:', error);
      // On error, reload to get correct data
      await handleSelectScene(selectedScene);
    }
  };

  const handleReorderObjects = async (orderedIds: string[]) => {
    if (!selectedScene) return;

    // Optimistic update
    setObjects(prevObjects => {
      const reordered = orderedIds.map(id => prevObjects.find(obj => obj.id === id)!).filter(Boolean);
      return reordered;
    });

    try {
      await scenesAPI.reorderObjects(selectedScene.id, orderedIds);
    } catch (error) {
      console.error('Failed to reorder objects:', error);
      await handleSelectScene(selectedScene);
    }
  };

  const handleReorderDialogues = async (orderedIds: string[]) => {
    if (!selectedScene) return;

    // Optimistic update
    setDialogues(prevDialogues => {
      const reordered = orderedIds.map(id => prevDialogues.find(dlg => dlg.id === id)!).filter(Boolean);
      return reordered;
    });

    try {
      await scenesAPI.reorderDialogues(selectedScene.id, orderedIds);
    } catch (error) {
      console.error('Failed to reorder dialogues:', error);
      await handleSelectScene(selectedScene);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div>
          <p className="text-xl mb-4">프로젝트를 찾을 수 없습니다</p>
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

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Top Section: Sidebar + Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tabbed */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300 mb-2 text-sm"
          >
            ← 대시보드
          </button>
          <h2 className="text-xl font-bold truncate">{project.title}</h2>
          <p className="text-sm text-gray-400">v{project.version}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setLeftSidebarTab('scenes')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              leftSidebarTab === 'scenes'
                ? 'bg-gray-750 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            🎬 장면
          </button>
          <button
            onClick={() => setLeftSidebarTab('background')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              leftSidebarTab === 'background'
                ? 'bg-gray-750 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            🎨 배경
          </button>
          <button
            onClick={() => setLeftSidebarTab('assets')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              leftSidebarTab === 'assets'
                ? 'bg-gray-750 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            📦 에셋
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Scenes Tab */}
          {leftSidebarTab === 'scenes' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">장면 목록</h3>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                  + 추가
                </button>
              </div>

              {scenes.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-4xl mb-2">🎬</p>
                  <p className="text-sm">씬이 없습니다</p>
                  <p className="text-xs">씬을 추가하세요</p>
                </div>
              ) : (
            <div className="space-y-2">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  onClick={() => handleSelectScene(scene)}
                  className={`rounded-lg p-3 cursor-pointer transition-colors border ${
                    selectedScene?.id === scene.id
                      ? 'bg-blue-700 border-blue-500'
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium">{scene.order_index}. {scene.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScene(scene.id);
                      }}
                      className="text-gray-400 hover:text-red-500 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                  {scene.description && (
                    <p className="text-xs text-gray-400 mb-1">{scene.description}</p>
                  )}
                  {scene.participant_count && (
                    <div className="text-xs text-gray-500">
                      👥 {scene.participant_count}명
                    </div>
                  )}
                </div>
              ))}
            </div>
              )}
            </>
          )}

          {/* Background Map Tab */}
          {leftSidebarTab === 'background' && (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">배경 맵 선택</h3>
                  <button
                    onClick={() => navigate('/background-maps')}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    관리 →
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  {selectedScene ? `"${selectedScene.title}" 장면의 배경 맵을 선택하세요` : '장면을 먼저 선택하세요'}
                </p>
              </div>

              {!selectedScene ? (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-4xl mb-2">👈</p>
                  <p className="text-sm">장면을 먼저 선택하세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 배경 없음 옵션 */}
                  <button
                    onClick={() => handleBackgroundMapChange(null)}
                    className={`w-full text-left rounded-lg p-4 border transition-all ${
                      !selectedScene.background_map_id
                        ? 'bg-blue-700 border-blue-500 ring-2 ring-blue-400'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-650 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">∅</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">배경 없음</h4>
                          {!selectedScene.background_map_id && (
                            <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">적용됨</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">기본 격자만 표시</p>
                      </div>
                    </div>
                  </button>

                  {/* 배경 맵 목록 */}
                  {backgroundMaps.map((map) => {
                    const isActive = selectedScene.background_map_id === map.id;
                    return (
                      <button
                        key={map.id}
                        onClick={() => handleBackgroundMapChange(map.id)}
                        className={`w-full text-left rounded-lg p-4 border transition-all ${
                          isActive
                            ? 'bg-blue-700 border-blue-500 ring-2 ring-blue-400'
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-650 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{map.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold">{map.name}</h4>
                              {isActive && (
                                <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">적용됨</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{map.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {backgroundMaps.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <p className="text-4xl mb-2">🗺️</p>
                      <p className="text-sm">배경 맵이 없습니다</p>
                      <button
                        onClick={() => navigate('/background-maps')}
                        className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        배경 맵 만들기 →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Assets Tab */}
          {leftSidebarTab === 'assets' && (
            <div className="h-full -m-4">
              <AssetLibraryPanel
                onAssetSelect={async (assetId) => {
                  // Handle asset selection - create new object with selected asset
                  if (!selectedScene) {
                    alert('장면을 먼저 선택하세요');
                    return;
                  }
                  const asset = assets.find(a => a.id === assetId);
                  if (asset) {
                    // Set appropriate object type based on asset category
                    const validTypes = ['person', 'train', 'facility', 'sign'];
                    const objectType = validTypes.includes(asset.category) ? asset.category : 'other';

                    try {
                      // Create object directly with asset info
                      const createdObject = await scenesAPI.createObject(selectedScene.id, {
                        type: objectType,
                        name: asset.name,
                        model_id: assetId,
                      });

                      // Reload scene to show new object
                      await handleSelectScene(selectedScene);
                      loadAssets();

                      // Record undo action
                      pushAction({
                        type: 'create_object',
                        undo: async () => {
                          await scenesAPI.deleteObject(selectedScene.id, createdObject.id);
                          await handleSelectScene(selectedScene);
                        },
                        redo: async () => {
                          const recreated = await scenesAPI.createObject(selectedScene.id, {
                            type: objectType,
                            name: asset.name,
                            model_id: assetId,
                          });
                          await handleSelectScene(selectedScene);
                        },
                      });
                    } catch (error) {
                      console.error('Failed to create object:', error);
                      alert('오브젝트 생성 실패');
                    }
                  }
                }}
                onAssetUpdated={() => {
                  // 에셋이 업로드/수정/삭제되면 SceneEditor의 에셋 목록도 갱신
                  loadAssets();
                }}
              />
            </div>
          )}
        </div>
      </aside>

      {/* Main Area - 3D Viewer */}
      <main className="flex-1 flex flex-col items-center justify-center bg-gray-900 relative">
        {selectedScene ? (
          <>
            <div className="flex-1 w-full">
              <ThreeViewer
                ref={threeViewerRef}
                objects={[...backgroundObjects, ...objects]}
                selectedObjectId={selectedObjectId}
                assets={assets}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onObjectSelect={(id) => setSelectedObjectId(id)}
                onObjectTransform={handleObjectTransform}
              />
            </div>

            {/* Playing Warning & Overlay */}
            {isPlaying && (
              <>
                {/* Transparent overlay to block interaction */}
                <div className="absolute inset-0 z-40 bg-transparent cursor-not-allowed" />

                {/* Warning message */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 bg-opacity-50 text-black px-6 py-3 rounded-lg shadow-2xl z-50 font-semibold flex items-center gap-2 select-none pointer-events-none"
                  onDragStart={(e) => e.preventDefault()}>
                  <span className="text-2xl">⚠️</span>
                  <span>재생 중에는 편집할 수 없습니다</span>
                </div>
              </>
            )}

            {/* Dialogue Subtitles */}
            {(() => {
              const activeDialogues = dialogues.filter(
                dlg => currentTime >= dlg.start_time && currentTime <= dlg.start_time + dlg.duration
              );
              return activeDialogues.length > 0 && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 space-y-2 z-40 max-w-3xl w-full px-4 select-none">
                  {activeDialogues.map(dlg => {
                    // speaker_name 우선, 없으면 object_id로 찾기
                    const speaker = dlg.speaker_name ||
                      (dlg.object_id ? objects.find(obj => obj.id === dlg.object_id)?.name : null);
                    return (
                      <div
                        key={dlg.id}
                        className="bg-black bg-opacity-75 text-white px-6 py-3 rounded-lg shadow-2xl animate-fade-in"
                        onDragStart={(e) => e.preventDefault()}
                      >
                        {speaker && (
                          <div className="text-sm font-semibold text-blue-300 mb-1">
                            {speaker}
                          </div>
                        )}
                        <div className="text-lg">
                          {dlg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Undo/Redo Controls & Shortcuts Help */}
            <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-90 rounded-lg px-3 py-2 border border-gray-700 z-10 select-none"
              onDragStart={(e) => e.preventDefault()}>
              {/* Undo/Redo Buttons */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    canUndo
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  title="실행 취소 (Ctrl+Z)"
                >
                  ↶
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    canRedo
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  title="다시 실행 (Ctrl+Shift+Z)"
                >
                  ↷
                </button>
                <div className="border-l border-gray-600 h-6 mx-1"></div>
                <div className="text-xs font-semibold text-white">단축키</div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="text-xs text-gray-400 space-y-0.5">
                <div><kbd className="px-1 bg-gray-700 rounded text-white">Space</kbd> 재생/일시정지</div>
                <div><kbd className="px-1 bg-gray-700 rounded text-white">K</kbd> 키프레임 추가</div>
                <div><kbd className="px-1 bg-gray-700 rounded text-white">Delete</kbd> 삭제</div>
                <div><kbd className="px-1 bg-gray-700 rounded text-white">Ctrl+D</kbd> 복제</div>
                <div><kbd className="px-1 bg-gray-700 rounded text-white">Esc</kbd> 선택 해제</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">👈</div>
            <p className="text-xl">장면을 선택하세요</p>
          </div>
        )}
      </main>

        {/* Inspector Panel (Right) */}
        {selectedScene && (
          <InspectorPanel
            selectedObject={selectedObjectId ? objects.find(obj => obj.id === selectedObjectId) : undefined}
            selectedDialogue={selectedDialogueId ? dialogues.find(dlg => dlg.id === selectedDialogueId) : undefined}
            sceneId={selectedScene.id}
            assets={assets}
            onUpdate={() => handleSelectScene(selectedScene)}
            onDelete={(id, type) => {
              if (type === 'object') {
                handleDeleteObject(id);
              } else {
                handleDeleteDialogue(id);
              }
            }}
          />
        )}
      </div>
      {/* End of Top Section */}

      {/* Timeline Panel (Bottom) */}
      {selectedScene && (
        <TimelinePanel
          objects={objects}
          dialogues={dialogues}
          currentTime={currentTime}
          maxTime={maxTime}
          isPlaying={isPlaying}
          selectedObjectId={selectedObjectId}
          selectedDialogueId={selectedDialogueId}
          onTimeChange={setCurrentTime}
          onPlayPause={handlePlayPause}
          onAddKeyframe={handleAddKeyframe}
          onUpdateKeyframe={handleUpdateKeyframe}
          onDeleteKeyframe={handleDeleteKeyframe}
          onSelectObject={(id) => {
            setSelectedObjectId(id);
            setSelectedDialogueId(undefined); // Deselect dialogue when object selected
          }}
          onSelectDialogue={(id) => {
            setSelectedDialogueId(id);
            setSelectedObjectId(undefined); // Deselect object when dialogue selected
          }}
          onMaxTimeChange={setMaxTime}
          onUpdateDialogue={handleUpdateDialogue}
          onReorderObjects={handleReorderObjects}
          onReorderDialogues={handleReorderDialogues}
          onDeleteObject={handleDeleteObject}
          onDeleteDialogue={handleDeleteDialogue}
        />
      )}

      {/* Floating Action Buttons */}
      {selectedScene && (
        <div className="fixed bottom-24 right-8 flex flex-col gap-2 z-30">
          <button
            onClick={() => setShowObjectDialog(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg text-sm font-medium"
            title="오브젝트 추가"
          >
            + 오브젝트
          </button>
          <button
            onClick={() => setShowDialogueDialog(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full shadow-lg text-sm font-medium"
            title="대화 추가"
          >
            + 대화
          </button>
        </div>
      )}

      {/* REMOVE OLD RIGHT SIDEBAR - REPLACED ABOVE */}
      {false && selectedScene && (
          <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Objects Section */}
          <div className="border-b border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">오브젝트</h3>
                <button
                  onClick={() => setShowObjectDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                  + 추가
                </button>
              </div>
              <p className="text-xs text-gray-400">{selectedScene?.title}</p>
            </div>

            <div className="max-h-64 overflow-auto p-4">
            {objects.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p className="text-4xl mb-2">📦</p>
                <p className="text-sm">오브젝트가 없습니다</p>
                <p className="text-xs">오브젝트를 추가하세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {objects.map((obj) => {
                  const isSelected = selectedObjectId === obj.id;
                  return (
                    <div key={obj.id} className="space-y-2">
                      <div
                        onClick={() => setSelectedObjectId(isSelected ? undefined : obj.id)}
                        className={`rounded-lg p-3 border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-700 border-blue-500'
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-medium block">{obj.name}</span>
                            <span className="text-xs text-gray-400">{obj.type}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteObject(obj.id);
                            }}
                            className="text-gray-400 hover:text-red-500 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                          <div>
                            <span className="text-gray-500">Position:</span>{' '}
                            ({obj.position_x.toFixed(1)}, {obj.position_y.toFixed(1)}, {obj.position_z.toFixed(1)})
                          </div>
                          <div>
                            <span className="text-gray-500">Rotation:</span>{' '}
                            ({obj.rotation_x.toFixed(0)}°, {obj.rotation_y.toFixed(0)}°, {obj.rotation_z.toFixed(0)}°)
                          </div>
                          <div>
                            <span className="text-gray-500">Scale:</span>{' '}
                            ({obj.scale_x.toFixed(2)}, {obj.scale_y.toFixed(2)}, {obj.scale_z.toFixed(2)})
                          </div>
                        </div>
                      </div>

                      {/* Transform Editor */}
                      {isSelected && (
                        <div className="bg-gray-750 rounded-lg p-3 border border-blue-500">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-blue-300">Transform 편집</h4>
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={obj.show_nametag === 1}
                                onChange={async (e) => {
                                  if (!selectedScene) return;
                                  await scenesAPI.updateObject(selectedScene.id, obj.id, {
                                    showNametag: e.target.checked
                                  });
                                  await handleSelectScene(selectedScene);
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-gray-300">네임태그 표시</span>
                            </label>
                          </div>

                          {/* Position */}
                          <div className="mb-3">
                            <label className="text-xs text-gray-400 block mb-1">Position</label>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="number"
                                value={obj.position_x}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  handleObjectTransform(obj.id, {
                                    position: [newVal, obj.position_y, obj.position_z],
                                    rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
                                    scale: [obj.scale_x, obj.scale_y, obj.scale_z]
                                  });
                                }}
                                step="0.1"
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                                placeholder="X"
                              />
                              <input
                                type="number"
                                value={obj.position_y}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  handleObjectTransform(obj.id, {
                                    position: [obj.position_x, newVal, obj.position_z],
                                    rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
                                    scale: [obj.scale_x, obj.scale_y, obj.scale_z]
                                  });
                                }}
                                step="0.1"
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                                placeholder="Y"
                              />
                              <input
                                type="number"
                                value={obj.position_z}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  handleObjectTransform(obj.id, {
                                    position: [obj.position_x, obj.position_y, newVal],
                                    rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
                                    scale: [obj.scale_x, obj.scale_y, obj.scale_z]
                                  });
                                }}
                                step="0.1"
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                                placeholder="Z"
                              />
                            </div>
                          </div>

                          {/* Rotation */}
                          <div className="mb-3">
                            <label className="text-xs text-gray-400 block mb-1">Rotation (degrees)</label>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="number"
                                value={obj.rotation_x}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  handleObjectTransform(obj.id, {
                                    position: [obj.position_x, obj.position_y, obj.position_z],
                                    rotation: [newVal, obj.rotation_y, obj.rotation_z],
                                    scale: [obj.scale_x, obj.scale_y, obj.scale_z]
                                  });
                                }}
                                step="1"
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                                placeholder="X"
                              />
                              <input
                                type="number"
                                value={obj.rotation_y}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  handleObjectTransform(obj.id, {
                                    position: [obj.position_x, obj.position_y, obj.position_z],
                                    rotation: [obj.rotation_x, newVal, obj.rotation_z],
                                    scale: [obj.scale_x, obj.scale_y, obj.scale_z]
                                  });
                                }}
                                step="1"
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                                placeholder="Y"
                              />
                              <input
                                type="number"
                                value={obj.rotation_z}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 0;
                                  handleObjectTransform(obj.id, {
                                    position: [obj.position_x, obj.position_y, obj.position_z],
                                    rotation: [obj.rotation_x, obj.rotation_y, newVal],
                                    scale: [obj.scale_x, obj.scale_y, obj.scale_z]
                                  });
                                }}
                                step="1"
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                                placeholder="Z"
                              />
                            </div>
                          </div>

                          {/* Scale */}
                          <div className="mb-3">
                            <label className="text-xs text-gray-400 block mb-1">Scale</label>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="number"
                                value={obj.scale_x}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 1;
                                  handleObjectTransform(obj.id, {
                                    position: [obj.position_x, obj.position_y, obj.position_z],
                                    rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
                                    scale: [newVal, obj.scale_y, obj.scale_z]
                                  });
                                }}
                                step="0.1"
                                min="0.1"
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                                placeholder="X"
                              />
                              <input
                                type="number"
                                value={obj.scale_y}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 1;
                                  handleObjectTransform(obj.id, {
                                    position: [obj.position_x, obj.position_y, obj.position_z],
                                    rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
                                    scale: [obj.scale_x, newVal, obj.scale_z]
                                  });
                                }}
                                step="0.1"
                                min="0.1"
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                                placeholder="Y"
                              />
                              <input
                                type="number"
                                value={obj.scale_z}
                                onChange={(e) => {
                                  const newVal = parseFloat(e.target.value) || 1;
                                  handleObjectTransform(obj.id, {
                                    position: [obj.position_x, obj.position_y, obj.position_z],
                                    rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z],
                                    scale: [obj.scale_x, obj.scale_y, newVal]
                                  });
                                }}
                                step="0.1"
                                min="0.1"
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                                placeholder="Z"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>

          {/* Dialogues Section */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">대화 / 자막</h3>
                <button
                  onClick={() => setShowDialogueDialog(true)}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                >
                  + 추가
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {dialogues.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-4xl mb-2">💬</p>
                  <p className="text-sm">대화가 없습니다</p>
                  <p className="text-xs">대화를 추가하세요</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dialogues.map((dlg) => {
                    const speaker = objects.find(obj => obj.id === dlg.object_id);
                    return (
                      <div
                        key={dlg.id}
                        className="bg-gray-700 rounded-lg p-3 border border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {speaker && (
                              <span className="text-xs text-blue-400 block mb-1">
                                👤 {speaker.name}
                              </span>
                            )}
                            <p className="text-sm">{dlg.text}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteDialogue(dlg.id)}
                            className="text-gray-400 hover:text-red-500 text-sm ml-2"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>⏱️ {dlg.start_time.toFixed(1)}s</span>
                          <span>⏳ {dlg.duration.toFixed(1)}s</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Create Scene Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">새 장면 추가</h2>
            <input
              type="text"
              value={newSceneTitle}
              onChange={(e) => setNewSceneTitle(e.target.value)}
              placeholder="장면 제목"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateScene();
                if (e.key === 'Escape') setShowCreateDialog(false);
              }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateScene}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                disabled={!newSceneTitle.trim()}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Object Dialog */}
      {showObjectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">새 오브젝트 추가</h2>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={newObjectName}
                onChange={(e) => setNewObjectName(e.target.value)}
                placeholder="오브젝트 이름"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateObject();
                  if (e.key === 'Escape') setShowObjectDialog(false);
                }}
              />
              <select
                value={newObjectType}
                onChange={(e) => setNewObjectType(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="person">👤 사람</option>
                <option value="train">🚆 기차</option>
                <option value="facility">🏢 시설물</option>
                <option value="sign">🚏 표지판</option>
                <option value="other">📦 기타</option>
              </select>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">3D 모델 (선택사항)</label>
                <select
                  value={newObjectModelId}
                  onChange={(e) => setNewObjectModelId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="">기본 (박스)</option>
                  <optgroup label="기본 도형">
                    {assets.filter(a => a.category === 'primitive').map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </optgroup>
                  {assets.some(a => a.category === 'model') && (
                    <optgroup label="업로드된 모델">
                      {assets.filter(a => a.category === 'model').map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowObjectDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleCreateObject()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                disabled={!newObjectName.trim()}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Dialogue Dialog */}
      {showDialogueDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">새 대화 추가</h2>
            <div className="space-y-3 mb-4">
              <textarea
                value={newDialogueText}
                onChange={(e) => setNewDialogueText(e.target.value)}
                placeholder="대화 내용"
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-green-500 resize-none"
                autoFocus
              />
              <div>
                <label className="text-xs text-gray-400 block mb-1">발화자 이름 (직접 입력)</label>
                <input
                  type="text"
                  value={newDialogueSpeakerName}
                  onChange={(e) => setNewDialogueSpeakerName(e.target.value)}
                  placeholder="예: 승무원, 승객 등"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                />
              </div>
              <select
                value={newDialogueObjectId}
                onChange={(e) => {
                  setNewDialogueObjectId(e.target.value);
                  // 오브젝트 선택 시 자동으로 이름 채우기
                  if (e.target.value) {
                    const obj = objects.find(o => o.id === e.target.value);
                    if (obj && !newDialogueSpeakerName) {
                      setNewDialogueSpeakerName(obj.name);
                    }
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-green-500"
              >
                <option value="">오브젝트 연결 안함</option>
                {objects.map(obj => (
                  <option key={obj.id} value={obj.id}>
                    {obj.name} ({obj.type})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">시작 시간 (초)</label>
                  <input
                    type="number"
                    value={newDialogueStartTime}
                    onChange={(e) => setNewDialogueStartTime(e.target.value)}
                    step="0.1"
                    min="0"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">지속 시간 (초)</label>
                  <input
                    type="number"
                    value={newDialogueDuration}
                    onChange={(e) => setNewDialogueDuration(e.target.value)}
                    step="0.1"
                    min="0.1"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDialogueDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateDialogue}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                disabled={!newDialogueText.trim()}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
