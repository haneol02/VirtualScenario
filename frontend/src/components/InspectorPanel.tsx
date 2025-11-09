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
}

export default function InspectorPanel({
  selectedObject,
  selectedDialogue,
  sceneId,
  assets,
  onUpdate,
  onDelete,
  objectType = 'scene',  // Default to 'scene' for backward compatibility
}: InspectorPanelProps) {
  // Local state for Korean input handling
  const [localObjectName, setLocalObjectName] = useState('');
  const [localSpeakerName, setLocalSpeakerName] = useState('');
  const [localDialogueText, setLocalDialogueText] = useState('');

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
    }
  }, [selectedObject?.id]);

  useEffect(() => {
    if (selectedDialogue) {
      setLocalSpeakerName(selectedDialogue.speaker_name || '');
      setLocalDialogueText(selectedDialogue.text);
    }
  }, [selectedDialogue?.id]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (!selectedObject && !selectedDialogue) {
    return (
      <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col items-center justify-center text-gray-500 select-none relative z-[60]">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-sm">오브젝트 또는 대화를 선택하세요</p>
      </aside>
    );
  }

  const handleTransformChange = async (field: string, value: number) => {
    if (!selectedObject) return;

    const transform = {
      position: [selectedObject.position_x, selectedObject.position_y, selectedObject.position_z] as [number, number, number],
      rotation: [selectedObject.rotation_x, selectedObject.rotation_y, selectedObject.rotation_z] as [number, number, number],
      scale: [selectedObject.scale_x, selectedObject.scale_y, selectedObject.scale_z] as [number, number, number],
    };

    switch (field) {
      case 'position_x': transform.position[0] = value; break;
      case 'position_y': transform.position[1] = value; break;
      case 'position_z': transform.position[2] = value; break;
      case 'rotation_x': transform.rotation[0] = value; break;
      case 'rotation_y': transform.rotation[1] = value; break;
      case 'rotation_z': transform.rotation[2] = value; break;
      case 'scale_x': transform.scale[0] = value; break;
      case 'scale_y': transform.scale[1] = value; break;
      case 'scale_z': transform.scale[2] = value; break;
    }

    try {
      await scenesAPI.updateObject(sceneId, selectedObject.id, { transform });
      onUpdate();
    } catch (error) {
      console.error('Failed to update transform:', error);
    }
  };

  const handleNameChange = async (newName: string) => {
    if (!selectedObject || !newName.trim()) return;

    try {
      await scenesAPI.updateObject(sceneId, selectedObject.id, { name: newName });
      onUpdate();
    } catch (error) {
      console.error('Failed to update name:', error);
    }
  };

  const handleNametagToggle = async (checked: boolean) => {
    if (!selectedObject) return;

    try {
      await scenesAPI.updateObject(sceneId, selectedObject.id, { showNametag: checked });
      onUpdate();
    } catch (error) {
      console.error('Failed to update nametag:', error);
    }
  };

  const handleModelChange = async (modelId: string) => {
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

  const handleDialogueUpdate = async (field: string, value: any) => {
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
    <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto relative z-[60]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between select-none">
        <h3 className="text-lg font-semibold text-white">인스펙터</h3>
        {selectedObject && (
          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
            오브젝트
          </span>
        )}
        {selectedDialogue && (
          <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
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
            <label className="block text-xs font-semibold text-gray-400 mb-1">이름</label>
            <input
              type="text"
              value={localObjectName}
              onChange={(e) => setLocalObjectName(e.target.value)}
              onBlur={(e) => handleNameChange(localObjectName)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="오브젝트 이름"
            />
            <div className="text-xs text-gray-500 mt-1">타입: {selectedObject.type}</div>
          </div>

          {/* Model Selection */}
          <div className="bg-gray-750 rounded-lg p-3 border border-gray-600">
            <label className="block text-xs font-semibold text-blue-400 mb-2">🎨 3D 모델 / 에셋</label>
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
                <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
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
              <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-400">
                기본 박스 사용 중. 위에서 다른 모델을 선택하세요.
              </div>
            )}
          </div>

          {/* Nametag Toggle */}
          <div className="flex items-center gap-2">
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

          <hr className="border-gray-700" />

          {/* Position */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {['x', 'y', 'z'].map((axis) => (
                <div key={axis}>
                  <label className="text-xs text-gray-500 block mb-1">{axis.toUpperCase()}</label>
                  <input
                    type="number"
                    value={selectedObject[`position_${axis}` as keyof typeof selectedObject] as number}
                    onChange={(e) => {
                      // 빈 문자열이면 업데이트하지 않음 (입력 중 허용)
                      if (e.target.value !== '') {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          handleTransformChange(`position_${axis}`, val);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // 포커스 해제 시 빈 문자열이면 0으로 설정
                      if (e.target.value === '') {
                        handleTransformChange(`position_${axis}`, 0);
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
            <label className="block text-xs font-semibold text-gray-400 mb-2">Rotation (degrees)</label>
            <div className="grid grid-cols-3 gap-2">
              {['x', 'y', 'z'].map((axis) => (
                <div key={axis}>
                  <label className="text-xs text-gray-500 block mb-1">{axis.toUpperCase()}</label>
                  <input
                    type="number"
                    value={selectedObject[`rotation_${axis}` as keyof typeof selectedObject] as number}
                    onChange={(e) => {
                      // 빈 문자열이면 업데이트하지 않음 (입력 중 허용)
                      if (e.target.value !== '') {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          handleTransformChange(`rotation_${axis}`, val);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // 포커스 해제 시 빈 문자열이면 0으로 설정
                      if (e.target.value === '') {
                        handleTransformChange(`rotation_${axis}`, 0);
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
            <label className="block text-xs font-semibold text-gray-400 mb-2">Scale</label>
            <div className="grid grid-cols-3 gap-2">
              {['x', 'y', 'z'].map((axis) => (
                <div key={axis}>
                  <label className="text-xs text-gray-500 block mb-1">{axis.toUpperCase()}</label>
                  <input
                    type="number"
                    value={selectedObject[`scale_${axis}` as keyof typeof selectedObject] as number}
                    onChange={(e) => {
                      // 빈 문자열이면 업데이트하지 않음 (입력 중 허용)
                      if (e.target.value !== '') {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          handleTransformChange(`scale_${axis}`, val);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // 포커스 해제 시 빈 문자열이거나 0.1 미만이면 0.1로 설정
                      if (e.target.value === '' || parseFloat(e.target.value) < 0.1) {
                        handleTransformChange(`scale_${axis}`, 0.1);
                      }
                    }}
                    step="0.1"
                    min="0.1"
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
                <h4 className="text-sm font-semibold text-gray-300 mb-2 select-none">키프레임 ({keyframes.length}개)</h4>
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
                <div className="mt-2 text-xs text-gray-500 text-center select-none">
                  💡 타임라인에서 'K' 키로 키프레임 추가
                </div>
              </div>
            );
          })()}

          <hr className="border-gray-700" />

          {/* Delete Button */}
          <button
            onClick={() => onDelete(selectedObject.id, 'object')}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium text-white"
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
            <label className="block text-xs font-semibold text-gray-400 mb-2">발화자 이름</label>
            <input
              type="text"
              value={localSpeakerName}
              onChange={(e) => setLocalSpeakerName(e.target.value)}
              onBlur={(e) => handleDialogueUpdate('speakerName', localSpeakerName)}
              placeholder="예: 승무원, 승객 등"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Text */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">대화 내용</label>
            <textarea
              value={localDialogueText}
              onChange={(e) => setLocalDialogueText(e.target.value)}
              onBlur={(e) => handleDialogueUpdate('text', localDialogueText)}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 resize-none"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">시작 시간 (초)</label>
            <input
              type="number"
              value={selectedDialogue.start_time}
              onChange={(e) => handleDialogueUpdate('startTime', parseFloat(e.target.value) || 0)}
              step="0.1"
              min="0"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">지속 시간 (초)</label>
            <input
              type="number"
              value={selectedDialogue.duration}
              onChange={(e) => handleDialogueUpdate('duration', parseFloat(e.target.value) || 0.1)}
              step="0.1"
              min="0.1"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <hr className="border-gray-700" />

          {/* Delete Button */}
          <button
            onClick={() => onDelete(selectedDialogue.id, 'dialogue')}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium text-white"
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
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
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
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
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
