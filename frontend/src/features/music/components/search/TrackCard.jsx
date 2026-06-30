import React, { useState, useCallback } from 'react';
import { usePlayer } from '../../hooks/usePlayer.js';
import { useLikedSongs } from '../../hooks/useLikedSongs.js';
import { useMusicDispatch } from '../../context/MusicContext.jsx';
import { formatDuration } from '../../utils/formatters.js';
import { TrackContextMenu } from '../shared/TrackContextMenu.jsx';
import { ACTIONS } from '../../utils/constants.js';
import { fetchRelatedTracks } from '../../api/musicApi.js';

export function TrackCard({ track, queue, queueIndex, context, compact = false }) {
  const { play, currentTrack, isPlaying } = usePlayer();
  const { toggle, isLiked } = useLikedSongs();
  const dispatch = useMusicDispatch();
  const [menuPos, setMenuPos] = useState(null);

  const isCurrentTrack = currentTrack?.videoId === track.videoId;
  const liked = isLiked(track.videoId);

  const handlePlay = useCallback(() => {
    if (context === 'search') {
      // Play the track immediately by itself
      play(track, [track], 0, context);

      // Fetch smart related songs in the background
      fetchRelatedTracks(track.videoId, track.title, track.artist)
        .then(({ results }) => {
          if (!results?.length) return;
          const newQueue = [track, ...results];
          dispatch({ type: ACTIONS.UPDATE_QUEUE, payload: { queue: newQueue } });
        })
        .catch(() => { /* silently ignore */ });
    } else {
      // For Playlists, Liked Songs, etc., play with the full provided queue
      play(track, queue || [track], queueIndex ?? 0, context);
    }
  }, [play, dispatch, track, queue, queueIndex, context]);

  const handleLike = useCallback((e) => {
    e.stopPropagation();
    toggle(track);
    dispatch({
      type: ACTIONS.SHOW_TOAST,
      payload: {
        message: liked ? 'Removed from Liked Songs' : 'Added to Liked Songs',
        type: liked ? 'info' : 'success',
      },
    });
  }, [toggle, track, liked, dispatch]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMenuBtn = useCallback((e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    // Position menu to the left and below the button, adjusting for screen edges
    const x = Math.min(rect.left - 180, window.innerWidth - 200);
    const y = Math.min(rect.bottom + 4, window.innerHeight - 300);
    setMenuPos({ x, y });
  }, []);

  return (
    <>
      <div
        className={`music-track-row${isCurrentTrack ? ' playing' : ''}`}
        onClick={handlePlay}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
      >
        {/* Thumbnail with playing indicator overlay */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={track.thumbnail}
            alt=""
            className="music-track-thumb"
            loading="lazy"
            onError={(e) => { e.target.src = `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`; }}
          />
          {isCurrentTrack && isPlaying && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              borderRadius: 'var(--music-radius)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div className="music-playing-indicator">
                <div className="music-playing-bar" style={{ height: 10 }} />
                <div className="music-playing-bar" style={{ height: 18 }} />
                <div className="music-playing-bar" style={{ height: 6 }} />
              </div>
            </div>
          )}
        </div>

        <div className="music-track-info">
          <div className="music-track-title">{track.title}</div>
          <div className="music-track-artist">{track.artist || track.channelTitle || 'Unknown Artist'}</div>
        </div>

        {!compact && (
          <div className="music-track-duration">{formatDuration(track.duration)}</div>
        )}

        <div className="music-track-actions">
          <button
            className="music-ctrl-btn"
            onClick={handleLike}
            style={{ color: liked ? 'var(--music-accent)' : 'inherit', width: 40, height: 40 }}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          <button
            className="music-ctrl-btn"
            onClick={handleMenuBtn}
            style={{ width: 40, height: 40 }}
            aria-label="More options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {menuPos && (
        <TrackContextMenu
          track={track}
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setMenuPos(null)}
        />
      )}
    </>
  );
}
