// usePlayer.js — Playback controls via native HTML5 audio and the backend proxy

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMusicState, useMusicDispatch, useMusicAudio } from '../context/MusicContext.jsx';
import { ACTIONS } from '../utils/constants.js';
import { getAudioProxyUrl } from '../api/musicApi.js';

export function usePlayer() {
  const state = useMusicState();
  const dispatch = useMusicDispatch();
  const { youtubePlayerRef } = useMusicAudio();
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

  useEffect(() => {
    if (!currentTrack?.videoId) {
      setPlayerReady(false);
      return;
    }

    const audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.playsInline = true;
    audio.setAttribute('webkit-playsinline', 'true');

    const playerApi = {
      seekTo: (time) => {
        audio.currentTime = Math.max(0, Number(time) || 0);
      },
      getCurrentTime: () => audio.currentTime || 0,
      getDuration: () => audio.duration || 0,
      mute: () => {
        audio.muted = true;
      },
      unMute: () => {
        audio.muted = false;
      },
      setVolume: (value) => {
        const normalized = value > 1 ? value / 100 : value;
        audio.volume = Math.max(0, Math.min(1, normalized || 0));
      },
      play: () => audio.play(),
      pause: () => audio.pause(),
      load: () => audio.load(),
      getPlayerState: () => {
        if (audio.ended) return 0;
        if (audio.paused) return 2;
        return 1;
      },
    };

    const handleTimeUpdate = () => {
      dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time: audio.currentTime || 0 } });
    };

    const handleDurationChange = () => {
      if (audio.duration) {
        dispatch({ type: ACTIONS.SET_DURATION, payload: { duration: audio.duration } });
      }
    };

    const handleLoadedMetadata = () => {
      setPlayerReady(true);
      if (audio.duration) {
        dispatch({ type: ACTIONS.SET_DURATION, payload: { duration: audio.duration } });
      }
    };

    const handlePlay = () => {
      setPlayerReady(true);
    };

    const handlePause = () => {
      setPlayerReady(true);
    };

    const handleEnded = () => {
      dispatch({ type: ACTIONS.NEXT_TRACK });
    };

    const handleError = () => {
      console.error('[usePlayer] Audio playback error');
      dispatch({ type: ACTIONS.NEXT_TRACK });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    audio.src = getAudioProxyUrl(currentTrack.videoId);
    document.body.appendChild(audio);
    youtubePlayerRef.current = playerApi;
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.remove();
      if (youtubePlayerRef.current === playerApi) {
        youtubePlayerRef.current = null;
      }
    };
  }, [currentTrack?.videoId, dispatch, youtubePlayerRef]);

  useEffect(() => {
    if (!playerReady || !youtubePlayerRef.current || !currentTrack) return;
    try {
      if (isMuted) {
        youtubePlayerRef.current.mute();
      } else {
        youtubePlayerRef.current.unMute();
        youtubePlayerRef.current.setVolume(volume * 100);
      }
    } catch (err) {}
  }, [volume, isMuted, playerReady, currentTrack?.videoId, youtubePlayerRef]);

  useEffect(() => {
    if (!playerReady || !youtubePlayerRef.current || !currentTrack) return;

    try {
      const player = youtubePlayerRef.current;
      if (isPlaying) {
        const playPromise = player.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      } else {
        player.pause();
      }
    } catch (err) {}
  }, [isPlaying, playerReady, currentTrack?.videoId, youtubePlayerRef]);

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
            type: 'image/jpeg',
          },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => { dispatch({ type: ACTIONS.RESUME }); });
      navigator.mediaSession.setActionHandler('pause', () => { dispatch({ type: ACTIONS.PAUSE }); });
      navigator.mediaSession.setActionHandler('previoustrack', () => { dispatch({ type: ACTIONS.PREV_TRACK }); });
      navigator.mediaSession.setActionHandler('nexttrack', () => { dispatch({ type: ACTIONS.NEXT_TRACK }); });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.seekTo === 'function') {
          youtubePlayerRef.current.seekTo(details.seekTime, true);
          dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time: details.seekTime } });
        }
      });
    }
  }, [currentTrack, dispatch, youtubePlayerRef]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

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
