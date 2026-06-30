import React, { useState, useRef, useEffect } from 'react';
import { usePlaylists } from '../../hooks/usePlaylists.js';
import { useLibrary } from '../../hooks/useLibrary.js';
import { useQueue } from '../../hooks/useQueue.js';
import { usePlayer } from '../../hooks/usePlayer.js';

export function TrackContextMenu({ track, onClose, playlistId }) {
  const sheetRef = useRef(null);
  const subSheetRef = useRef(null);
  const { playlists, addTrack, removeTrack, createPlaylist } = usePlaylists();
  const { toggleLike, isLiked } = useLibrary();
  const { playNext, addToQueue } = useQueue();
  const { play } = usePlayer();
  const [showPlaylistSub, setShowPlaylistSub] = useState(false);
  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [translateY, setTranslateY] = useState(0);
  const [subTranslateY, setSubTranslateY] = useState(0);

  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const formInputRef = useRef(null);

  useEffect(() => {
    // Disable body scroll when mounted
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!track) return null;
  const liked = isLiked(track.videoId);

  const handlePlayNow = () => { play(track, [track], 0); onClose(); };
  const handleAddToQueue = () => { addToQueue(track); onClose(); };
  const handleLike = () => { toggleLike(track); onClose(); };
  const handleOpenYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${track.videoId}`, '_blank');
    onClose();
  };

  const handleAddToPlaylist = (playlistId) => {
    addTrack(playlistId, track);
    setShowPlaylistSub(false);
    onClose();
  };

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  
  const handleTouchMove = (e, setTy) => {
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 0) setTy(deltaY);
  };

  const handleTouchEnd = (delta, setTy, closeFn) => {
    if (delta > 80) closeFn();
    else setTy(0);
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      const newId = createPlaylist(newPlaylistName.trim());
      handleAddToPlaylist(newId);
      setNewPlaylistName('');
      setShowNewPlaylistForm(false);
    }
  };

  useEffect(() => {
    if (showNewPlaylistForm && formInputRef.current) {
      formInputRef.current.focus();
    }
  }, [showNewPlaylistForm]);

  return (
    <>
      <div 
        style={{
          position: 'fixed', inset: 0,
          background: showPlaylistSub ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.7)',
          zIndex: 3000, transition: 'background 0.3s ease'
        }}
        onClick={onClose}
      />
      
      {/* Main Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#282828',
          borderRadius: '12px 12px 0 0',
          zIndex: 3001,
          transform: `translateY(${translateY}px)`,
          transition: translateY === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={(e) => !showPlaylistSub && handleTouchMove(e, setTranslateY)}
        onTouchEnd={() => !showPlaylistSub && handleTouchEnd(touchCurrentY.current - touchStartY.current, setTranslateY, onClose)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderBottom: '1px solid #535353' }}>
          <img src={track.thumbnail} style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover' }} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
            <div style={{ fontSize: 14, color: '#B3B3B3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist || track.channelTitle || 'Unknown'}</div>
          </div>
        </div>

        <div style={{ padding: '8px 0', overflowY: 'auto', maxHeight: '60vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', cursor: 'pointer' }} onClick={handlePlayNow}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2" width="24" height="24">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#fff' }}>Play now</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', cursor: 'pointer' }} onClick={handleAddToQueue}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2" width="24" height="24">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#fff' }}>Add to queue</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', cursor: 'pointer' }} onClick={handleLike}>
            {liked ? (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1ed760', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2" width="24" height="24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            )}
            <span style={{ fontSize: 16, fontWeight: 500, color: '#fff' }}>{liked ? 'Remove from liked' : 'Add to liked songs'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', cursor: 'pointer' }} onClick={() => setShowPlaylistSub(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2" width="24" height="24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#fff' }}>Add to playlist</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', cursor: 'pointer' }} onClick={handleOpenYouTube}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2" width="24" height="24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#fff' }}>Open in YouTube</span>
          </div>

          {playlistId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', cursor: 'pointer' }} onClick={() => { removeTrack(playlistId, track.videoId); onClose(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#e0245e" strokeWidth="2" width="24" height="24">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#e0245e' }}>Remove from playlist</span>
            </div>
          )}
        </div>
      </div>

      {/* Playlist Sub-sheet */}
      {showPlaylistSub && (
        <div
          ref={subSheetRef}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#282828',
            borderRadius: '12px 12px 0 0',
            zIndex: 3002,
            transform: `translateY(${subTranslateY}px)`,
            transition: subTranslateY === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
            height: '80vh', display: 'flex', flexDirection: 'column'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={(e) => handleTouchMove(e, setSubTranslateY)}
          onTouchEnd={() => handleTouchEnd(touchCurrentY.current - touchStartY.current, setSubTranslateY, () => setShowPlaylistSub(false))}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', borderBottom: '1px solid #535353' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>Add to playlist</h3>
            <button onClick={() => setShowPlaylistSub(false)} style={{ position: 'absolute', right: 16, fontSize: 24, color: '#B3B3B3', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!showNewPlaylistForm ? (
              <>
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', height: 64, cursor: 'pointer' }}
                  onClick={() => setShowNewPlaylistForm(true)}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 4, background: '#3E3E3E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 24, color: '#B3B3B3' }}>+</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>New playlist</div>
                </div>
                
                {playlists.map(pl => (
                  <div 
                    key={pl.id} 
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', height: 64, cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#3E3E3E'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => handleAddToPlaylist(pl.id)}
                  >
                    {pl.coverUrl ? (
                      <img src={pl.coverUrl} style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} alt="" />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 4, background: '#535353', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 24 }}>🎵</span>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 500, color: '#FFFFFF' }}>{pl.name}</div>
                      <div style={{ fontSize: 12, color: '#B3B3B3' }}>{pl.tracks?.length || 0} songs</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ padding: '16px' }}>
                <label style={{ display: 'block', fontSize: 14, color: '#B3B3B3', marginBottom: 8 }}>Playlist name</label>
                <input
                  ref={formInputRef}
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreatePlaylist();
                    if (e.key === 'Escape') {
                      setShowNewPlaylistForm(false);
                      setNewPlaylistName('');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #535353',
                    background: '#1E1E1E',
                    color: '#FFFFFF',
                    fontSize: 14,
                    marginBottom: 16,
                    fontFamily: 'inherit',
                  }}
                  placeholder="Enter playlist name"
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={!newPlaylistName.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '4px',
                      background: newPlaylistName.trim() ? '#1DB954' : '#535353',
                      color: '#000',
                      border: 'none',
                      fontWeight: 600,
                      cursor: newPlaylistName.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewPlaylistForm(false);
                      setNewPlaylistName('');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '4px',
                      background: 'transparent',
                      color: '#B3B3B3',
                      border: '1px solid #535353',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
