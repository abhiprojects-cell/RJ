import React from 'react';
import { useLibrary } from '../../hooks/useLibrary.js';
import { TrackCard } from '../search/TrackCard.jsx';

export function RecentlyPlayed() {
  const { recentlyPlayed, clearRecent } = useLibrary();

  if (!recentlyPlayed || recentlyPlayed.length === 0) {
    return (
      <div className="music-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h3>No history yet</h3>
        <p>Tracks you play will appear here</p>
      </div>
    );
  }

  return (
    <div className="music-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '13px', color: 'var(--music-text-muted)' }}>
        <span>{recentlyPlayed.length} track{recentlyPlayed.length !== 1 ? 's' : ''}</span>
        <button
          onClick={clearRecent}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--music-accent)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--music-accent-hover)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--music-accent)'}
        >
          Clear history
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {recentlyPlayed.map((track, i) => (
          <TrackCard
            key={`${track.videoId}-${i}`}
            track={track}
            queue={recentlyPlayed}
            queueIndex={i}
            context="recent"
          />
        ))}
      </div>
    </div>
  );
}
