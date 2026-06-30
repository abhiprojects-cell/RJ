// music.routes.js — All Express route definitions for /api/music

import { Router } from 'express';
import { search, stream, trending, suggest, info, related } from './music.controller.js';

const router = Router();

/**
 * GET /api/music/search?q=<query>
 * Search YouTube — returns top 10 results
 */
router.get('/search', search);

/**
 * GET /api/music/trending
 * Get trending music tracks
 */
router.get('/trending', trending);

/**
 * GET /api/music/suggest?q=<query>
 * Get autocomplete suggestions from YouTube
 */
router.get('/suggest', suggest);

/**
 * GET /api/music/stream?url=<youtubeUrl>
 * Get a direct audio stream URL for a YouTube track
 */
router.get('/stream', stream);

/**
 * GET /api/music/info?url=<youtubeUrl>
 * Get full metadata for a specific YouTube track
 */
router.get('/info', info);

/**
 * GET /api/music/related?videoId=<id>&title=<title>&artist=<artist>
 * Get smart related songs based on the currently playing track
 */
router.get('/related', related);

export default router;
