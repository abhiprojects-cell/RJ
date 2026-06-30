// musicApi.js — All fetch/axios wrappers for the music backend

import { API_BASE } from '../utils/constants.js';

const BASE = API_BASE;

/**
 * Generic fetch wrapper with error normalization
 */
async function apiFetch(path, options = {}) {
  const controller = options.signal ? null : new AbortController();
  const signal = options.signal || controller?.signal;
  
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), 12000)
    : null;

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (timeoutId) clearTimeout(timeoutId);

    const data = await res.json();

    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.code = data.code || 'HTTP_ERROR';
      err.status = res.status;
      throw err;
    }

    return data;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const abortErr = new Error('Request was aborted');
      abortErr.code = 'ABORTED';
      throw abortErr;
    }
    throw err;
  }
}

// ── API Methods ───────────────────────────────────────────────────────────────

/**
 * Search YouTube for tracks
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ results: Track[] }>}
 */
export function searchTracks(query, signal) {
  return apiFetch(`/search?q=${encodeURIComponent(query)}`, { signal });
}

/**
 * Get a direct audio stream URL
 * @param {string} youtubeUrl
 * @returns {Promise<{ audioUrl: string, expiresAt: string, format: string, bitrate: string }>}
 */
export function fetchStreamUrl(youtubeUrl) {
  return apiFetch(`/stream?url=${encodeURIComponent(youtubeUrl)}`);
}

/**
 * Get trending music
 * @returns {Promise<{ results: Track[] }>}
 */
export function fetchTrending() {
  return apiFetch('/trending');
}

/**
 * Get autocomplete suggestions
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ suggestions: string[] }>}
 */
export function fetchSuggestions(query, signal) {
  return apiFetch(`/suggest?q=${encodeURIComponent(query)}`, { signal });
}

/**
 * Get full track metadata
 * @param {string} youtubeUrl
 * @returns {Promise<Track>}
 */
export function fetchTrackInfo(youtubeUrl) {
  return apiFetch(`/info?url=${encodeURIComponent(youtubeUrl)}`);
}

/**
 * Get related/similar songs for a track (Spotify-style autoqueue)
 * @param {string} videoId
 * @param {string} title
 * @param {string} artist
 * @returns {Promise<{ results: Track[] }>}
 */
export function fetchRelatedTracks(videoId, title, artist) {
  const params = new URLSearchParams({ videoId, title: title || '', artist: artist || '' });
  return apiFetch(`/related?${params.toString()}`);
}

/**
 * Fetch stream URL with auto-retry once on failure
 * @param {string} youtubeUrl
 * @returns {Promise<{ audioUrl: string, expiresAt: string }>}
 */
export async function fetchStreamUrlWithRetry(youtubeUrl) {
  try {
    return await fetchStreamUrl(youtubeUrl);
  } catch (err) {
    if (err.code === 'ABORTED') throw err;
    // Retry once
    await new Promise((r) => setTimeout(r, 500));
    return await fetchStreamUrl(youtubeUrl);
  }
}

/**
 * Get the URL of the backend audio proxy for a given YouTube video ID.
 * Use this as the `src` of an HTML5 <audio> element — the backend
 * fetches the actual stream and pipes it back, avoiding CORS.
 * @param {string} videoId  e.g. "dQw4w9WgXcQ"
 * @returns {string}  the proxy URL
 */
export function getAudioProxyUrl(videoId) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return `${BASE}/audio?url=${encodeURIComponent(youtubeUrl)}`;
}
