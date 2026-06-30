import React from 'react';
import { usePlayer } from '../../hooks/usePlayer.js';

export function VolumeControl() {
  const { volume, isMuted, setVolume, toggleMute } = usePlayer();
  const displayVol = isMuted ? 0 : volume;

  const Icon = () => {
    if (displayVol === 0) return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
    );
    if (displayVol < 0.5) return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    );
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    );
  };

  return (
    <div className="music-volume">
      <button className="music-ctrl-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
        <Icon />
      </button>
      <input
        className="music-volume-slider"
        type="range" min="0" max="1" step="0.02"
        value={displayVol}
        onChange={(e) => setVolume(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--music-text-primary) ${displayVol * 100}%, var(--music-border) ${displayVol * 100}%)`
        }}
      />
    </div>
  );
}
