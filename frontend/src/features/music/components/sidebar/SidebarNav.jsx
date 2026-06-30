import React from 'react';
import { useMusicState, useMusicDispatch } from '../../context/MusicContext.jsx';
import { ACTIONS, VIEWS } from '../../utils/constants.js';
import { Home, Search, Library } from 'lucide-react';

export function SidebarNav() {
  const { activeView } = useMusicState();
  const dispatch = useMusicDispatch();

  const navigate = (view) => dispatch({ type: ACTIONS.SET_VIEW, payload: { view } });

  const navItems = [
    { view: VIEWS.HOME, Icon: Home, label: 'Home' },
    { view: VIEWS.SEARCH, Icon: Search, label: 'Search' },
    { view: VIEWS.LIBRARY, Icon: Library, label: 'Your Library' },
  ];

  return (
    <nav
      className="music-sidebar-section-container"
      role="navigation"
      aria-label="Main navigation"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ view, Icon, label }) => (
          <button
            key={view}
            className={`music-nav-btn${activeView === view ? ' active' : ''}`}
            onClick={() => navigate(view)}
            aria-current={activeView === view ? 'page' : undefined}
          >
            <Icon className="icon" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

