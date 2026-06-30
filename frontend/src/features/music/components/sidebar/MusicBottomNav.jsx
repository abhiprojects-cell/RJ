import React from 'react';
import { useMusicState, useMusicDispatch } from '../../context/MusicContext.jsx';
import { ACTIONS, VIEWS } from '../../utils/constants.js';

export function MusicBottomNav() {
  const { activeView } = useMusicState();
  const dispatch = useMusicDispatch();

  const setView = (view) => {
    dispatch({ type: ACTIONS.SET_VIEW, payload: { view } });
  };

  const NavButton = ({ view, label, icon }) => {
    const isActive = view === VIEWS.LIBRARY || view === VIEWS.PLAYLIST 
      ? (activeView === VIEWS.LIBRARY || activeView === VIEWS.PLAYLIST)
      : activeView === view;

    return (
      <button
        className={`music-bottom-nav-btn${isActive ? ' active' : ''}`}
        onClick={() => setView(view)}
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: '8px 12px',
          color: isActive ? 'var(--music-text-primary)' : 'var(--music-text-secondary)',
          fontSize: '11px',
          fontWeight: isActive ? 600 : 500,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'color 0.2s',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isActive ? '0' : '2'}>
          {icon}
        </svg>
        <span>{label}</span>
        {isActive && (
          <div style={{
            position: 'absolute',
            bottom: '0',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'var(--music-accent)',
          }} />
        )}
      </button>
    );
  };

  return (
    <nav className="music-bottom-nav">
      <NavButton
        view={VIEWS.HOME}
        label="Home"
        icon={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinejoin="round" />}
      />

      <NavButton
        view={VIEWS.SEARCH}
        label="Search"
        icon={<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" /></>}
      />

      <NavButton
        view={VIEWS.LIBRARY}
        label="Library"
        icon={<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>}
      />

      <NavButton
        view={VIEWS.LIKED}
        label="Liked"
        icon={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />}
      />
    </nav>
  );
}
