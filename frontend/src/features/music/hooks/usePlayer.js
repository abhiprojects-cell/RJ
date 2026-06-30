// usePlayer.js — Playback via native HTML5 <audio> + backend yt-dlp proxy
// Same-IP extraction and delivery means no YouTube IP mismatch / 403.
// Native <audio> allows background playback on iOS and Android browsers.

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

  // ── 1. Create / swap the native <audio> element on track change ──────────────
  // We create a new audio element per track so there is no stale-src race condition.
  // The element is appended to <body> so the browser keeps it alive across renders.
  useEffect(() => {
    if (!currentTrack?.videoId) {
      setPlayerReady(false);
      return;
    }

    const audio = document.createElement('audio');
    audio.preload = 'auto';
    // These two attributes allow audio to play inline on iOS without fullscreening
    audio.playsInline = true;
    audio.setAttribute('webkit-playsinline', 'true');

    // Build the proxy URL: /api/music/audio?url=<encodedYouTubeUrl>
    // The backend runs yt-dlp (same IP) and pipes the bytes back with Range support.
    audio.src = getAudioProxyUrl(currentTrack.videoId);

    // Expose the same API surface the rest of the app already uses via youtubePlayerRef
    const playerApi = {
      seekTo:         (t) => { audio.currentTime = Math.max(0, Number(t) || 0); },
      getCurrentTime: () => audio.currentTime || 0,
      getDuration:    () => audio.duration || 0,
      mute:           () => { audio.muted = true; },
      unMute:         () => { audio.muted = false; },
      setVolume:      (v) => { audio.volume = Math.max(0, Math.min(1, v > 1 ? v / 100 : v)); },
      play:           () => audio.play(),
      pause:          () => audio.pause(),
      getPlayerState: () => audio.ended ? 0 : audio.paused ? 2 : 1,
    };

    const onTimeUpdate    = () => dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: { time: audio.currentTime || 0 } });
    const onDuration      = () => { if (audio.duration) dispatch({ type: ACTIONS.SET_DURATION, payload: { duration: audio.duration } }); };
    const onLoadedMeta    = () => { setPlayerReady(true); if (audio.duration) dispatch({ type: ACTIONS.SET_DURATION, payload: { duration: audio.duration } }); };
    const onCanPlay       = () => setPlayerReady(true);
    const onEnded         = () => dispatch({ type: ACTIONS.NEXT_TRACK });
    // On error: skip to next track after a short delay
    const onError         = (e) => { console.error('[usePlayer] audio error', e); dispatch({ type: ACTIONS.NEXT_TRACK }); };

    audio.addEventListener('timeupdate',     onTimeUpdate);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('canplay',        onCanPlay);
    audio.addEventListener('ended',          onEnded);
    audio.addEventListener('error',          onError);

    document.body.appendChild(audio);
    youtubePlayerRef.current = playerApi;
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate',     onTimeUpdate);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('canplay',        onCanPlay);
      audio.removeEventListener('ended',          onEnded);
      audio.removeEventListener('error',          onError);
      audio.remove();
      if (youtubePlayerRef.current === playerApi) youtubePlayerRef.current = null;
    };
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
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        youtubePlayerRef.current.pause();
      }
    } catch (_) {}
  }, [isPlaying, playerReady, currentTrack?.videoId, youtubePlayerRef]);

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
    dispatch({ type: ACTIONS.PLAY_TRACK, payload: { track, queue, queueIndex, context } });
  }, [dispatch]);

  const pause = useCallback(() => dispatch({ type: ACTIONS.PAUSE }), [dispatch]);
  const resume = useCallback(() => dispatch({ type: ACTIONS.RESUME }), [dispatch]);

  const togglePlay = useCallback(() => {
    if (isPlaying) dispatch({ type: ACTIONS.PAUSE });
    else           dispatch({ type: ACTIONS.RESUME });
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
