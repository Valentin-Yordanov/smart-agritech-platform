'use client';

import { useSyncExternalStore } from 'react';

// Recent scans kept on this device only; the backend has no per-user history endpoint yet
export interface ScanHistoryItem {
  id: string | null;
  speciesName: string;
  diseaseName: string;
  confidence: number;
  isHealthy: boolean;
  uncertain: boolean;
  mode: 'cloud' | 'offline';
  createdAt: string;
}

const KEY = 'agritech.scanHistory.v1';
const MAX_ITEMS = 25;
const EMPTY: ScanHistoryItem[] = [];
const listeners = new Set<() => void>();
let cache: ScanHistoryItem[] | null = null;

function read(): ScanHistoryItem[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ScanHistoryItem[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function addScanToHistory(item: ScanHistoryItem): void {
  cache = [item, ...read()].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage can be blocked (private mode); history then lasts for this tab only
  }
  listeners.forEach((l) => l());
}

export function clearScanHistory(): void {
  cache = EMPTY;
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

// Returns null during server render and hydration so callers can show a skeleton
export function useScanHistory(): ScanHistoryItem[] | null {
  return useSyncExternalStore<ScanHistoryItem[] | null>(subscribe, read, () => null);
}
