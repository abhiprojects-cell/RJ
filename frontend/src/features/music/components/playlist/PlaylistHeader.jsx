import React from 'react';
import { usePlayer } from '../../hooks/usePlayer.js';

export function PlaylistHeader({ playlist, onPlayAll }) {
  if (!playlist) return null;

  return (
    <div className="music-playlist-header">
      {playlist.coverUrl ? (
        <img src={playlist.coverUrl} className="music-playlist-cover" alt={playlist.name} loading="lazy" />
      ) : (
        <div className="music-playlist-cover-placeholder">
          <span style={{ fontSize: 64 }}>🎵</span>
        </div>
      )}
      <div className="music-playlist-meta">
        <div className="music-playlist-type">Playlist</div>
        <h1 className="music-playlist-title" title={playlist.name}>{playlist.name}</h1>
        {playlist.description && (
          <div className="music-playlist-desc">{playlist.description}</div>
        )}
        <div className="music-playlist-stats">
          {(playlist.tracks?.length || 0)} track{(playlist.tracks?.length || 0) !== 1 ? 's' : ''}
        </div>
      </div>
      {(playlist.tracks?.length || 0) > 0 && (
        <div style={{ alignSelf: 'flex-end', marginLeft: 'auto' }}>
          <button className="music-play-all-btn" onClick={onPlayAll}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
