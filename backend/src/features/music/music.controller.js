// music.controller.js — Request handling, validation, response shaping

import { sanitizeQuery, sanitizeYouTubeUrl } from './music.sanitizer.js';
import {
  searchYouTube,
  getStreamUrl,
  getTrending,
  getSuggestions,
  getTrackInfo,
  getRelated,
} from './music.service.js';
import {
  searchCache,
  streamCache,
  trendingCache,
  suggestCache,
  infoCache,
} from './music.cache.js';
import { sendError, InvalidInputError } from './music.errors.js';
import https from 'https';

// ── GET /api/music/search?q= ──────────────────────────────────────────────────

export async function search(req, res) {
  try {
    const raw = req.query.q;
    if (!raw) throw new InvalidInputError('Query parameter "q" is required');

    const query = sanitizeQuery(raw);
    const cacheKey = `search:${query.toLowerCase()}`;

    const result = await searchCache.getOrFetch(
      cacheKey,
      () => searchYouTube(query),
      5 * 60 * 1000,
    );

    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}



// ── GET /api/music/trending ───────────────────────────────────────────────────

export async function trending(req, res) {
  try {
    const cacheKey = 'trending:music';
    const result = await trendingCache.getOrFetch(
      cacheKey,
      () => getTrending(),
      30 * 60 * 1000,
    );
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}

// ── GET /api/music/suggest?q= ─────────────────────────────────────────────────

export async function suggest(req, res) {
  try {
    const raw = req.query.q;
    if (!raw) throw new InvalidInputError('Query parameter "q" is required');

    const query = sanitizeQuery(raw);
    if (query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const cacheKey = `suggest:${query.toLowerCase()}`;

    const result = await suggestCache.getOrFetch(
      cacheKey,
      () => getSuggestions(query),
      2 * 60 * 1000,
    );

    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}

// ── GET /api/music/stream?url= ─────────────────────────────────────────────────

export async function stream(req, res) {
  try {
    const raw = req.query.url;
    if (!raw) throw new InvalidInputError('Query parameter "url" is required');

    const url = sanitizeYouTubeUrl(raw);
    const cacheKey = `stream:${url}`;

    const result = await streamCache.getOrFetch(
      cacheKey,
      () => getStreamUrl(url),
      5 * 60 * 1000,
    );

    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}

// ── GET /api/music/info?url= ──────────────────────────────────────────────────

export async function info(req, res) {
  try {
    const raw = req.query.url;
    if (!raw) throw new InvalidInputError('Query parameter "url" is required');

    const url = sanitizeYouTubeUrl(raw);

    let videoId = raw;
    try {
      const parsed = new URL(raw);
      videoId = parsed.searchParams.get('v') || parsed.pathname.slice(1) || raw;
    } catch {
      // use raw as key
    }

    const cacheKey = `info:${videoId}`;

    const result = await infoCache.getOrFetch(
      cacheKey,
      () => getTrackInfo(url),
      5 * 60 * 1000,
    );

    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}
// ── GET /api/music/related?videoId=&title=&artist= ────────────────────────────

export async function related(req, res) {
  try {
    const { videoId, title, artist } = req.query;
    if (!videoId) throw new InvalidInputError('Query parameter "videoId" is required');

    const cacheKey = `related:${videoId}`;
    const result = await searchCache.getOrFetch(
      cacheKey,
      () => getRelated(videoId, title || '', artist || ''),
      10 * 60 * 1000, // cache for 10 mins
    );

    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}
