import { useState } from 'react';
import { PathKeyframe } from '../lib/api';

interface PathEditorProps {
  sceneObject: {
    id: string;
    name: string;
    path_data?: string;
    position_x: number;
    position_y: number;
    position_z: number;
    rotation_x: number;
    rotation_y: number;
    rotation_z: number;
    scale_x: number;
    scale_y: number;
    scale_z: number;
  } | null;
  onSaveKeyframe: (keyframes: PathKeyframe[]) => void;
  onClose: () => void;
}

export default function PathEditor({ sceneObject, onSaveKeyframe, onClose }: PathEditorProps) {
  const [keyframes, setKeyframes] = useState<PathKeyframe[]>(() => {
    if (sceneObject?.path_data) {
      try {
        return JSON.parse(sceneObject.path_data);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [maxTime, setMaxTime] = useState(10); // 기본 10초

  const addKeyframe = () => {
    if (!sceneObject) return;

    // 현재 오브젝트의 실제 위치와 회전 사용
    const newKeyframe: PathKeyframe = {
      time: currentTime,
      position: [sceneObject.position_x, sceneObject.position_y, sceneObject.position_z],
      rotation: [sceneObject.rotation_x, sceneObject.rotation_y, sceneObject.rotation_z],
      scale: [sceneObject.scale_x, sceneObject.scale_y, sceneObject.scale_z],
    };

    const updatedKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    setKeyframes(updatedKeyframes);
  };

  const deleteKeyframe = (index: number) => {
    const updatedKeyframes = keyframes.filter((_, i) => i !== index);
    setKeyframes(updatedKeyframes);
  };

  const handleSave = () => {
    onSaveKeyframe(keyframes);
    onClose();
  };

  if (!sceneObject) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Path 편집: {sceneObject.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 타임라인 컨트롤 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            현재 시간: {currentTime.toFixed(2)}초
          </label>
          <input
            type="range"
            min="0"
            max={maxTime}
            step="0.1"
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              min="1"
              max="60"
              value={maxTime}
              onChange={(e) => setMaxTime(parseInt(e.target.value))}
              className="border rounded px-2 py-1 w-20"
            />
            <span className="text-sm text-gray-600 self-center">최대 시간 (초)</span>
          </div>
        </div>

        {/* 키프레임 추가 버튼 */}
        <div className="mb-4">
          <button
            onClick={addKeyframe}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            + 현재 시간에 키프레임 추가
          </button>
        </div>

        {/* 키프레임 리스트 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">키프레임 목록</h3>
          {keyframes.length === 0 ? (
            <p className="text-gray-500 text-sm">키프레임이 없습니다. 위 버튼을 눌러 추가하세요.</p>
          ) : (
            <div className="space-y-2">
              {keyframes.map((kf, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded border"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">시간: {kf.time.toFixed(2)}초</div>
                    <div className="text-xs text-gray-600">
                      위치: ({kf.position[0].toFixed(2)}, {kf.position[1].toFixed(2)}, {kf.position[2].toFixed(2)})
                    </div>
                    <div className="text-xs text-gray-600">
                      회전: ({kf.rotation[0].toFixed(2)}, {kf.rotation[1].toFixed(2)}, {kf.rotation[2].toFixed(2)})
                    </div>
                  </div>
                  <button
                    onClick={() => deleteKeyframe(index)}
                    className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-500"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 안내 문구 */}
        <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>사용 방법:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>타임라인 슬라이더를 원하는 시간으로 이동</li>
            <li>3D 뷰에서 오브젝트를 원하는 위치/회전으로 조정</li>
            <li>"키프레임 추가" 버튼을 눌러 해당 시간에 위치 저장</li>
            <li>여러 키프레임을 추가하여 애니메이션 경로 생성</li>
          </ul>
        </div>

        {/* 저장/취소 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
