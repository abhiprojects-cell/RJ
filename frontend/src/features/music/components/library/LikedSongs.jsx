import React, { useState } from 'react';
import { useLikedSongs } from '../../hooks/useLikedSongs.js';
import { TrackCard } from '../search/TrackCard.jsx';
import { usePlayer } from '../../hooks/usePlayer.js';

// playMode: 'inorder' | 'shuffle'
export function LikedSongs() {
  const { likedSongs } = useLikedSongs();
  const { play } = usePlayer();
  const [playMode, setPlayMode] = useState('inorder'); // 'inorder' | 'shuffle'

  if (!likedSongs || likedSongs.length === 0) {
    return (
      <div className="music-empty-state" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <h3>Songs you like will appear here</h3>
        <p style={{ fontSize: '14px' }}>Save songs by tapping the heart icon</p>
      </div>
    );
  }

  const handlePlay = () => {
    if (playMode === 'shuffle') {
      const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
      play(shuffled[0], shuffled, 0, 'liked');
    } else {
      play(likedSongs[0], likedSongs, 0, 'liked');
    }
  };

  const togglePlayMode = () => {
    setPlayMode(prev => prev === 'inorder' ? 'shuffle' : 'inorder');
  };

  const isShuffle = playMode === 'shuffle';

  return (
    <div className="music-fade-in" style={{ paddingBottom: 100 }}>
      {/* Gradient Header */}
      <div className="music-liked-header">
        <div className="music-liked-icon" style={{ background: 'linear-gradient(135deg, #450af5, #c4efd9)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <div className="music-liked-info">
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.5px' }}>Liked Songs</h1>
          <div className="music-liked-count" style={{ fontWeight: '500' }}>{likedSongs.length} song{likedSongs.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="music-liked-actions" style={{ padding: '16px 24px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Big Play Button */}
          <button className="music-btn-play" onClick={handlePlay} title={isShuffle ? 'Play Shuffled' : 'Play in order'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          {/* Shuffle Toggle Button — glows green when active */}
          <button
            onClick={togglePlayMode}
            className="music-ctrl-btn"
            style={{
              width: 36,
              height: 36,
              color: isShuffle ? 'var(--music-accent)' : 'var(--music-text-secondary)',
              position: 'relative',
              transition: 'color 0.2s',
            }}
            title={isShuffle ? 'Shuffle: ON — click for In Order' : 'Shuffle: OFF — click for Shuffle'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
            {/* Green dot indicator when shuffle is ON */}
            {isShuffle && (
              <span style={{
                position: 'absolute',
                bottom: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'var(--music-accent)',
                display: 'block',
              }} />
            )}
          </button>

          {/* Mode label */}
          <span style={{ fontSize: '13px', color: 'var(--music-text-secondary)', fontWeight: 500 }}>
            {isShuffle ? 'Shuffle' : 'In order'}
          </span>
        </div>
      </div>

      {/* Track List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 16px' }}>
        {likedSongs.map((track, i) => (
          <TrackCard
            key={`${track.videoId}-${i}`}
            track={track}
            queue={likedSongs}
            queueIndex={i}
            context="liked"
          />
        ))}
      </div>
    </div>
  );
}
