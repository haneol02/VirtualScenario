import { useState, useEffect } from 'react';
import { Asset, assetsAPI } from '../lib/api';

interface AssetLibraryPanelProps {
  onAssetSelect: (assetId: string) => void;
}

export default function AssetLibraryPanel({ onAssetSelect }: AssetLibraryPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('model');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

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
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const filteredAssets = selectedCategory === 'all'
    ? assets
    : assets.filter(asset => asset.category === selectedCategory);

  const categories = ['all', 'primitive', 'model', 'person', 'train', 'facility', 'sign'];

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
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
            className="p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer flex justify-between items-center"
            onClick={() => onAssetSelect(asset.id)}
          >
            <div>
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
            {asset.type === 'model' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(asset.id);
                }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                삭제
              </button>
            )}
          </div>
        ))}
      </div>

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
