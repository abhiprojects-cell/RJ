// usePlayer.js — Playback controls via YouTube IFrame API

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMusicState, useMusicDispatch, useMusicAudio } from '../context/MusicContext.jsx';
import { ACTIONS } from '../utils/constants.js';

export function usePlayer() {
  const state = useMusicState();
  const dispatch = useMusicDispatch();
  const { youtubePlayerRef } = useMusicAudio();
  const timeUpdateIntervalRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);

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

  // ── 1. Initialize YouTube IFrame API ─────────────────────────────────────────
  useEffect(() => {
    // If already loaded or loading, do nothing
    if (window.YT && window.YT.Player) {
      if (!youtubePlayerRef.current) initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    function initPlayer() {
      // Must wait for the DOM element 'youtube-player' to exist
      let checkExist = null;
      const checkFn = () => {
        if (document.getElementById('youtube-player')) {
          if (checkExist) clearInterval(checkExist);
          checkExist = null;
          
          youtubePlayerRef.current = new window.YT.Player('youtube-player', {
            height: '0',
            width: '0',
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              playsinline: 1,
            },
            events: {
              onReady: (event) => {
                setPlayerReady(true);
                // Apply initial volume
                event.target.setVolume(isMuted ? 0 : volume * 100);
              },
              onStateChange: onPlayerStateChange,
              onError: onPlayerError,
            },
          });
        }
      };
      checkExist = setInterval(checkFn, 100);
      return () => {
        if (checkExist) clearInterval(checkExist);
      };
    }

    return () => {
      // Cleanup if component unmounts entirely
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Handle YouTube Player Events ──────────────────────────────────────────
  
  const onPlayerStateChange = useCallback((event) => {
    const YT = window.YT;
    if (!YT) return;

    if (event.data === YT.PlayerState.PLAYING) {
      // Ensure sync
      if (!state.isPlaying) {
         // dispatch({ type: ACTIONS.RESUME }); // Can cause loops, usually we trust our own state
      }
      
      // Get duration once it starts playing
      const dur = event.target.getDuration();
      if (dur && dur !== state.duration) {
        dispatch({ type: ACTIONS.SET_DURATION, payload: { duration: dur } });
      }

      // Start timeupdate polling
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = setInterval(() => {
        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
          dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time: youtubePlayerRef.current.getCurrentTime() } });
          
          const currentDur = youtubePlayerRef.current.getDuration();
          if (currentDur) {
            dispatch({ type: ACTIONS.SET_DURATION, payload: { duration: currentDur } });
          }
        }
      }, 500);

    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.BUFFERING) {
      clearInterval(timeUpdateIntervalRef.current);
    } else if (event.data === YT.PlayerState.ENDED) {
      clearInterval(timeUpdateIntervalRef.current);
      dispatch({ type: ACTIONS.NEXT_TRACK });
    }
  }, [state.isPlaying, state.duration, dispatch, youtubePlayerRef]);

  const onPlayerError = useCallback((event) => {
    console.error('[usePlayer] YouTube Player Error:', event.data);
    // Auto-skip on error
    setTimeout(() => {
      dispatch({ type: ACTIONS.NEXT_TRACK });
    }, 1500);
  }, [dispatch]);

  // ── 3. Sync Volume and Mute ──────────────────────────────────────────────────
  useEffect(() => {
    if (!playerReady || !youtubePlayerRef.current) return;
    try {
      if (isMuted) {
        youtubePlayerRef.current.mute();
      } else {
        youtubePlayerRef.current.unMute();
        youtubePlayerRef.current.setVolume(volume * 100);
      }
    } catch (err) {}
  }, [volume, isMuted, playerReady, youtubePlayerRef]);

  // ── 4. Load and Play Track ───────────────────────────────────────────────────
  useEffect(() => {
    if (!playerReady || !youtubePlayerRef.current || !currentTrack) return;

    try {
      const player = youtubePlayerRef.current;
      // Load video by ID
      if (isPlaying) {
        player.loadVideoById(currentTrack.videoId, state.currentTime > 0 ? state.currentTime : 0);
      } else {
        player.cueVideoById(currentTrack.videoId, state.currentTime > 0 ? state.currentTime : 0);
      }
    } catch (err) {
      console.error('[usePlayer] Failed to load video:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.videoId, playerReady]);

  // ── 5. Sync Play/Pause state ─────────────────────────────────────────────────
  useEffect(() => {
    if (!playerReady || !youtubePlayerRef.current || !currentTrack) return;
    
    try {
      const player = youtubePlayerRef.current;
      const playerState = player.getPlayerState ? player.getPlayerState() : -1;
      const YT = window.YT;
      
      if (isPlaying && playerState !== YT?.PlayerState.PLAYING && playerState !== YT?.PlayerState.BUFFERING) {
        player.playVideo();
      } else if (!isPlaying && playerState === YT?.PlayerState.PLAYING) {
        player.pauseVideo();
      }
    } catch (err) {}
  }, [isPlaying, playerReady, currentTrack, youtubePlayerRef]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(timeUpdateIntervalRef.current);
    };
  }, []);

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
    if (youtubePlayerRef.current && typeof youtubePlayerRef.current.seekTo === 'function') {
      youtubePlayerRef.current.seekTo(time, true);
    }
    dispatch({ type: ACTIONS.SEEK, payload: { time } });
  }, [youtubePlayerRef, dispatch]);

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
