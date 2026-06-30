import React from 'react';
import { usePlayer } from '../../hooks/usePlayer.js';
import { REPEAT_MODES } from '../../utils/constants.js';

export function PlayerControls() {
  const { isPlaying, isShuffled, repeatMode, togglePlay, next, prev, toggleShuffle, cycleRepeat, currentTrack } = usePlayer();

  return (
    <div className="music-controls">
      <div className="music-controls-row">
        {/* Shuffle */}
        <button
          className={`music-ctrl-btn${isShuffled ? ' active' : ''}`}
          onClick={toggleShuffle}
          aria-label="Shuffle"
          style={{ position: 'relative' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          {isShuffled && (
            <span style={{
              position: 'absolute', bottom: 4, left: '50%',
              transform: 'translateX(-50%)',
              width: 4, height: 4,
              background: 'var(--music-accent)',
              borderRadius: '50%',
              display: 'block',
            }} />
          )}
        </button>

        {/* Previous */}
        <button
          className="music-ctrl-btn"
          onClick={prev}
          disabled={!currentTrack}
          aria-label="Previous"
          style={{ width: 48, height: 48 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="19,20 9,12 19,4" /><rect x="5" y="4" width="3" height="16" rx="1" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          className="music-play-btn"
          onClick={togglePlay}
          disabled={!currentTrack}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#000">
              <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#000">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          className="music-ctrl-btn"
          onClick={next}
          disabled={!currentTrack}
          aria-label="Next"
          style={{ width: 48, height: 48 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,4 15,12 5,20" /><rect x="16" y="4" width="3" height="16" rx="1" />
          </svg>
        </button>

        {/* Repeat */}
        <button
          className={`music-ctrl-btn${repeatMode !== REPEAT_MODES.OFF ? ' active' : ''}`}
          onClick={cycleRepeat}
          aria-label={`Repeat: ${repeatMode}`}
          style={{ position: 'relative' }}
        >
          {repeatMode === REPEAT_MODES.ONE ? (
            /* Repeat one icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              <text x="10" y="14" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">1</text>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          )}
          {repeatMode !== REPEAT_MODES.OFF && (
            <span style={{
              position: 'absolute', bottom: 4, left: '50%',
              transform: 'translateX(-50%)',
              width: 4, height: 4,
              background: 'var(--music-accent)',
              borderRadius: '50%',
              display: 'block',
            }} />
          )}
        </button>
      </div>
    </div>
  );
}
