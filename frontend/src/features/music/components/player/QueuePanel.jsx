import React, { useState, useRef } from 'react';
import { useQueue } from '../../hooks/useQueue.js';
import { usePlayer } from '../../hooks/usePlayer.js';

export function QueuePanel({ onClose }) {
  const { queue, upcomingTracks, removeFromQueue, clearQueue, playingContext } = useQueue();
  const { currentTrack } = usePlayer();
  const [translateX, setTranslateX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    // Trigger slide-in animation after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    });
  }, []);

  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };

  const handleTouchMove = (e) => {
    touchCurrentX.current = e.touches[0].clientX;
    const deltaX = touchCurrentX.current - touchStartX.current;
    if (deltaX > 0) setTranslateX(deltaX);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for animation to finish
  };

  const handleTouchEnd = () => {
    const delta = touchCurrentX.current - touchStartX.current;
    if (delta > 100) handleClose();
    else setTranslateX(0);
  };

  return (
    <div className={`music-queue-panel ${isOpen ? 'open' : ''}`} style={{ transform: translateX > 0 ? `translateX(${translateX}px)` : '' }}>
      {/* Header */}
      <div className="music-queue-header" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="music-queue-title">Queue</div>
        <button
          className="music-queue-close"
          onClick={handleClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.3 5.71L12.71 11.3l5.59 5.59L17.88 19 12.3 13.41 6.71 19 5.3 17.59l5.59-5.59L5.3 6.41 6.71 5l5.59 5.59L17.88 5z" />
          </svg>
        </button>
      </div>

      {/* Queue Content */}
      <div className="music-queue-content">
        {/* Now Playing Section */}
        {currentTrack && (
          <div className="music-queue-section">
            <div className="music-queue-section-label" style={{ color: 'var(--music-accent)' }}>Now playing</div>
            <div className="music-queue-item now-playing">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="music-queue-item-thumb"
                onError={(e) => {
                  e.target.src = `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg`;
                }}
              />
              <div className="music-queue-item-info">
                <div className="music-queue-item-title" title={currentTrack.title}>{currentTrack.title}</div>
                <div className="music-queue-item-artist" title={currentTrack.artist || currentTrack.channelTitle}>
                  {currentTrack.artist || currentTrack.channelTitle || 'Unknown Artist'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Up Section */}
        {upcomingTracks.length > 0 && (
          <div className="music-queue-section">
            <div className="music-queue-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Next up</span>
              {upcomingTracks.length === 0 && currentTrack && playingContext === 'search' && (
                <span style={{ fontSize: '11px', color: 'var(--music-text-muted)', fontStyle: 'italic' }}>
                  Finding similar songs…
                </span>
              )}
            </div>
            {upcomingTracks.map((track, idx) => (
              <div key={`${track.videoId}-${idx}`} className="music-queue-item">
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="music-queue-item-thumb"
                  onError={(e) => {
                    e.target.src = `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`;
                  }}
                />
                <div className="music-queue-item-info">
                  <div className="music-queue-item-title" title={track.title}>{track.title}</div>
                  <div className="music-queue-item-artist" title={track.artist || track.channelTitle}>
                    {track.artist || track.channelTitle || 'Unknown Artist'}
                  </div>
                </div>
                <button
                  className="music-queue-item-remove"
                  onClick={() => removeFromQueue(idx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                  title="Remove from queue"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.3 5.71L12.71 11.3l5.59 5.59L17.88 19 12.3 13.41 6.71 19 5.3 17.59l5.59-5.59L5.3 6.41 6.71 5l5.59 5.59L17.88 5z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Loading state when autoqueue is being fetched */}
        {upcomingTracks.length === 0 && currentTrack && playingContext === 'search' && (
          <div style={{ padding: '20px 16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--music-text-muted)', marginBottom: 12 }}>Finding similar songs…</div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="music-queue-item" style={{ pointerEvents: 'none' }}>
                <div className="music-skeleton" style={{ width: 40, height: 40, borderRadius: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="music-skeleton" style={{ height: 12, width: '60%' }} />
                  <div className="music-skeleton" style={{ height: 10, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {upcomingTracks.length === 0 && !currentTrack && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--music-text-secondary)' }}>
            <div style={{ fontSize: '14px' }}>Nothing in queue</div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--music-text-muted)' }}>Play something to get started</div>
          </div>
        )}
      </div>

      {/* Footer */}
      {upcomingTracks.length > 0 && (
        <div className="music-queue-footer">
          <button
            className="music-btn-clear"
            onClick={clearQueue}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
          >
            Clear queue
          </button>
        </div>
      )}
    </div>
  );
}
