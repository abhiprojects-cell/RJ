// useQueue.js — Queue CRUD operations

import { useCallback } from 'react';
import { useMusicState, useMusicDispatch } from '../context/MusicContext.jsx';
import { ACTIONS } from '../utils/constants.js';

export function useQueue() {
  const { queue, queueIndex, currentTrack, playingContext } = useMusicState();
  const dispatch = useMusicDispatch();

  const addToQueue = useCallback((track) => {
    dispatch({ type: ACTIONS.ADD_TO_QUEUE, payload: { track } });
    dispatch({
      type: ACTIONS.SHOW_TOAST,
      payload: { message: 'Added to queue', type: 'info' }
    });
  }, [dispatch]);

  const playNext = useCallback((track) => {
    dispatch({ type: ACTIONS.PLAY_NEXT, payload: { track } });
  }, [dispatch]);

  const removeFromQueue = useCallback((index) => {
    dispatch({ type: ACTIONS.REMOVE_FROM_QUEUE, payload: { index } });
  }, [dispatch]);

  const clearQueue = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_QUEUE });
  }, [dispatch]);

  const reorderQueue = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    dispatch({ type: ACTIONS.REORDER_QUEUE, payload: { fromIndex, toIndex } });
  }, [dispatch]);

  const setQueue = useCallback((tracks, startIndex = 0, context = null) => {
    dispatch({ type: ACTIONS.SET_QUEUE, payload: { queue: tracks, queueIndex: startIndex, context } });
  }, [dispatch]);

  const isInQueue = useCallback((videoId) => {
    return queue.some((t) => t.videoId === videoId);
  }, [queue]);

  const upcomingTracks = queue.slice(queueIndex + 1);
  const previousTracks = queue.slice(0, queueIndex);

  return {
    queue,
    queueIndex,
    currentTrack,
    upcomingTracks,
    previousTracks,
    playingContext,
    addToQueue,
    playNext,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    setQueue,
    isInQueue,
  };
}
