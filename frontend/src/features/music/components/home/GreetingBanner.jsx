import React from 'react';

export function GreetingBanner() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="music-greeting-section">
      <div className="music-greeting-time">{getGreeting()}</div>
    </div>
  );
}
