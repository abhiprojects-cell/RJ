// usePlayer.js — Playback controls via HTML5 Audio and Backend Streams

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMusicState, useMusicDispatch, useMusicAudio } from '../context/MusicContext.jsx';
import { ACTIONS } from '../utils/constants.js';
import { fetchStreamUrlWithRetry } from '../api/musicApi.js';

export function usePlayer() {
  const state = useMusicState();
  const dispatch = useMusicDispatch();
  const { audioRef } = useMusicAudio();
  const [isBuffering, setIsBuffering] = useState(false);
  const streamCacheRef = useRef({});

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    currentTime,
    duration,
    queue,
    queueIndex,
  } = state;

  // ── 1. Load and Play Track via backend stream ────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.videoId) return;

    let isSubscribed = true;

    const loadStream = async () => {
      try {
        setIsBuffering(true);
        // Check local cache first so we don't re-fetch if they play the same song again
        let url = streamCacheRef.current[currentTrack.videoId];
        
        if (!url) {
          const res = await fetchStreamUrlWithRetry(currentTrack.videoId);
          url = res.audioUrl;
          streamCacheRef.current[currentTrack.videoId] = url;
        }

        if (!isSubscribed) return;

        // Only set src if it's different to prevent resetting playback
        if (audio.src !== url) {
          audio.src = url;
          audio.load();
        }

        if (isPlaying) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => console.error('[usePlayer] Auto-play prevented or failed:', err));
          }
        }
      } catch (err) {
        console.error('[usePlayer] Failed to load stream:', err);
        if (isSubscribed) {
          // Auto-skip on error after a brief delay
          setTimeout(() => dispatch({ type: ACTIONS.NEXT_TRACK }), 1500);
        }
      } finally {
        if (isSubscribed) setIsBuffering(false);
      }
    };

    loadStream();

    return () => {
      isSubscribed = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.videoId]);

  // ── 2. Sync Play/Pause state ─────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying && audio.paused) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('[usePlayer] Play prevented:', err);
          dispatch({ type: ACTIONS.PAUSE });
        });
      }
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, audioRef]);

  // ── 3. Sync Volume and Mute ──────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted, audioRef]);

  // ── 4. HTML5 Audio Event Listeners ───────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time: audio.currentTime } });
    };

    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        dispatch({ type: ACTIONS.SET_DURATION, payload: { duration: audio.duration } });
      }
    };

    const onEnded = () => {
      dispatch({ type: ACTIONS.NEXT_TRACK });
    };

    const onPlay = () => {
      if (!state.isPlaying) dispatch({ type: ACTIONS.RESUME });
    };

    const onPause = () => {
      if (state.isPlaying) dispatch({ type: ACTIONS.PAUSE });
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    
    const onError = (e) => {
      console.error('[usePlayer] HTML5 Audio Error:', e);
      setTimeout(() => dispatch({ type: ACTIONS.NEXT_TRACK }), 1500);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
    };
  }, [audioRef, dispatch, state.isPlaying]);

  // ── 5. Media Session API (Background & Lockscreen Controls) ──────────────────
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist || currentTrack.channelTitle || 'Unknown Artist',
        album: 'CEA Music',
        artwork: [
          {
            src: currentTrack.thumbnail || `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg`,
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        dispatch({ type: ACTIONS.RESUME });
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        dispatch({ type: ACTIONS.PAUSE });
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        dispatch({ type: ACTIONS.PREV_TRACK });
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        dispatch({ type: ACTIONS.NEXT_TRACK });
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time: details.seekTime } });
        }
      });
    }
  }, [currentTrack, dispatch, audioRef]);

  // Sync media session playback state
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // ── Controls ───────────────────────────────────────────────────────────────

  const play = useCallback((track, queue, queueIndex, context) => {
    dispatch({ type: ACTIONS.PLAY_TRACK, payload: { track, queue, queueIndex, context } });
  }, [dispatch]);

  const pause = useCallback(() => {
    dispatch({ type: ACTIONS.PAUSE });
  }, [dispatch]);

  const resume = useCallback(() => {
    dispatch({ type: ACTIONS.RESUME });
  }, [dispatch]);

  const togglePlay = useCallback(() => {
    if (isPlaying) dispatch({ type: ACTIONS.PAUSE });
    else dispatch({ type: ACTIONS.RESUME });
  }, [isPlaying, dispatch]);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    dispatch({ type: ACTIONS.SEEK, payload: { time } });
  }, [audioRef, dispatch]);

  const setVolume = useCallback((vol) => {
    dispatch({ type: ACTIONS.SET_VOLUME, payload: { volume: Math.max(0, Math.min(1, vol)) } });
  }, [dispatch]);

  const toggleMute = useCallback(() => {
    dispatch({ type: ACTIONS.TOGGLE_MUTE });
  }, [dispatch]);

  const next = useCallback(() => {
    dispatch({ type: ACTIONS.NEXT_TRACK });
  }, [dispatch]);

  const prev = useCallback(() => {
    dispatch({ type: ACTIONS.PREV_TRACK });
  }, [dispatch]);

  const toggleShuffle = useCallback(() => {
    dispatch({ type: ACTIONS.TOGGLE_SHUFFLE });
  }, [dispatch]);

  const cycleRepeat = useCallback(() => {
    dispatch({ type: ACTIONS.CYCLE_REPEAT });
  }, [dispatch]);

  const playQueue = useCallback((tracks, startIndex = 0, context = null) => {
    if (!tracks.length) return;
    const track = tracks[startIndex];
    dispatch({ type: ACTIONS.SET_QUEUE, payload: { queue: tracks, queueIndex: startIndex, context } });
    dispatch({ type: ACTIONS.PLAY_TRACK, payload: { track, queue: tracks, queueIndex: startIndex, context } });
  }, [dispatch]);

  return {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    currentTime,
    duration,
    queue,
    queueIndex,
    isBuffering,
    play,
    pause,
    resume,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
    playQueue,
  };
}
