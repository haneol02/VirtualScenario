import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, type Project } from '../lib/api';
import UserGuideModal from '../components/UserGuideModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectsAPI.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;

    try {
      const newProject = await projectsAPI.create({
        title: newProjectTitle,
        version: '1.0',
      });
      setNewProjectTitle('');
      setShowCreateDialog(false);
      // 새로 생성된 프로젝트의 에디터로 이동
      navigate(`/editor/${newProject.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) return;

    try {
      await projectsAPI.delete(id);
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">VirtualScenario Editor</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGuide(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              📖 사용 가이드
            </button>
            <button
              onClick={() => navigate('/background-maps')}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              🗺️ 배경 맵 관리
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              + 새 프로젝트
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-xl mb-2">프로젝트가 없습니다</p>
            <p className="text-sm">새 프로젝트를 생성하여 시작하세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-400 mb-3">{project.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>v{project.version}</span>
                  <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/editor/${project.id}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    ✏️ 편집
                  </button>
                  <button
                    onClick={() => navigate(`/simulator/${project.id}`)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                  >
                    ▶️ 재생
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">새 프로젝트 생성</h2>
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="프로젝트 제목"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
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
                onClick={handleCreateProject}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                disabled={!newProjectTitle.trim()}
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Guide Modal */}
      <UserGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-3 text-sm text-gray-400">
        <div className="flex items-center justify-between">
          <span>VirtualScenario v0.1.0</span>
          <span>Phase 1 - MVP</span>
        </div>
      </footer>
    </div>
  );
}
