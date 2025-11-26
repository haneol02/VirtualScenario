import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const guideUrl = new URL('./USER_GUIDE.md', window.location.href).toString();

      fetch(guideUrl)
        .then((res) => res.text())
        .then((text) => {
          setContent(text);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load user guide:', error);
          setContent('# 사용 가이드를 불러올 수 없습니다\n\n파일을 찾을 수 없거나 오류가 발생했습니다.');
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📖</span>
            <span>VirtualScenario 사용 가이드</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="prose prose-invert prose-blue max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customize heading styles
                  h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-bold text-white mb-4 mt-8 pb-2 border-b border-gray-700" {...props} />
                  ),
                  h2: ({ node, children, ...props }) => {
                    // Convert heading text to id (e.g., "시작하기" -> "시작하기")
                    const text = children?.toString() || '';
                    const id = text.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <h2 id={id} className="text-2xl font-bold text-white mb-3 mt-6" {...props}>
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ node, ...props }) => (
                    <h3 className="text-xl font-semibold text-white mb-2 mt-4" {...props} />
                  ),
                  // Customize paragraph
                  p: ({ node, ...props }) => (
                    <p className="text-gray-300 mb-4 leading-relaxed" {...props} />
                  ),
                  // Customize lists
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-gray-300 ml-4" {...props} />
                  ),
                  // Customize code blocks
                  code: ({ node, inline, ...props }: any) =>
                    inline ? (
                      <code className="bg-gray-800 text-blue-400 px-2 py-1 rounded text-sm" {...props} />
                    ) : (
                      <code className="block bg-gray-800 text-gray-300 p-4 rounded-lg mb-4 overflow-x-auto" {...props} />
                    ),
                  // Customize links
                  a: ({ node, href, children, ...props }) => {
                    // Handle anchor links for table of contents
                    if (href?.startsWith('#')) {
                      return (
                        <a
                          href={href}
                          onClick={(e) => {
                            e.preventDefault();
                            const id = href.slice(1);
                            const element = document.getElementById(id);
                            if (element && contentRef.current) {
                              // Smooth scroll to the element
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    }
                    return <a href={href} className="text-blue-400 hover:text-blue-300 underline" {...props}>{children}</a>;
                  },
                  // Customize blockquotes
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4" {...props} />
                  ),
                  // Customize horizontal rules
                  hr: ({ node, ...props }) => (
                    <hr className="border-gray-700 my-8" {...props} />
                  ),
                  // Customize tables
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full border border-gray-700" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-gray-800" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-gray-700 px-4 py-2 text-left text-white" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-gray-700 px-4 py-2 text-gray-300" {...props} />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
