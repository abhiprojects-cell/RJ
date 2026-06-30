import React, { useRef, useCallback, useState, useEffect } from 'react';
import { usePlayer } from '../../hooks/usePlayer.js';
import { useMusicAudio } from '../../context/MusicContext.jsx';
import { formatDuration } from '../../utils/formatters.js';

export function ProgressBar({ mini = false }) {
  const { currentTime, duration, currentTrack } = usePlayer();
  const { audioRef } = useMusicAudio();
  const progressRef = useRef(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const percent = duration > 0 ? ((isDragging ? dragTime : currentTime) / duration) * 100 : 0;

  const calculateTimeFromEvent = (e) => {
    if (!progressRef.current || !duration) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pos = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(pos * duration, duration));
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    setDragTime(calculateTimeFromEvent(e));
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    setDragTime(calculateTimeFromEvent(e));
  };

  const handleDragEnd = useCallback(
    (e) => {
      if (!isDragging || !duration || !audioRef.current) {
        setIsDragging(false);
        return;
      }
      const newTime = calculateTimeFromEvent(e.changedTouches ? e.changedTouches[0] : e);
      audioRef.current.currentTime = newTime;
      setIsDragging(false);
    },
    [isDragging, duration, audioRef]
  );

  useEffect(() => {
    if (!isDragging) return;

    const cleanup = () => {
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };

    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);

    return cleanup;
  }, [isDragging, handleDragMove, handleDragEnd]);

  if (mini) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'absolute', bottom: 0, left: 0 }}>
        <div className="sp-mini-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    );
  }

  return (
    <div className="music-progress-container">
      <div 
        className="music-progress-bar" 
        ref={progressRef}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{ padding: '8px 0', backgroundClip: 'content-box' }}
      >
        <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
          <div className="music-progress-fill" style={{ width: `${percent}%`, position: 'absolute', left: 0, top: 0, height: '100%', background: isDragging ? 'var(--music-accent)' : 'var(--music-text-primary)', borderRadius: 2 }} />
          <div className="music-progress-handle" style={{ 
            position: 'absolute', top: '50%', right: `${100 - percent}%`, 
            transform: 'translate(50%, -50%)', width: 12, height: 12, 
            background: '#fff', borderRadius: '50%', 
            opacity: isDragging ? 1 : undefined 
          }} />
        </div>
      </div>
      <div className="music-progress-times">
        <span>{formatDuration(isDragging ? dragTime : currentTime)}</span>
        <span>{formatDuration(duration || currentTrack?.duration || 0)}</span>
      </div>
    </div>
  );
}
