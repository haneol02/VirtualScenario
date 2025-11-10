import { useState, useRef, useEffect } from 'react';
import { SceneObject, PathKeyframe, Dialogue, scenesAPI } from '../lib/api';

interface TimelinePanelProps {
  objects: SceneObject[];
  dialogues: Dialogue[];
  currentTime: number;
  maxTime: number;
  isPlaying: boolean;
  selectedObjectId?: string;
  selectedDialogueId?: string;
  sceneId: string;  // Add sceneId for API calls
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  onAddKeyframe: (objectId: string, time: number) => void;
  onUpdateKeyframe: (objectId: string, keyframeIndex: number, newTime: number) => void;
  onDeleteKeyframe: (objectId: string, keyframeIndex: number) => void;
  onSelectObject: (objectId: string) => void;
  onSelectDialogue: (dialogueId: string) => void;
  onMaxTimeChange: (maxTime: number) => void;
  onUpdateDialogue: (dialogueId: string, updates: { startTime?: number; duration?: number }) => void;
  onReorderObjects: (orderedIds: string[]) => void;
  onReorderDialogues: (orderedIds: string[]) => void;
  onDeleteObject: (objectId: string) => void;
  onDeleteDialogue: (dialogueId: string) => void;
  onRefresh: () => void;  // Add refresh callback
}

export default function TimelinePanel({
  objects,
  dialogues,
  currentTime,
  maxTime,
  isPlaying,
  selectedObjectId,
  selectedDialogueId,
  sceneId,
  onTimeChange,
  onPlayPause,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
  onSelectObject,
  onSelectDialogue,
  onMaxTimeChange,
  onUpdateDialogue,
  onReorderObjects,
  onReorderDialogues,
  onDeleteObject,
  onDeleteDialogue,
  onRefresh,
}: TimelinePanelProps) {
  const [zoom, setZoom] = useState(1); // 1 = 1초당 50px
  const [localMaxTime, setLocalMaxTime] = useState(maxTime.toString()); // 로컬 상태로 maxTime 관리
  const [localCurrentTime, setLocalCurrentTime] = useState(currentTime.toFixed(2)); // 현재 시간 입력창 관리
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    objectId?: string;
    dialogueId?: string;
    keyframeIndex?: number;
    time: number;
  } | null>(null);

  // Keyframe drag state
  const [keyframeDrag, setKeyframeDrag] = useState<{
    objectId: string;
    keyframeIndex: number;
    initialTime: number;
    startX: number;
    previewTime?: number;
  } | null>(null);

  // Keyframe edit modal state
  const [keyframeEditModal, setKeyframeEditModal] = useState<{
    objectId: string;
    keyframeIndex: number;
    currentTime: number;
  } | null>(null);

  // Adjust context menu position to stay within viewport
  const adjustContextMenuPosition = (x: number, y: number) => {
    const menuWidth = 250; // Approximate menu width
    const menuHeight = 200; // Approximate menu height

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

  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Dialogue drag state
  const [dialogueDrag, setDialogueDrag] = useState<{
    dialogueId: string;
    mode: 'move' | 'resize-left' | 'resize-right';
    startX: number;
    initialStartTime: number;
    initialDuration: number;
    previewStartTime?: number;
    previewDuration?: number;
  } | null>(null);

  // Layer reordering state
  const [draggedItem, setDraggedItem] = useState<{ type: 'object' | 'dialogue'; id: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync local state with props
  useEffect(() => {
    setLocalCurrentTime(currentTime.toFixed(2));
  }, [currentTime]);

  useEffect(() => {
    setLocalMaxTime(maxTime.toString());
  }, [maxTime]);

  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = maxTime * pixelsPerSecond;

  // Auto-assign dialogues to layers based on time overlap
  const assignDialoguesToLayers = (dialogues: Dialogue[]): Dialogue[][] => {
    const layers: Dialogue[][] = [];

    // Sort dialogues by start time
    const sortedDialogues = [...dialogues].sort((a, b) => a.start_time - b.start_time);

    for (const dialogue of sortedDialogues) {
      // Find a layer where this dialogue doesn't overlap
      let placed = false;
      for (const layer of layers) {
        const overlaps = layer.some(d => {
          const dEnd = d.start_time + d.duration;
          const dialogueEnd = dialogue.start_time + dialogue.duration;
          // Check if they overlap (not if one ends exactly when other starts)
          return !(dialogue.start_time >= dEnd || dialogueEnd <= d.start_time);
        });

        if (!overlaps) {
          layer.push(dialogue);
          placed = true;
          break;
        }
      }

      // If no suitable layer found, create a new one
      if (!placed) {
        layers.push([dialogue]);
      }
    }

    return layers;
  };

  const dialogueLayers = assignDialoguesToLayers(dialogues);

  // Calculate total content height (header + objects + dialogue layers)
  const headerHeight = 32; // h-8 = 32px
  const trackHeight = 56; // h-14 = 56px
  const totalContentHeight = headerHeight + (objects.length * trackHeight) + (dialogueLayers.length * trackHeight);

  // Generate time markers (every second)
  const timeMarkers = [];
  for (let i = 0; i <= maxTime; i++) {
    timeMarkers.push(i);
  }

  // Calculate time from mouse position
  const getTimeFromMouseX = (clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const x = clientX - rect.left + scrollLeft - 192; // Subtract layer list width (w-48 = 192px) and add scroll offset
    return Math.max(0, Math.min((x / pixelsPerSecond), maxTime));
  };

  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent) => {
    const newTime = getTimeFromMouseX(e.clientX);
    onTimeChange(newTime);
  };

  // Handle timeline drag (scrubbing)
  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    // Only allow scrubbing on timeline grid, not on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('.timeline-interactive')) {
      return;
    }

    setIsDragging(true);
    const newTime = getTimeFromMouseX(e.clientX);
    onTimeChange(newTime);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newTime = getTimeFromMouseX(e.clientX);
    onTimeChange(newTime);
  };

  const handleTimelineMouseUp = () => {
    setIsDragging(false);
  };

  // Object property toggle handlers
  const handleToggleVisible = async (e: React.MouseEvent, objectId: string) => {
    e.stopPropagation(); // Prevent object selection
    if (isPlaying) return;

    const obj = objects.find(o => o.id === objectId);
    if (!obj) return;

    try {
      await scenesAPI.updateObject(sceneId, objectId, {
        visible: obj.visible === 0 ? true : false
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle visible:', error);
    }
  };

  const handleToggleNametag = async (e: React.MouseEvent, objectId: string) => {
    e.stopPropagation(); // Prevent object selection
    if (isPlaying) return;

    const obj = objects.find(o => o.id === objectId);
    if (!obj) return;

    try {
      await scenesAPI.updateObject(sceneId, objectId, {
        showNametag: obj.show_nametag === 0 ? true : false
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle nametag:', error);
    }
  };

  const handleToggleLocked = async (e: React.MouseEvent, objectId: string) => {
    e.stopPropagation(); // Prevent object selection
    if (isPlaying) return;

    const obj = objects.find(o => o.id === objectId);
    if (!obj) return;

    try {
      await scenesAPI.updateObject(sceneId, objectId, {
        locked: ('locked' in obj && obj.locked === 1) ? false : true
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle locked:', error);
    }
  };

  // Dialogue drag handlers
  const handleDialogueMouseDown = (
    e: React.MouseEvent,
    dialogueId: string,
    mode: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.stopPropagation();
    const dialogue = dialogues.find(d => d.id === dialogueId);
    if (!dialogue) return;

    setDialogueDrag({
      dialogueId,
      mode,
      startX: e.clientX,
      initialStartTime: dialogue.start_time,
      initialDuration: dialogue.duration,
    });
  };

  useEffect(() => {
    if (!dialogueDrag) return;

    const snapToHalfSecond = (time: number) => {
      return Math.round(time * 2) / 2;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dialogueDrag.startX;
      const deltaTime = deltaX / pixelsPerSecond;

      if (dialogueDrag.mode === 'move') {
        const rawStartTime = dialogueDrag.initialStartTime + deltaTime;
        const snappedStartTime = snapToHalfSecond(rawStartTime);
        const newStartTime = Math.max(0, Math.min(snappedStartTime, maxTime - dialogueDrag.initialDuration));

        // Update preview state only
        setDialogueDrag(prev => prev ? { ...prev, previewStartTime: newStartTime } : null);
      } else if (dialogueDrag.mode === 'resize-left') {
        const rawStartTime = dialogueDrag.initialStartTime + deltaTime;
        const snappedStartTime = snapToHalfSecond(rawStartTime);
        const newStartTime = Math.max(0, Math.min(snappedStartTime, dialogueDrag.initialStartTime + dialogueDrag.initialDuration - 0.5));
        const newDuration = Math.max(0.5, snapToHalfSecond(dialogueDrag.initialDuration - (newStartTime - dialogueDrag.initialStartTime)));

        // Update preview state only
        setDialogueDrag(prev => prev ? { ...prev, previewStartTime: newStartTime, previewDuration: newDuration } : null);
      } else if (dialogueDrag.mode === 'resize-right') {
        const rawDuration = dialogueDrag.initialDuration + deltaTime;
        const snappedDuration = snapToHalfSecond(rawDuration);
        const newDuration = Math.max(0.5, snappedDuration);

        // Update preview state only
        setDialogueDrag(prev => prev ? { ...prev, previewDuration: newDuration } : null);
      }
    };

    const handleMouseUp = () => {
      // Apply changes to backend when drag ends
      if (dialogueDrag.previewStartTime !== undefined || dialogueDrag.previewDuration !== undefined) {
        const updates: { startTime?: number; duration?: number } = {};

        if (dialogueDrag.previewStartTime !== undefined) {
          updates.startTime = dialogueDrag.previewStartTime;
        }
        if (dialogueDrag.previewDuration !== undefined) {
          updates.duration = dialogueDrag.previewDuration;
        }

        onUpdateDialogue(dialogueDrag.dialogueId, updates);
      }
      setDialogueDrag(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dialogueDrag, pixelsPerSecond, maxTime, onUpdateDialogue]);

  // Keyframe drag effect
  useEffect(() => {
    if (!keyframeDrag) return;

    const snapToTenth = (time: number) => {
      return Math.round(time * 10) / 10;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - keyframeDrag.startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const rawTime = keyframeDrag.initialTime + deltaTime;
      const snappedTime = snapToTenth(rawTime);
      const newTime = Math.max(0, Math.min(snappedTime, maxTime));

      // Update preview state only
      setKeyframeDrag(prev => prev ? { ...prev, previewTime: newTime } : null);
    };

    const handleMouseUp = () => {
      // Apply changes to backend when drag ends
      if (keyframeDrag.previewTime !== undefined && keyframeDrag.previewTime !== keyframeDrag.initialTime) {
        onUpdateKeyframe(keyframeDrag.objectId, keyframeDrag.keyframeIndex, keyframeDrag.previewTime);
      }
      setKeyframeDrag(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [keyframeDrag, pixelsPerSecond, maxTime, onUpdateKeyframe]);

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, objectId?: string, dialogueId?: string) => {
    e.preventDefault();
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 200;
    const time = Math.max(0, Math.min((x / pixelsPerSecond), maxTime));

    const pos = adjustContextMenuPosition(e.clientX, e.clientY);
    setContextMenu({
      x: pos.x,
      y: pos.y,
      objectId,
      dialogueId,
      time,
    });
  };

  const handleAddKeyframeFromMenu = () => {
    if (!contextMenu || !contextMenu.objectId) return;

    onAddKeyframe(contextMenu.objectId, contextMenu.time);
    setContextMenu(null);
  };

  // Layer reorder handlers
  const handleDragStart = (e: React.DragEvent, type: 'object' | 'dialogue', id: string, index: number) => {
    setDraggedItem({ type, id, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, type: 'object' | 'dialogue', index: number) => {
    e.preventDefault();
    if (draggedItem && draggedItem.type === type) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (!draggedItem || dragOverIndex === null) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    if (draggedItem.index === dragOverIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the array
    if (draggedItem.type === 'object') {
      const newOrder = [...objects];
      const [removed] = newOrder.splice(draggedItem.index, 1);
      newOrder.splice(dragOverIndex, 0, removed);
      const orderedIds = newOrder.map(obj => obj.id);
      onReorderObjects(orderedIds);
    } else {
      const newOrder = [...dialogues];
      const [removed] = newOrder.splice(draggedItem.index, 1);
      newOrder.splice(dragOverIndex, 0, removed);
      const orderedIds = newOrder.map(dlg => dlg.id);
      onReorderDialogues(orderedIds);
    }

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Sync local maxTime when prop changes
  useEffect(() => {
    setLocalMaxTime(maxTime.toString());
  }, [maxTime]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Global mouse events for dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  // Keyboard shortcuts (removed K key handling - it's handled in SceneEditor)

  return (
    <div className="h-full bg-gray-850 border-t border-gray-700 flex flex-col select-none">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
          >
            {isPlaying ? '⏸️ 일시정지' : '▶️ 재생'}
          </button>

          {/* Reset to Start Button */}
          <button
            onClick={() => onTimeChange(0)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium"
            title="처음으로 돌아가기"
          >
            ⏮️ 처음으로
          </button>

          {/* Add Keyframe Button */}
          {selectedObjectId && (
            <button
              onClick={() => onAddKeyframe(selectedObjectId, currentTime)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
              title="현재 시간에 키프레임 추가 (K)"
            >
              ◆ 키프레임 추가
            </button>
          )}

          {/* Time Display */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={localCurrentTime}
              onChange={(e) => {
                setLocalCurrentTime(e.target.value);
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val === '' || isNaN(parseFloat(val))) {
                  setLocalCurrentTime('0');
                  onTimeChange(0);
                } else {
                  const newTime = parseFloat(val);
                  if (newTime < 0) {
                    setLocalCurrentTime('0');
                    onTimeChange(0);
                  } else if (newTime > maxTime) {
                    setLocalCurrentTime(maxTime.toFixed(2));
                    onTimeChange(maxTime);
                  } else {
                    onTimeChange(newTime);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
              step="0.1"
              min="0"
              max={maxTime}
              title="현재 시간 (초)"
            />
            <span className="text-sm text-gray-400">s</span>
            <span className="text-gray-600">/</span>
            <input
              type="number"
              value={localMaxTime}
              onChange={(e) => {
                // 입력 중에는 자유롭게 입력 가능
                setLocalMaxTime(e.target.value);
              }}
              onBlur={(e) => {
                // 포커스 해제 시 범위 검증 및 조정
                const val = e.target.value;
                if (val === '' || isNaN(parseFloat(val))) {
                  setLocalMaxTime('30');
                  onMaxTimeChange(30); // 기본값
                } else {
                  const newMaxTime = parseFloat(val);
                  if (newMaxTime < 1) {
                    setLocalMaxTime('1');
                    onMaxTimeChange(1);
                  } else if (newMaxTime > 600) {
                    setLocalMaxTime('600');
                    onMaxTimeChange(600);
                  } else {
                    onMaxTimeChange(newMaxTime);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
              min="1"
              max="600"
              step="1"
              title="장면 길이 (최소 1초)"
            />
            <span className="text-sm text-gray-400">s</span>
            <span className="text-xs text-gray-500 ml-1">(최소 1초)</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">줌:</span>
          {[0.25, 0.5, 1, 2].map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-2 py-1 rounded text-xs ${
                zoom === z
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {z * 100}%
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Area */}
      <div ref={timelineRef} className="flex-1 flex overflow-auto">
        {/* Layer List (Left) */}
        <div className="w-48 bg-gray-800 border-r border-gray-700 flex-shrink-0 select-none overflow-hidden">
          {/* Header matching Time Ruler */}
          <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 sticky top-0 z-10">
            <span className="text-xs font-semibold text-gray-400">속성</span>
          </div>

          {/* Object Tracks Section */}
          <div className="border-b border-gray-700">
            {objects.map((obj, index) => {
              // Get type icon
              const getTypeIcon = (type: string) => {
                if (type === 'primitive_box' || type === 'box') return '📦';
                if (type === 'primitive_sphere' || type === 'sphere') return '⚪';
                if (type === 'primitive_cylinder' || type === 'cylinder') return '🥫';
                if (type === 'primitive_cone' || type === 'cone') return '🔺';
                if (type === 'primitive_plane' || type === 'plane') return '⬜';
                if (type === 'primitive_torus' || type === 'torus') return '🍩';
                if (type === 'model') return '🎭';
                if (type === 'image') return '🖼️';
                if (type === 'text') return '📝';
                return '📦';
              };

              return (
                <div
                  key={obj.id}
                  draggable={!isPlaying}
                  onDragStart={(e) => !isPlaying && handleDragStart(e, 'object', obj.id, index)}
                  onDragOver={(e) => !isPlaying && handleDragOver(e, 'object', index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => !isPlaying && onSelectObject(obj.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isPlaying) return;
                    const pos = adjustContextMenuPosition(e.clientX, e.clientY);
                    setContextMenu({
                      x: pos.x,
                      y: pos.y,
                      objectId: obj.id,
                      time: currentTime,
                    });
                  }}
                  className={`h-14 px-3 py-1.5 text-sm border-b border-gray-750 transition-colors ${
                    isPlaying ? 'cursor-not-allowed' : 'cursor-move'
                  } ${
                    selectedObjectId === obj.id
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  } ${draggedItem?.type === 'object' && draggedItem.index === index ? 'opacity-50' : ''} ${
                    dragOverIndex === index && draggedItem?.type === 'object' ? 'border-t-2 border-t-blue-400' : ''
                  }`}
                >
                  {/* Object Name */}
                  <div className="text-sm font-medium mb-1 leading-tight truncate">{obj.name}</div>

                  {/* Icons Row */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {/* Visible Toggle */}
                    <button
                      onClick={(e) => handleToggleVisible(e, obj.id)}
                      className="opacity-60 hover:opacity-100 transition-opacity text-sm"
                      title={obj.visible === 0 ? "숨김" : "표시"}
                    >
                      {obj.visible === 0 ? '👁️‍🗨️' : '👁️'}
                    </button>

                    {/* Nametag Toggle */}
                    <button
                      onClick={(e) => handleToggleNametag(e, obj.id)}
                      className="opacity-60 hover:opacity-100 transition-opacity text-sm"
                      title={obj.show_nametag === 0 ? "네임태그 숨김" : "네임태그 표시"}
                    >
                      {obj.show_nametag === 0 ? '🏷️' : '📛'}
                    </button>

                    {/* Locked Toggle */}
                    <button
                      onClick={(e) => handleToggleLocked(e, obj.id)}
                      className="opacity-60 hover:opacity-100 transition-opacity text-sm"
                      title={('locked' in obj && obj.locked === 1) ? "잠금" : "해제"}
                    >
                      {('locked' in obj && obj.locked === 1) ? '🔒' : '🔓'}
                    </button>

                    {/* Object Type Badge */}
                    <span className="px-1 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded flex-shrink-0 ml-auto">
                      오브젝트
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dialogue Layer Tracks Section */}
          <div>
            {dialogueLayers.map((layer, layerIndex) => (
              <div
                key={`layer-${layerIndex}`}
                className="h-14 px-3 py-1.5 text-sm border-b border-gray-750 transition-colors bg-gray-800 hover:bg-gray-750"
              >
                {/* Layer Info */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-300">
                    대화/자막 레이어 {layerIndex + 1}
                  </span>
                  <span className="px-1.5 py-0.5 bg-green-600 text-white text-[10px] font-semibold rounded">
                    {layer.length}개
                  </span>
                </div>
                {/* Layer time range */}
                <div className="text-xs text-gray-500">
                  {layer.length > 0 && (
                    <>
                      {Math.min(...layer.map(d => d.start_time)).toFixed(1)}s -
                      {Math.max(...layer.map(d => d.start_time + d.duration)).toFixed(1)}s
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Grid (Right) */}
        <div
          className="flex-1 relative"
          onClick={handleTimelineClick}
          onMouseDown={!isPlaying ? handleTimelineMouseDown : undefined}
          onMouseMove={!isPlaying ? handleTimelineMouseMove : undefined}
          onMouseUp={!isPlaying ? handleTimelineMouseUp : undefined}
          style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
        >
          {/* Time Ruler */}
          <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center relative sticky top-0 z-10 select-none">
            {timeMarkers.map((time) => (
              <div
                key={time}
                className="absolute top-0 h-full flex items-end text-xs text-gray-400"
                style={{ left: `${time * pixelsPerSecond}px` }}
              >
                <div className="relative">
                  <div className="w-px h-2 bg-gray-600"></div>
                  <span className="absolute top-1 left-1">{time}s</span>
                </div>
              </div>
            ))}
          </div>

          {/* Object Keyframe Tracks */}
          <div>
            {objects.map((obj) => {
              const keyframes: PathKeyframe[] = obj.path_data ? JSON.parse(obj.path_data) : [];
              return (
                <div
                  key={obj.id}
                  className="h-14 border-b border-gray-750 relative"
                  style={{ width: `${timelineWidth}px` }}
                  onContextMenu={(e) => handleContextMenu(e, obj.id)}
                >
                  {/* Keyframes */}
                  {keyframes.map((kf, idx) => {
                    // Use preview time if this keyframe is being dragged
                    const isDragging = keyframeDrag?.objectId === obj.id && keyframeDrag?.keyframeIndex === idx;
                    const displayTime = isDragging && keyframeDrag.previewTime !== undefined
                      ? keyframeDrag.previewTime
                      : kf.time;

                    return (
                      <div
                        key={idx}
                        className={`absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 timeline-interactive ${
                          isPlaying ? 'cursor-not-allowed pointer-events-none opacity-50' : 'cursor-move'
                        } ${isDragging ? 'z-[10000]' : 'z-10'}`}
                        style={{ left: `${displayTime * pixelsPerSecond}px` }}
                        onClick={(e) => {
                          if (isPlaying) return;
                          e.stopPropagation();
                          onSelectObject(obj.id);
                          onTimeChange(kf.time);
                        }}
                        onDoubleClick={(e) => {
                          if (isPlaying) return;
                          e.stopPropagation();
                          setKeyframeEditModal({
                            objectId: obj.id,
                            keyframeIndex: idx,
                            currentTime: kf.time,
                          });
                        }}
                        onMouseDown={(e) => {
                          if (isPlaying) return;
                          e.stopPropagation();
                          setKeyframeDrag({
                            objectId: obj.id,
                            keyframeIndex: idx,
                            initialTime: kf.time,
                            startX: e.clientX,
                          });
                        }}
                        onContextMenu={(e) => {
                          if (isPlaying) return;
                          e.preventDefault();
                          e.stopPropagation();
                          const pos = adjustContextMenuPosition(e.clientX, e.clientY);
                          setContextMenu({
                            x: pos.x,
                            y: pos.y,
                            objectId: obj.id,
                            keyframeIndex: idx,
                            time: kf.time,
                          });
                        }}
                        title={`키프레임 ${displayTime.toFixed(2)}s`}
                      >
                        <div className={`w-3 h-3 rotate-45 border-2 shadow-lg transition-all hover:scale-125 ${
                          selectedObjectId === obj.id ? 'bg-blue-400 border-blue-200' : 'bg-blue-500 border-white'
                        } ${isDragging ? 'scale-150 bg-yellow-400 border-yellow-200' : ''}`}></div>

                        {/* Time label when dragging */}
                        {isDragging && (
                          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs px-2 py-1 rounded whitespace-nowrap font-semibold pointer-events-none">
                            {displayTime.toFixed(1)}s
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Dialogue Layer Tracks */}
          <div>
            {dialogueLayers.map((layer, layerIndex) => (
              <div
                key={`layer-track-${layerIndex}`}
                className="h-14 border-b border-gray-750 relative"
                style={{ width: `${timelineWidth}px` }}
              >
                {/* Render all dialogues in this layer */}
                {layer.map((dlg) => {
                  // Use preview values if this dialogue is being dragged
                  const isDragging = dialogueDrag?.dialogueId === dlg.id;
                  const displayStartTime = isDragging && dialogueDrag.previewStartTime !== undefined
                    ? dialogueDrag.previewStartTime
                    : dlg.start_time;
                  const displayDuration = isDragging && dialogueDrag.previewDuration !== undefined
                    ? dialogueDrag.previewDuration
                    : dlg.duration;

                  const startPx = displayStartTime * pixelsPerSecond;
                  const widthPx = displayDuration * pixelsPerSecond;

                  return (
                    <div
                      key={dlg.id}
                      className={`absolute top-2 h-10 rounded timeline-interactive group ${
                        selectedDialogueId === dlg.id
                          ? 'bg-green-600 border-2 border-green-400'
                          : 'bg-green-700 border-2 border-green-800 hover:bg-green-600 hover:shadow-lg'
                      } ${isDragging ? 'opacity-80' : 'transition-all'} ${
                        isPlaying ? 'pointer-events-none opacity-50' : ''
                      }`}
                      style={{
                        left: `${startPx}px`,
                        width: `${widthPx}px`,
                      }}
                      onClick={(e) => {
                        if (isPlaying) return;
                        e.stopPropagation();
                        onSelectDialogue(dlg.id);
                      }}
                      onContextMenu={(e) => {
                        if (isPlaying) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const pos = adjustContextMenuPosition(e.clientX, e.clientY);
                        setContextMenu({
                          x: pos.x,
                          y: pos.y,
                          dialogueId: dlg.id,
                          time: dlg.start_time,
                        });
                      }}
                      onMouseDown={(e) => !isPlaying && e.stopPropagation()}
                      title={dlg.text}
                    >
                    {/* Left resize handle */}
                    <div
                      className={`absolute left-0 top-0 h-full w-2 hover:bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isPlaying ? 'cursor-not-allowed' : 'cursor-ew-resize'
                      }`}
                      onMouseDown={(e) => !isPlaying && handleDialogueMouseDown(e, dlg.id, 'resize-left')}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Center draggable area */}
                    <div
                      className={`px-2 py-1 text-xs text-white truncate select-none ${
                        isPlaying ? 'cursor-not-allowed' : 'cursor-move'
                      }`}
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                      onMouseDown={(e) => !isPlaying && handleDialogueMouseDown(e, dlg.id, 'move')}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      {dlg.text}
                    </div>

                    {/* Right resize handle */}
                    <div
                      className={`absolute right-0 top-0 h-full w-2 hover:bg-green-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isPlaying ? 'cursor-not-allowed' : 'cursor-ew-resize'
                      }`}
                      onMouseDown={(e) => !isPlaying && handleDialogueMouseDown(e, dlg.id, 'resize-right')}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div
            ref={playheadRef}
            className="absolute top-0 w-0.5 bg-red-500 pointer-events-none z-20"
            style={{
              left: `${currentTime * pixelsPerSecond}px`,
              height: `${totalContentHeight}px`
            }}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1"></div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-[10000] min-w-48 select-none"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
        >
          {/* Object Keyframe Menu */}
          {contextMenu.objectId && (
            <>
              {contextMenu.keyframeIndex !== undefined ? (
                <>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-white"
                    onClick={() => {
                      const obj = objects.find(o => o.id === contextMenu.objectId);
                      if (obj) {
                        onSelectObject(obj.id);
                        onTimeChange(contextMenu.time);
                      }
                      setContextMenu(null);
                    }}
                  >
                    ⏱️ 이 시간으로 이동
                  </button>
                  <div className="border-t border-gray-700 my-1"></div>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-red-400"
                    onClick={() => {
                      if (contextMenu.objectId && contextMenu.keyframeIndex !== undefined) {
                        onDeleteKeyframe(contextMenu.objectId, contextMenu.keyframeIndex);
                      }
                      setContextMenu(null);
                    }}
                  >
                    🗑️ 키프레임 삭제
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-white"
                    onClick={() => {
                      const obj = objects.find(o => o.id === contextMenu.objectId);
                      if (obj) {
                        onSelectObject(obj.id);
                      }
                      setContextMenu(null);
                    }}
                  >
                    🔍 선택
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-white"
                    onClick={handleAddKeyframeFromMenu}
                  >
                    ◆ 키프레임 추가 ({contextMenu.time.toFixed(2)}s)
                  </button>
                  <div className="border-t border-gray-700 my-1"></div>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-red-400"
                    onClick={() => {
                      if (contextMenu.objectId) {
                        onDeleteObject(contextMenu.objectId);
                      }
                      setContextMenu(null);
                    }}
                  >
                    🗑️ 오브젝트 삭제 (Delete)
                  </button>
                </>
              )}
            </>
          )}

          {/* Dialogue Menu */}
          {contextMenu.dialogueId && (
            <>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-white"
                onClick={() => {
                  const dlg = dialogues.find(d => d.id === contextMenu.dialogueId);
                  if (dlg) {
                    onSelectDialogue(dlg.id);
                  }
                  setContextMenu(null);
                }}
              >
                🔍 선택
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-white"
                onClick={() => {
                  const dlg = dialogues.find(d => d.id === contextMenu.dialogueId);
                  if (dlg) {
                    onSelectDialogue(dlg.id);
                    onTimeChange(dlg.start_time);
                  }
                  setContextMenu(null);
                }}
              >
                ⏱️ 시작 시간으로 이동
              </button>
              <div className="border-t border-gray-700 my-1"></div>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-red-400"
                onClick={() => {
                  if (contextMenu.dialogueId) {
                    onDeleteDialogue(contextMenu.dialogueId);
                  }
                  setContextMenu(null);
                }}
              >
                🗑️ 대화 삭제 (Delete)
              </button>
            </>
          )}
        </div>
      )}

      {/* Keyframe Edit Modal */}
      {keyframeEditModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"
          onClick={() => setKeyframeEditModal(null)}
        >
          <div
            className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-6 w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">키프레임 시간 편집</h3>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">시간 (초)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={maxTime}
                defaultValue={keyframeEditModal.currentTime.toFixed(1)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const newTime = parseFloat((e.target as HTMLInputElement).value);
                    if (!isNaN(newTime) && newTime >= 0 && newTime <= maxTime) {
                      onUpdateKeyframe(keyframeEditModal.objectId, keyframeEditModal.keyframeIndex, newTime);
                      setKeyframeEditModal(null);
                    }
                  } else if (e.key === 'Escape') {
                    setKeyframeEditModal(null);
                  }
                }}
                id="keyframe-time-input"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                onClick={() => setKeyframeEditModal(null)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white font-medium"
                onClick={() => {
                  const input = document.getElementById('keyframe-time-input') as HTMLInputElement;
                  const newTime = parseFloat(input.value);
                  if (!isNaN(newTime) && newTime >= 0 && newTime <= maxTime) {
                    onUpdateKeyframe(keyframeEditModal.objectId, keyframeEditModal.keyframeIndex, newTime);
                    setKeyframeEditModal(null);
                  }
                }}
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
