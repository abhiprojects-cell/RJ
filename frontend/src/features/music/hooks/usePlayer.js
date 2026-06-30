// usePlayer.js — Playback via native HTML5 <audio> + backend yt-dlp proxy
// Same-IP extraction and delivery means no YouTube IP mismatch / 403.
// Native <audio> allows background playback on iOS and Android browsers.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMusicState, useMusicDispatch, useMusicAudio } from '../context/MusicContext.jsx';
import { ACTIONS } from '../utils/constants.js';
import { getAudioProxyUrl } from '../api/musicApi.js';

// ── Singleton Audio Element ───────────────────────────────────────────────────
// We use a single persistent audio element to satisfy mobile browser autoplay policies.
// Recreating the element per-track causes iOS/Android to block playback.
const audioEl = document.createElement('audio');
audioEl.preload = 'auto';
audioEl.playsInline = true;
audioEl.setAttribute('webkit-playsinline', 'true');
// We do not append to body immediately here just in case SSR, but since this is React CSR, it's fine.
if (typeof window !== 'undefined' && !document.getElementById('cea-native-audio')) {
  audioEl.id = 'cea-native-audio';
  document.body.appendChild(audioEl);
}

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

  // ── 1. Setup Singleton Audio & Listeners ─────────────────────────────────────
  useEffect(() => {
    // Expose API
    const playerApi = {
      seekTo:         (t) => { audioEl.currentTime = Math.max(0, Number(t) || 0); },
      getCurrentTime: () => audioEl.currentTime || 0,
      getDuration:    () => audioEl.duration || 0,
      mute:           () => { audioEl.muted = true; },
      unMute:         () => { audioEl.muted = false; },
      setVolume:      (v) => { audioEl.volume = Math.max(0, Math.min(1, v > 1 ? v / 100 : v)); },
      play:           () => audioEl.play(),
      pause:          () => audioEl.pause(),
      getPlayerState: () => audioEl.ended ? 0 : audioEl.paused ? 2 : 1,
    };
    youtubePlayerRef.current = playerApi;

    const onTimeUpdate    = () => dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time: audioEl.currentTime || 0 } });
    const onDuration      = () => { if (audioEl.duration) dispatch({ type: ACTIONS.SET_DURATION, payload: { duration: audioEl.duration } }); };
    const onLoadedMeta    = () => { setPlayerReady(true); if (audioEl.duration) dispatch({ type: ACTIONS.SET_DURATION, payload: { duration: audioEl.duration } }); };
    const onCanPlay       = () => setPlayerReady(true);
    const onEnded         = () => dispatch({ type: ACTIONS.NEXT_TRACK });
    const onError         = (e) => { 
      // Ignored if src is empty
      if (!audioEl.src || audioEl.src.endsWith('undefined')) return;
      console.error('[usePlayer] audio error', e); 
      dispatch({ type: ACTIONS.NEXT_TRACK }); 
    };

    audioEl.addEventListener('timeupdate',     onTimeUpdate);
    audioEl.addEventListener('durationchange', onDuration);
    audioEl.addEventListener('loadedmetadata', onLoadedMeta);
    audioEl.addEventListener('canplay',        onCanPlay);
    audioEl.addEventListener('ended',          onEnded);
    audioEl.addEventListener('error',          onError);

    return () => {
      audioEl.removeEventListener('timeupdate',     onTimeUpdate);
      audioEl.removeEventListener('durationchange', onDuration);
      audioEl.removeEventListener('loadedmetadata', onLoadedMeta);
      audioEl.removeEventListener('canplay',        onCanPlay);
      audioEl.removeEventListener('ended',          onEnded);
      audioEl.removeEventListener('error',          onError);
      if (youtubePlayerRef.current === playerApi) youtubePlayerRef.current = null;
    };
  }, [dispatch, youtubePlayerRef]);

  // ── 1.5. Update src on track change ──────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack?.videoId) {
      setPlayerReady(false);
      audioEl.removeAttribute('src');
      audioEl.load();
      return;
    }

    setPlayerReady(false);
    audioEl.src = getAudioProxyUrl(currentTrack.videoId);
    audioEl.load();
    
    if (isPlaying) {
      const p = audioEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.videoId]);

  // ── 2. Sync volume / mute ────────────────────────────────────────────────────
  useEffect(() => {
    if (!playerReady || !youtubePlayerRef.current) return;
    try {
      if (isMuted) {
        youtubePlayerRef.current.mute();
      } else {
        youtubePlayerRef.current.unMute();
        youtubePlayerRef.current.setVolume(volume);
      }
    } catch (_) {}
  }, [volume, isMuted, playerReady, youtubePlayerRef]);

  // ── 3. Sync play / pause ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!playerReady || !youtubePlayerRef.current || !currentTrack) return;
    try {
      if (isPlaying) {
        const p = youtubePlayerRef.current.play();
        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
             console.warn('Playback prevented:', err);
             // If browser blocked it, we must pause state visually
             if (err.name === 'NotAllowedError') {
                dispatch({ type: ACTIONS.PAUSE });
             }
          });
        }
      } else {
        youtubePlayerRef.current.pause();
      }
    } catch (_) {}
  }, [isPlaying, playerReady, currentTrack?.videoId, youtubePlayerRef, dispatch]);

  // ── 4. MediaSession API (lock-screen / notification controls) ─────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title:   currentTrack.title,
      artist:  currentTrack.artist || currentTrack.channelTitle || 'Unknown Artist',
      album:   'CEA Music',
      artwork: [
        {
          src:   currentTrack.thumbnail || `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg`,
          sizes: '512x512',
          type:  'image/jpeg',
        },
      ],
    });

    navigator.mediaSession.setActionHandler('play',          () => dispatch({ type: ACTIONS.RESUME }));
    navigator.mediaSession.setActionHandler('pause',         () => dispatch({ type: ACTIONS.PAUSE }));
    navigator.mediaSession.setActionHandler('previoustrack', () => dispatch({ type: ACTIONS.PREV_TRACK }));
    navigator.mediaSession.setActionHandler('nexttrack',     () => dispatch({ type: ACTIONS.NEXT_TRACK }));
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(details.seekTime);
        dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time: details.seekTime } });
      }
    });
  }, [currentTrack, dispatch, youtubePlayerRef]);

  // Sync OS playback state badge (play/pause indicator on lock screen)
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // ── Controls (dispatch to reducer; effects above react and drive the audio) ───
  const play = useCallback((track, queue, queueIndex, context) => {
    // Attempt to unlock audio synchronously on user interaction
    if (audioEl.paused) {
      const p = audioEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    dispatch({ type: ACTIONS.PLAY_TRACK, payload: { track, queue, queueIndex, context } });
  }, [dispatch]);

  const pause = useCallback(() => {
    audioEl.pause();
    dispatch({ type: ACTIONS.PAUSE });
  }, [dispatch]);

  const resume = useCallback(() => {
    const p = audioEl.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    dispatch({ type: ACTIONS.RESUME });
  }, [dispatch]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioEl.pause();
      dispatch({ type: ACTIONS.PAUSE });
    } else {
      const p = audioEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      dispatch({ type: ACTIONS.RESUME });
    }
  }, [isPlaying, dispatch]);

  const seek = useCallback((time) => {
    if (youtubePlayerRef.current) youtubePlayerRef.current.seekTo(time);
    dispatch({ type: ACTIONS.SEEK, payload: { time } });
  }, [youtubePlayerRef, dispatch]);

  const setVolume = useCallback((vol) => {
    dispatch({ type: ACTIONS.SET_VOLUME, payload: { volume: Math.max(0, Math.min(1, vol)) } });
  }, [dispatch]);

  const toggleMute     = useCallback(() => dispatch({ type: ACTIONS.TOGGLE_MUTE }), [dispatch]);
  const next           = useCallback(() => dispatch({ type: ACTIONS.NEXT_TRACK }),  [dispatch]);
  const prev           = useCallback(() => dispatch({ type: ACTIONS.PREV_TRACK }),  [dispatch]);
  const toggleShuffle  = useCallback(() => dispatch({ type: ACTIONS.TOGGLE_SHUFFLE }), [dispatch]);
  const cycleRepeat    = useCallback(() => dispatch({ type: ACTIONS.CYCLE_REPEAT }),   [dispatch]);

  const playQueue = useCallback((tracks, startIndex = 0, context = null) => {
    if (!tracks.length) return;
    const track = tracks[startIndex];
    dispatch({ type: ACTIONS.SET_QUEUE,    payload: { queue: tracks, queueIndex: startIndex, context } });
    dispatch({ type: ACTIONS.PLAY_TRACK,   payload: { track, queue: tracks, queueIndex: startIndex, context } });
  }, [dispatch]);

  return {
    currentTrack, isPlaying, volume, isMuted, isShuffled, repeatMode,
    currentTime, duration, queue, queueIndex,
    play, pause, resume, togglePlay, seek, setVolume,
    toggleMute, next, prev, toggleShuffle, cycleRepeat, playQueue,
  };
}
