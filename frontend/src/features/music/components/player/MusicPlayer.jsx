import React, { useState, useRef, useCallback } from 'react';
import { useMusicAudio, useMusicDispatch } from '../../context/MusicContext.jsx';
import { usePlayer } from '../../hooks/usePlayer.js';
import { useLikedSongs } from '../../hooks/useLikedSongs.js';
import { PlayerControls } from './PlayerControls.jsx';
import { ProgressBar } from './ProgressBar.jsx';
import { QueuePanel } from './QueuePanel.jsx';
import { TrackContextMenu } from '../shared/TrackContextMenu.jsx';
import { ACTIONS } from '../../utils/constants.js';

export function MusicPlayer() {
  const { audioRef } = useMusicAudio();
  const dispatch = useMusicDispatch();
  const { currentTrack, isPlaying, togglePlay, next, prev } = usePlayer();
  const { toggle, isLiked } = useLikedSongs();
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const translateY = useRef(0);
  const touchStartY = useRef(0);
  const playerRef = useRef(null);

  const liked = currentTrack ? isLiked(currentTrack.videoId) : false;

  const handleLikeToggle = useCallback(() => {
    if (!currentTrack) return;
    toggle(currentTrack);
    dispatch({
      type: ACTIONS.SHOW_TOAST,
      payload: {
        message: isLiked(currentTrack.videoId)
          ? 'Removed from Liked Songs'
          : 'Added to Liked Songs',
        type: isLiked(currentTrack.videoId) ? 'info' : 'success',
      },
    });
  }, [currentTrack, toggle, isLiked, dispatch]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setMenuPos({ x: e.clientX || window.innerWidth / 2, y: e.clientY || 80 });
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && playerRef.current) {
      playerRef.current.style.transform = `translateY(${delta}px)`;
      playerRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = (e) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (playerRef.current) {
      playerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      if (delta > 120) {
        playerRef.current.style.transform = 'translateY(100%)';
        setTimeout(() => {
          setIsExpanded(false);
          if (playerRef.current) playerRef.current.style.transform = '';
        }, 380);
      } else {
        playerRef.current.style.transform = 'translateY(0)';
      }
    }
    touchStartY.current = 0;
  };

  const handleShare = () => {
    if (!currentTrack) return;
    const url = `https://youtube.com/watch?v=${currentTrack.videoId}`;
    if (navigator.share) {
      navigator.share({ title: currentTrack.title, url });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        dispatch({ type: ACTIONS.SHOW_TOAST, payload: { message: 'Link copied!', type: 'info' } });
      });
    }
  };

  return (
    <>
      {/* Hidden HTML5 audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} playsInline preload="auto" />

      {/* ── FULLSCREEN PLAYER ── */}
      {isExpanded && currentTrack && (
        <div
          ref={playerRef}
          className="sp-fullscreen-player"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Dynamic blurred background */}
          <div className="sp-fs-art-bg">
            <img
              src={currentTrack.thumbnail}
              alt=""
              onError={(e) => { e.target.src = `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg`; }}
            />
          </div>
          <div className="sp-fs-bg" />

          <div className="sp-fs-inner">
            {/* Drag indicator */}
            <div className="sp-fs-drag-handle" />

            {/* Header */}
            <div className="sp-fs-header">
              <button className="sp-fs-btn" onClick={() => setIsExpanded(false)} aria-label="Minimize player">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="22" height="22">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div className="sp-fs-playing-from">
                <span className="sp-fs-playing-from-label">Now Playing</span>
              </div>

              <button className="sp-fs-btn" onClick={handleMenuClick} aria-label="More options">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                </svg>
              </button>
            </div>

            {/* Album Art */}
            <div className="sp-fs-art-wrap">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className={`sp-fs-art${isPlaying ? ' playing' : ''}`}
                onError={(e) => { e.target.src = `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg`; }}
              />
            </div>

            {/* Track Info & Like */}
            <div className="sp-fs-track-row">
              <div className="sp-fs-track-info">
                <div className="sp-fs-title">{currentTrack.title}</div>
                <div className="sp-fs-artist">{currentTrack.artist || currentTrack.channelTitle || 'Unknown Artist'}</div>
              </div>
              <button
                className={`sp-fs-like-btn${liked ? ' liked' : ''}`}
                onClick={handleLikeToggle}
                aria-label={liked ? 'Unlike' : 'Like'}
              >
                <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="26" height="26">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="sp-fs-progress">
              <ProgressBar />
            </div>

            {/* Controls */}
            <PlayerControls />

            {/* Bottom Action Row */}
            <div className="sp-fs-bottom-row">
              <button className="sp-fs-icon-btn" aria-label="Devices">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="sp-fs-icon-btn" onClick={handleShare} aria-label="Share">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
                <button className="sp-fs-icon-btn" onClick={() => setIsQueueOpen(true)} aria-label="Queue">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <rect x="3" y="6" width="18" height="2" rx="1" /><rect x="3" y="12" width="18" height="2" rx="1" />
                    <rect x="3" y="18" width="12" height="2" rx="1" /><polygon points="17,16 21,19 17,22" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MINI PLAYER BAR ── */}
      <div
        className={`sp-mini-player${currentTrack && !isExpanded ? ' visible' : ''}`}
        onClick={() => setIsExpanded(true)}
        role="button"
        aria-label="Open player"
      >
        {currentTrack && (
          <>
            <img
              src={currentTrack.thumbnail}
              alt=""
              className="sp-mini-art"
              onError={(e) => { e.target.src = `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg`; }}
            />
            <div className="sp-mini-info">
              <div className="sp-mini-title">{currentTrack.title}</div>
              <div className="sp-mini-artist">{currentTrack.artist || currentTrack.channelTitle || 'Unknown Artist'}</div>
            </div>

            <div className="sp-mini-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="music-ctrl-btn"
                onClick={handleLikeToggle}
                style={{ color: liked ? 'var(--music-accent)' : 'inherit', width: 44, height: 44 }}
                aria-label={liked ? 'Unlike' : 'Like'}
              >
                <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              <button
                className="music-ctrl-btn"
                onClick={prev}
                style={{ color: '#fff', width: 44, height: 44 }}
                aria-label="Previous"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <polygon points="19,20 9,12 19,4" /><rect x="5" y="4" width="3" height="16" rx="1" />
                </svg>
              </button>

              <button
                className="music-ctrl-btn"
                onClick={togglePlay}
                style={{ color: '#fff', width: 44, height: 44 }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><polygon points="5,3 19,12 5,21" /></svg>
                )}
              </button>

              <button
                className="music-ctrl-btn"
                onClick={next}
                style={{ color: '#fff', width: 44, height: 44 }}
                aria-label="Next"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <polygon points="5,4 15,12 5,20" /><rect x="17" y="4" width="2" height="16" rx="1" />
                </svg>
              </button>
            </div>

            {/* Progress line at the very bottom */}
            <div className="sp-mini-progress-line">
              <ProgressBar mini />
            </div>
          </>
        )}
      </div>

      {isQueueOpen && <QueuePanel onClose={() => setIsQueueOpen(false)} />}

      {menuPos && currentTrack && (
        <TrackContextMenu
          track={currentTrack}
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setMenuPos(null)}
        />
      )}
    </>
  );
}
