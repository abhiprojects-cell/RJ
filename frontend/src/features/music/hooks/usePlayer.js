// usePlayer.js — Playback via native HTML5 <audio> + backend yt-dlp proxy
// Same-IP extraction and delivery means no YouTube IP mismatch / 403.
// Native <audio> allows REAL background playback on iOS and Android (like Spotify).

import { useCallback, useEffect, useRef } from 'react';
import { useMusicState, useMusicDispatch, useMusicAudio } from '../context/MusicContext.jsx';
import { ACTIONS } from '../utils/constants.js';
import { getAudioProxyUrl } from '../api/musicApi.js';

// ── Singleton Audio Element ───────────────────────────────────────────────────
// One persistent element to satisfy mobile autoplay policies.
// Recreating per-track causes iOS/Android to block background playback.
let audioEl;
if (typeof window !== 'undefined') {
  audioEl = document.getElementById('cea-native-audio');
  if (!audioEl) {
    audioEl = document.createElement('audio');
    audioEl.id = 'cea-native-audio';
    audioEl.preload = 'auto';
    audioEl.playsInline = true;
    audioEl.setAttribute('webkit-playsinline', 'true');
    document.body.appendChild(audioEl);
  }
}

// ── Module-level state mirror ─────────────────────────────────────────────────
// Event handlers (visibilitychange, MediaSession) are registered once and
// cannot read React state via closures without going stale. We keep a plain
// object in sync with the latest render so those handlers always see fresh values.
const liveState = {
  isPlaying:    false,
  volume:       0.8,
  isMuted:      false,
  currentTrack: null,
};

// ── usePlayer hook ─────────────────────────────────────────────────────────────
export function usePlayer() {
  const state    = useMusicState();
  const dispatch = useMusicDispatch();
  const { youtubePlayerRef } = useMusicAudio();

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

  // Keep the module-level mirror in sync on every render (no overhead)
  liveState.isPlaying    = isPlaying;
  liveState.volume       = volume;
  liveState.isMuted      = isMuted;
  liveState.currentTrack = currentTrack;

  // ── 1. One-time Setup: attach all audio event listeners ──────────────────
  useEffect(() => {
    // Expose a player API on the shared ref so MusicContext keyboard shortcuts work
    const playerApi = {
      seekTo:         (t) => { audioEl.currentTime = Math.max(0, Number(t) || 0); },
      getCurrentTime: () => audioEl.currentTime || 0,
      getDuration:    () => audioEl.duration    || 0,
      mute:           () => { audioEl.muted = true;  },
      unMute:         () => { audioEl.muted = false; },
      setVolume:      (v) => { audioEl.volume = Math.max(0, Math.min(1, v > 1 ? v / 100 : v)); },
      play:           () => audioEl.play(),
      pause:          () => audioEl.pause(),
      getPlayerState: () => (audioEl.ended ? 0 : audioEl.paused ? 2 : 1),
    };
    youtubePlayerRef.current = playerApi;

    // timeupdate — update UI progress + lock-screen position state
    const onTimeUpdate = () => {
      const time = audioEl.currentTime || 0;
      dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time } });

      // setPositionState is CRITICAL for the lock-screen / notification timeline.
      // Without it the lock screen shows a static bar with no seek control.
      if ('mediaSession' in navigator && audioEl.duration && !isNaN(audioEl.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration:     audioEl.duration,
            playbackRate: audioEl.playbackRate || 1,
            position:     Math.min(time, audioEl.duration),
          });
        } catch (_) {}
      }
    };

    const onDurationChange = () => {
      if (audioEl.duration && !isNaN(audioEl.duration)) {
        dispatch({ type: ACTIONS.SET_DURATION, payload: { duration: audioEl.duration } });
      }
    };

    // ended — advance queue
    const onEnded = () => dispatch({ type: ACTIONS.NEXT_TRACK });

    // error — skip to next (don't block the queue)
    const onError = () => {
      if (!audioEl.src || audioEl.src === window.location.href) return;
      console.warn('[usePlayer] audio error — skipping track');
      dispatch({ type: ACTIONS.NEXT_TRACK });
    };

    // visibilitychange — some browsers (especially iOS Safari) pause audio
    // when the tab goes to background. We resume it if the state says playing.
    const onVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        liveState.isPlaying &&
        audioEl.paused &&
        audioEl.src &&
        audioEl.src !== window.location.href
      ) {
        const p = audioEl.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    };

    audioEl.addEventListener('timeupdate',     onTimeUpdate);
    audioEl.addEventListener('durationchange', onDurationChange);
    audioEl.addEventListener('loadedmetadata', onDurationChange);
    audioEl.addEventListener('ended',          onEnded);
    audioEl.addEventListener('error',          onError);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      audioEl.removeEventListener('timeupdate',     onTimeUpdate);
      audioEl.removeEventListener('durationchange', onDurationChange);
      audioEl.removeEventListener('loadedmetadata', onDurationChange);
      audioEl.removeEventListener('ended',          onEnded);
      audioEl.removeEventListener('error',          onError);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (youtubePlayerRef.current === playerApi) youtubePlayerRef.current = null;
    };
  }, [dispatch, youtubePlayerRef]);

  // ── 2. Track change — swap src and auto-play ──────────────────────────────
  useEffect(() => {
    if (!currentTrack?.videoId) {
      audioEl.removeAttribute('src');
      audioEl.load();
      return;
    }

    const proxyUrl = getAudioProxyUrl(currentTrack.videoId);

    // Skip if already on this track (avoids reloading on unrelated re-renders)
    if (audioEl.src === proxyUrl) {
      if (liveState.isPlaying && audioEl.paused) {
        const p = audioEl.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
      return;
    }

    audioEl.src = proxyUrl;
    audioEl.load();

    // Auto-play immediately — the browser queues this until enough data loads.
    // This fires on every PLAY_TRACK dispatch so isPlaying will be true.
    const p = audioEl.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        console.warn('[usePlayer] play() blocked by browser:', err.name, err.message);
        // If the browser blocked autoplay (first visit, no gesture), reflect in state
        if (err.name === 'NotAllowedError') {
          dispatch({ type: ACTIONS.PAUSE });
        }
      });
    }
  // We intentionally exclude isPlaying — track changes always auto-play.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.videoId]);

  // ── 3. Play / Pause sync ──────────────────────────────────────────────────
  // Handles manual pause/resume without a track change.
  useEffect(() => {
    if (!currentTrack?.videoId) return;

    if (isPlaying) {
      if (audioEl.paused) {
        const p = audioEl.play();
        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
            if (err.name === 'NotAllowedError') dispatch({ type: ACTIONS.PAUSE });
          });
        }
      }
    } else {
      if (!audioEl.paused) audioEl.pause();
    }
  }, [isPlaying, currentTrack?.videoId, dispatch]);

  // ── 3b. Handle PREV_TRACK "restart current track" case ────────────────────
  // When the reducer returns currentTime=0 for the SAME track (user pressed prev
  // while >3s in), we need to actually seek the audio element to the beginning.
  const prevTrackRef = useRef(null);
  useEffect(() => {
    const prevVideo = prevTrackRef.current;
    prevTrackRef.current = currentTrack?.videoId || null;
    // Only seek when: same track, currentTime just became 0, and audio is past 1s
    if (
      currentTrack?.videoId &&
      currentTrack.videoId === prevVideo &&
      currentTime === 0 &&
      audioEl.currentTime > 1
    ) {
      audioEl.currentTime = 0;
    }
  }, [currentTime, currentTrack?.videoId]);

  // ── 4. Volume / Mute sync ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (isMuted) {
        audioEl.muted = true;
      } else {
        audioEl.muted  = false;
        audioEl.volume = Math.max(0, Math.min(1, volume));
      }
    } catch (_) {}
  }, [volume, isMuted]);

  // ── 5. MediaSession API — full Spotify-like lock-screen controls ──────────
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title:   currentTrack.title  || 'Unknown',
      artist:  currentTrack.artist || currentTrack.channelTitle || 'Unknown Artist',
      album:   'RJ Music',
      artwork: [
        {
          src:   currentTrack.thumbnail ||
                 `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg`,
          sizes: '512x512',
          type:  'image/jpeg',
        },
      ],
    });

    // Helper: seek by offset (headphones, car controls, Bluetooth)
    const seekBy = (offsetSec) => {
      const t = Math.max(0, Math.min(audioEl.duration || 0, audioEl.currentTime + offsetSec));
      audioEl.currentTime = t;
      dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time: t } });
    };

    navigator.mediaSession.setActionHandler('play', () => {
      const p = audioEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      dispatch({ type: ACTIONS.RESUME });
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioEl.pause();
      dispatch({ type: ACTIONS.PAUSE });
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      audioEl.pause();
      dispatch({ type: ACTIONS.PAUSE });
    });

    navigator.mediaSession.setActionHandler('previoustrack', () =>
      dispatch({ type: ACTIONS.PREV_TRACK }),
    );

    navigator.mediaSession.setActionHandler('nexttrack', () =>
      dispatch({ type: ACTIONS.NEXT_TRACK }),
    );

    // seekbackward/seekforward: required for headphones (AirPods, earbuds, car).
    // Without these, the OS falls back to skipping tracks on double-press.
    navigator.mediaSession.setActionHandler('seekbackward', (details) =>
      seekBy(-(details?.seekOffset ?? 10)),
    );

    navigator.mediaSession.setActionHandler('seekforward', (details) =>
      seekBy(details?.seekOffset ?? 10),
    );

    // seekto: dragging the lock-screen / notification progress bar
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        audioEl.currentTime = details.seekTime;
        dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time: details.seekTime } });
      }
    });

    return () => {
      [
        'play','pause','stop',
        'previoustrack','nexttrack',
        'seekbackward','seekforward','seekto',
      ].forEach((action) => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch (_) {}
      });
    };
  }, [currentTrack, dispatch]);

  // ── 6. Sync OS play/pause badge ───────────────────────────────────────────
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // ── Controls (called by UI components) ────────────────────────────────────
  // All controls dispatch to the reducer; effects above react to state changes.

  const play = useCallback((track, queue, queueIndex, context) => {
    // Unlock audio context synchronously on user gesture (required by iOS)
    if (audioEl.paused && audioEl.src) {
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
    audioEl.currentTime = Math.max(0, Number(time) || 0);
    dispatch({ type: ACTIONS.SEEK, payload: { time } });
  }, [dispatch]);

  const setVolume = useCallback((vol) => {
    dispatch({
      type: ACTIONS.SET_VOLUME,
      payload: { volume: Math.max(0, Math.min(1, vol)) },
    });
  }, [dispatch]);

  const toggleMute    = useCallback(() => dispatch({ type: ACTIONS.TOGGLE_MUTE }),    [dispatch]);
  const next          = useCallback(() => dispatch({ type: ACTIONS.NEXT_TRACK }),      [dispatch]);
  const prev          = useCallback(() => dispatch({ type: ACTIONS.PREV_TRACK }),      [dispatch]);
  const toggleShuffle = useCallback(() => dispatch({ type: ACTIONS.TOGGLE_SHUFFLE }), [dispatch]);
  const cycleRepeat   = useCallback(() => dispatch({ type: ACTIONS.CYCLE_REPEAT }),   [dispatch]);

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
