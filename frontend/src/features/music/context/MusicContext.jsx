// MusicContext.jsx — Global music state (Context + useReducer)

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
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
import { ACTIONS, VIEWS, REPEAT_MODES } from '../utils/constants.js';

const initialState = {
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
  activeView: VIEWS.HOME,
  activePlaylistId: null,
  isMiniPlayer: false,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  suggestions: [],
  toast: null,
  likedSongs: [],
  playlists: [],
  recentlyPlayed: [],
  preferences: {
    crossfade: false,
    autoplay: true,
    showLyrics: false,
    compactPlayer: false,
  },
};

export const MusicStateContext = createContext(null);
export const MusicDispatchContext = createContext(null);
export const MusicAudioContext = createContext(null);

export function MusicProvider({ children }) {
  const [state, dispatch] = useReducer(musicReducer, initialState);
  const youtubePlayerRef = useRef(null);
  const saveIntervalRef  = useRef(null);
  // Always-current ref so the save interval doesn't capture stale state
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Boot: load persisted data ──────────────────────────────────────────────
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

  // ── Persist playback position every 10 s ─────────────────────────────────
  // SET_CURRENT_TIME is already dispatched continuously by the timeupdate event
  // in usePlayer.js — we only need to persist to localStorage here.
  // IMPORTANT: deps = [] so the interval is created ONCE, not on every render.
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      const s = stateRef.current;
      if (youtubePlayerRef.current && s.currentTrack && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
        const time = youtubePlayerRef.current.getCurrentTime();
        if (time > 0) {
          writePlayerState({ ...s, currentTime: time });
        }
      }
    }, 10000);
    return () => clearInterval(saveIntervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (state.isPlaying) dispatch({ type: ACTIONS.PAUSE });
        else dispatch({ type: ACTIONS.RESUME });
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
          youtubePlayerRef.current.seekTo(youtubePlayerRef.current.getCurrentTime() + 10, true);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
          youtubePlayerRef.current.seekTo(Math.max(0, youtubePlayerRef.current.getCurrentTime() - 10), true);
        }
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        dispatch({ type: ACTIONS.SET_VOLUME, payload: { volume: Math.min(1, (state.volume || 0) + 0.1) } });
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        dispatch({ type: ACTIONS.SET_VOLUME, payload: { volume: Math.max(0, (state.volume || 0) - 0.1) } });
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.isPlaying, state.volume, state.currentTrack]);

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
