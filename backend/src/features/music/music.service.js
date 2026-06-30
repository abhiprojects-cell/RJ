// music.service.js — Search, Info, and Suggestions (Playback handled on frontend via IFrame API)
import { request as httpsRequest } from 'https';
import { TimeoutError, NotFoundError, MusicError, MusicErrorCodes } from './music.errors.js';
import ytsr from 'ytsr';
import ytdl from '@distube/ytdl-core';

// ── Providers ────────────────────────────────────────────────────────────────

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.colinslegacy.com',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractVideoId(raw) {
  try {
    const u = new URL(raw);
    return u.searchParams.get('v') || u.pathname.replace(/^\//, '');
  } catch {
    return raw.split('v=')[1]?.split('&')[0] || raw.split('youtu.be/')[1]?.split('?')[0] || raw;
  }
}

async function safeFetch(url, timeoutMs = 10000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}



// ── Main exported service methods ─────────────────────────────────────────────

export async function searchYouTube(query) {
  try {
    const results = await ytsr(query, { limit: 20 });
    const videos = results.items.filter(i => i.type === 'video');
    if (!videos.length) throw new NotFoundError(`No results for "${query}"`);
    return {
      results: videos.map(item => ({
        videoId: item.id,
        title: item.title,
        thumbnail: item.bestThumbnail?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: item.duration || '0:00',
        artist: item.author?.name || 'Unknown Artist',
        album: null,
        views: item.views || 0,
        uploadDate: item.uploadedAt || null,
        description: item.description || '',
        likes: 0,
      })),
    };
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new MusicError(err.message, MusicErrorCodes.INTERNAL_ERROR, 500);
  }
}



export async function getTrending() {
  return searchYouTube('latest trending songs 2024');
}

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
    const req = httpsRequest(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        clearTimeout(timer);
        try {
          const match = data.match(/\[.*\]/s);
          if (!match) return resolve({ suggestions: [] });
          const parsed = JSON.parse(match[0]);
          const suggestions = (Array.isArray(parsed[1]) ? parsed[1] : [])
            .map(s => (Array.isArray(s) ? s[0] : s))
            .filter(s => typeof s === 'string')
            .slice(0, 20);
          resolve({ suggestions });
        } catch { resolve({ suggestions: [] }); }
      });
    });
    req.on('error', err => { clearTimeout(timer); reject(new MusicError(err.message, MusicErrorCodes.NETWORK_ERROR, 502)); });
    req.end();
  });
}

export async function getTrackInfo(youtubeUrl) {
  const videoId = extractVideoId(youtubeUrl.replace(/"/g, ''));
  if (!videoId) throw new MusicError('Invalid YouTube URL', MusicErrorCodes.INVALID_INPUT, 400);

  // Try Piped first (no rate limits), then ytdl-core
  try {
    const data = await safeFetch(`${PIPED_INSTANCES[0]}/streams/${videoId}`);
    return {
      videoId,
      title: data.title || 'Unknown',
      thumbnail: data.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      duration: data.duration || 0,
      artist: data.uploader || 'Unknown Artist',
      album: null,
      description: (data.description || '').slice(0, 500),
      views: data.views || 0,
      likes: data.likes || 0,
      uploadDate: data.uploadDate || null,
    };
  } catch {
    // Fallback to ytdl-core
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getBasicInfo(url).catch(e => { throw new MusicError(e.message, MusicErrorCodes.INTERNAL_ERROR, 500); });
    const d = info.videoDetails;
    return {
      videoId: d.videoId,
      title: d.title || 'Unknown',
      thumbnail: d.thumbnails?.[d.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      duration: parseInt(d.lengthSeconds || '0', 10),
      artist: d.author?.name || 'Unknown Artist',
      album: null,
      description: (d.description || '').slice(0, 500),
      views: parseInt(d.viewCount || '0', 10),
      likes: 0,
      uploadDate: d.publishDate || null,
    };
  }
}

export async function getStreamUrl(youtubeUrl) {
  const videoId = extractVideoId(youtubeUrl.replace(/"/g, ''));
  if (!videoId) throw new MusicError('Invalid YouTube URL', MusicErrorCodes.INVALID_INPUT, 400);

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  // Try Piped audio stream first
  for (const instance of PIPED_INSTANCES) {
    try {
      const data = await safeFetch(`${instance}/streams/${videoId}`);
      const audioStreams = (data.streams || []).filter((s) => s.type?.startsWith('audio'));
      if (audioStreams.length) {
        const best = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        return {
          audioUrl: best.url || best.streamUrl || best.link,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          format: best.mimeType || best.format || 'audio/mp4',
          bitrate: best.bitrate || best.audioBitrate || null,
        };
      }
    } catch {
      continue;
    }
  }

  // Fallback to ytdl-core when Piped doesn't return a usable audio stream
  const info = await ytdl.getInfo(url).catch((e) => {
    throw new MusicError(e.message, MusicErrorCodes.INTERNAL_ERROR, 500);
  });
  const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
  if (!format?.url) {
    throw new MusicError('Unable to resolve audio stream URL', MusicErrorCodes.STREAM_FAILED, 502);
  }

  return {
    audioUrl: format.url,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    format: format.mimeType || format.container || 'audio/mp4',
    bitrate: format.bitrate || format.audioBitrate || null,
  };
}
export async function getRelated(videoId, title, artist) {
  const cleanTitle = (title || '')
    .replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '')
    .replace(/official|video|audio|lyrics|hd|hq|4k|mv|m\/v|song|music/gi, '')
    .trim();
  const cleanArtist = (artist || '').replace(/VEVO|official|music|topic/gi, '').trim();

  // Create highly specific, audio-focused search queries to simulate a radio mix
  let queries = [];
  if (cleanArtist && cleanTitle) {
    queries = [
      `${cleanArtist} ${cleanTitle} audio`, // try to get the actual song or remixes
      `${cleanArtist} mix`,                 // great for getting similar vibe/genre
      `${cleanArtist} top tracks`           // other songs by same artist
    ];
  } else if (cleanArtist) {
    queries = [`${cleanArtist} mix`, `${cleanArtist} audio`];
  } else if (cleanTitle) {
    queries = [`${cleanTitle} song audio`, `${cleanTitle} playlist`];
  } else {
    // Ultimate fallback if no metadata
    queries = ['popular hits audio 2024'];
  }

  const seen = new Set([videoId]);
  let related = [];

  // Helper to run ytsr with a timeout
  const ytsrWithTimeout = (query, limit) => {
    return Promise.race([
      ytsr(query, { limit }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('ytsr timeout')), 4000))
    ]);
  };

  // Run queries concurrently
  await Promise.all(
    queries.map(async (q) => {
      try {
        const results = await ytsrWithTimeout(q, 10);
        const videos = results.items.filter(i => 
          i.type === 'video' && 
          !seen.has(i.id) &&
          i.duration // Ensure it's not a live stream
        );
        
        for (const item of videos) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            related.push({
              videoId: item.id,
              title: item.title,
              thumbnail: item.bestThumbnail?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
              duration: item.duration || '0:00',
              artist: item.author?.name || 'Unknown Artist',
              album: null,
              views: item.views || 0,
              uploadDate: item.uploadedAt || null,
              description: item.description || '',
              likes: 0,
            });
          }
        }
      } catch (err) {
        console.error(`[AutoQueue] Failed query '${q}':`, err.message);
      }
    })
  );

  // If we somehow got very few songs (e.g. rate limit), do one final broad fallback
  if (related.length < 5) {
    try {
      const fallback = await ytsr('trending music hits audio', { limit: 15 });
      fallback.items.filter(i => i.type === 'video' && !seen.has(i.id)).forEach(item => {
        seen.add(item.id);
        related.push({
          videoId: item.id,
          title: item.title,
          thumbnail: item.bestThumbnail?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
          duration: item.duration || '0:00',
          artist: item.author?.name || 'Unknown Artist',
        });
      });
    } catch (e) {}
  }

  // Take top 20 max
  const finalRelated = related.slice(0, 20);

  // Shuffle to make the radio feel natural and not clumped by search query
  for (let i = finalRelated.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [finalRelated[i], finalRelated[j]] = [finalRelated[j], finalRelated[i]];
  }

  return { results: finalRelated };
}
