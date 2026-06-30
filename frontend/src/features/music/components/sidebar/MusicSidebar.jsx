import React from 'react';
import { SidebarNav } from './SidebarNav.jsx';
import { PlaylistList } from './PlaylistList.jsx';
import { Music2 } from 'lucide-react';
import InstallButton from '../shared/InstallButton.jsx';

export function MusicSidebar() {
  return (
    <aside className="music-sidebar">
      <div className="music-sidebar-section-container">
        <div className="music-sidebar-header">
          <Music2 size={28} />
          <span>CEA Music</span>
        </div>
        <InstallButton />
      </div>
      <SidebarNav />
      <PlaylistList />
    </aside>
  );
}
