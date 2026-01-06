import { useState, useCallback } from 'react';

interface UseHistoryResult<T> {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pushState: (newState: T) => void;
}

export function useHistory<T>(initialState: T): UseHistoryResult<T> {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  // The current state is always history[index]
  const state = history[index];

  // Navigate back
  const undo = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // Navigate forward
  const redo = useCallback(() => {
    setIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  // Add new state and truncate future
  const pushState = useCallback((newState: T) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, index + 1);
      return [...newHistory, newState];
    });
    setIndex((prev) => prev + 1);
  }, [index]);

  // Direct set (replace current) - rarely used in undo/redo pattern but good to have
  const setState = useCallback((newState: T) => {
      setHistory(prev => {
          const newHistory = [...prev];
          newHistory[index] = newState;
          return newHistory;
      });
  }, [index]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
    pushState
  };
}