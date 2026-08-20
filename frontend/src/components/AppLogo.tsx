'use client';

import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export function AppLogo({ size = 'md', className = '', showText = false }: AppLogoProps) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const iconDimensions = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center space-x-2.5 group select-none ${className}`}>
      {/* Visual Emblem */}
      <div
        className={`relative ${iconDimensions} rounded-2xl bg-[#091124] shadow-md border border-amber-400/40 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-amber-400 transition-all duration-300`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

        {/* Vector SVG Emblem - Option A Design */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-10 p-0.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="optA-orange" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>

            <linearGradient id="optA-gold" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            <linearGradient id="optA-needle-top" x1="45" y1="35" x2="65" y2="55" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            <linearGradient id="optA-needle-bot" x1="35" y1="45" x2="55" y2="65" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#C2410C" />
            </linearGradient>
          </defs>

          {/* 1. Store Building Gable & Chimneys */}
          <path d="M28 26 L34 26 L34 34 L28 34 Z" fill="url(#optA-orange)" />
          <path d="M66 26 L72 26 L72 34 L66 34 Z" fill="url(#optA-orange)" />

          {/* Gable Roof & Walls */}
          <path
            d="M50 18 L78 36 L78 78 L22 78 L22 36 Z"
            fill="url(#optA-orange)"
            stroke="#091124"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Store Base Foundation Bar */}
          <rect x="18" y="78" width="64" height="4" rx="2" fill="url(#optA-orange)" />

          {/* 2. Central Compass Dial (Navy Disk) */}
          <circle cx="50" cy="48" r="24" fill="#091124" stroke="url(#optA-gold)" strokeWidth="2.5" />
          <circle cx="50" cy="48" r="17" fill="none" stroke="url(#optA-gold)" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.7" />

          {/* 3. Compass Star Points (N, S, E, W Triangles) */}
          {/* North Point */}
          <polygon points="50,26 47,33 53,33" fill="#FFFFFF" />
          {/* South Point */}
          <polygon points="50,70 47,63 53,63" fill="#FFFFFF" />
          {/* West Point */}
          <polygon points="28,48 35,45 35,51" fill="#FFFFFF" />
          {/* East Point */}
          <polygon points="72,48 65,45 65,51" fill="#FFFFFF" />

          {/* Diagonal Star Points */}
          <polygon points="65.5,32.5 59.5,35 62,40.5" fill="#FFFFFF" opacity="0.9" />
          <polygon points="34.5,63.5 40.5,61 38,55.5" fill="#FFFFFF" opacity="0.9" />
          <polygon points="34.5,32.5 37,38 42.5,35.5" fill="#FFFFFF" opacity="0.9" />
          <polygon points="65.5,63.5 63,58 57.5,60.5" fill="#FFFFFF" opacity="0.9" />

          {/* 4. Compass Needle (Dynamic Pointer) */}
          <polygon points="50,48 64,34 53,45" fill="url(#optA-needle-top)" />
          <polygon points="50,48 36,62 47,51" fill="url(#optA-needle-bot)" />
          <polygon points="50,48 53,45 47,51" fill="#FFFFFF" />

          {/* Needle Center Pivot */}
          <circle cx="50" cy="48" r="3.5" fill="#091124" stroke="url(#optA-gold)" strokeWidth="1.5" />
          <circle cx="50" cy="48" r="1.5" fill="#FDE047" />

          {/* 5. Store Entrance Portal (Bottom Center) */}
          <path
            d="M44 78 L44 68 L56 68 L56 78 Z"
            fill="#091124"
            stroke="url(#optA-gold)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <rect x="47" y="71" width="6" height="7" fill="url(#optA-orange)" />
        </svg>
      </div>

      {/* Optional Brand Text */}
      {showText && (
        <div>
          <div className="font-extrabold text-base tracking-tight text-zinc-900 flex items-center space-x-1.5 leading-none">
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
              Store Finder
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full shadow-xs">
              PRO
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium mt-0.5">品牌实体专柜精准导航</p>
        </div>
      )}
    </div>
  );
}
