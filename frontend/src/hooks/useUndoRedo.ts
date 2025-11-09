import { useCallback, useRef, useState } from 'react';

export interface UndoableAction<T = any> {
  type: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  data?: T;
}

export function useUndoRedo(maxHistorySize: number = 50) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const history = useRef<UndoableAction[]>([]);
  const currentIndex = useRef(-1);

  const updateFlags = useCallback(() => {
    setCanUndo(currentIndex.current >= 0);
    setCanRedo(currentIndex.current < history.current.length - 1);
  }, []);

  const pushAction = useCallback((action: UndoableAction) => {
    // Remove any actions after current index (redo history is lost)
    history.current = history.current.slice(0, currentIndex.current + 1);

    // Add new action
    history.current.push(action);

    // Limit history size
    if (history.current.length > maxHistorySize) {
      history.current.shift();
    } else {
      currentIndex.current++;
    }

    updateFlags();
  }, [maxHistorySize, updateFlags]);

  const undo = useCallback(async () => {
    if (currentIndex.current < 0) return;

    const action = history.current[currentIndex.current];
    try {
      await action.undo();
      currentIndex.current--;
      updateFlags();
    } catch (error) {
      console.error('Undo failed:', error);
    }
  }, [updateFlags]);

  const redo = useCallback(async () => {
    if (currentIndex.current >= history.current.length - 1) return;

    currentIndex.current++;
    const action = history.current[currentIndex.current];
    try {
      await action.redo();
      updateFlags();
    } catch (error) {
      console.error('Redo failed:', error);
      currentIndex.current--;
      updateFlags();
    }
  }, [updateFlags]);

  const clear = useCallback(() => {
    history.current = [];
    currentIndex.current = -1;
    updateFlags();
  }, [updateFlags]);

  return {
    pushAction,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
  };
}
