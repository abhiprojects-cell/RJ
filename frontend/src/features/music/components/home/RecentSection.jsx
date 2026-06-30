import React from 'react';
import { useLibrary } from '../../hooks/useLibrary.js';
import { TrackCard } from '../search/TrackCard.jsx';

export function RecentSection() {
  const { recentlyPlayed } = useLibrary();

  if (!recentlyPlayed || recentlyPlayed.length === 0) {
    return null; // Don't show empty state
  }

  const recentTracks = recentlyPlayed.slice(0, 10);

  return (
    <section className="music-section music-fade-in">
      <h2 className="music-section-title" style={{ marginBottom: '16px' }}>Recently played</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {recentTracks.map((track, idx) => (
          <TrackCard
            key={`${track.videoId}-${idx}`}
            track={track}
            queue={recentTracks}
            queueIndex={idx}
            context="recent"
          />
        ))}
      </div>
    </section>
  );
}
