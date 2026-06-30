// storage.js — localStorage helpers with schema versioning and debouncing

import { STORAGE_KEYS, SCHEMA_VERSION, LIMITS, DEFAULT_PREFERENCES, DEFAULT_PLAYER_STATE } from './constants.js';

// ── Debounce helper ───────────────────────────────────────────────────────────

const writeTimers = {};

function debouncedWrite(key, value, delayMs = LIMITS.STORAGE_WRITE_DEBOUNCE_MS) {
  clearTimeout(writeTimers[key]);
  writeTimers[key] = setTimeout(() => {
    rawWrite(key, value);
  }, delayMs);
}

function rawWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Quota exceeded — try to prune recent history then retry
    if (err.name === 'QuotaExceededError') {
      pruneRecentHistory();
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        console.warn('[MusicStorage] localStorage quota exceeded even after pruning.');
      }
    }
  }
}

function rawRead(key) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return null;
    return JSON.parse(item);
  } catch {
    return null;
  }
}

// ── Quota guard: prune oldest recently played entries ─────────────────────────

function pruneRecentHistory() {
  const recent = rawRead(STORAGE_KEYS.RECENT) || [];
  // Remove oldest half
  const pruned = recent.slice(0, Math.floor(recent.length / 2));
  try {
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(pruned));
  } catch {
    // If even that fails, clear recent entirely
    try { localStorage.removeItem(STORAGE_KEYS.RECENT); } catch {}
  }
}

// ── Version migration ─────────────────────────────────────────────────────────

function checkVersion() {
  const versionKey = 'cea_music_schema_version';
  const stored = rawRead(versionKey);
  if (stored !== SCHEMA_VERSION) {
    // Version mismatch — clear all music keys to prevent corruption
    Object.values(STORAGE_KEYS).forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
    rawWrite(versionKey, SCHEMA_VERSION);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function initStorage() {
  checkVersion();
}

// Liked Songs
export function readLikedSongs() {
  return rawRead(STORAGE_KEYS.LIKED) || [];
}
export function writeLikedSongs(tracks) {
  debouncedWrite(STORAGE_KEYS.LIKED, tracks);
}

// Playlists
export function readPlaylists() {
  return rawRead(STORAGE_KEYS.PLAYLISTS) || [];
}
export function writePlaylists(playlists) {
  debouncedWrite(STORAGE_KEYS.PLAYLISTS, playlists);
}

// Recently Played
export function readRecent() {
  return rawRead(STORAGE_KEYS.RECENT) || [];
}
export function writeRecent(tracks) {
  debouncedWrite(STORAGE_KEYS.RECENT, tracks);
}

// Player State
export function readPlayerState() {
  const saved = rawRead(STORAGE_KEYS.PLAYER_STATE);
  if (!saved) return null;
  return saved;
}
export function writePlayerState(state) {
  debouncedWrite(STORAGE_KEYS.PLAYER_STATE, {
    currentTrack: state.currentTrack,
    queue: state.queue,
    queueIndex: state.queueIndex,
    volume: state.volume,
    isMuted: state.isMuted,
    isShuffled: state.isShuffled,
    repeatMode: state.repeatMode,
    currentTime: state.currentTime,
  });
}

// Preferences
export function readPreferences() {
  return { ...DEFAULT_PREFERENCES, ...(rawRead(STORAGE_KEYS.PREFERENCES) || {}) };
}
export function writePreferences(prefs) {
  debouncedWrite(STORAGE_KEYS.PREFERENCES, prefs);
}

// Search cache (for back-navigate restoration)
export function readSearchCache() {
  return rawRead(STORAGE_KEYS.SEARCH_CACHE) || {};
}
export function writeSearchCache(cache) {
  debouncedWrite(STORAGE_KEYS.SEARCH_CACHE, cache);
}

// Clear all music data
export function clearAllMusicData() {
  Object.values(STORAGE_KEYS).forEach((k) => {
    try { localStorage.removeItem(k); } catch {}
  });
  try { localStorage.removeItem('cea_music_schema_version'); } catch {}
}

// Generate a simple UUID (no external dep)
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
