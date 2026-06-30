import React from 'react';

export function LoadingSpinner({ size = 36 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
      <div className="music-spinner" style={{ width: size, height: size }} />
    </div>
  );
}

export function ErrorFallback({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="music-error music-fade-in">
      <div style={{ fontSize: 40 }}>⚠️</div>
      <div className="music-error-title">{message}</div>
      {onRetry && (
        <button className="music-btn music-btn-ghost" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = '🎵', title = 'Nothing here yet', subtitle = '' }) {
  return (
    <div className="music-empty music-fade-in">
      <div className="music-empty-icon">{icon}</div>
      <div className="music-empty-title">{title}</div>
      {subtitle && <p className="music-empty-sub">{subtitle}</p>}
    </div>
  );
}
