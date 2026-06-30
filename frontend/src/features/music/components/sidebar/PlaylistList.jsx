import React, { useState } from 'react';
import { usePlaylists } from '../../hooks/usePlaylists.js';
import { useLikedSongs } from '../../hooks/useLikedSongs.js';
import { useMusicDispatch, useMusicState } from '../../context/MusicContext.jsx';
import { ACTIONS, VIEWS } from '../../utils/constants.js';
import { CreatePlaylistModal } from '../playlist/CreatePlaylistModal.jsx';
import { truncate } from '../../utils/formatters.js';
import { Heart, Music, Plus, ListMusic } from 'lucide-react';

export function PlaylistList() {
  const { playlists } = usePlaylists();
  const { count } = useLikedSongs();
  const dispatch = useMusicDispatch();
  const { activeView, activePlaylistId } = useMusicState();
  const [showCreate, setShowCreate] = useState(false);

  const goLiked = () => dispatch({ type: ACTIONS.SET_VIEW, payload: { view: VIEWS.LIKED } });
  const goPlaylist = (id) => dispatch({ type: ACTIONS.SET_VIEW, payload: { view: VIEWS.PLAYLIST, playlistId: id } });

  return (
    <div className="music-sidebar-section-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="music-sidebar-section-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ListMusic size={20} />
          <span>Your Library</span>
        </div>
        <button 
          className="music-ctrl-btn" 
          onClick={() => setShowCreate(true)}
          title="Create playlist"
          style={{ width: 'auto', height: 'auto', padding: 4 }}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="music-sidebar-section">
        {/* Liked Songs pinned */}
        <div
          className={`music-playlist-item${activeView === VIEWS.LIKED ? ' active' : ''}`}
          onClick={goLiked}
        >
          <div className="icon-box" style={{ background: 'linear-gradient(135deg, #450af5, #c4efd9)' }}>
            <Heart size={16} fill="white" color="white" />
          </div>
          <span>Liked Songs ({count})</span>
        </div>

        {playlists.map((pl) => (
          <div
            key={pl.id}
            className={`music-playlist-item${activePlaylistId === pl.id ? ' active' : ''}`}
            onClick={() => goPlaylist(pl.id)}
            title={pl.name}
          >
            {pl.coverUrl ? (
              <img src={pl.coverUrl} alt="" />
            ) : (
              <div className="icon-box">
                <Music size={16} />
              </div>
            )}
            <span>{truncate(pl.name, 22)}</span>
          </div>
        ))}

        {!playlists.length && (
          <div style={{ padding: '24px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--music-text-secondary)', marginBottom: 12 }}>
              Create your first playlist
            </p>
            <button 
              className="music-btn music-btn-primary" 
              onClick={() => setShowCreate(true)}
              style={{ padding: '8px 16px', fontSize: 12 }}
            >
              Create Playlist
            </button>
          </div>
        )}
      </div>

      {showCreate && <CreatePlaylistModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

