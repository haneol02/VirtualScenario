import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundMap, BackgroundObject, backgroundMapsAPI, Asset, assetsAPI } from '../lib/api';
import ThreeViewer, { ThreeViewerHandle } from '../components/ThreeViewer';
import { useUndoRedo } from '../hooks/useUndoRedo';
import AssetLibraryPanel from '../components/AssetLibraryPanel';
import InspectorPanel from '../components/InspectorPanel';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function BackgroundMapEditor() {
  const navigate = useNavigate();
  const threeViewerRef = useRef<ThreeViewerHandle>(null);

  const [backgroundMaps, setBackgroundMaps] = useState<BackgroundMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<BackgroundMap | null>(null);
  const [objects, setObjects] = useState<BackgroundObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | undefined>();
  const [assets, setAssets] = useState<Asset[]>([]);

  const [showCreateMapDialog, setShowCreateMapDialog] = useState(false);
  const [showAddObjectDialog, setShowAddObjectDialog] = useState(false);
  const [leftSidebarTab, setLeftSidebarTab] = useState<'objects' | 'assets'>('objects');

  const [newMapName, setNewMapName] = useState('');
  const [newMapDescription, setNewMapDescription] = useState('');
  const [newMapIcon, setNewMapIcon] = useState('🗺️');
  const [newMapGridWidth, setNewMapGridWidth] = useState('20');
  const [newMapGridDepth, setNewMapGridDepth] = useState('20');

  // Local state for grid size inputs
  const [localGridWidth, setLocalGridWidth] = useState('20');
  const [localGridDepth, setLocalGridDepth] = useState('20');

  // Undo/Redo system
  const { pushAction, undo, redo, canUndo, canRedo } = useUndoRedo();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
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
      // Delete selected object
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedObjectId) {
          handleDeleteObject(selectedObjectId);
        }
      }
      // Deselect (Escape)
      else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedObjectId(undefined);
      }
      // Duplicate (Ctrl+D)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedObjectId && selectedMap) {
          const obj = objects.find(o => o.id === selectedObjectId);
          if (obj) {
            handleDuplicateObject(obj);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedObjectId, objects, selectedMap]);

  // Load background maps and assets
  useEffect(() => {
    loadBackgroundMaps();
    loadAssets();
  }, []);

  // Load objects when map is selected
  useEffect(() => {
    if (selectedMap) {
      loadObjects();
      // Update local grid size state
      if (selectedMap.grid_size) {
        const gridSize = JSON.parse(selectedMap.grid_size);
        setLocalGridWidth(gridSize.width.toString());
        setLocalGridDepth(gridSize.depth.toString());
      } else {
        setLocalGridWidth('20');
        setLocalGridDepth('20');
      }
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

    const width = parseInt(newMapGridWidth);
    const depth = parseInt(newMapGridDepth);

    // Validate grid size
    if (isNaN(width) || width < 5 || width > 200) {
      alert('가로 크기는 5~200 사이여야 합니다.');
      return;
    }
    if (isNaN(depth) || depth < 5 || depth > 200) {
      alert('세로 크기는 5~200 사이여야 합니다.');
      return;
    }

    try {
      await backgroundMapsAPI.create({
        name: newMapName,
        description: newMapDescription,
        icon: newMapIcon,
        gridSize: JSON.stringify({ width, depth }),
      });

      setNewMapName('');
      setNewMapDescription('');
      setNewMapIcon('🗺️');
      setNewMapGridWidth('20');
      setNewMapGridDepth('20');
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

  const applyGridSize = async (width: number, depth: number) => {
    if (!selectedMap) return;

    const newGridSize = JSON.stringify({ width, depth });

    try {
      await backgroundMapsAPI.update(selectedMap.id, {
        gridSize: newGridSize
      });
      await loadBackgroundMaps();
      // Re-select the map to update the state
      const updatedMap = await backgroundMapsAPI.get(selectedMap.id);
      setSelectedMap(updatedMap);
    } catch (error) {
      console.error('Failed to update grid size:', error);
    }
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

  const handleDuplicateObject = async (obj: BackgroundObject) => {
    if (!selectedMap) return;

    try {
      const createdObject = await backgroundMapsAPI.createObject(selectedMap.id, {
        type: obj.type,
        name: obj.name + ' (복사본)',
        modelId: obj.model_id,
        color: obj.color,
        positionX: obj.position_x + 0.5, // Offset slightly
        positionY: obj.position_y,
        positionZ: obj.position_z + 0.5,
        rotationX: obj.rotation_x,
        rotationY: obj.rotation_y,
        rotationZ: obj.rotation_z,
        scaleX: obj.scale_x,
        scaleY: obj.scale_y,
        scaleZ: obj.scale_z,
      });
      await loadObjects();
      setSelectedObjectId(createdObject.id);

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
      console.error('Failed to duplicate object:', error);
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
    <div className="h-screen bg-gray-900 text-white">
      <PanelGroup direction="horizontal">
        {/* Left Sidebar - Background Maps & Objects/Assets */}
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <aside className="h-full bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <button
                onClick={() => navigate('/')}
                className="text-blue-400 hover:text-blue-300 mb-2 text-sm"
              >
                ← 대시보드
              </button>
              <h2 className="text-xl font-bold">배경 맵 관리</h2>
            </div>

            {/* Background Map Selection */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">배경 맵</h3>
                <button
                  onClick={() => setShowCreateMapDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                >
                  + 추가
                </button>
              </div>
              <select
                value={selectedMap?.id || ''}
                onChange={(e) => {
                  const map = backgroundMaps.find(m => m.id === e.target.value);
                  if (map) handleSelectMap(map);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">배경 맵을 선택하세요</option>
                {backgroundMaps.map((map) => (
                  <option key={map.id} value={map.id}>
                    {map.icon} {map.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid Size Settings */}
            {selectedMap && (
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-sm font-semibold mb-3">맵 크기 (그리드)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">가로 (Width)</label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={localGridWidth}
                      onChange={(e) => {
                        // 입력 중에는 자유롭게 입력 가능
                        setLocalGridWidth(e.target.value);
                      }}
                      onBlur={async (e) => {
                        // 포커스 해제 시 범위 검증 및 적용
                        const val = e.target.value;
                        if (val === '' || isNaN(parseInt(val))) {
                          setLocalGridWidth('20');
                          return;
                        }

                        const newWidth = parseInt(val);
                        if (newWidth < 5) {
                          setLocalGridWidth('5');
                          await applyGridSize(5, parseInt(localGridDepth));
                        } else if (newWidth > 200) {
                          setLocalGridWidth('200');
                          await applyGridSize(200, parseInt(localGridDepth));
                        } else {
                          await applyGridSize(newWidth, parseInt(localGridDepth));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">세로 (Depth)</label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={localGridDepth}
                      onChange={(e) => {
                        // 입력 중에는 자유롭게 입력 가능
                        setLocalGridDepth(e.target.value);
                      }}
                      onBlur={async (e) => {
                        // 포커스 해제 시 범위 검증 및 적용
                        const val = e.target.value;
                        if (val === '' || isNaN(parseInt(val))) {
                          setLocalGridDepth('20');
                          return;
                        }

                        const newDepth = parseInt(val);
                        if (newDepth < 5) {
                          setLocalGridDepth('5');
                          await applyGridSize(parseInt(localGridWidth), 5);
                        } else if (newDepth > 200) {
                          setLocalGridDepth('200');
                          await applyGridSize(parseInt(localGridWidth), 200);
                        } else {
                          await applyGridSize(parseInt(localGridWidth), newDepth);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  그리드 크기 범위: 5 ~ 200
                </p>
              </div>
            )}

            {/* Tabs */}
            {selectedMap && (
              <>
                <div className="flex border-b border-gray-700">
                  <button
                    onClick={() => setLeftSidebarTab('objects')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      leftSidebarTab === 'objects'
                        ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-750'
                    }`}
                  >
                    📦 오브젝트
                  </button>
                  <button
                    onClick={() => setLeftSidebarTab('assets')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      leftSidebarTab === 'assets'
                        ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-750'
                    }`}
                  >
                    🎨 에셋
                  </button>
                </div>

                {/* Objects Tab */}
                {leftSidebarTab === 'objects' && (
                  <div className="flex-1 overflow-auto p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">오브젝트 목록</h3>
                      <button
                        onClick={() => setShowAddObjectDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                      >
                        + 추가
                      </button>
                    </div>

                    {objects.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <p className="text-4xl mb-2">📦</p>
                        <p className="text-sm">오브젝트가 없습니다</p>
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
                                  <span className="font-medium text-sm">{obj.name}</span>
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
                              <div className="text-xs text-gray-400">{obj.type}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Assets Tab */}
                {leftSidebarTab === 'assets' && (
                  <div className="h-full -m-4">
                    <AssetLibraryPanel
                      onAssetSelect={async (assetId) => {
                        if (!selectedMap) {
                          alert('배경 맵을 먼저 선택하세요');
                          return;
                        }
                        const asset = assets.find(a => a.id === assetId);
                        if (asset) {
                          try {
                            await backgroundMapsAPI.createObject(selectedMap.id, {
                              type: 'primitive',
                              name: asset.name,
                              modelId: assetId,
                              color: '#6b7280',
                            });
                            await loadObjects();
                          } catch (error) {
                            console.error('Failed to create object:', error);
                            alert('오브젝트 생성 실패');
                          }
                        }
                      }}
                      onAssetUpdated={() => {
                        loadAssets();
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </aside>
        </Panel>

        {/* Main Area - 3D Editor */}
        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors cursor-col-resize" />
        <Panel defaultSize={60} minSize={30}>
          <main className="h-full flex flex-col items-center justify-center bg-gray-900 relative">
            {selectedMap ? (
              <>
                <div className="flex-1 w-full">
                  <ThreeViewer
                    ref={threeViewerRef}
                    objects={objects}
                    selectedObjectId={selectedObjectId}
                    assets={assets}
                    gridSize={
                      selectedMap.grid_size
                        ? JSON.parse(selectedMap.grid_size)
                        : { width: 20, depth: 20 }
                    }
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
        </Panel>

        {/* Right Sidebar - Inspector Panel */}
        {selectedMap && (
          <>
            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors cursor-col-resize" />
            <Panel defaultSize={20} minSize={15} maxSize={40}>
              <InspectorPanel
                selectedObject={selectedObject}
                sceneId={selectedMap.id}
                assets={assets}
                onUpdate={loadObjects}
                onDelete={(id, type) => {
                  if (type === 'object') {
                    handleDeleteObject(id);
                  }
                }}
                objectType="background"
              />
            </Panel>
          </>
        )}
      </PanelGroup>

      {/* Create Map Dialog */}
      {showCreateMapDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
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

              <div>
                <label className="block text-sm mb-2">맵 크기 (그리드)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">가로 (Width)</label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={newMapGridWidth}
                      onChange={(e) => setNewMapGridWidth(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">세로 (Depth)</label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={newMapGridDepth}
                      onChange={(e) => setNewMapGridDepth(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                      placeholder="20"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  범위: 5 ~ 200
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateMapDialog(false);
                  setNewMapName('');
                  setNewMapDescription('');
                  setNewMapIcon('🗺️');
                  setNewMapGridWidth('20');
                  setNewMapGridDepth('20');
                }}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
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
