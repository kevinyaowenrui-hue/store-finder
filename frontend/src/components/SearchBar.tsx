'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, Sparkles, History, Trash2, Command } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

const STORAGE_KEY = 'store_finder_search_history';

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

  // Save term to history on debounce or submit
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

  // Keyboard shortcut listener (/ or Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' && document.activeElement !== inputRef.current && document.activeElement?.tagName !== 'INPUT') ||
        ((e.metaKey || e.ctrlKey) && e.key === 'k')
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectHistory = (item: string) => {
    onChange(item);
    saveToHistory(item);
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto group">
      <div className="relative flex items-center w-full bg-white rounded-2xl border border-zinc-200/90 shadow-elevated focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900/5 transition-all">
        {/* Left Search Icon */}
        <div className="pl-4.5 pr-2 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay closing to allow clicking history item
            setTimeout(() => setIsFocused(false), 200);
            if (value.trim()) saveToHistory(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              saveToHistory(value);
              setIsFocused(false);
            }
          }}
          onChange={(e) => onChange(e.target.value)}
          placeholder="搜索品牌、商场、城市、楼层或特色 (按 / 聚焦)"
          className="w-full py-4 pr-16 text-base sm:text-lg bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none font-normal"
        />

        {/* Keyboard shortcut hint / Clear Button */}
        <div className="absolute right-3 flex items-center space-x-1">
          {value ? (
            <button
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title="清空搜索"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200 rounded-md">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Recent Searches Dropdown Drawer when focused & empty */}
      {isFocused && !value && history.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-zinc-200 shadow-elevated p-3 z-30 animate-fade-in text-left">
          <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-semibold text-zinc-400 border-b border-zinc-100">
            <span className="flex items-center space-x-1">
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span>最近搜索</span>
            </span>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                clearHistory();
              }}
              className="text-zinc-400 hover:text-rose-600 transition-colors flex items-center space-x-0.5"
            >
              <Trash2 className="w-3 h-3" />
              <span>清空记录</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {history.map((term, idx) => (
              <button
                key={idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectHistory(term);
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtle Hint */}
      <div className="mt-2.5 flex items-center justify-between px-2 text-[12px] text-zinc-400">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">
            热门搜索：
            <span
              className="text-zinc-600 font-medium cursor-pointer hover:underline"
              onClick={() => {
                onChange('始祖鸟 郑州');
                saveToHistory('始祖鸟 郑州');
              }}
            >
              始祖鸟 郑州
            </span>{' '}
            ·{' '}
            <span
              className="text-zinc-600 font-medium cursor-pointer hover:underline"
              onClick={() => {
                onChange('Lululemon 静安');
                saveToHistory('Lululemon 静安');
              }}
            >
              Lulu 静安
            </span>{' '}
            ·{' '}
            <span
              className="text-zinc-600 font-medium cursor-pointer hover:underline"
              onClick={() => {
                onChange('Nike 001');
                saveToHistory('Nike 001');
              }}
            >
              Nike 001
            </span>{' '}
            ·{' '}
            <span
              className="text-zinc-600 font-medium cursor-pointer hover:underline"
              onClick={() => {
                onChange('Salomon 太古里');
                saveToHistory('Salomon 太古里');
              }}
            >
              Salomon 太古里
            </span>{' '}
            ·{' '}
            <span
              className="text-zinc-600 font-medium cursor-pointer hover:underline"
              onClick={() => {
                onChange('On 昂跑');
                saveToHistory('On 昂跑');
              }}
            >
              On 昂跑
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

