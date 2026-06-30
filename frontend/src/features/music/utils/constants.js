// constants.js — Action types, storage keys, and config

// ── Action Types ─────────────────────────────────────────────────────────────

export const ACTIONS = {
  // Playback
  PLAY_TRACK: 'PLAY_TRACK',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  SEEK: 'SEEK',
  SET_VOLUME: 'SET_VOLUME',
  TOGGLE_MUTE: 'TOGGLE_MUTE',
  SET_DURATION: 'SET_DURATION',
  SET_CURRENT_TIME: 'SET_CURRENT_TIME',

  // Navigation
  NEXT_TRACK: 'NEXT_TRACK',
  PREV_TRACK: 'PREV_TRACK',
  TOGGLE_SHUFFLE: 'TOGGLE_SHUFFLE',
  CYCLE_REPEAT: 'CYCLE_REPEAT',

  // Queue
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',
  PLAY_NEXT: 'PLAY_NEXT',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE',
  CLEAR_QUEUE: 'CLEAR_QUEUE',
  REORDER_QUEUE: 'REORDER_QUEUE',
  SET_QUEUE: 'SET_QUEUE',
  UPDATE_QUEUE: 'UPDATE_QUEUE', // replace queue without interrupting playback

  // Liked Songs
  LIKE_TRACK: 'LIKE_TRACK',
  UNLIKE_TRACK: 'UNLIKE_TRACK',

  // Playlists
  CREATE_PLAYLIST: 'CREATE_PLAYLIST',
  DELETE_PLAYLIST: 'DELETE_PLAYLIST',
  RENAME_PLAYLIST: 'RENAME_PLAYLIST',
  ADD_TO_PLAYLIST: 'ADD_TO_PLAYLIST',
  REMOVE_FROM_PLAYLIST: 'REMOVE_FROM_PLAYLIST',
  REORDER_PLAYLIST: 'REORDER_PLAYLIST',

  // Search
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_SEARCHING: 'SET_SEARCHING',
  SET_SUGGESTIONS: 'SET_SUGGESTIONS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',

  // UI
  SET_VIEW: 'SET_VIEW',
  TOGGLE_MINI_PLAYER: 'TOGGLE_MINI_PLAYER',
  SET_PLAYING_CONTEXT: 'SET_PLAYING_CONTEXT',
  SHOW_TOAST: 'SHOW_TOAST',
  HIDE_TOAST: 'HIDE_TOAST',

  // Storage
  LOAD_FROM_STORAGE: 'LOAD_FROM_STORAGE',
  SYNC_TO_STORAGE: 'SYNC_TO_STORAGE',

  // Recently Played
  ADD_TO_RECENT: 'ADD_TO_RECENT',
  CLEAR_RECENT: 'CLEAR_RECENT',
};

// ── Repeat Modes ─────────────────────────────────────────────────────────────

export const REPEAT_MODES = {
  OFF: 'off',
  ALL: 'all',
  ONE: 'one',
};

export const REPEAT_CYCLE = [REPEAT_MODES.OFF, REPEAT_MODES.ALL, REPEAT_MODES.ONE];

// ── Views ────────────────────────────────────────────────────────────────────

export const VIEWS = {
  HOME: 'home',
  SEARCH: 'search',
  LIBRARY: 'library',
  PLAYLIST: 'playlist',
  LIKED: 'liked',
};

// ── localStorage Keys ─────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  LIKED: 'cea_music_liked_v1',
  PLAYLISTS: 'cea_music_playlists_v1',
  RECENT: 'cea_music_recent_v1',
  PLAYER_STATE: 'cea_music_player_state_v1',
  PREFERENCES: 'cea_music_preferences_v1',
  SEARCH_CACHE: 'cea_music_search_cache_v1',
};

export const SCHEMA_VERSION = 1;

// ── Limits ───────────────────────────────────────────────────────────────────

export const LIMITS = {
  RECENT_MAX: 50,
  SUGGESTIONS_MAX: 10,
  SEARCH_RESULTS_MAX: 40,
  TRENDING_MAX: 20,
  STORAGE_WRITE_DEBOUNCE_MS: 300,
};

// ── API Base URL ─────────────────────────────────────────────────────────────
// Use the Render backend URL for all API calls.
export const BACKEND_URL = 'https://rj-cr26.onrender.com';

export const API_BASE = `${BACKEND_URL}/api/music`;

// ── Default Preferences ───────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES = {
  crossfade: false,
  autoplay: true,
  showLyrics: false,
  compactPlayer: false,
};

// ── Default Player State ──────────────────────────────────────────────────────

export const DEFAULT_PLAYER_STATE = {
  currentTrack: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  volume: 0.8,
  isMuted: false,
  isShuffled: false,
  repeatMode: REPEAT_MODES.OFF,
  queue: [],
  queueIndex: -1,
  originalQueue: [],
  playingContext: null,
};
