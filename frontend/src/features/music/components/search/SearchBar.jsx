import React, { useRef, useEffect, useState, useCallback } from 'react';

export function SearchBar({ query, setQuery, suggestions, clearSearch, selectSuggestion, isSuggesting, onSearch }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const justSelectedRef = useRef(false); // prevents dropdown reappearing after selection

  useEffect(() => {
    // Don't re-open dropdown if we just selected a suggestion
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    setShowSuggestions(suggestions.length > 0 && query.length >= 1);
    setFocusedIdx(-1);
  }, [suggestions, query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions) setFocusedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) setFocusedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && focusedIdx >= 0) {
        selectSuggestion(suggestions[focusedIdx]);
      } else if (query.trim() && onSearch) {
        onSearch(query.trim());
      }
      setShowSuggestions(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }, [showSuggestions, focusedIdx, suggestions, selectSuggestion, query, onSearch]);

  const handleClear = useCallback(() => {
    clearSearch();
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [clearSearch]);

  const handleSuggestionClick = useCallback((s) => {
    justSelectedRef.current = true; // block next effect from reopening
    selectSuggestion(s);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }, [selectSuggestion]);

  return (
    <div className="music-search-wrap" ref={containerRef} style={{ position: 'relative' }}>
      <span className="music-search-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>

      <input
        ref={inputRef}
        className="music-search-input"
        id="music-search-input"
        type="search"
        inputMode="search"
        enterKeyHint="search"
        placeholder="What do you want to listen to?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0 && query.length >= 1) setShowSuggestions(true);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {query && (
        <button
          className="music-search-clear"
          onClick={handleClear}
          tabIndex={-1}
          aria-label="Clear search"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#2a2a2a',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
            zIndex: 200,
            maxHeight: '280px',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {isSuggesting ? (
            <div style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--music-text-secondary)', fontSize: '13px' }}>
              Loading suggestions...
            </div>
          ) : (
            suggestions.slice(0, 15).map((s, i) => (
              <div
                key={i}
                role="option"
                aria-selected={focusedIdx === i}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: focusedIdx === i ? 'rgba(255,255,255,0.1)' : 'transparent',
                  transition: 'background 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: focusedIdx === i ? '#fff' : 'var(--music-text-secondary)',
                  borderRadius: focusedIdx === i ? 8 : 0,
                  margin: focusedIdx === i ? '2px 4px' : 0,
                }}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click
                  handleSuggestionClick(s);
                }}
                onMouseEnter={() => setFocusedIdx(i)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
