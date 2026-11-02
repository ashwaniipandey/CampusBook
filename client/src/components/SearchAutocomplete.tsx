'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock3, Loader2, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

type Suggestion = { type: 'title' | 'author' | 'isbn'; value: string };

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  inputClassName?: string;
  onFocus?: () => void;
}

export default function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = 'Search books, authors, or ISBN...',
  inputClassName = '',
  onFocus,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<{ term: string; searchedAt: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadRecentSearches = useCallback(async () => {
    if (!user) {
      setRecentSearches([]);
      return;
    }
    try {
      const response = await api.getRecentSearches();
      setRecentSearches(response.searches || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load recent searches.');
    }
  }, [user]);

  useEffect(() => {
    const query = value.trim();
    const id = ++requestId.current;
    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.getBookSuggestions(query);
        if (requestId.current === id) setSuggestions(response.suggestions || []);
      } catch (requestError) {
        if (requestId.current === id) {
          setSuggestions([]);
          setError(requestError instanceof Error ? requestError.message : 'Unable to load suggestions.');
        }
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const submitSearch = async (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    setOpen(false);
    onChange(normalized);
    if (user) {
      try {
        const response = await api.addRecentSearch(normalized);
        setRecentSearches(response.searches || []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to save this search.');
      }
    }
    if (onSearch) onSearch(normalized);
    else router.push(`/explore?q=${encodeURIComponent(normalized)}`);
  };

  const clearRecent = async () => {
    try {
      await api.clearRecentSearches();
      setRecentSearches([]);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to clear recent searches.');
    }
  };

  const showRecent = open && value.trim().length < 2 && user && recentSearches.length > 0;
  const showSuggestions = open && value.trim().length >= 2 && suggestions.length > 0;

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          setOpen(true);
          setError('');
          onFocus?.();
          if (user && value.trim().length < 2) void loadRecentSearches();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void submitSearch(value);
          }
          if (event.key === 'Escape') setOpen(false);
        }}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-campus-400 focus:outline-none focus:ring-2 focus:ring-campus-500/30 ${inputClassName}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            setOpen(true);
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {open && (showRecent || showSuggestions || loading || Boolean(error)) && (
        <div className="absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Finding suggestions...
            </div>
          )}
          {error && <p role="status" className="px-4 py-3 text-xs text-rose-700">{error}</p>}
          {showSuggestions && suggestions.map((suggestion) => (
            <button
              type="button"
              key={`${suggestion.type}-${suggestion.value}`}
              onClick={() => void submitSearch(suggestion.value)}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-campus-50"
            >
              <span className="truncate">{suggestion.value}</span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-500">{suggestion.type}</span>
            </button>
          ))}
          {showRecent && (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Recent searches</span>
                <button type="button" onClick={() => void clearRecent()} className="text-[11px] font-semibold text-campus-700 hover:underline">
                  Clear
                </button>
              </div>
              {recentSearches.map((search) => (
                <button
                  type="button"
                  key={`${search.term}-${search.searchedAt}`}
                  onClick={() => void submitSearch(search.term)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-campus-50"
                >
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{search.term}</span>
                </button>
              ))}
            </>
          )}
          {open && value.trim().length >= 2 && !loading && !error && !suggestions.length && (
            <p className="px-4 py-3 text-xs text-slate-500">No matching suggestions.</p>
          )}
        </div>
      )}
    </div>
  );
}
