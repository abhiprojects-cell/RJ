import React, { useState } from 'react';
import { usePlaylists } from '../../hooks/usePlaylists.js';
import { useMusicState, useMusicDispatch } from '../../context/MusicContext.jsx';
import { PlaylistTrackList } from './PlaylistTrackList.jsx';
import { EmptyState } from '../shared/SharedComponents.jsx';
import { ACTIONS, VIEWS } from '../../utils/constants.js';
import { usePlayer } from '../../hooks/usePlayer.js';

export function PlaylistPage() {
  const { activePlaylistId } = useMusicState();
  const dispatch = useMusicDispatch();
  const { getPlaylist, deletePlaylist, sharePlaylist } = usePlaylists();
  const { play } = usePlayer();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [playMode, setPlayMode] = useState('inorder'); // 'inorder' | 'shuffle'

  const playlist = getPlaylist(activePlaylistId);

  if (!playlist) {
    return (
      <div className="music-fade-in" style={{ padding: 32 }}>
        <EmptyState icon="⚠️" title="Playlist not found" subtitle="It may have been deleted" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="music-btn music-btn-primary" onClick={() => dispatch({ type: ACTIONS.SET_VIEW, payload: { view: VIEWS.LIBRARY } })}>
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const handlePlay = () => {
    if (playlist.tracks.length === 0) return;
    if (playMode === 'shuffle') {
      const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
      play(shuffled[0], shuffled, 0, `playlist:${playlist.id}`);
    } else {
      play(playlist.tracks[0], playlist.tracks, 0, `playlist:${playlist.id}`);
    }
  };

  const togglePlayMode = () => setPlayMode(prev => prev === 'inorder' ? 'shuffle' : 'inorder');
  const isShuffle = playMode === 'shuffle';

  const handleDelete = () => {
    if (confirm(`Delete playlist "${playlist.name}"?`)) {
      deletePlaylist(playlist.id);
      dispatch({ type: ACTIONS.SET_VIEW, payload: { view: VIEWS.LIBRARY } });
    }
  };

  const handleShare = () => {
    sharePlaylist(playlist.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    dispatch({ type: ACTIONS.SET_VIEW, payload: { view: VIEWS.LIBRARY } });
  };

  const coverUrl = playlist.coverUrl || playlist.tracks?.[0]?.thumbnail;
  const trackCount = playlist.tracks?.length || 0;

  return (
    <div className="music-fade-in" style={{ paddingBottom: 100, minHeight: '100vh', background: '#0c0c0c' }}>

      {/* ── Compact Header: fixed-height, not full-square ── */}
      <div style={{ position: 'relative', width: '100%', height: 260, overflow: 'hidden' }}>
        {/* Background blurred art */}
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(12px) brightness(0.5)', transform: 'scale(1.1)' }}
            aria-hidden="true"
          />
        )}
        {!coverUrl && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} />
        )}

        {/* dark vignette overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(12,12,12,1) 100%)' }} />

        {/* Top bar: back + menu */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0', zIndex: 2 }}>
          <button
            onClick={handleBack}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(4px)', flexShrink: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* ⋮ menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(m => !m)}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(4px)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>
              </svg>
            </button>
            {showMenu && (
              <>
                <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{ position: 'absolute', right: 0, top: 44, background: '#282828', borderRadius: 12, padding: '8px 0', minWidth: 180, zIndex: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                  <button onClick={() => { handleShare(); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 20px', background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    {copied ? '✓ Link Copied!' : 'Share Playlist'}
                  </button>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  <button onClick={() => { handleDelete(); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 20px', background: 'none', border: 'none', color: '#ff5555', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    Delete Playlist
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Centre: square art thumbnail */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -58%)', width: 110, height: 110, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 1, flexShrink: 0 }}>
          {coverUrl ? (
            <img src={coverUrl} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🎵</div>
          )}
        </div>

        {/* Bottom: title & track count */}
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', zIndex: 1, padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Playlist</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', margin: '0 0 4px', lineHeight: 1.2 }}>{playlist.name}</h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{trackCount} track{trackCount !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px 12px' }}>
        {/* Big Play button — plays in current mode */}
        <button
          onClick={handlePlay}
          disabled={trackCount === 0}
          style={{ width: 56, height: 56, borderRadius: '50%', background: trackCount > 0 ? 'var(--music-accent)' : 'rgba(255,255,255,0.1)', border: 'none', color: '#000', cursor: trackCount > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: trackCount > 0 ? '0 4px 20px rgba(29,185,84,0.4)' : 'none', transition: 'all 0.2s' }}
          title={isShuffle ? 'Play Shuffled' : 'Play in order'}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        {/* Shuffle toggle — glows green when active */}
        <button
          onClick={togglePlayMode}
          disabled={trackCount === 0}
          className="music-ctrl-btn"
          style={{ width: 36, height: 36, color: isShuffle ? 'var(--music-accent)' : 'var(--music-text-secondary)', cursor: trackCount > 0 ? 'pointer' : 'not-allowed', position: 'relative', transition: 'color 0.2s' }}
          title={isShuffle ? 'Shuffle: ON — click for In Order' : 'Shuffle: OFF — click for Shuffle'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          {isShuffle && (
            <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--music-accent)', display: 'block' }} />
          )}
        </button>

        {/* Mode label */}
        <span style={{ fontSize: '13px', color: 'var(--music-text-secondary)', fontWeight: 500 }}>
          {isShuffle ? 'Shuffle' : 'In order'}
        </span>
      </div>

      {/* ── Track list ── */}
      {trackCount > 0 ? (
        <PlaylistTrackList playlist={playlist} />
      ) : (
        <EmptyState icon="🎶" title="Empty playlist" subtitle="Search for tracks and add them here" />
      )}
    </div>
  );
}
