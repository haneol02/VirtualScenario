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
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState('');

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

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingProjectTitle(project.title);
  };

  const handleSaveProjectTitle = async (projectId: string) => {
    if (!editingProjectTitle.trim()) return;

    try {
      await projectsAPI.update(projectId, { title: editingProjectTitle });
      await loadProjects();
      setEditingProjectId(null);
      setEditingProjectTitle('');
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditingProjectTitle('');
  };

  const handleDuplicateProject = async (id: string) => {
    try {
      await projectsAPI.duplicate(id);
      loadProjects();
    } catch (error) {
      console.error('Failed to duplicate project:', error);
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
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white flex flex-col">
      {/* Header with Hero Section */}
      <header className="bg-gradient-to-r from-gray-800 via-gray-850 to-gray-800 border-b border-gray-700 shadow-2xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                VirtualScenario
              </h1>
              <p className="text-gray-400 text-sm">
                코레일 안전교육 시나리오 에디터 & 3D 시뮬레이터
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGuide(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
              >
                <span className="text-lg">📖</span>
                <span className="font-medium">사용 가이드</span>
              </button>
              <button
                onClick={() => navigate('/background-maps')}
                className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-gray-500/25 transform hover:scale-105"
              >
                <span className="text-lg">🗺️</span>
                <span className="font-medium">배경 맵 관리</span>
              </button>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 font-semibold"
              >
                <span className="text-lg mr-1">+</span> 새 프로젝트
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">📁</span>
              <span>프로젝트: <span className="text-white font-semibold">{projects.length}</span></span>
            </div>
            <div className="border-l border-gray-700 h-4"></div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✨</span>
              <span>Phase 1-2 완료</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-3xl p-16 border border-gray-700 shadow-2xl text-center max-w-lg">
              <div className="text-8xl mb-6 animate-pulse">📁</div>
              <p className="text-2xl font-bold text-white mb-3">프로젝트가 없습니다</p>
              <p className="text-gray-400 mb-8">새 프로젝트를 생성하여 시작하세요</p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 font-semibold"
              >
                <span className="text-xl mr-2">+</span> 새 프로젝트 만들기
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transform hover:scale-[1.02] hover:-translate-y-1"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  {editingProjectId === project.id ? (
                    <input
                      type="text"
                      value={editingProjectTitle}
                      onChange={(e) => setEditingProjectTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveProjectTitle(project.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      onBlur={() => handleSaveProjectTitle(project.id)}
                      className="flex-1 bg-gray-700 border border-blue-500 rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <h3
                      className="text-xl font-bold cursor-pointer text-white group-hover:text-blue-400 transition-colors line-clamp-2 flex-1"
                      onClick={() => handleEditProject(project)}
                      title="클릭하여 제목 수정"
                    >
                      {project.title}
                    </h3>
                  )}
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateProject(project.id);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      title="프로젝트 복제"
                    >
                      📋
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="프로젝트 삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">{project.description}</p>
                )}

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-5 pb-4 border-b border-gray-700">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md font-medium">v{project.version}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <span>🕒</span>
                    <span>{new Date(project.updated_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/editor/${project.id}`)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>✏️</span>
                    <span>편집</span>
                  </button>
                  <button
                    onClick={() => navigate(`/simulator/${project.id}`)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>▶️</span>
                    <span>재생</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fade-in">
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl p-8 w-[480px] border border-gray-700 shadow-2xl transform transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">✨</div>
              <h2 className="text-2xl font-bold text-white">새 프로젝트 생성</h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">프로젝트 이름</label>
              <input
                type="text"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="예: 코레일 안전교육 시나리오"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                  if (e.key === 'Escape') setShowCreateDialog(false);
                }}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium"
              >
                취소
              </button>
              <button
                onClick={handleCreateProject}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                disabled={!newProjectTitle.trim()}
              >
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Guide Modal */}
      <UserGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-8 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-white">VirtualScenario</span>
            <span className="text-gray-500">v0.1.0</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">Phase 1-2 완료</span>
          </div>
          <div className="text-gray-400">
            동아대학교 AI학과 3년차 - 코레일 안전교육 프로젝트
          </div>
        </div>
      </footer>
    </div>
  );
}
