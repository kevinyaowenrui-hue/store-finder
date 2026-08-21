'use client';

import React from 'react';
import Link from 'next/link';
import { Database, Sparkles } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  engine?: string;
  totalStores?: number;
  onOpenCalculator?: () => void;
  onOpenKanban?: () => void;
  activeTaskCount?: number;
}

export function Header({
  engine,
  totalStores,
  onOpenCalculator,
  onOpenKanban,
  activeTaskCount = 0,
}: HeaderProps) {
  return (
    <header className="w-full border-b border-zinc-200/70 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/" className="hover:opacity-90 active:scale-95 transition-all flex items-center">
          <AppLogo size="md" showText={true} />
        </Link>

        {/* Right side Actions / Status */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 text-xs">
          {totalStores !== undefined && (
            <div className="hidden md:flex items-center px-2.5 py-1 rounded-full bg-zinc-100/90 text-zinc-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              <span>
                全国 <strong className="text-zinc-900 font-semibold">{totalStores}</strong> 店
              </span>
            </div>
          )}

          {onOpenCalculator && (
            <button
              type="button"
              onClick={onOpenCalculator}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold transition-all shadow-xs active:scale-95"
              title="得物调货净利润计算器"
            >
              <span>💰 利润计算器</span>
            </button>
          )}

          {onOpenKanban && (
            <button
              type="button"
              onClick={onOpenKanban}
              className="relative flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold transition-all shadow-xs active:scale-95"
              title="得物跨店调货进度看板"
            >
              <span>📊 调货看板</span>
              {activeTaskCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-black">
                  {activeTaskCount}
                </span>
              )}
            </button>
          )}

          <Link
            href="/admin"
            className="hidden sm:flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white active:bg-zinc-100 text-zinc-700 font-medium transition-all shadow-xs active:scale-95"
            title="管理后台"
          >
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            <span>管理后台</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
