import React, { useEffect, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMusicState } from '../context/MusicContext.jsx';
import { useLibrary } from '../hooks/useLibrary.js';
import { VIEWS } from '../utils/constants.js';

// Layout + Components
import { MusicSidebar } from '../components/sidebar/MusicSidebar.jsx';
import { MusicPlayer } from '../components/player/MusicPlayer.jsx';
import { HomePage } from '../components/home/HomePage.jsx';
import { MusicSearch } from '../components/search/MusicSearch.jsx';
import { LibraryPage } from '../components/library/LibraryPage.jsx';
import { PlaylistPage } from '../components/playlist/PlaylistPage.jsx';
import { LikedSongs } from '../components/library/LikedSongs.jsx';
import { MusicBottomNav } from '../components/sidebar/MusicBottomNav.jsx';
import { ToastNotification } from '../components/shared/ToastNotification.jsx';

import '../styles/music.css';

function MusicContent() {
  const { activeView } = useMusicState();
  const { importPlaylistFromUrl } = useLibrary();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle shared playlist link
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sharedData = params.get('playlist');
    if (sharedData) {
      const newId = importPlaylistFromUrl(sharedData);
      if (newId) {
        // Clean URL after import
        navigate('/music', { replace: true });
      }
    }
  }, [location.search, importPlaylistFromUrl, navigate]);

  return (
    <div className="music-module">
      <div className="music-layout">
        <MusicSidebar />
        <main className="music-main" id="music-scroll-container">
          <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#B3B3B3' }}>Loading...</div>}>
            {activeView === VIEWS.HOME && <HomePage />}
            {activeView === VIEWS.SEARCH && <MusicSearch />}
            {activeView === VIEWS.LIBRARY && <LibraryPage />}
            {activeView === VIEWS.PLAYLIST && <PlaylistPage />}
            {activeView === VIEWS.LIKED && <LikedSongs />}
          </Suspense>
        </main>
      </div>
      <MusicBottomNav />
      <MusicPlayer />
      <ToastNotification />
    </div>
  );
}

export default function MusicPage() {
  return <MusicContent />;
}
