// useSearch.js — Debounced search + abort controller

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMusicDispatch } from '../context/MusicContext.jsx';
import { ACTIONS } from '../utils/constants.js';
import { searchTracks, fetchSuggestions } from '../api/musicApi.js';

const DEBOUNCE_MS = 250;
const SUGGEST_DEBOUNCE_MS = 150;
const MIN_SUGGEST_CHARS = 2;
const SEARCH_CACHE_MAX = 50; // Limit cache to prevent memory bloat

export function useSearch() {
  const dispatch = useMusicDispatch();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // In-memory cache for back-navigation
  const searchCacheRef = useRef({});
  const searchAbortRef = useRef(null);
  const suggestAbortRef = useRef(null);
  const searchTimerRef = useRef(null);
  const suggestTimerRef = useRef(null);

  // ── Debounced search ──────────────────────────────────────────────────────

  const executeSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      dispatch({ type: ACTIONS.SET_SEARCH_RESULTS, payload: { results: [] } });
      return;
    }

    const cacheKey = q.toLowerCase().trim();
    if (searchCacheRef.current[cacheKey]) {
      const cached = searchCacheRef.current[cacheKey];
      setResults(cached);
      setHasSearched(true);
      dispatch({ type: ACTIONS.SET_SEARCH_RESULTS, payload: { results: cached } });
      return;
    }

    // Enforce cache size limit
    const cacheSize = Object.keys(searchCacheRef.current).length;
    if (cacheSize >= SEARCH_CACHE_MAX) {
      const firstKey = Object.keys(searchCacheRef.current)[0];
      delete searchCacheRef.current[firstKey];
    }

    // Abort previous in-flight request
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    searchAbortRef.current = new AbortController();

    setIsSearching(true);
    setError(null);
    dispatch({ type: ACTIONS.SET_SEARCHING, payload: { value: true } });

    try {
      const data = await searchTracks(q, searchAbortRef.current.signal);
      const tracks = data.results || [];
      searchCacheRef.current[cacheKey] = tracks;
      setResults(tracks);
      setHasSearched(true);
      setIsSearching(false);
      dispatch({ type: ACTIONS.SET_SEARCH_RESULTS, payload: { results: tracks } });
      dispatch({ type: ACTIONS.SET_SEARCHING, payload: { value: false } });
    } catch (err) {
      if (err.code === 'ABORTED') return;
      setIsSearching(false);
      setError(err.message || 'Search failed');
      dispatch({ type: ACTIONS.SET_SEARCHING, payload: { value: false } });
    }
  }, [dispatch]);

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }
    searchTimerRef.current = setTimeout(() => executeSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(searchTimerRef.current);
  }, [query, executeSearch]);

  // ── Debounced suggestions ─────────────────────────────────────────────────

  useEffect(() => {
    clearTimeout(suggestTimerRef.current);

    if (query.length < MIN_SUGGEST_CHARS) {
      setSuggestions([]);
      dispatch({ type: ACTIONS.SET_SUGGESTIONS, payload: { suggestions: [] } });
      return;
    }

    suggestTimerRef.current = setTimeout(async () => {
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      suggestAbortRef.current = new AbortController();

      setIsSuggesting(true);
      try {
        const data = await fetchSuggestions(query, suggestAbortRef.current.signal);
        const sugg = data.suggestions || [];
        setSuggestions(sugg);
        dispatch({ type: ACTIONS.SET_SUGGESTIONS, payload: { suggestions: sugg } });
      } catch (err) {
        if (err.code !== 'ABORTED') setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, SUGGEST_DEBOUNCE_MS);

    return () => clearTimeout(suggestTimerRef.current);
  }, [query, dispatch]);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      clearTimeout(searchTimerRef.current);
      clearTimeout(suggestTimerRef.current);
    };
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setError(null);
    setHasSearched(false);
    dispatch({ type: ACTIONS.SET_SEARCH_RESULTS, payload: { results: [] } });
    dispatch({ type: ACTIONS.SET_SUGGESTIONS, payload: { suggestions: [] } });
  }, [dispatch]);

  const selectSuggestion = useCallback((suggestion) => {
    // Clear suggestions FIRST so the dropdown can't reappear
    setSuggestions([]);
    dispatch({ type: ACTIONS.SET_SUGGESTIONS, payload: { suggestions: [] } });
    setQuery(suggestion);
    // Trigger search immediately (don't wait for debounce)
    clearTimeout(suggestTimerRef.current);
    executeSearch(suggestion);
  }, [dispatch, executeSearch]);

  return {
    query,
    setQuery,
    results,
    suggestions,
    isSearching,
    isSuggesting,
    error,
    hasSearched,
    clearSearch,
    selectSuggestion,
    executeSearch,
  };
}
