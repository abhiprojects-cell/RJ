import React, { useState } from 'react';
import { usePlayer } from '../../hooks/usePlayer.js';
import { formatDuration } from '../../utils/formatters.js';
import { TrackContextMenu } from '../shared/TrackContextMenu.jsx';

export function PlaylistTrackList({ playlist }) {
  const { currentTrack, isPlaying, play } = usePlayer();
  const [menuTrack, setMenuTrack] = useState(null);
  const [menuPos, setMenuPos] = useState(null);

  if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return null;

  const handlePlay = (track, index) => {
    play(track, playlist.tracks, index, `playlist:${playlist.id}`);
  };

  const handleMenu = (e, track) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom });
    setMenuTrack(track);
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
        {playlist.tracks.map((track, i) => {
          const isCurrent = currentTrack?.videoId === track.videoId;
          return (
            <div
              key={`${track.videoId}-${i}`}
              onClick={() => handlePlay(track, i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 8px',
                borderRadius: 10,
                cursor: 'pointer',
                background: isCurrent ? 'rgba(29,185,84,0.08)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = isCurrent ? 'rgba(29,185,84,0.12)' : 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = isCurrent ? 'rgba(29,185,84,0.08)' : 'transparent'}
            >
              {/* Index / playing indicator */}
              <div style={{ width: 20, textAlign: 'center', flexShrink: 0, fontSize: 12, color: isCurrent ? 'var(--music-accent)' : 'var(--music-text-secondary)', fontWeight: isCurrent ? 700 : 400 }}>
                {isCurrent && isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--music-accent)">
                    <rect x="3" y="6" width="4" height="12" rx="1"/><rect x="10" y="3" width="4" height="15" rx="1"/><rect x="17" y="8" width="4" height="10" rx="1"/>
                  </svg>
                ) : (
                  i + 1
                )}
              </div>

              {/* Thumbnail */}
              <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                <img src={track.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>

              {/* Title + artist — fills remaining space */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: isCurrent ? 'var(--music-accent)' : 'var(--music-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--music-text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.artist || track.channelTitle}
                </div>
              </div>

              {/* Duration + menu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--music-text-secondary)' }}>{formatDuration(track.duration)}</span>
                <button
                  className="music-ctrl-btn"
                  onClick={(e) => handleMenu(e, track)}
                  style={{ width: 28, height: 28, color: 'var(--music-text-secondary)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {menuPos && menuTrack && (
        <TrackContextMenu
          track={menuTrack}
          x={menuPos.x}
          y={menuPos.y}
          playlistId={playlist.id}
          onClose={() => { setMenuPos(null); setMenuTrack(null); }}
        />
      )}
    </>
  );
}
