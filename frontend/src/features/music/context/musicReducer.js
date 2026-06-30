// musicReducer.js — All action types + reducer

import { ACTIONS, REPEAT_CYCLE, LIMITS } from '../utils/constants.js';
import { writeLikedSongs, writePlaylists, writeRecent, writePlayerState } from '../utils/storage.js';

function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deduplicateById(arr, getId = (t) => t.videoId) {
  const seen = new Set();
  return arr.filter((item) => {
    const id = getId(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function addToRecent(recentList, track) {
  const filtered = recentList.filter((t) => t.videoId !== track.videoId);
  const updated = [{ ...track, playedAt: new Date().toISOString() }, ...filtered];
  return updated.slice(0, LIMITS.RECENT_MAX);
}

export function musicReducer(state, action) {
  switch (action.type) {

    // ── Playback ──────────────────────────────────────────────────────────────

    case ACTIONS.PLAY_TRACK: {
      const { track, queue, queueIndex, context } = action.payload;
      const providedQueue = queue || (track ? [track] : state.queue);
      let newQueue = providedQueue;
      let newOriginalQueue = queue ? providedQueue : state.originalQueue;
      let newIndex = queueIndex !== undefined ? queueIndex : 0;

      if (state.isShuffled && queue) {
        // If playing a new queue with shuffle on, shuffle it but keep clicked track first
        newQueue = fisherYates(providedQueue);
        const currentIdx = newQueue.findIndex((t) => t.videoId === track?.videoId);
        if (currentIdx > 0) {
          [newQueue[0], newQueue[currentIdx]] = [newQueue[currentIdx], newQueue[0]];
          newIndex = 0;
        } else if (currentIdx === -1) {
          newQueue.unshift(track);
          newIndex = 0;
        } else {
          newIndex = 0;
        }
      }

      const newRecent = addToRecent(state.recentlyPlayed, track);
      const newState = {
        ...state,
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
        queue: newQueue,
        queueIndex: newIndex,
        originalQueue: newOriginalQueue,
        playingContext: context || state.playingContext,
        recentlyPlayed: newRecent,
      };
      writePlayerState(newState);
      writeRecent(newRecent);
      return newState;
    }

    case ACTIONS.PAUSE: {
      const newState = { ...state, isPlaying: false };
      writePlayerState(newState);
      return newState;
    }

    case ACTIONS.RESUME: {
      const newState = { ...state, isPlaying: true };
      writePlayerState(newState);
      return newState;
    }

    case ACTIONS.SEEK: {
      return { ...state, currentTime: action.payload.time };
    }

    case ACTIONS.SET_DURATION: {
      if (state.duration === action.payload.duration) return state;
      return { ...state, duration: action.payload.duration };
    }

    case ACTIONS.SET_CURRENT_TIME: {
      return { ...state, currentTime: action.payload.time };
    }

    case ACTIONS.SET_VOLUME: {
      const newState = { ...state, volume: action.payload.volume, isMuted: false };
      writePlayerState(newState);
      return newState;
    }

    case ACTIONS.TOGGLE_MUTE: {
      const newState = { ...state, isMuted: !state.isMuted };
      writePlayerState(newState);
      return newState;
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    case ACTIONS.NEXT_TRACK: {
      const { queue, queueIndex, repeatMode } = state;
      if (!queue.length) return state;

      let nextIndex;
      if (repeatMode === 'one') {
        nextIndex = queueIndex;
      } else if (queueIndex < queue.length - 1) {
        nextIndex = queueIndex + 1;
      } else if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return { ...state, isPlaying: false };
      }

      const track = queue[nextIndex];
      const newRecent = addToRecent(state.recentlyPlayed, track);
      const newState = {
        ...state,
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
        queueIndex: nextIndex,
        recentlyPlayed: newRecent,
      };
      writePlayerState(newState);
      writeRecent(newRecent);
      return newState;
    }

    case ACTIONS.PREV_TRACK: {
      const { queue, queueIndex, currentTime } = state;
      if (!queue.length) return state;

      // If more than 3s in, restart current track
      if (currentTime > 3) {
        return { ...state, currentTime: 0 };
      }

      const prevIndex = queueIndex > 0 ? queueIndex - 1 : 0;
      const track = queue[prevIndex];
      const newRecent = addToRecent(state.recentlyPlayed, track);
      const newState = {
        ...state,
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
        queueIndex: prevIndex,
        recentlyPlayed: newRecent,
      };
      writePlayerState(newState);
      writeRecent(newRecent);
      return newState;
    }

    case ACTIONS.TOGGLE_SHUFFLE: {
      if (!state.isShuffled) {
        // Enable shuffle: save original, shuffle queue
        const original = [...state.queue];
        const shuffled = fisherYates(original);
        // Find current track in shuffled and put it first
        const currentIdx = shuffled.findIndex((t) => t.videoId === state.currentTrack?.videoId);
        if (currentIdx > 0) {
          [shuffled[0], shuffled[currentIdx]] = [shuffled[currentIdx], shuffled[0]];
        }
        const newState = {
          ...state,
          isShuffled: true,
          originalQueue: original,
          queue: shuffled,
          queueIndex: 0,
        };
        writePlayerState(newState);
        return newState;
      } else {
        // Disable shuffle: restore original queue, find current track
        const original = state.originalQueue;
        const currentIdx = original.findIndex((t) => t.videoId === state.currentTrack?.videoId);
        const newState = {
          ...state,
          isShuffled: false,
          queue: original,
          queueIndex: currentIdx >= 0 ? currentIdx : 0,
        };
        writePlayerState(newState);
        return newState;
      }
    }

    case ACTIONS.CYCLE_REPEAT: {
      const currentIdx = REPEAT_CYCLE.indexOf(state.repeatMode);
      const nextRepeat = REPEAT_CYCLE[(currentIdx + 1) % REPEAT_CYCLE.length];
      const newState = { ...state, repeatMode: nextRepeat };
      writePlayerState(newState);
      return newState;
    }

    // ── Queue ─────────────────────────────────────────────────────────────────

    case ACTIONS.ADD_TO_QUEUE: {
      const track = action.payload.track;
      const newQueue = [...state.queue, track];
      const newState = { ...state, queue: newQueue, originalQueue: [...state.originalQueue, track] };
      writePlayerState(newState);
      return newState;
    }

    case ACTIONS.PLAY_NEXT: {
      const track = action.payload.track;
      const insertAt = state.queueIndex + 1;
      const newQueue = [
        ...state.queue.slice(0, insertAt),
        track,
        ...state.queue.slice(insertAt),
      ];
      const newState = { ...state, queue: newQueue };
      writePlayerState(newState);
      return newState;
    }

    case ACTIONS.REMOVE_FROM_QUEUE: {
      const idx = action.payload.index;
      const newQueue = state.queue.filter((_, i) => i !== idx);
      let newIndex = state.queueIndex;
      if (idx < state.queueIndex) newIndex--;
      else if (idx === state.queueIndex) newIndex = Math.min(newIndex, newQueue.length - 1);
      const newState = { ...state, queue: newQueue, queueIndex: newIndex };
      writePlayerState(newState);
      return newState;
    }

    case ACTIONS.CLEAR_QUEUE: {
      const newState = {
        ...state,
        queue: state.currentTrack ? [state.currentTrack] : [],
        queueIndex: state.currentTrack ? 0 : -1,
        originalQueue: [],
      };
      writePlayerState(newState);
      return newState;
    }

    case ACTIONS.REORDER_QUEUE: {
      const { fromIndex, toIndex } = action.payload;
      const newQueue = [...state.queue];
      const [moved] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, moved);

      let newIndex = state.queueIndex;
      if (fromIndex === state.queueIndex) newIndex = toIndex;
      else if (fromIndex < state.queueIndex && toIndex >= state.queueIndex) newIndex--;
      else if (fromIndex > state.queueIndex && toIndex <= state.queueIndex) newIndex++;

      const newState = { ...state, queue: newQueue, queueIndex: newIndex };
      writePlayerState(newState);
      return newState;
    }

    case ACTIONS.SET_QUEUE: {
      const { queue, queueIndex, context } = action.payload;
      const newState = {
        ...state,
        queue,
        queueIndex: queueIndex ?? 0,
        currentTrack: queue[queueIndex ?? 0] || null,
        isPlaying: true,
        currentTime: 0,
        originalQueue: state.isShuffled ? state.originalQueue : queue,
        playingContext: context || state.playingContext,
      };
      writePlayerState(newState);
      return newState;
    }

    case ACTIONS.UPDATE_QUEUE: {
      // Replace the queue WITHOUT changing the current track or restarting playback.
      // Used for background autoqueue injection (e.g., related songs).
      const { queue: newQueue } = action.payload;
      const updatedState = {
        ...state,
        queue: newQueue,
        // Keep the current track at index 0 (it's always first in the new queue)
        queueIndex: 0,
        originalQueue: state.isShuffled ? state.originalQueue : newQueue,
      };
      writePlayerState(updatedState);
      return updatedState;
    }

    // ── Liked Songs ───────────────────────────────────────────────────────────

    case ACTIONS.LIKE_TRACK: {
      const track = action.payload.track;
      const exists = state.likedSongs.some((t) => t.videoId === track.videoId);
      if (exists) return state;
      const updated = [{ ...track, likedAt: new Date().toISOString() }, ...state.likedSongs];
      writeLikedSongs(updated);
      return { ...state, likedSongs: updated };
    }

    case ACTIONS.UNLIKE_TRACK: {
      const videoId = action.payload.videoId;
      const updated = state.likedSongs.filter((t) => t.videoId !== videoId);
      writeLikedSongs(updated);
      return { ...state, likedSongs: updated };
    }

    // ── Playlists ─────────────────────────────────────────────────────────────

    case ACTIONS.CREATE_PLAYLIST: {
      const { id, name, description } = action.payload;
      const now = new Date().toISOString();
      const playlist = {
        id,
        name,
        description: description || '',
        coverUrl: null,
        createdAt: now,
        updatedAt: now,
        tracks: [],
      };
      const updated = [...state.playlists, playlist];
      writePlaylists(updated);
      return { ...state, playlists: updated };
    }

    case ACTIONS.DELETE_PLAYLIST: {
      const updated = state.playlists.filter((p) => p.id !== action.payload.id);
      writePlaylists(updated);
      return { ...state, playlists: updated };
    }

    case ACTIONS.RENAME_PLAYLIST: {
      const updated = state.playlists.map((p) =>
        p.id === action.payload.id
          ? { ...p, name: action.payload.name, updatedAt: new Date().toISOString() }
          : p,
      );
      writePlaylists(updated);
      return { ...state, playlists: updated };
    }

    case ACTIONS.ADD_TO_PLAYLIST: {
      const { playlistId, track } = action.payload;
      const updated = state.playlists.map((p) => {
        if (p.id !== playlistId) return p;
        if (p.tracks.some((t) => t.videoId === track.videoId)) return p;
        const newTracks = [...p.tracks, track];
        return {
          ...p,
          tracks: newTracks,
          coverUrl: p.coverUrl || track.thumbnail,
          updatedAt: new Date().toISOString(),
        };
      });
      writePlaylists(updated);
      return { ...state, playlists: updated };
    }

    case ACTIONS.REMOVE_FROM_PLAYLIST: {
      const { playlistId, videoId } = action.payload;
      const updated = state.playlists.map((p) => {
        if (p.id !== playlistId) return p;
        const newTracks = p.tracks.filter((t) => t.videoId !== videoId);
        return {
          ...p,
          tracks: newTracks,
          coverUrl: newTracks[0]?.thumbnail || null,
          updatedAt: new Date().toISOString(),
        };
      });
      writePlaylists(updated);
      return { ...state, playlists: updated };
    }

    case ACTIONS.REORDER_PLAYLIST: {
      const { playlistId, fromIndex, toIndex } = action.payload;
      const updated = state.playlists.map((p) => {
        if (p.id !== playlistId) return p;
        const tracks = [...p.tracks];
        const [moved] = tracks.splice(fromIndex, 1);
        tracks.splice(toIndex, 0, moved);
        return { ...p, tracks, updatedAt: new Date().toISOString() };
      });
      writePlaylists(updated);
      return { ...state, playlists: updated };
    }

    // ── Search ────────────────────────────────────────────────────────────────

    case ACTIONS.SET_SEARCH_QUERY: {
      return { ...state, searchQuery: action.payload.query };
    }

    case ACTIONS.SET_SEARCH_RESULTS: {
      return {
        ...state,
        searchResults: action.payload.results,
        isSearching: false,
      };
    }

    case ACTIONS.SET_SEARCHING: {
      return { ...state, isSearching: action.payload.value };
    }

    case ACTIONS.SET_SUGGESTIONS: {
      return { ...state, suggestions: action.payload.suggestions };
    }

    // ── UI ────────────────────────────────────────────────────────────────────

    case ACTIONS.SET_VIEW: {
      return { ...state, activeView: action.payload.view, activePlaylistId: action.payload.playlistId || null };
    }

    case ACTIONS.TOGGLE_MINI_PLAYER: {
      return { ...state, isMiniPlayer: !state.isMiniPlayer };
    }

    case ACTIONS.SET_PLAYING_CONTEXT: {
      return { ...state, playingContext: action.payload.context };
    }
    
    case ACTIONS.SHOW_TOAST: {
      return { ...state, toast: { message: action.payload.message, type: action.payload.type || 'info' } };
    }
    
    case ACTIONS.HIDE_TOAST: {
      return { ...state, toast: null };
    }

    // ── Storage ───────────────────────────────────────────────────────────────

    case ACTIONS.LOAD_FROM_STORAGE: {
      return { ...state, ...action.payload };
    }

    case ACTIONS.ADD_TO_RECENT: {
      const newRecent = addToRecent(state.recentlyPlayed, action.payload.track);
      writeRecent(newRecent);
      return { ...state, recentlyPlayed: newRecent };
    }

    case ACTIONS.CLEAR_RECENT: {
      writeRecent([]);
      return { ...state, recentlyPlayed: [] };
    }

    default:
      return state;
  }
}
