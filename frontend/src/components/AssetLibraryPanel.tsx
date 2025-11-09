import { useState, useEffect } from 'react';
import { Asset, assetsAPI } from '../lib/api';

interface AssetLibraryPanelProps {
  onAssetSelect: (assetId: string) => void;
  onAssetUpdated?: () => void;  // 에셋이 업로드/수정/삭제되었을 때 호출
}

export default function AssetLibraryPanel({ onAssetSelect, onAssetUpdated }: AssetLibraryPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('model');
  const [isUploading, setIsUploading] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    assetId: string;
    x: number;
    y: number;
  } | null>(null);

  // Edit modal state
  const [editModal, setEditModal] = useState<{
    asset: Asset;
  } | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadAssets();
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const loadAssets = async () => {
    try {
      const data = await assetsAPI.getAll();
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      // Auto-fill name from filename
      setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName) {
      alert('파일과 이름을 입력하세요.');
      return;
    }

    setIsUploading(true);
    try {
      await assetsAPI.upload(uploadFile, uploadName, uploadCategory);
      alert('업로드 성공!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadName('');
      loadAssets();
      // 부모 컴포넌트에 에셋 업데이트 알림
      if (onAssetUpdated) onAssetUpdated();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('업로드 실패');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 에셋을 삭제하시겠습니까?')) return;

    try {
      await assetsAPI.delete(id);
      loadAssets();
      // 부모 컴포넌트에 에셋 업데이트 알림
      if (onAssetUpdated) onAssetUpdated();
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const handleAssetClick = (e: React.MouseEvent, assetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContextMenu({
      assetId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleAddToScene = (assetId: string) => {
    setContextMenu(null);
    onAssetSelect(assetId);
  };

  const handleEdit = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      setEditName(asset.name);
      setEditModal({ asset });
    }
    setContextMenu(null);
  };

  const handleSaveEdit = async () => {
    if (!editModal || !editName.trim()) {
      alert('이름을 입력하세요.');
      return;
    }

    try {
      await assetsAPI.update(editModal.asset.id, { name: editName });
      setEditModal(null);
      loadAssets();
      // 부모 컴포넌트에 에셋 업데이트 알림
      if (onAssetUpdated) onAssetUpdated();
    } catch (error) {
      console.error('Failed to update asset:', error);
      alert('수정 실패');
    }
  };

  const filteredAssets = selectedCategory === 'all'
    ? assets
    : assets.filter(asset => asset.category === selectedCategory);

  const categories = ['all', 'primitive', 'model', 'person', 'train', 'facility', 'sign'];

  return (
    <div
      className="h-full flex flex-col bg-gray-800 text-white select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold mb-3">에셋 라이브러리</h3>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded text-sm ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat === 'all' ? '전체' : cat}
            </button>
          ))}
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
        >
          + 3D 모델 업로드
        </button>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredAssets.map(asset => (
          <div
            key={asset.id}
            className="p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer flex justify-between items-center select-none"
            onClick={(e) => handleAssetClick(e, asset.id)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="pointer-events-none">
              <p className="font-medium">{asset.name}</p>
              <p className="text-xs text-gray-400">
                {asset.type === 'model' && asset.file_format && (
                  <span className="bg-blue-500 px-2 py-0.5 rounded mr-2">
                    {asset.file_format.toUpperCase()}
                  </span>
                )}
                {asset.category}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-900 border border-gray-600 rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleAddToScene(contextMenu.assetId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
          >
            <span>➕</span>
            <span>장면에 추가</span>
          </button>
          <button
            onClick={() => handleEdit(contextMenu.assetId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
          >
            <span>✏️</span>
            <span>편집 (이름 변경)</span>
          </button>
          {assets.find(a => a.id === contextMenu.assetId)?.type === 'model' && (
            <>
              <div className="border-t border-gray-700 my-1"></div>
              <button
                onClick={() => {
                  handleDelete(contextMenu.assetId);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center gap-2"
              >
                <span>🗑️</span>
                <span>삭제</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">에셋 이름 변경</h3>

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  새 이름
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-sm"
                  placeholder="에셋 이름"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') setEditModal(null);
                  }}
                />
              </div>

              {/* Category Info */}
              <div className="text-xs text-gray-400">
                <p>카테고리: {editModal.asset.category}</p>
                {editModal.asset.file_format && (
                  <p>파일 형식: {editModal.asset.file_format.toUpperCase()}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">3D 모델 업로드</h3>

            <div className="space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  파일 선택 (GLB, GLTF, OBJ, FBX)
                </label>
                <input
                  type="file"
                  accept=".glb,.gltf,.obj,.fbx"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-sm"
                />
                {uploadFile && (
                  <p className="text-xs text-gray-400 mt-1">
                    {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  에셋 이름
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-sm"
                  placeholder="예: 기차역 벤치"
                />
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  카테고리
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-sm"
                >
                  <option value="model">Model</option>
                  <option value="person">Person</option>
                  <option value="train">Train</option>
                  <option value="facility">Facility</option>
                  <option value="sign">Sign</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !uploadFile || !uploadName}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium"
                >
                  {isUploading ? '업로드 중...' : '업로드'}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadName('');
                  }}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
