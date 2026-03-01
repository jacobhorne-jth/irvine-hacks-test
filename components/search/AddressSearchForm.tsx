'use client';

import { useState, FormEvent, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, MapPin } from 'lucide-react';

const SAMPLE_ADDRESSES = [
  '2744 Middle St, Orlando, FL 32807',
  '1642 Peacock Ave, Sunnyvale, CA 94087',
  '30 Shade Tree, Irvine, CA',
];

export function AddressSearchForm({ centered = false }: { centered?: boolean }) {
  const router = useRouter();
  const [address, setAddress]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [suggestions, setSuggestions]   = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults]       = useState(false);
  const [activeIndex, setActiveIndex]   = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const fetchSuggestions = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setNoResults(false);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address-suggest?q=${encodeURIComponent(value)}`);
        if (!res.ok) return;
        const data: string[] = await res.json();
        setSuggestions(data);
        setNoResults(data.length === 0);
        setShowDropdown(true);
        setActiveIndex(-1);
      } catch {
        // suggestions are non-critical — fail silently
      }
    }, 300);
  }, []);

  function handleChange(value: string) {
    setAddress(value);
    setNoResults(false); // clear error as user keeps typing
    fetchSuggestions(value);
  }

  function handleSelect(suggestion: string) {
    setAddress(suggestion);
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setShowDropdown(false);
    router.push(`/property/${encodeURIComponent(address.trim())}`);
  }

  return (
    <div className="w-full max-w-2xl space-y-4" ref={containerRef}>
      <div className="relative">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 border border-[#1E2640] bg-[#0B0F1C] rounded-2xl px-4 py-3.5 focus-within:border-[#F5A11C]/40 transition-colors">
            <Search className="h-4 w-4 text-[#AABFCF] shrink-0" />
            <input
              type="text"
              value={address}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              placeholder="Enter any US property address..."
              className="flex-1 bg-transparent text-white placeholder:text-[#AABFCF] text-sm font-data focus:outline-none"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#F5A11C] text-[#080B14] text-sm font-bold rounded-2xl hover:bg-[#F5A11C]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 whitespace-nowrap"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Analyzing...' : 'Analyze Risk →'}
          </button>
        </form>

        {/* Autocomplete dropdown */}
        {showDropdown && (suggestions.length > 0 || noResults) && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-[#1A2035] bg-[#0B0F1C] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
            {noResults ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#AABFCF]" />
                <span className="text-sm font-data text-[#AABFCF] italic">No address found</span>
              </div>
            ) : (
              suggestions.map((suggestion, i) => {
                const [street, ...rest] = suggestion.split(',');
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(suggestion);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[#1A2035] last:border-b-0 transition-colors ${
                      i === activeIndex ? 'bg-[#F5A11C]/8' : 'hover:bg-[#0F1320]'
                    }`}
                  >
                    <MapPin
                      className="h-3.5 w-3.5 shrink-0 transition-colors"
                      style={{ color: i === activeIndex ? '#F5A11C' : '#AABFCF' }}
                    />
                    <span className="min-w-0 truncate font-data text-sm">
                      <span className="text-white font-medium">{street}</span>
                      {rest.length > 0 && (
                        <span className="text-[#C8D6E2]">,{rest.join(',')}</span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Sample address chips */}
      <div className={`flex flex-col gap-2${centered ? ' items-center' : ''}`}>
        <p className="text-xs font-data text-[#AABFCF] tracking-[0.15em] uppercase">
          Sample addresses:
        </p>
        <div className={`flex flex-wrap gap-2${centered ? ' justify-center' : ''}`}>
          {SAMPLE_ADDRESSES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleSelect(sample)}
              className="text-xs font-data px-3 py-1.5 border border-[#1A2035] text-[#C8D6E2] hover:border-[#F5A11C]/40 hover:text-[#F5A11C] transition-colors rounded"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
