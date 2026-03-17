import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'kore_recent_tools';
const MAX_RECENT = 5;

interface RecentTool {
  toolKey: string;
  lastUsed: string;
}

let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  listeners.forEach((l) => l());
}

function getRecent(): RecentTool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) || '[]';
}

export function useRecentTools() {
  const raw = useSyncExternalStore(subscribe, getSnapshot);
  const recent: RecentTool[] = JSON.parse(raw);

  const trackTool = useCallback((toolKey: string) => {
    const current = getRecent().filter((t) => t.toolKey !== toolKey);
    const updated = [
      { toolKey, lastUsed: new Date().toISOString() },
      ...current,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    emitChange();
  }, []);

  return { recentTools: recent, trackTool };
}
