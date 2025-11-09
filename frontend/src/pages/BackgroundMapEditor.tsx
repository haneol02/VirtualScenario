import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundMap, BackgroundObject, backgroundMapsAPI, Asset, assetsAPI } from '../lib/api';
import ThreeViewer, { ThreeViewerHandle } from '../components/ThreeViewer';
import { useUndoRedo } from '../hooks/useUndoRedo';
import AssetLibraryPanel from '../components/AssetLibraryPanel';
import InspectorPanel from '../components/InspectorPanel';

export default function BackgroundMapEditor() {
  const navigate = useNavigate();
  const threeViewerRef = useRef<ThreeViewerHandle>(null);

  const [backgroundMaps, setBackgroundMaps] = useState<BackgroundMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<BackgroundMap | null>(null);
  const [objects, setObjects] = useState<BackgroundObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | undefined>();
  const [assets, setAssets] = useState<Asset[]>([]);

  const [showCreateMapDialog, setShowCreateMapDialog] = useState(false);
  const [leftSidebarTab, setLeftSidebarTab] = useState<'objects' | 'assets'>('objects');

  const [newMapName, setNewMapName] = useState('');
  const [newMapDescription, setNewMapDescription] = useState('');
  const [newMapIcon, setNewMapIcon] = useState('🗺️');

  // Undo/Redo system
  const { pushAction, undo, redo, canUndo, canRedo } = useUndoRedo();

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Load background maps and assets
  useEffect(() => {
    loadBackgroundMaps();
    loadAssets();
  }, []);

  // Load objects when map is selected
  useEffect(() => {
    if (selectedMap) {
      loadObjects();
    }
  }, [selectedMap]);

  const loadBackgroundMaps = async () => {
    try {
      const maps = await backgroundMapsAPI.getAll();
      setBackgroundMaps(maps);
    } catch (error) {
      console.error('Failed to load background maps:', error);
    }
  };

  const loadObjects = async () => {
    if (!selectedMap) return;
    try {
      const objs = await backgroundMapsAPI.getObjects(selectedMap.id);
      setObjects(objs);
    } catch (error) {
      console.error('Failed to load objects:', error);
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

  const handleCreateMap = async () => {
    if (!newMapName.trim()) return;

    try {
      await backgroundMapsAPI.create({
        name: newMapName,
        description: newMapDescription,
        icon: newMapIcon,
      });

      setNewMapName('');
      setNewMapDescription('');
      setNewMapIcon('🗺️');
      setShowCreateMapDialog(false);

      await loadBackgroundMaps();
    } catch (error) {
      console.error('Failed to create background map:', error);
    }
  };

  const handleSelectMap = (map: BackgroundMap) => {
    setSelectedMap(map);
    setSelectedObjectId(undefined);
  };

  const handleDeleteMap = async (id: string) => {
    if (!confirm('이 배경 맵을 삭제하시겠습니까?')) return;

    try {
      await backgroundMapsAPI.delete(id);
      if (selectedMap?.id === id) {
        setSelectedMap(null);
        setObjects([]);
      }
      await loadBackgroundMaps();
    } catch (error) {
      console.error('Failed to delete background map:', error);
    }
  };

  const handleAddObject = async (data: {
    type: string;
    name: string;
    modelId?: string;
    color?: string;
  }) => {
    if (!selectedMap) return;

    try {
      const createdObject = await backgroundMapsAPI.createObject(selectedMap.id, {
        ...data,
        color: data.color || '#6b7280',
      });
      await loadObjects();
      setShowAddObjectDialog(false);

      // Record undo action
      pushAction({
        type: 'create_object',
        undo: async () => {
          await backgroundMapsAPI.deleteObject(createdObject.id);
          await loadObjects();
        },
        redo: async () => {
          await loadObjects();
        },
        data: { objectId: createdObject.id }
      });
    } catch (error) {
      console.error('Failed to add object:', error);
    }
  };

  const handleDeleteObject = async (id: string) => {
    if (!confirm('이 오브젝트를 삭제하시겠습니까?')) return;

    // Save object data for undo
    const objectToDelete = objects.find(obj => obj.id === id);
    if (!objectToDelete || !selectedMap) return;

    try {
      await backgroundMapsAPI.deleteObject(id);
      await loadObjects();
      if (selectedObjectId === id) {
        setSelectedObjectId(undefined);
      }

      // Record undo action
      pushAction({
        type: 'delete_object',
        undo: async () => {
          await backgroundMapsAPI.createObject(selectedMap.id, {
            type: objectToDelete.type,
            name: objectToDelete.name + ' (복원됨)',
            modelId: objectToDelete.model_id,
            color: objectToDelete.color,
            positionX: objectToDelete.position_x,
            positionY: objectToDelete.position_y,
            positionZ: objectToDelete.position_z,
            rotationX: objectToDelete.rotation_x,
            rotationY: objectToDelete.rotation_y,
            rotationZ: objectToDelete.rotation_z,
            scaleX: objectToDelete.scale_x,
            scaleY: objectToDelete.scale_y,
            scaleZ: objectToDelete.scale_z,
          });
          await loadObjects();
        },
        redo: async () => {
          await loadObjects();
        },
        data: { objectId: id, objectData: objectToDelete }
      });
    } catch (error) {
      console.error('Failed to delete object:', error);
    }
  };

  const handleObjectTransform = async (objectId: string, transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }, recordUndo: boolean = true) => {
    // Save previous state for undo
    const previousObject = objects.find(obj => obj.id === objectId);
    if (!previousObject) return;

    const previousTransform = {
      position: [previousObject.position_x, previousObject.position_y, previousObject.position_z] as [number, number, number],
      rotation: [previousObject.rotation_x, previousObject.rotation_y, previousObject.rotation_z] as [number, number, number],
      scale: [previousObject.scale_x, previousObject.scale_y, previousObject.scale_z] as [number, number, number],
    };

    try {
      await backgroundMapsAPI.updateObject(objectId, { transform });
      await loadObjects();

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

  const selectedObject = objects.find(obj => obj.id === selectedObjectId);

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Left Sidebar - Background Maps List */}
      <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300 mb-2 text-sm"
          >
            ← 대시보드
          </button>
          <h2 className="text-xl font-bold">배경 맵 관리</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">배경 맵 목록</h3>
            <button
              onClick={() => setShowCreateMapDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              + 추가
            </button>
          </div>

          {backgroundMaps.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-4xl mb-2">🗺️</p>
              <p className="text-sm">배경 맵이 없습니다</p>
              <p className="text-xs">배경 맵을 추가하세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backgroundMaps.map((map) => (
                <div
                  key={map.id}
                  onClick={() => handleSelectMap(map)}
                  className={`rounded-lg p-3 cursor-pointer transition-colors border ${
                    selectedMap?.id === map.id
                      ? 'bg-blue-700 border-blue-500'
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{map.icon}</span>
                      <span className="font-medium">{map.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMap(map.id);
                      }}
                      className="text-gray-400 hover:text-red-500 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                  {map.description && (
                    <p className="text-xs text-gray-400 ml-8">{map.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Area - 3D Editor */}
      <main className="flex-1 flex flex-col items-center justify-center bg-gray-900 relative">
        {selectedMap ? (
          <>
            <div className="flex-1 w-full">
              <ThreeViewer
                objects={objects}
                selectedObjectId={selectedObjectId}
                onObjectSelect={(id) => setSelectedObjectId(id)}
                onObjectTransform={handleObjectTransform}
              />
            </div>

            {/* Undo/Redo Controls */}
            <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-90 rounded-lg px-3 py-2 flex items-center gap-2 border border-gray-700 z-10">
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
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">👈</div>
            <p className="text-xl">배경 맵을 선택하세요</p>
          </div>
        )}
      </main>

      {/* Right Sidebar - Objects Panel */}
      {selectedMap && (
        <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">오브젝트</h3>
              <button
                onClick={() => setShowAddObjectDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                + 추가
              </button>
            </div>
            <p className="text-xs text-gray-400">{selectedMap.name}</p>
          </div>

          <div className="flex-1 overflow-auto p-4">
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
                  <div
                    key={obj.id}
                    onClick={() => setSelectedObjectId(isSelected ? undefined : obj.id)}
                    className={`rounded-lg p-3 border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-700 border-blue-500'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: obj.color }}
                        />
                        <span className="font-medium">{obj.name}</span>
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
                    <div className="text-xs text-gray-400">
                      <div className="text-gray-500">{obj.type}</div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Properties Panel */}
          {selectedObject && (
            <div className="border-t border-gray-700 p-4">
              <h4 className="text-sm font-semibold mb-3">속성</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-gray-400 mb-1">이름</label>
                  <input
                    type="text"
                    value={selectedObject.name}
                    onChange={async (e) => {
                      await backgroundMapsAPI.updateObject(selectedObject.id, {
                        name: e.target.value
                      });
                      await loadObjects();
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">색상</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedObject.color}
                      onChange={async (e) => {
                        await backgroundMapsAPI.updateObject(selectedObject.id, {
                          color: e.target.value
                        });
                        await loadObjects();
                      }}
                      className="w-12 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedObject.color}
                      onChange={async (e) => {
                        await backgroundMapsAPI.updateObject(selectedObject.id, {
                          color: e.target.value
                        });
                        await loadObjects();
                      }}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedObject.show_nametag === 1}
                      onChange={async (e) => {
                        await backgroundMapsAPI.updateObject(selectedObject.id, {
                          showNametag: e.target.checked
                        });
                        await loadObjects();
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-300">네임태그 표시</span>
                  </label>
                </div>

                {/* Transform Controls */}
                <div className="pt-2 border-t border-gray-700 space-y-3">
                  <div>
                    <label className="block text-gray-400 mb-2 text-xs font-semibold">위치 (Position)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">X</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedObject.position_x.toFixed(2)}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value) || 0;
                            await backgroundMapsAPI.updateObject(selectedObject.id, {
                              transform: {
                                position: [val, selectedObject.position_y, selectedObject.position_z]
                              }
                            });
                            await loadObjects();
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Y</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedObject.position_y.toFixed(2)}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value) || 0;
                            await backgroundMapsAPI.updateObject(selectedObject.id, {
                              transform: {
                                position: [selectedObject.position_x, val, selectedObject.position_z]
                              }
                            });
                            await loadObjects();
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Z</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedObject.position_z.toFixed(2)}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value) || 0;
                            await backgroundMapsAPI.updateObject(selectedObject.id, {
                              transform: {
                                position: [selectedObject.position_x, selectedObject.position_y, val]
                              }
                            });
                            await loadObjects();
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2 text-xs font-semibold">회전 (Rotation °)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">X</label>
                        <input
                          type="number"
                          step="1"
                          value={selectedObject.rotation_x.toFixed(0)}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value) || 0;
                            await backgroundMapsAPI.updateObject(selectedObject.id, {
                              transform: {
                                rotation: [val, selectedObject.rotation_y, selectedObject.rotation_z]
                              }
                            });
                            await loadObjects();
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Y</label>
                        <input
                          type="number"
                          step="1"
                          value={selectedObject.rotation_y.toFixed(0)}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value) || 0;
                            await backgroundMapsAPI.updateObject(selectedObject.id, {
                              transform: {
                                rotation: [selectedObject.rotation_x, val, selectedObject.rotation_z]
                              }
                            });
                            await loadObjects();
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Z</label>
                        <input
                          type="number"
                          step="1"
                          value={selectedObject.rotation_z.toFixed(0)}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value) || 0;
                            await backgroundMapsAPI.updateObject(selectedObject.id, {
                              transform: {
                                rotation: [selectedObject.rotation_x, selectedObject.rotation_y, val]
                              }
                            });
                            await loadObjects();
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2 text-xs font-semibold">크기 (Scale)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">X</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedObject.scale_x.toFixed(2)}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value) || 1;
                            await backgroundMapsAPI.updateObject(selectedObject.id, {
                              transform: {
                                scale: [val, selectedObject.scale_y, selectedObject.scale_z]
                              }
                            });
                            await loadObjects();
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Y</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedObject.scale_y.toFixed(2)}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value) || 1;
                            await backgroundMapsAPI.updateObject(selectedObject.id, {
                              transform: {
                                scale: [selectedObject.scale_x, val, selectedObject.scale_z]
                              }
                            });
                            await loadObjects();
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Z</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedObject.scale_z.toFixed(2)}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value) || 1;
                            await backgroundMapsAPI.updateObject(selectedObject.id, {
                              transform: {
                                scale: [selectedObject.scale_x, selectedObject.scale_y, val]
                              }
                            });
                            await loadObjects();
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Create Map Dialog */}
      {showCreateMapDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">새 배경 맵 만들기</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">아이콘</label>
                <input
                  type="text"
                  value={newMapIcon}
                  onChange={(e) => setNewMapIcon(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="🗺️"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">이름 *</label>
                <input
                  type="text"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="예: 승강장"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">설명</label>
                <textarea
                  value={newMapDescription}
                  onChange={(e) => setNewMapDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 h-20 resize-none"
                  placeholder="배경 맵 설명"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateMapDialog(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
              >
                취소
              </button>
              <button
                onClick={handleCreateMap}
                disabled={!newMapName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Object Dialog */}
      {showAddObjectDialog && <AddObjectDialog onClose={() => setShowAddObjectDialog(false)} onAdd={handleAddObject} />}
    </div>
  );
}

// Add Object Dialog Component
function AddObjectDialog({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (data: { type: string; name: string; modelId?: string; color?: string }) => void;
}) {
  const [objectType, setObjectType] = useState('primitive');
  const [objectName, setObjectName] = useState('');
  const [primitiveType, setPrimitiveType] = useState('box');
  const [objectColor, setObjectColor] = useState('#6b7280');

  const primitives = [
    { id: 'primitive_box', name: '사각형', geometry: 'box' },
    { id: 'primitive_sphere', name: '구', geometry: 'sphere' },
    { id: 'primitive_cylinder', name: '원기둥', geometry: 'cylinder' },
    { id: 'primitive_cone', name: '원뿔', geometry: 'cone' },
    { id: 'primitive_plane', name: '평면', geometry: 'plane' },
    { id: 'primitive_torus', name: '도넛', geometry: 'torus' },
  ];

  const handleSubmit = () => {
    if (!objectName.trim()) return;

    onAdd({
      type: objectType,
      name: objectName,
      modelId: objectType === 'primitive' ? `primitive_${primitiveType}` : undefined,
      color: objectColor,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <h3 className="text-xl font-bold mb-4">오브젝트 추가</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">타입</label>
            <select
              value={objectType}
              onChange={(e) => setObjectType(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            >
              <option value="primitive">3D 프리미티브</option>
              <option value="facility">시설물</option>
              <option value="sign">표지판</option>
            </select>
          </div>

          {objectType === 'primitive' && (
            <div>
              <label className="block text-sm mb-1">도형</label>
              <select
                value={primitiveType}
                onChange={(e) => setPrimitiveType(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                {primitives.map(p => (
                  <option key={p.id} value={p.geometry}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">이름 *</label>
            <input
              type="text"
              value={objectName}
              onChange={(e) => setObjectName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              placeholder="예: 벤치"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">색상</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={objectColor}
                onChange={(e) => setObjectColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={objectColor}
                onChange={(e) => setObjectColor(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!objectName.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
