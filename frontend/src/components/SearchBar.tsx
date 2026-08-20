'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, Sparkles, History, Trash2 } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

const STORAGE_KEY = 'store_finder_search_history';

const POPULAR_SUGGESTIONS = [
  '1906',
  'Grey Store',
  '奥特莱斯',
  '跑步专营',
  '三里屯',
  '前滩太古里',
  '德基广场',
  '万象城',
];

export function SearchBar({ value, onChange, onClear, isLoading }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save term to history
  const saveToHistory = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleSelectSuggestion = (term: string) => {
    onChange(term);
    saveToHistory(term);
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto space-y-2">
      {/* Main Search Input */}
      <div
        className={`relative flex items-center bg-white rounded-2xl border transition-all duration-200 shadow-sm ${
          isFocused
            ? 'border-zinc-900 ring-2 ring-zinc-900/10 shadow-md'
            : 'border-zinc-200/90 hover:border-zinc-300'
        }`}
      >
        <div className="pl-4 pr-2 text-zinc-400 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
          ) : (
            <Search className="w-5 h-5 text-zinc-500" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Slight delay so suggestion clicks register before blur
            setTimeout(() => setIsFocused(false), 200);
            if (value.trim()) {
              saveToHistory(value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              saveToHistory(value);
              inputRef.current?.blur();
            }
          }}
          placeholder="搜索品牌、商场、城市、业态 (如 1906, 奥莱)..."
          className="w-full py-3.5 pr-10 bg-transparent text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />

        {value && (
          <button
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 active:scale-90 transition-all"
            title="清空搜索"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Search Suggestions & History (Mobile Friendly Horizontal Scroll) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1 text-xs -mx-1 px-1">
        <span className="text-[11px] text-zinc-400 font-medium shrink-0 flex items-center pl-1">
          <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
          热门:
        </span>
        {POPULAR_SUGGESTIONS.map((item) => (
          <button
            key={item}
            onClick={() => handleSelectSuggestion(item)}
            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 active:scale-95 text-zinc-700 font-medium shrink-0 transition-all text-xs"
          >
            {item}
          </button>
        ))}

        {history.length > 0 && (
          <>
            <span className="text-zinc-300 shrink-0 px-0.5">|</span>
            <span className="text-[11px] text-zinc-400 font-medium shrink-0 flex items-center">
              <History className="w-3 h-3 mr-1 text-zinc-400" />
              历史:
            </span>
            {history.map((item) => (
              <button
                key={item}
                onClick={() => handleSelectSuggestion(item)}
                className="px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 active:scale-95 text-zinc-600 font-medium shrink-0 transition-all text-xs"
              >
                {item}
              </button>
            ))}
            <button
              onClick={clearHistory}
              className="p-1 text-zinc-400 hover:text-zinc-600 shrink-0 text-[10px]"
              title="清空历史"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
