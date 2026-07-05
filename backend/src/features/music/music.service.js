import { request as httpsRequest } from 'https';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';
import { TimeoutError, NotFoundError, MusicError, MusicErrorCodes } from './music.errors.js';

const execFileAsync = promisify(execFile);

// ── yt-dlp binary path ────────────────────────────────────────────────────────
// Navigate from: backend/src/features/music/music.service.js
// Up 3 levels  : backend/
// Then into    : backend/node_modules/youtube-dl-exec/bin/yt-dlp[.exe]
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YT_DLP_BIN = path.resolve(__dirname, '../../../node_modules/youtube-dl-exec/bin');
const YT_DLP = process.platform === 'win32'
  ? path.join(YT_DLP_BIN, 'yt-dlp.exe')
  : path.join(YT_DLP_BIN, 'yt-dlp');


// ── In-memory stream URL cache (TTL: 4 hours) ─────────────────────────────────
// yt-dlp URLs are IP-locked but stay valid for several hours.
// Caching avoids the slow subprocess call on every /audio request.
const streamUrlCache = new Map(); // videoId -> { audioUrl, format, cachedAt }
const STREAM_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// ── Core yt-dlp helper ─────────────────────────────────────────────────────────
// Runs yt-dlp with the given args and returns parsed JSONL lines.
async function ytdlp(args, timeoutMs = 20000) {
  const { stdout } = await execFileAsync(YT_DLP, args, {
    maxBuffer: 1024 * 1024 * 10, // 10 MB
    timeout: timeoutMs,
  });
  return stdout;
}

// Parse newline-delimited JSON output from --dump-json
function parseJsonLines(stdout) {
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

// Map a yt-dlp entry to the shape the rest of the app expects
function mapEntry(entry) {
  const id = entry.id || entry.url?.split('?v=')[1];
  const duration = entry.duration
    ? new Date(entry.duration * 1000).toISOString().slice(11, 19).replace(/^00:/, '')
    : '0:00';
  return {
    videoId: id,
    title: entry.title || 'Unknown',
    thumbnail:
      entry.thumbnail ||
      (entry.thumbnails?.slice(-1)[0]?.url) ||
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    duration,
    artist: entry.uploader || entry.channel || 'Unknown Artist',
    album: null,
    views: entry.view_count || 0,
    uploadDate: entry.upload_date || null,
    description: (entry.description || '').slice(0, 200),
    likes: entry.like_count || 0,
  };
}

// ── Search ─────────────────────────────────────────────────────────────────────
export async function searchYouTube(query) {
  try {
    const stdout = await ytdlp(
      [
        `ytsearch20:${query}`,
        '--dump-json',
        '--skip-download',
        '--flat-playlist',
        '--quiet',
        '--no-warnings',
      ],
      25000,
    );
    const entries = parseJsonLines(stdout).filter((e) => e.id && e.title);
    if (!entries.length) throw new NotFoundError(`No results for "${query}"`);
    return { results: entries.map(mapEntry) };
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new MusicError(err.message, MusicErrorCodes.INTERNAL_ERROR, 500);
  }
}

export async function getTrending() {
  const year = new Date().getFullYear();
  return searchYouTube(`popular music hits ${year} top songs`);
}

// ── Suggestions (Google autocomplete — no yt-dlp needed, always fast) ─────────
export async function getSuggestions(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    const options = {
      hostname: 'suggestqueries.google.com',
      path: `/complete/search?client=youtube&ds=yt&q=${encoded}`,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    };
    const timer = setTimeout(() => reject(new TimeoutError('Suggestion API timed out')), 5000);
    const req = httpsRequest(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        clearTimeout(timer);
        try {
          const match = data.match(/\[.*\]/s);
          if (!match) return resolve({ suggestions: [] });
          const parsed = JSON.parse(match[0]);
          const suggestions = (Array.isArray(parsed[1]) ? parsed[1] : [])
            .map((s) => (Array.isArray(s) ? s[0] : s))
            .filter((s) => typeof s === 'string')
            .slice(0, 20);
          resolve({ suggestions });
        } catch {
          resolve({ suggestions: [] });
        }
      });
    });
    req.on('error', (err) => {
      clearTimeout(timer);
      reject(new MusicError(err.message, MusicErrorCodes.NETWORK_ERROR, 502));
    });
    req.end();
  });
}

// ── Track Info ─────────────────────────────────────────────────────────────────
function extractVideoId(raw) {
  try {
    const u = new URL(raw);
    return u.searchParams.get('v') || u.pathname.replace(/^\//, '');
  } catch {
    return raw.split('v=')[1]?.split('&')[0] || raw.split('youtu.be/')[1]?.split('?')[0] || raw;
  }
}

export async function getTrackInfo(youtubeUrl) {
  const videoId = extractVideoId(youtubeUrl.replace(/"/g, ''));
  if (!videoId) throw new MusicError('Invalid YouTube URL', MusicErrorCodes.INVALID_INPUT, 400);

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const stdout = await ytdlp(
    ['--dump-json', '--skip-download', '--quiet', '--no-warnings', url],
    20000,
  ).catch((e) => { throw new MusicError(e.message, MusicErrorCodes.INTERNAL_ERROR, 500); });

  const entry = parseJsonLines(stdout)[0];
  if (!entry) throw new MusicError('No info returned', MusicErrorCodes.NOT_FOUND, 404);
  return mapEntry(entry);
}

// ── Stream URL (yt-dlp same-IP extraction) ─────────────────────────────────────
// Extract on Render → proxy bytes from Render → no IP mismatch, no 403.
async function extractWithYtDlp(videoId) {
  const cached = streamUrlCache.get(videoId);
  if (cached && Date.now() - cached.cachedAt < STREAM_CACHE_TTL_MS) return cached;

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const stdout = await ytdlp(
    [
      url,
      '--get-url',
      '--format', 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio',
      '--no-check-certificates',
      '--no-warnings',
      '--prefer-free-formats',
      '--add-headers', 'referer:youtube.com',
      '--add-headers', 'user-agent:Mozilla/5.0',
      '--quiet',
    ],
    30000,
  ).catch((e) => { throw new MusicError(`yt-dlp extraction failed: ${e.message}`, MusicErrorCodes.STREAM_FAILED, 502); });

  const audioUrl = stdout.split('\n').filter(Boolean)[0]?.trim();
  if (!audioUrl) throw new MusicError('yt-dlp returned no URL', MusicErrorCodes.STREAM_FAILED, 502);

  const result = { audioUrl, format: 'audio/webm', cachedAt: Date.now() };
  streamUrlCache.set(videoId, result);
  return result;
}

export async function getStreamUrl(youtubeUrl) {
  const videoId = extractVideoId(youtubeUrl.replace(/"/g, ''));
  if (!videoId) throw new MusicError('Invalid YouTube URL', MusicErrorCodes.INVALID_INPUT, 400);
  const { audioUrl, format } = await extractWithYtDlp(videoId);
  return {
    audioUrl,
    expiresAt: new Date(Date.now() + STREAM_CACHE_TTL_MS).toISOString(),
    format,
    bitrate: null,
  };
}

// ── Related tracks (yt-dlp search, concurrent queries) ────────────────────────
export async function getRelated(videoId, title, artist) {
  const cleanTitle = (title || '')
    .replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '')
    .replace(/official|video|audio|lyrics|hd|hq|4k|mv|m\/v|song|music/gi, '')
    .trim();
  const cleanArtist = (artist || '').replace(/VEVO|official|music|topic/gi, '').trim();

  let queries = [];
  if (cleanArtist && cleanTitle) {
    queries = [`${cleanArtist} ${cleanTitle} audio`, `${cleanArtist} mix`, `${cleanArtist} top tracks`];
  } else if (cleanArtist) {
    queries = [`${cleanArtist} mix`, `${cleanArtist} audio`];
  } else if (cleanTitle) {
    queries = [`${cleanTitle} song audio`, `${cleanTitle} playlist`];
  } else {
    queries = ['popular hits audio 2024'];
  }

  const seen = new Set([videoId]);
  const related = [];

  const searchOne = async (query) => {
    try {
      const stdout = await ytdlp(
        [`ytsearch10:${query}`, '--dump-json', '--skip-download', '--flat-playlist', '--quiet', '--no-warnings'],
        15000,
      );
      const entries = parseJsonLines(stdout).filter((e) => e.id && e.title && !seen.has(e.id));
      for (const entry of entries) {
        if (!seen.has(entry.id)) {
          seen.add(entry.id);
          related.push(mapEntry(entry));
        }
      }
    } catch (err) {
      console.error(`[Related] query "${query}" failed:`, err.message);
    }
  };

  await Promise.all(queries.map(searchOne));

  // Fallback if we got too few results
  if (related.length < 5) {
    await searchOne('trending music hits audio 2024').catch(() => {});
  }

  // Shuffle for a natural radio feel
  const out = related.slice(0, 20);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return { results: out };
}
