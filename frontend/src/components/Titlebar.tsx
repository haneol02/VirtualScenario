import { useEffect, useState } from 'react';

type WindowState = { isMaximized: boolean };

declare global {
  interface Window {
    electronAPI?: {
      windowControl: (action: 'minimize' | 'maximize' | 'close') => void;
      onWindowState?: (callback: (state: WindowState) => void) => () => void;
    };
  }
}

export default function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onWindowState?.((state) => {
      setIsMaximized(state.isMaximized);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleControl = (action: 'minimize' | 'maximize' | 'close') => {
    window.electronAPI?.windowControl(action);
  };

  return (
    <div className="app-titlebar">
      <div className="app-titlebar__title">VirtualScenario</div>
      <div className="app-titlebar__subtitle">코레일 안전교육 시나리오 에디터</div>
      <div className="app-titlebar__spacer" />
      <div className="app-titlebar__controls" aria-label="창 제어">
        <button
          type="button"
          className="app-titlebar__btn app-titlebar__btn--minimize"
          title="최소화"
          onClick={() => handleControl('minimize')}
        >
          <span className="app-titlebar__icon app-titlebar__icon--minimize" />
        </button>
        <button
          type="button"
          className="app-titlebar__btn app-titlebar__btn--maximize"
          title={isMaximized ? '복원' : '최대화'}
          onClick={() => handleControl('maximize')}
        >
          <span className="app-titlebar__icon app-titlebar__icon--maximize" data-maximized={isMaximized} />
        </button>
        <button
          type="button"
          className="app-titlebar__btn app-titlebar__btn--close"
          title="닫기"
          onClick={() => handleControl('close')}
        >
          <span className="app-titlebar__icon app-titlebar__icon--close" />
        </button>
      </div>
    </div>
  );
}
