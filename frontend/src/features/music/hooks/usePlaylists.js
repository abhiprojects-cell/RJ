// usePlaylists.js — Create/edit/delete playlists

import { useCallback } from 'react';
import { useMusicState, useMusicDispatch } from '../context/MusicContext.jsx';
import { ACTIONS } from '../utils/constants.js';
import { generateId } from '../utils/storage.js';

export function usePlaylists() {
  const { playlists } = useMusicState();
  const dispatch = useMusicDispatch();

  const createPlaylist = useCallback(
    (name, description = '') => {
      const id = generateId();
      dispatch({ type: ACTIONS.CREATE_PLAYLIST, payload: { id, name, description } });
      return id;
    },
    [dispatch],
  );

  const deletePlaylist = useCallback(
    (id) => dispatch({ type: ACTIONS.DELETE_PLAYLIST, payload: { id } }),
    [dispatch],
  );

  const renamePlaylist = useCallback(
    (id, name) => dispatch({ type: ACTIONS.RENAME_PLAYLIST, payload: { id, name } }),
    [dispatch],
  );

  const addTrack = useCallback(
    (playlistId, track) =>
      dispatch({ type: ACTIONS.ADD_TO_PLAYLIST, payload: { playlistId, track } }),
    [dispatch],
  );

  const removeTrack = useCallback(
    (playlistId, videoId) =>
      dispatch({ type: ACTIONS.REMOVE_FROM_PLAYLIST, payload: { playlistId, videoId } }),
    [dispatch],
  );

  const reorderTracks = useCallback(
    (playlistId, fromIndex, toIndex) =>
      dispatch({ type: ACTIONS.REORDER_PLAYLIST, payload: { playlistId, fromIndex, toIndex } }),
    [dispatch],
  );

  const getPlaylist = useCallback(
    (id) => playlists.find((p) => p.id === id) || null,
    [playlists],
  );

  const isTrackInPlaylist = useCallback(
    (playlistId, videoId) => {
      const pl = playlists.find((p) => p.id === playlistId);
      return pl ? pl.tracks.some((t) => t.videoId === videoId) : false;
    },
    [playlists],
  );

  const sharePlaylist = useCallback(
    (playlistId) => {
      const pl = playlists.find((p) => p.id === playlistId);
      if (!pl) return null;
      try {
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(pl))));
        const url = `${window.location.origin}/music?playlist=${encoded}`;
        if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
        return url;
      } catch {
        return null;
      }
    },
    [playlists],
  );

  return {
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addTrack,
    removeTrack,
    reorderTracks,
    getPlaylist,
    isTrackInPlaylist,
    sharePlaylist,
  };
}
