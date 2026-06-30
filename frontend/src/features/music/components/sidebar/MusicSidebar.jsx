import React from 'react';
import { SidebarNav } from './SidebarNav.jsx';
import { PlaylistList } from './PlaylistList.jsx';
import { Music2 } from 'lucide-react';

export function MusicSidebar() {
  return (
    <aside className="music-sidebar">
      <div className="music-sidebar-section-container">
        <div className="music-sidebar-header">
          <Music2 size={28} />
          <span>CEA Music</span>
        </div>
      </div>
      <SidebarNav />
      <PlaylistList />
    </aside>
  );
}

