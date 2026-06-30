import React from 'react';

import InstallButton from '../shared/InstallButton.jsx';

export function GreetingBanner() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="music-greeting-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="music-greeting-time">{getGreeting()}</div>
      <InstallButton className="mobile-only-install-btn" />
    </div>
  );
}
