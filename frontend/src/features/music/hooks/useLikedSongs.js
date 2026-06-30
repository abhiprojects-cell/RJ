// useLikedSongs.js — Like/unlike logic with optimistic UI

import { useCallback } from 'react';
import { useMusicState, useMusicDispatch } from '../context/MusicContext.jsx';
import { ACTIONS } from '../utils/constants.js';

export function useLikedSongs() {
  const { likedSongs } = useMusicState();
  const dispatch = useMusicDispatch();

  const isLiked = useCallback(
    (videoId) => likedSongs.some((t) => t.videoId === videoId),
    [likedSongs],
  );

  const like = useCallback(
    (track) => {
      dispatch({ type: ACTIONS.LIKE_TRACK, payload: { track } });
    },
    [dispatch],
  );

  const unlike = useCallback(
    (videoId) => {
      dispatch({ type: ACTIONS.UNLIKE_TRACK, payload: { videoId } });
    },
    [dispatch],
  );

  const toggle = useCallback(
    (track) => {
      if (likedSongs.some((t) => t.videoId === track.videoId)) {
        dispatch({ type: ACTIONS.UNLIKE_TRACK, payload: { videoId: track.videoId } });
      } else {
        dispatch({ type: ACTIONS.LIKE_TRACK, payload: { track } });
      }
    },
    [likedSongs, dispatch],
  );

  return {
    likedSongs,
    isLiked,
    like,
    unlike,
    toggle,
    count: likedSongs.length,
  };
}
