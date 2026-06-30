// MusicContext.jsx — Global music state (Context + useReducer)

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { musicReducer } from './musicReducer.js';
import {
  initStorage,
  readLikedSongs,
  readPlaylists,
  readRecent,
  readPlayerState,
  readPreferences,
  writePlayerState,
} from '../utils/storage.js';
import { ACTIONS, VIEWS, REPEAT_MODES, DEFAULT_PLAYER_STATE } from '../utils/constants.js';

// ── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  // Playback
  currentTrack: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  volume: 0.8,
  isMuted: false,
  isShuffled: false,
  repeatMode: REPEAT_MODES.OFF,

  // Queue
  queue: [],
  queueIndex: -1,
  originalQueue: [],
  playingContext: null,

  // UI
  activeView: VIEWS.HOME,
  activePlaylistId: null,
  isMiniPlayer: false,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  suggestions: [],
  toast: null, // { message: string, type: string }

  // Library (loaded from localStorage)
  likedSongs: [],
  playlists: [],
  recentlyPlayed: [],

  // Preferences
  preferences: {
    crossfade: false,
    autoplay: true,
    showLyrics: false,
    compactPlayer: false,
  },
};

// ── Contexts ──────────────────────────────────────────────────────────────────

export const MusicStateContext = createContext(null);
export const MusicDispatchContext = createContext(null);
export const MusicAudioContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function MusicProvider({ children }) {
  const [state, dispatch] = useReducer(musicReducer, initialState);
  const youtubePlayerRef = useRef(null);
  const saveIntervalRef = useRef(null);

  // ── Boot: load persisted data ───────────────────────────────────────────────
  useEffect(() => {
    initStorage();

    const liked = readLikedSongs();
    const playlists = readPlaylists();
    const recent = readRecent();
    const playerState = readPlayerState();
    const prefs = readPreferences();

    dispatch({
      type: ACTIONS.LOAD_FROM_STORAGE,
      payload: {
        likedSongs: liked,
        playlists,
        recentlyPlayed: recent,
        preferences: prefs,
        ...(playerState
          ? {
              currentTrack: playerState.currentTrack,
              queue: playerState.queue || [],
              queueIndex: playerState.queueIndex ?? -1,
              volume: playerState.volume ?? 0.8,
              isMuted: playerState.isMuted ?? false,
              isShuffled: playerState.isShuffled ?? false,
              repeatMode: playerState.repeatMode ?? REPEAT_MODES.OFF,
              currentTime: playerState.currentTime ?? 0,
            }
          : {}),
      },
    });
  }, []);

  // ── Save playback position every 5s ────────────────────────────────────────
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      if (youtubePlayerRef.current && state.currentTrack && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
        const time = youtubePlayerRef.current.getCurrentTime();
        if (time > 0) {
          dispatch({
            type: ACTIONS.SET_CURRENT_TIME,
            payload: { time },
          });
          writePlayerState({ ...state, currentTime: time });
        }
      }
    }, 5000);
    return () => clearInterval(saveIntervalRef.current);
  }, [state.currentTrack, state]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      // Don't intercept when user is typing
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (state.isPlaying) dispatch({ type: ACTIONS.PAUSE });
        else dispatch({ type: ACTIONS.RESUME });
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
           const t = youtubePlayerRef.current.getCurrentTime();
           youtubePlayerRef.current.seekTo(t + 10, true);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
           const t = youtubePlayerRef.current.getCurrentTime();
           youtubePlayerRef.current.seekTo(Math.max(0, t - 10), true);
        }
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const newVol = Math.min(1, (state.volume || 0) + 0.1);
        dispatch({ type: ACTIONS.SET_VOLUME, payload: { volume: newVol } });
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const newVol = Math.max(0, (state.volume || 0) - 0.1);
        dispatch({ type: ACTIONS.SET_VOLUME, payload: { volume: newVol } });
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.isPlaying, state.volume, state.currentTrack]);

  // ── Stable context values ──────────────────────────────────────────────────
  const audioContextValue = useMemo(() => ({ youtubePlayerRef }), []);

  return (
    <MusicStateContext.Provider value={state}>
      <MusicDispatchContext.Provider value={dispatch}>
        <MusicAudioContext.Provider value={audioContextValue}>
          {children}
        </MusicAudioContext.Provider>
      </MusicDispatchContext.Provider>
    </MusicStateContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useMusicState() {
  const ctx = useContext(MusicStateContext);
  if (!ctx) throw new Error('useMusicState must be used inside MusicProvider');
  return ctx;
}

export function useMusicDispatch() {
  const ctx = useContext(MusicDispatchContext);
  if (!ctx) throw new Error('useMusicDispatch must be used inside MusicProvider');
  return ctx;
}

export function useMusicAudio() {
  const ctx = useContext(MusicAudioContext);
  if (!ctx) throw new Error('useMusicAudio must be used inside MusicProvider');
  return ctx;
}
