import React, { useState } from 'react';
import { usePlaylists } from '../../hooks/usePlaylists.js';
import { useMusicDispatch } from '../../context/MusicContext.jsx';
import { ACTIONS, VIEWS } from '../../utils/constants.js';

export function PlaylistGrid() {
  const { playlists, deletePlaylist, renamePlaylist } = usePlaylists();
  const dispatch = useMusicDispatch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const goPlaylist = (id) => {
    dispatch({ type: ACTIONS.SET_VIEW, payload: { view: VIEWS.PLAYLIST, playlistId: id } });
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      dispatch({
        type: ACTIONS.CREATE_PLAYLIST,
        payload: { id: Date.now().toString(), name: newPlaylistName.trim() }
      });
      setNewPlaylistName('');
      setShowCreateModal(false);
    }
  };

  return (
    <>
      {playlists.length === 0 ? (
        <div className="music-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 2c-1.105 0-2 .895-2 2v4H5c-1.105 0-2 .895-2 2v10c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V10c0-1.105-.895-2-2-2h-2V4c0-1.105-.895-2-2-2H9zm0 2h6v4H9V4zm-4 6h14v10H5V10z"/>
          </svg>
          <h3>Create your first playlist</h3>
          <p style={{ fontSize: '14px', marginBottom: '24px' }}>Start organizing your favorite tracks</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="music-btn music-btn-primary"
          >
            + Create Playlist
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* Create Playlist Card */}
          <div
            onClick={() => setShowCreateModal(true)}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', transition: 'background 0.2s', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--music-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', marginBottom: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Create playlist</div>
          </div>

          {/* Playlist Cards */}
          {playlists.map(pl => (
            <div
              key={pl.id}
              onClick={() => goPlaylist(pl.id)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            >
              <div style={{ aspectRatio: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                {pl.coverUrl ? (
                  <img src={pl.coverUrl} alt={pl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 2c-1.105 0-2 .895-2 2v4H5c-1.105 0-2 .895-2 2v10c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V10c0-1.105-.895-2-2-2h-2V4c0-1.105-.895-2-2-2H9zm0 2h6v4H9V4zm-4 6h14v10H5V10z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div style={{ padding: '0 2px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={pl.name}>{pl.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--music-text-secondary)', marginTop: '4px' }}>{pl.tracks?.length || 0} songs</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="music-modal-scrim" onClick={() => setShowCreateModal(false)}>
          <div className="music-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="music-modal-title">Create Playlist</h2>
            <input
              type="text"
              className="music-input"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreatePlaylist();
                if (e.key === 'Escape') setShowCreateModal(false);
              }}
              autoFocus
            />
            <div className="music-btn-row">
              <button
                className="music-btn music-btn-text"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="music-btn music-btn-primary"
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                style={{
                  opacity: newPlaylistName.trim() ? 1 : 0.5,
                  cursor: newPlaylistName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
