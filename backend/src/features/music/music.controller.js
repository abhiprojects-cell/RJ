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

// ── GET /api/music/audio?url=<youtubeUrl> ────────────────────────────────────
// Proxies the raw audio stream through the backend to avoid browser CORS issues.

export async function audio(req, res) {
  try {
    const raw = req.query.url;
    if (!raw) throw new InvalidInputError('Query parameter "url" is required');

    const url = sanitizeYouTubeUrl(raw);

    // Get (or cache) the upstream audio URL
    const cacheKey = `stream:${url}`;
    const streamInfo = await streamCache.getOrFetch(
      cacheKey,
      () => getStreamUrl(url),
      5 * 60 * 1000,
    );

    const { audioUrl, format } = streamInfo;
    if (!audioUrl) throw new Error('No audio URL resolved');

    // Forward Range header so browsers can seek
    const rangeHeader = req.headers['range'];
    const upstreamHeaders = {
      'User-Agent': 'Mozilla/5.0',
      'Accept': '*/*',
    };
    if (rangeHeader) upstreamHeaders['Range'] = rangeHeader;

    // Pipe the upstream audio through to the client
    const upstreamRes = await fetch(audioUrl, { headers: upstreamHeaders });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      throw new Error(`Upstream audio fetch failed: ${upstreamRes.status}`);
    }

    // Set appropriate response headers
    const status = rangeHeader && upstreamRes.status === 206 ? 206 : 200;
    res.status(status);
    // Allow cross-origin <audio> elements to load this resource (required for
    // MediaSession seekto to work when frontend and backend are on different origins)
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', format || 'audio/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=300');

    const contentLength = upstreamRes.headers.get('content-length');
    const contentRange = upstreamRes.headers.get('content-range');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);

    // Stream the body
    const reader = upstreamRes.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        const ok = res.write(Buffer.from(value));
        if (!ok) {
          // Handle backpressure
          await new Promise(resolve => res.once('drain', resolve));
        }
      }
    };

    req.on('close', () => reader.cancel());
    await pump();

  } catch (err) {
    sendError(res, err);
  }
}
