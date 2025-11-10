import { SceneObject, BackgroundObject, Dialogue, scenesAPI, backgroundMapsAPI, PathKeyframe, Asset } from '../lib/api';
import { useState, useEffect } from 'react';

interface InspectorPanelProps {
  selectedObject?: SceneObject | BackgroundObject;
  selectedDialogue?: Dialogue;
  sceneId: string;  // For SceneObject, this is scene_id; for BackgroundObject, this is background_map_id
  assets: Asset[];
  onUpdate: () => void;
  onDelete: (id: string, type: 'object' | 'dialogue') => void;
  objectType?: 'scene' | 'background';  // 'scene' for SceneObject, 'background' for BackgroundObject
  currentTime?: number;  // Current animation time for keyframe interpolation
  isPlaying?: boolean;  // Is timeline playing
  onTransformChange?: (objectId: string, transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }) => void;  // Callback for transform changes (with keyframe support)
}

export default function InspectorPanel({
  selectedObject,
  selectedDialogue,
  sceneId,
  assets,
  onUpdate,
  onDelete,
  objectType = 'scene',  // Default to 'scene' for backward compatibility
  currentTime = 0,
  isPlaying = false,
  onTransformChange,
}: InspectorPanelProps) {
  // Local state for input handling (입력 중에는 자유롭게 입력 가능, blur 시에만 적용)
  const [localObjectName, setLocalObjectName] = useState('');
  const [localSpeakerName, setLocalSpeakerName] = useState('');
  const [localDialogueText, setLocalDialogueText] = useState('');
  const [localDialogueStartTime, setLocalDialogueStartTime] = useState('');
  const [localDialogueDuration, setLocalDialogueDuration] = useState('');

  // Local state for transform inputs
  const [localPosition, setLocalPosition] = useState<[string, string, string]>(['0', '0', '0']);
  const [localRotation, setLocalRotation] = useState<[string, string, string]>(['0', '0', '0']);
  const [localScale, setLocalScale] = useState<[string, string, string]>(['1', '1', '1']);

  // Local state for color
  const [localColor, setLocalColor] = useState('#ffffff');

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'object' | 'dialogue';
    id: string;
  } | null>(null);

  // Adjust context menu position to stay within viewport
  const adjustContextMenuPosition = (x: number, y: number) => {
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 150; // Approximate menu height

    let adjustedX = x;
    let adjustedY = y;

    // Check right edge
    if (x + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - 10;
    }

    // Check bottom edge
    if (y + menuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - 10;
    }

    // Check left edge
    if (adjustedX < 10) {
      adjustedX = 10;
    }

    // Check top edge
    if (adjustedY < 10) {
      adjustedY = 10;
    }

    return { x: adjustedX, y: adjustedY };
  };

  // Sync local state when selection changes
  useEffect(() => {
    if (selectedObject) {
      setLocalObjectName(selectedObject.name);

      // Sync color
      setLocalColor(selectedObject.color || '#ffffff');

      // Sync transform values
      const interpolated = getInterpolatedTransform(selectedObject);
      setLocalPosition([
        interpolated.position[0].toFixed(3),
        interpolated.position[1].toFixed(3),
        interpolated.position[2].toFixed(3),
      ]);
      setLocalRotation([
        interpolated.rotation[0].toFixed(2),
        interpolated.rotation[1].toFixed(2),
        interpolated.rotation[2].toFixed(2),
      ]);
      setLocalScale([
        interpolated.scale[0].toFixed(3),
        interpolated.scale[1].toFixed(3),
        interpolated.scale[2].toFixed(3),
      ]);
    }
  }, [selectedObject, currentTime]);

  useEffect(() => {
    if (selectedDialogue) {
      setLocalSpeakerName(selectedDialogue.speaker_name || '');
      setLocalDialogueText(selectedDialogue.text);
      setLocalDialogueStartTime(selectedDialogue.start_time.toString());
      setLocalDialogueDuration(selectedDialogue.duration.toString());
    }
  }, [selectedDialogue]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Calculate interpolated transform based on keyframes and currentTime
  const getInterpolatedTransform = (obj: SceneObject | BackgroundObject) => {
    // Default transform from database
    const defaultTransform = {
      position: [obj.position_x, obj.position_y, obj.position_z] as [number, number, number],
      rotation: [obj.rotation_x, obj.rotation_y, obj.rotation_z] as [number, number, number],
      scale: [obj.scale_x, obj.scale_y, obj.scale_z] as [number, number, number],
    };

    // Check if object is SceneObject and has keyframes
    if (!('path_data' in obj) || !obj.path_data) {
      return defaultTransform;
    }

    try {
      const keyframes: PathKeyframe[] = JSON.parse(obj.path_data);
      if (keyframes.length === 0) {
        return defaultTransform;
      }

      // Find surrounding keyframes
      let prevKf: PathKeyframe | null = null;
      let nextKf: PathKeyframe | null = null;

      for (let i = 0; i < keyframes.length; i++) {
        if (keyframes[i].time <= currentTime) {
          prevKf = keyframes[i];
        }
        if (keyframes[i].time > currentTime && !nextKf) {
          nextKf = keyframes[i];
          break;
        }
      }

      // If before first keyframe, use first keyframe
      if (!prevKf && nextKf) {
        return {
          position: nextKf.position,
          rotation: nextKf.rotation,
          scale: nextKf.scale || [1, 1, 1],
        };
      }

      // If after last keyframe, use last keyframe
      if (prevKf && !nextKf) {
        return {
          position: prevKf.position,
          rotation: prevKf.rotation,
          scale: prevKf.scale || [1, 1, 1],
        };
      }

      // Interpolate between keyframes
      if (prevKf && nextKf) {
        const t = (currentTime - prevKf.time) / (nextKf.time - prevKf.time);
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        return {
          position: [
            lerp(prevKf.position[0], nextKf.position[0], t),
            lerp(prevKf.position[1], nextKf.position[1], t),
            lerp(prevKf.position[2], nextKf.position[2], t),
          ] as [number, number, number],
          rotation: [
            lerp(prevKf.rotation[0], nextKf.rotation[0], t),
            lerp(prevKf.rotation[1], nextKf.rotation[1], t),
            lerp(prevKf.rotation[2], nextKf.rotation[2], t),
          ] as [number, number, number],
          scale: [
            lerp((prevKf.scale || [1, 1, 1])[0], (nextKf.scale || [1, 1, 1])[0], t),
            lerp((prevKf.scale || [1, 1, 1])[1], (nextKf.scale || [1, 1, 1])[1], t),
            lerp((prevKf.scale || [1, 1, 1])[2], (nextKf.scale || [1, 1, 1])[2], t),
          ] as [number, number, number],
        };
      }

      return defaultTransform;
    } catch (e) {
      console.error('Failed to parse path_data:', e);
      return defaultTransform;
    }
  };

  if (!selectedObject && !selectedDialogue) {
    return (
      <aside className="w-full h-full bg-gray-800 border-l border-gray-700 flex flex-col items-center justify-center text-gray-500 select-none relative z-[60]">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-sm">오브젝트 또는 대화를 선택하세요</p>
      </aside>
    );
  }

  // Apply transform changes (called only on blur)
  const handleTransformBlur = async () => {
    if (isPlaying || !selectedObject) return;

    try {
      // Parse local state to numbers
      const position: [number, number, number] = [
        parseFloat(localPosition[0]) || 0,
        parseFloat(localPosition[1]) || 0,
        parseFloat(localPosition[2]) || 0,
      ];
      const rotation: [number, number, number] = [
        parseFloat(localRotation[0]) || 0,
        parseFloat(localRotation[1]) || 0,
        parseFloat(localRotation[2]) || 0,
      ];
      const scale: [number, number, number] = [
        Math.max(0.0001, parseFloat(localScale[0]) || 0.0001),
        Math.max(0.0001, parseFloat(localScale[1]) || 0.0001),
        Math.max(0.0001, parseFloat(localScale[2]) || 0.0001),
      ];

      const transform = { position, rotation, scale };

      // Use onTransformChange callback if available (for scene objects with keyframe support)
      if (onTransformChange && objectType === 'scene') {
        onTransformChange(selectedObject.id, transform);
      } else {
        // For background objects or when callback is not provided, update directly
        if (objectType === 'background') {
          await backgroundMapsAPI.updateObject(selectedObject.id, { transform });
        } else {
          await scenesAPI.updateObject(sceneId, selectedObject.id, { transform });
        }
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update transform:', error);
    }
  };

  const handleNameChange = async (newName: string) => {
    // Prevent editing during playback
    if (isPlaying) {
      console.warn('Cannot edit during playback');
      return;
    }

    if (!selectedObject || !newName.trim()) return;

    try {
      if (objectType === 'background') {
        await backgroundMapsAPI.updateObject(selectedObject.id, { name: newName });
      } else {
        await scenesAPI.updateObject(sceneId, selectedObject.id, { name: newName });
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to update name:', error);
    }
  };

  const handleNametagToggle = async (checked: boolean) => {
    // Prevent editing during playback
    if (isPlaying) {
      console.warn('Cannot edit during playback');
      return;
    }

    if (!selectedObject) return;

    try {
      if (objectType === 'background') {
        await backgroundMapsAPI.updateObject(selectedObject.id, { showNametag: checked });
      } else {
        await scenesAPI.updateObject(sceneId, selectedObject.id, { showNametag: checked });
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to update nametag:', error);
    }
  };

  const handleVisibleToggle = async (checked: boolean) => {
    // Prevent editing during playback
    if (isPlaying) {
      console.warn('Cannot edit during playback');
      return;
    }

    if (!selectedObject) return;

    try {
      if (objectType === 'background') {
        await backgroundMapsAPI.updateObject(selectedObject.id, { visible: checked });
      } else {
        await scenesAPI.updateObject(sceneId, selectedObject.id, { visible: checked });
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
  };

  const handleLockedToggle = async (checked: boolean) => {
    // Prevent editing during playback
    if (isPlaying) {
      console.warn('Cannot edit during playback');
      return;
    }

    if (!selectedObject) return;

    try {
      if (objectType === 'background') {
        await backgroundMapsAPI.updateObject(selectedObject.id, { locked: checked });
      } else {
        await scenesAPI.updateObject(sceneId, selectedObject.id, { locked: checked });
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to update locked:', error);
    }
  };

  const handleModelChange = async (modelId: string) => {
    // Prevent editing during playback
    if (isPlaying) {
      console.warn('Cannot edit during playback');
      return;
    }

    if (!selectedObject) return;

    try {
      if (objectType === 'background') {
        await backgroundMapsAPI.updateObject(selectedObject.id, {
          modelId: modelId || undefined
        });
      } else {
        await scenesAPI.updateObject(sceneId, selectedObject.id, {
          modelId: modelId || null
        });
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  };

  const handleColorChange = async (newColor: string) => {
    // Prevent editing during playback
    if (isPlaying) {
      console.warn('Cannot edit during playback');
      return;
    }

    if (!selectedObject) return;

    try {
      if (objectType === 'background') {
        await backgroundMapsAPI.updateObject(selectedObject.id, {
          color: newColor
        });
      } else {
        await scenesAPI.updateObject(sceneId, selectedObject.id, {
          color: newColor
        });
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to update color:', error);
    }
  };

  const handleDialogueUpdate = async (field: string, value: any) => {
    // Prevent editing during playback
    if (isPlaying) {
      console.warn('Cannot edit during playback');
      return;
    }

    if (!selectedDialogue) return;

    const data: any = {};
    data[field] = value;

    try {
      await scenesAPI.updateDialogue(sceneId, selectedDialogue.id, data);
      onUpdate();
    } catch (error) {
      console.error('Failed to update dialogue:', error);
    }
  };

  return (
    <aside className="w-full h-full bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto relative z-[60]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center gap-3 select-none">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-400 mb-1">인스펙터</h3>
          <div className="text-base font-semibold text-white truncate">
            {selectedObject ? selectedObject.name : selectedDialogue ? selectedDialogue.text : '-'}
          </div>
        </div>
        {selectedObject && (
          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded shrink-0">
            오브젝트
          </span>
        )}
        {selectedDialogue && (
          <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded shrink-0">
            대화/자막
          </span>
        )}
      </div>

      {/* Object Inspector */}
      {selectedObject && (
        <div
          className="p-4 space-y-4"
          onContextMenu={(e) => {
            e.preventDefault();
            const pos = adjustContextMenuPosition(e.clientX, e.clientY);
            setContextMenu({
              x: pos.x,
              y: pos.y,
              type: 'object',
              id: selectedObject.id,
            });
          }}
        >
          {/* Name & Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 select-none" onDragStart={(e) => e.preventDefault()}>이름</label>
            <input
              type="text"
              value={localObjectName}
              onChange={(e) => setLocalObjectName(e.target.value)}
              onBlur={(e) => handleNameChange(localObjectName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="오브젝트 이름"
            />
            <div className="text-xs text-gray-500 mt-1 select-none" onDragStart={(e) => e.preventDefault()}>타입: {selectedObject.type}</div>
          </div>

          {/* Model Selection */}
          <div className="bg-gray-750 rounded-lg p-3 border border-gray-600">
            <label className="block text-xs font-semibold text-blue-400 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>🎨 3D 모델 / 에셋</label>
            <select
              value={selectedObject.model_id || ''}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">기본 박스</option>
              <optgroup label="🔷 기본 프리미티브">
                {assets.filter(a => a.category === 'primitive').map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </optgroup>
              {assets.some(a => a.type === 'model') && (
                <optgroup label="📦 업로드된 3D 모델">
                  {assets.filter(a => a.type === 'model').map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} {asset.file_format ? `(.${asset.file_format})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {assets.some(a => a.type === 'image') && (
                <optgroup label="🖼️ 이미지">
                  {assets.filter(a => a.type === 'image').map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} {asset.file_format ? `(.${asset.file_format})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {assets.some(a => a.type === 'text') && (
                <optgroup label="✏️ 텍스트">
                  {assets.filter(a => a.type === 'text').map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {selectedObject.model_id && (() => {
              const currentAsset = assets.find(a => a.id === selectedObject.model_id);
              return currentAsset && (
                <div className="mt-2 p-2 bg-gray-800 rounded text-xs select-none" onDragStart={(e) => e.preventDefault()}>
                  <div className="text-gray-400">현재 모델:</div>
                  <div className="text-white font-semibold">{currentAsset.name}</div>
                  {currentAsset.type === 'model' && currentAsset.file_format && (
                    <div className="text-blue-400 mt-1">
                      포맷: {currentAsset.file_format.toUpperCase()}
                    </div>
                  )}
                  {currentAsset.type === 'primitive' && currentAsset.metadata && (() => {
                    try {
                      const meta = JSON.parse(currentAsset.metadata);
                      return (
                        <div className="text-green-400 mt-1">
                          타입: {meta.geometry || 'primitive'}
                        </div>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}
                </div>
              );
            })()}
            {!selectedObject.model_id && (
              <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-400 select-none" onDragStart={(e) => e.preventDefault()}>
                기본 박스 사용 중. 위에서 다른 모델을 선택하세요.
              </div>
            )}
          </div>

          {/* Color Picker */}
          <div className="bg-gray-750 rounded-lg p-3 border border-gray-600">
            <label className="block text-xs font-semibold text-purple-400 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>🎨 색상</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={localColor}
                onChange={(e) => setLocalColor(e.target.value)}
                onBlur={(e) => handleColorChange(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border border-gray-600"
                title="오브젝트 색상 선택"
              />
              <input
                type="text"
                value={localColor}
                onChange={(e) => setLocalColor(e.target.value)}
                onBlur={(e) => handleColorChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                placeholder="#ffffff"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          {/* Visible Toggle */}
          <div className="flex items-center gap-2 select-none" onDragStart={(e) => e.preventDefault()}>
            <input
              type="checkbox"
              id="visible"
              checked={'visible' in selectedObject ? selectedObject.visible !== 0 : true}
              onChange={(e) => handleVisibleToggle(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="visible" className="text-sm text-gray-300 cursor-pointer">
              오브젝트 보이기
            </label>
          </div>

          {/* Nametag Toggle */}
          <div className="flex items-center gap-2 select-none" onDragStart={(e) => e.preventDefault()}>
            <input
              type="checkbox"
              id="nametag"
              checked={selectedObject.show_nametag === 1}
              onChange={(e) => handleNametagToggle(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="nametag" className="text-sm text-gray-300 cursor-pointer">
              네임태그 표시
            </label>
          </div>

          {/* Locked Toggle */}
          <div className="flex items-center gap-2 select-none" onDragStart={(e) => e.preventDefault()}>
            <input
              type="checkbox"
              id="locked"
              checked={'locked' in selectedObject ? selectedObject.locked === 1 : false}
              onChange={(e) => handleLockedToggle(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="locked" className="text-sm text-gray-300 cursor-pointer">
              🔒 오브젝트 잠금
            </label>
          </div>

          <hr className="border-gray-700" />

          {/* Keyframe Info */}
          {'path_data' in selectedObject && selectedObject.path_data && (() => {
            try {
              const keyframes: PathKeyframe[] = JSON.parse(selectedObject.path_data);
              return keyframes.length > 0 && (
                <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-3 text-xs select-none" onDragStart={(e) => e.preventDefault()}>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 text-lg">◆</span>
                    <div className="flex-1">
                      <div className="text-blue-200 font-semibold mb-1">키프레임 애니메이션 활성</div>
                      <div className="text-blue-300 text-xs">
                        Transform 값은 현재 시간({currentTime.toFixed(1)}초)의 보간값입니다.
                        <br />
                        인스펙터에서 Transform을 수정하면 현재 시간에 키프레임이 추가/수정됩니다.
                      </div>
                    </div>
                  </div>
                </div>
              );
            } catch (e) {
              return null;
            }
          })()}

          {/* Position */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>Position</label>
            <div className="grid grid-cols-3 gap-2">
              {['x', 'y', 'z'].map((axis, idx) => (
                <div key={axis}>
                  <label className="text-xs text-gray-500 block mb-1 select-none" onDragStart={(e) => e.preventDefault()}>{axis.toUpperCase()}</label>
                  <input
                    type="number"
                    value={localPosition[idx]}
                    onChange={(e) => {
                      // 입력 중에는 자유롭게 입력 가능 (빈 문자열, 음수 등 모두 허용)
                      const newPosition = [...localPosition] as [string, string, string];
                      newPosition[idx] = e.target.value;
                      setLocalPosition(newPosition);
                    }}
                    onBlur={(e) => {
                      // 포커스 해제 시 빈 문자열이면 0으로 설정
                      if (e.target.value === '') {
                        const newPosition = [...localPosition] as [string, string, string];
                        newPosition[idx] = '0';
                        setLocalPosition(newPosition);
                      }
                      handleTransformBlur();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    step="0.1"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>Rotation (degrees)</label>
            <div className="grid grid-cols-3 gap-2">
              {['x', 'y', 'z'].map((axis, idx) => (
                <div key={axis}>
                  <label className="text-xs text-gray-500 block mb-1 select-none" onDragStart={(e) => e.preventDefault()}>{axis.toUpperCase()}</label>
                  <input
                    type="number"
                    value={localRotation[idx]}
                    onChange={(e) => {
                      // 입력 중에는 자유롭게 입력 가능
                      const newRotation = [...localRotation] as [string, string, string];
                      newRotation[idx] = e.target.value;
                      setLocalRotation(newRotation);
                    }}
                    onBlur={(e) => {
                      // 포커스 해제 시 빈 문자열이면 0으로 설정
                      if (e.target.value === '') {
                        const newRotation = [...localRotation] as [string, string, string];
                        newRotation[idx] = '0';
                        setLocalRotation(newRotation);
                      }
                      handleTransformBlur();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    step="1"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>Scale</label>
            <div className="grid grid-cols-3 gap-2">
              {['x', 'y', 'z'].map((axis, idx) => (
                <div key={axis}>
                  <label className="text-xs text-gray-500 block mb-1 select-none" onDragStart={(e) => e.preventDefault()}>{axis.toUpperCase()}</label>
                  <input
                    type="number"
                    value={localScale[idx]}
                    onChange={(e) => {
                      // 입력 중에는 자유롭게 입력 가능
                      const newScale = [...localScale] as [string, string, string];
                      newScale[idx] = e.target.value;
                      setLocalScale(newScale);
                    }}
                    onBlur={(e) => {
                      // 포커스 해제 시 빈 문자열이거나 0.0001 미만이면 0.0001로 설정
                      if (e.target.value === '' || parseFloat(e.target.value) < 0.0001) {
                        const newScale = [...localScale] as [string, string, string];
                        newScale[idx] = '0.0001';
                        setLocalScale(newScale);
                      }
                      handleTransformBlur();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    step="0.001"
                    min="0.001"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-700" />

          {/* Keyframes Section */}
          {'path_data' in selectedObject && selectedObject.path_data && (() => {
            const keyframes: PathKeyframe[] = JSON.parse(selectedObject.path_data);
            return keyframes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>키프레임 ({keyframes.length}개)</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {keyframes.map((kf, idx) => (
                    <div key={idx} className="bg-gray-750 border border-gray-600 rounded p-3 select-none"
                      onDragStart={(e) => e.preventDefault()}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-400">◆ 키프레임 {idx + 1}</span>
                        <button
                          onClick={async () => {
                            const updated = keyframes.filter((_, i) => i !== idx);
                            try {
                              await scenesAPI.updateObject(sceneId, selectedObject.id, {
                                pathData: updated.length > 0 ? updated : null
                              });
                              onUpdate();
                            } catch (error) {
                              console.error('Failed to delete keyframe:', error);
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-12">시간:</span>
                          <span className="text-white font-mono">{kf.time.toFixed(2)}s</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-12">Pos:</span>
                          <span className="text-white font-mono text-xs">
                            [{kf.position.map(v => v.toFixed(1)).join(', ')}]
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 w-12">Rot:</span>
                          <span className="text-white font-mono text-xs">
                            [{kf.rotation.map(v => v.toFixed(0)).join(', ')}]°
                          </span>
                        </div>
                        {kf.scale && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-12">Scale:</span>
                            <span className="text-white font-mono text-xs">
                              [{kf.scale.map(v => v.toFixed(2)).join(', ')}]
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center select-none" onDragStart={(e) => e.preventDefault()}>
                  💡 타임라인에서 'K' 키로 키프레임 추가
                </div>
              </div>
            );
          })()}

          <hr className="border-gray-700" />

          {/* Delete Button */}
          <button
            onClick={() => onDelete(selectedObject.id, 'object')}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium text-white select-none"
            onDragStart={(e) => e.preventDefault()}
          >
            🗑️ 오브젝트 삭제 (Delete)
          </button>
        </div>
      )}

      {/* Dialogue Inspector */}
      {selectedDialogue && (
        <div
          className="p-4 space-y-4"
          onContextMenu={(e) => {
            e.preventDefault();
            const pos = adjustContextMenuPosition(e.clientX, e.clientY);
            setContextMenu({
              x: pos.x,
              y: pos.y,
              type: 'dialogue',
              id: selectedDialogue.id,
            });
          }}
        >
          {/* Speaker Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>발화자 이름</label>
            <input
              type="text"
              value={localSpeakerName}
              onChange={(e) => setLocalSpeakerName(e.target.value)}
              onBlur={(e) => handleDialogueUpdate('speakerName', localSpeakerName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              placeholder="예: 승무원, 승객 등"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Text */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>대화 내용</label>
            <textarea
              value={localDialogueText}
              onChange={(e) => setLocalDialogueText(e.target.value)}
              onBlur={(e) => handleDialogueUpdate('text', localDialogueText)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.currentTarget.blur();
                }
              }}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 resize-none"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>시작 시간 (초)</label>
            <input
              type="number"
              value={localDialogueStartTime}
              onChange={(e) => setLocalDialogueStartTime(e.target.value)}
              onBlur={(e) => {
                const value = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0);
                setLocalDialogueStartTime(value.toString());
                handleDialogueUpdate('startTime', value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              step="0.1"
              min="0"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>지속 시간 (초)</label>
            <input
              type="number"
              value={localDialogueDuration}
              onChange={(e) => setLocalDialogueDuration(e.target.value)}
              onBlur={(e) => {
                const value = e.target.value === '' ? 0.1 : Math.max(0.1, parseFloat(e.target.value) || 0.1);
                setLocalDialogueDuration(value.toString());
                handleDialogueUpdate('duration', value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              step="0.1"
              min="0.1"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Layer Index */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 select-none" onDragStart={(e) => e.preventDefault()}>
              레이어 <span className="text-gray-500">(0 = 자동 배치)</span>
            </label>
            <input
              type="number"
              value={selectedDialogue.layer_index}
              onChange={(e) => {
                const value = Math.max(0, parseInt(e.target.value) || 0);
                handleDialogueUpdate('layerIndex', value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              step="1"
              min="0"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              0 = 자동 배치, 1 이상 = 수동 레이어 지정
            </p>
          </div>

          <hr className="border-gray-700" />

          {/* Delete Button */}
          <button
            onClick={() => onDelete(selectedDialogue.id, 'dialogue')}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium text-white select-none"
            onDragStart={(e) => e.preventDefault()}
          >
            🗑️ 대화 삭제 (Delete)
          </button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-1 z-[9999] select-none"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
        >
          {contextMenu.type === 'object' && (
            <>
              <button
                onClick={() => {
                  if (selectedObject) {
                    onDelete(selectedObject.id, 'object');
                  }
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2 select-none"
                onDragStart={(e) => e.preventDefault()}
              >
                <span>🗑️</span>
                <span>삭제 (Delete)</span>
              </button>
            </>
          )}
          {contextMenu.type === 'dialogue' && (
            <>
              <button
                onClick={() => {
                  if (selectedDialogue) {
                    onDelete(selectedDialogue.id, 'dialogue');
                  }
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2 select-none"
                onDragStart={(e) => e.preventDefault()}
              >
                <span>🗑️</span>
                <span>삭제 (Delete)</span>
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
