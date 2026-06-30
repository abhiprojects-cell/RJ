// useLibrary.js — localStorage read/write for all user data

import { useCallback } from 'react';
import { useMusicState, useMusicDispatch } from '../context/MusicContext.jsx';
import { ACTIONS } from '../utils/constants.js';
import { generateId } from '../utils/storage.js';

export function useLibrary() {
  const { likedSongs, playlists, recentlyPlayed } = useMusicState();
  const dispatch = useMusicDispatch();

  // ── Liked Songs ───────────────────────────────────────────────────────────

  const likeTrack = useCallback((track) => {
    dispatch({ type: ACTIONS.LIKE_TRACK, payload: { track } });
  }, [dispatch]);

  const unlikeTrack = useCallback((videoId) => {
    dispatch({ type: ACTIONS.UNLIKE_TRACK, payload: { videoId } });
  }, [dispatch]);

  const isLiked = useCallback((videoId) => {
    return likedSongs.some((t) => t.videoId === videoId);
  }, [likedSongs]);

  const toggleLike = useCallback((track) => {
    if (likedSongs.some((t) => t.videoId === track.videoId)) {
      dispatch({ type: ACTIONS.UNLIKE_TRACK, payload: { videoId: track.videoId } });
    } else {
      dispatch({ type: ACTIONS.LIKE_TRACK, payload: { track } });
    }
  }, [likedSongs, dispatch]);

  // ── Playlists ─────────────────────────────────────────────────────────────

  const createPlaylist = useCallback((name, description = '') => {
    const id = generateId();
    dispatch({ type: ACTIONS.CREATE_PLAYLIST, payload: { id, name, description } });
    return id;
  }, [dispatch]);

  const deletePlaylist = useCallback((id) => {
    dispatch({ type: ACTIONS.DELETE_PLAYLIST, payload: { id } });
  }, [dispatch]);

  const renamePlaylist = useCallback((id, name) => {
    dispatch({ type: ACTIONS.RENAME_PLAYLIST, payload: { id, name } });
  }, [dispatch]);

  const addToPlaylist = useCallback((playlistId, track) => {
    dispatch({ type: ACTIONS.ADD_TO_PLAYLIST, payload: { playlistId, track } });
  }, [dispatch]);

  const removeFromPlaylist = useCallback((playlistId, videoId) => {
    dispatch({ type: ACTIONS.REMOVE_FROM_PLAYLIST, payload: { playlistId, videoId } });
  }, [dispatch]);

  const reorderPlaylist = useCallback((playlistId, fromIndex, toIndex) => {
    dispatch({ type: ACTIONS.REORDER_PLAYLIST, payload: { playlistId, fromIndex, toIndex } });
  }, [dispatch]);

  const getPlaylist = useCallback((id) => {
    return playlists.find((p) => p.id === id) || null;
  }, [playlists]);

  const isInPlaylist = useCallback((playlistId, videoId) => {
    const pl = playlists.find((p) => p.id === playlistId);
    return pl ? pl.tracks.some((t) => t.videoId === videoId) : false;
  }, [playlists]);

  // Share playlist as base64 URL param
  const sharePlaylist = useCallback((playlistId) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return null;
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(pl))));
    const url = `${window.location.origin}/music?playlist=${encoded}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    return url;
  }, [playlists]);

  // Import shared playlist from URL param
  const importPlaylistFromUrl = useCallback((encoded) => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
      const id = generateId();
      const now = new Date().toISOString();
      dispatch({
        type: ACTIONS.CREATE_PLAYLIST,
        payload: { id, name: decoded.name, description: decoded.description || '' },
      });
      (decoded.tracks || []).forEach((track) => {
        dispatch({ type: ACTIONS.ADD_TO_PLAYLIST, payload: { playlistId: id, track } });
      });
      return id;
    } catch {
      return null;
    }
  }, [dispatch]);

  // ── Recently Played ───────────────────────────────────────────────────────

  const clearRecent = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_RECENT });
  }, [dispatch]);

  return {
    likedSongs,
    playlists,
    recentlyPlayed,
    likeTrack,
    unlikeTrack,
    isLiked,
    toggleLike,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    reorderPlaylist,
    getPlaylist,
    isInPlaylist,
    sharePlaylist,
    importPlaylistFromUrl,
    clearRecent,
  };
}
