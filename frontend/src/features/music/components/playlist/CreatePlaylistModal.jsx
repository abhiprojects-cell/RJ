import React, { useState } from 'react';
import { usePlaylists } from '../../hooks/usePlaylists.js';

export function CreatePlaylistModal({ onClose }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const { createPlaylist } = usePlaylists();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createPlaylist(name.trim(), desc.trim());
    onClose();
  };

  return (
    <div className="music-modal-overlay" onClick={onClose}>
      <div className="music-modal" onClick={e => e.stopPropagation()}>
        <h2 className="music-modal-title">Create Playlist</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Playlist name"
            className="music-modal-input"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            className="music-modal-input"
            style={{ resize: 'vertical', minHeight: 80 }}
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <div className="music-modal-actions">
            <button type="button" className="music-btn music-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="music-btn music-btn-primary" disabled={!name.trim()}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
