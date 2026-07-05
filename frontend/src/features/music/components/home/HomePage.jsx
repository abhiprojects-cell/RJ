import React, { useState, useCallback } from 'react';
import { GreetingBanner } from './GreetingBanner.jsx';
import { RecentSection } from './RecentSection.jsx';
import { TrendingSection } from './TrendingSection.jsx';

export function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey(k => k + 1);
      setIsRefreshing(false);
    }, 1000);
  }, []);

  return (
    <div className="music-fade-in music-home-inner" style={{ paddingBottom: 100 }}>
      {isRefreshing && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <div style={{
            width: 20, height: 20,
            border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: 'var(--music-accent)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite'
          }} />
        </div>
      )}
      <GreetingBanner />
      <RecentSection key={`recent-${refreshKey}`} />
      <TrendingSection key={`trending-${refreshKey}`} />
    </div>
  );
}
