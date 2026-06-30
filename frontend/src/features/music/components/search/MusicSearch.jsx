import React, { useRef, useEffect } from 'react';
import { useSearch } from '../../hooks/useSearch.js';
import { TrackCard } from './TrackCard.jsx';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CATEGORIES = [
  { id: 1, name: 'All',          color: '#E13300', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop&q=80' },
  { id: 2, name: 'Music',        color: '#27856A', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&q=80' },
  { id: 3, name: 'Podcasts',     color: '#8400E7', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop&q=80' },
  { id: 4, name: 'Hip-Hop',      color: '#BA5D07', img: 'https://images.unsplash.com/photo-1601643157091-ce5c665179ab?w=400&h=400&fit=crop&q=80' },
  { id: 5, name: 'New Releases', color: '#E8115B', img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop&q=80' },
  { id: 6, name: 'Live Events',  color: '#1E3264', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&q=80' },
  { id: 9, name: 'Bollywood',    color: '#E8115B', img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&h=300&fit=crop' },
  { id: 10, name: 'Rock',        color: '#477D95', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop' },
  { id: 11, name: 'Lo-fi',       color: '#27856A', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop' },
];

export function MusicSearch() {
  const {
    query, setQuery,
    results, suggestions,
    isSearching, isSuggesting,
    error, hasSearched,
    clearSearch, selectSuggestion, executeSearch,
  } = useSearch();

  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleInput = (e) => setQuery(e.target.value);

  const handleClear = () => {
    clearSearch();
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (s) => {
    selectSuggestion(s);
    inputRef.current?.blur();
  };

  const handleCategoryClick = (name) => {
    setQuery(name);
    executeSearch(name);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      executeSearch(query.trim());
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  const isTyping = query.length > 0;
  const showSuggestions = suggestions.length > 0 && isTyping;
  const showResults = hasSearched || isSearching;

  // Dedupe results by videoId
  const uniqueResults = React.useMemo(() => {
    const seen = new Set();
    return results.filter(t => { if (seen.has(t.videoId)) return false; seen.add(t.videoId); return true; });
  }, [results]);

  return (
    <div className="music-search-page music-fade-in" style={{ display: 'flex', flexDirection: 'column', paddingBottom: 100 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 20, marginTop: 16, paddingLeft: 16, letterSpacing: '-0.5px' }}>Search</h1>

      {/* ── Search Bar ── */}
      <div style={{ padding: '0 16px 12px', position: 'sticky', top: 0, zIndex: 50, background: 'var(--music-bg)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 8, padding: '0 14px', height: 46 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to listen to?"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              fontWeight: 500,
              color: '#000',
              caretColor: '#1db954',
            }}
          />
          {query && (
            <button
              onClick={handleClear}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#666', display: 'flex', alignItems: 'center' }}
              aria-label="Clear"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Unified Scrollable List ── */}
      <div style={{ flex: 1, padding: '0 0 8px' }}>

        {/* No query: browse categories */}
        {!isTyping && (
          <div style={{ padding: '8px 16px 0' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, letterSpacing: '-0.2px', color: 'var(--music-text-primary)' }}>Browse all</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  style={{ position: 'relative', height: 90, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: cat.color }}
                >
                  <span style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 14, fontWeight: 800, color: '#fff', zIndex: 1 }}>{cat.name}</span>
                  <img src={cat.img} alt={cat.name} loading="lazy" style={{ position: 'absolute', right: -8, bottom: -4, width: 80, height: 80, objectFit: 'cover', borderRadius: 6, transform: 'rotate(20deg)', opacity: 0.9 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions at the top */}
        {showSuggestions && (
          <div style={{ padding: '4px 0' }}>
            {suggestions.slice(0, 8).map((s, i) => (
              <div
                key={i}
                onClick={() => handleSuggestionClick(s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 18px',
                  cursor: 'pointer',
                  color: 'var(--music-text-primary)',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ color: 'var(--music-text-secondary)', flexShrink: 0 }}><SearchIcon /></span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Suggestion loading */}
        {isSuggesting && !showSuggestions && isTyping && (
          <div style={{ padding: '12px 18px', fontSize: 13, color: 'var(--music-text-secondary)' }}>Loading…</div>
        )}

        {/* Results inline below suggestions */}
        {isSearching && (
          <div style={{ padding: '4px 0' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
                <div className="music-skeleton" style={{ width: 48, height: 48, borderRadius: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="music-skeleton" style={{ height: 13, width: '65%', marginBottom: 7 }} />
                  <div className="music-skeleton" style={{ height: 11, width: '40%' }} />
                </div>
                <div className="music-skeleton" style={{ width: 34, height: 11 }} />
              </div>
            ))}
          </div>
        )}

        {!isSearching && showResults && uniqueResults.length > 0 && (
          <div>
            {showSuggestions && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
            )}
            <div>
              {uniqueResults.map((track, idx) => (
                <TrackCard
                  key={`${track.videoId}-${idx}`}
                  track={track}
                  queue={uniqueResults}
                  queueIndex={idx}
                  context="search"
                />
              ))}
            </div>
          </div>
        )}

        {!isSearching && showResults && !uniqueResults.length && !error && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--music-text-secondary)', fontSize: 14 }}>
            No results for "{query}"
          </div>
        )}

        {error && !isSearching && (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--music-text-secondary)', fontSize: 14 }}>
            <div style={{ marginBottom: 12 }}>Could not complete the search.</div>
            <button
              onClick={() => executeSearch(query)}
              style={{ padding: '9px 24px', background: '#fff', color: '#000', border: 'none', borderRadius: 500, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
