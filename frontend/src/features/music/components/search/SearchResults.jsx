import React from 'react';
import { TrackCard } from './TrackCard.jsx';

export function SearchResults({ results, isSearching, error, hasSearched, query, onRetry }) {
  if (isSearching) {
    return (
      <div className="music-fade-in">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="music-track-row" style={{ pointerEvents: 'none' }}>
            <div className="music-skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--music-radius)', flexShrink: 0 }} />
            <div className="music-track-info" style={{ flex: 1 }}>
              <div className="music-skeleton" style={{ height: '14px', width: '60%', marginBottom: '6px' }} />
              <div className="music-skeleton" style={{ height: '12px', width: '40%' }} />
            </div>
            <div className="music-skeleton" style={{ width: '40px', height: '12px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="music-fade-in" style={{ padding: '24px', textAlign: 'center', color: 'var(--music-text-secondary)' }}>
        <div style={{ fontSize: '14px', marginBottom: '12px' }}>{error}</div>
        <button
          onClick={onRetry}
          style={{
            padding: '8px 24px',
            background: 'var(--music-accent)',
            color: '#000',
            border: 'none',
            borderRadius: 'var(--music-radius-pill)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = 'var(--music-accent-hover)'}
          onMouseLeave={(e) => e.target.style.background = 'var(--music-accent)'}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!hasSearched) {
    return null;
  }

  if (!results.length) {
    return (
      <div className="music-fade-in" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--music-text-secondary)', marginBottom: '8px' }}>
          No results for "{query}"
        </div>
        <div style={{ fontSize: '12px', color: 'var(--music-text-muted)' }}>
          Try a different search term
        </div>
      </div>
    );
  }

  return (
    <div className="music-fade-in">
      <div style={{ color: 'var(--music-text-muted)', fontSize: '13px', marginBottom: '16px' }}>
        {results.length} result{results.length !== 1 ? 's' : ''}
      </div>
      <div className="music-search-results-list">
        {results.map((track, idx) => (
          <TrackCard
            key={`${track.videoId}-${idx}`}
            track={track}
            queue={results}
            queueIndex={idx}
            context="search"
          />
        ))}
      </div>
    </div>
  );
}
