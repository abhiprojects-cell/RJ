import React, { useEffect, useState } from 'react';
import { fetchTrending } from '../../api/musicApi.js';
import { usePlayer } from '../../hooks/usePlayer.js';

export function TrendingSection() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { play } = usePlayer();
  const [hoverId, setHoverId] = React.useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchTrending();
        if (mounted) {
          setTracks(data.results || []);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load trending');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (error) {
    return (
      <section className="music-section music-fade-in">
        <h2 className="music-section-title">Trending now</h2>
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--music-text-secondary)' }}>
          Could not load trending. Try again.
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="music-section music-fade-in">
        <h2 className="music-section-title">Trending now</h2>
        <div className="music-cards-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="music-card-item">
              <div className="music-skeleton music-card-thumb" style={{ marginBottom: '12px' }} />
              <div className="music-skeleton" style={{ height: '16px', marginBottom: '8px' }} />
              <div className="music-skeleton" style={{ height: '12px', width: '70%' }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!tracks.length) return null;

  const handlePlayCard = (track, idx) => {
    play(track, tracks, idx, 'trending');
  };

  return (
    <section className="music-section music-fade-in">
      <h2 className="music-section-title">Trending now</h2>
      <div className="music-cards-grid">
        {tracks.map((track, idx) => (
          <div
            key={`${track.videoId}-${idx}`}
            className="music-card-item"
            onMouseEnter={() => setHoverId(track.videoId)}
            onMouseLeave={() => setHoverId(null)}
          >
            <img
              src={track.thumbnail}
              alt={track.title}
              className="music-card-thumb"
              loading="lazy"
              onError={(e) => {
                e.target.src = `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`;
              }}
            />
            <div className="music-card-title" title={track.title}>{track.title}</div>
            <div className="music-card-subtitle" title={track.artist || track.channelTitle || 'Unknown Artist'}>
              {track.artist || track.channelTitle || 'Unknown Artist'}
            </div>

            {hoverId === track.videoId && (
              <div className="music-card-overlay" onClick={() => handlePlayCard(track, idx)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
