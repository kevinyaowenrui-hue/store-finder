'use client';

import React from 'react';
import Link from 'next/link';
import { Database } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  engine?: string;
  totalStores?: number;
}

export function Header({ engine, totalStores }: HeaderProps) {
  return (
    <header className="w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <AppLogo size="md" showText={true} />
        </Link>


        {/* Right side Actions / Status */}
        <div className="flex items-center space-x-3 text-sm">
          {engine && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-100/80 border border-zinc-200/60 text-xs text-zinc-600">
              <span className={`w-2 h-2 rounded-full ${engine === 'meilisearch' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="capitalize">{engine === 'meilisearch' ? 'Meilisearch 极速检索' : 'DB 检索模式'}</span>
            </div>
          )}

          {totalStores !== undefined && (
            <div className="hidden md:flex items-center text-xs text-zinc-500">
              收录 <span className="font-semibold text-zinc-800 mx-1">{totalStores}</span> 家门店
            </div>
          )}

          <Link
            href="/admin"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-xs transition-all shadow-subtle"
          >
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            <span>管理后台</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
