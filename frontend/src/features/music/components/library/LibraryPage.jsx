import React, { useState } from 'react';
import { PlaylistGrid } from './PlaylistGrid.jsx';
import { RecentlyPlayed } from './RecentlyPlayed.jsx';

export function LibraryPage() {
  const [activeTab, setActiveTab] = useState('playlists');

  return (
    <div className="music-fade-in" style={{ paddingBottom: 100 }}>
      <div style={{ padding: '24px 24px 0' }}>
        <h1 className="music-greeting" style={{ marginBottom: 16, fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>Your Library</h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', paddingBottom: '4px', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveTab('playlists')}
            style={{
              background: activeTab === 'playlists' ? 'var(--music-accent)' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'playlists' ? '#000' : '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Playlists
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            style={{
              background: activeTab === 'recent' ? 'var(--music-accent)' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'recent' ? '#000' : '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '24px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Recently Played
          </button>
        </div>
      </div>

      <div style={{ padding: '8px 24px 24px' }}>
        {activeTab === 'playlists' && <PlaylistGrid />}
        {activeTab === 'recent' && <RecentlyPlayed />}
      </div>
    </div>
  );
}
