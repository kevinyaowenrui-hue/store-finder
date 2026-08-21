'use client';

import React from 'react';

interface BrandLogoProps {
  code: string;
  name?: string;
  className?: string;
}

export function BrandLogo({ code, name = '', className = 'w-5 h-5' }: BrandLogoProps) {
  const brandCode = (code || '').toLowerCase().trim();

  // 1. New Balance: Classic NB italic monogram
  if (brandCode === 'new-balance' || brandCode === 'nb') {
    return (
      <svg viewBox="0 0 100 60" className={className} fill="currentColor">
        <path
          d="M10 50L30 10H42L36 24H52L46 38H60L45 50H10Z"
          fill="#CE1126"
        />
        <path
          d="M48 10H75C85 10 92 16 92 24C92 30 87 35 80 37C88 39 94 45 94 50H78C78 44 73 40 66 40H52L48 50H35L48 10ZM62 22H68C72 22 75 20 75 17C75 14 72 13 68 13H60L62 22ZM57 32H69C74 32 77 30 77 27C77 24 74 23 69 23H58L57 32Z"
          fill="#CE1126"
        />
      </svg>
    );
  }

  // 2. Nike: Iconic Swoosh
  if (brandCode === 'nike') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M21.71 6.84c-3.15 4.34-8.08 8.68-12.83 10.63-2.1.86-4.14.97-5.46.22-1.57-.9-1.92-2.73-1.07-4.47.88-1.8 2.65-3.5 4.96-4.78-1.12.95-1.96 2.06-2.28 3.12-.42 1.39.02 2.37.95 2.76.99.41 2.53.07 4.29-.86 4.31-2.28 9.08-6.62 11.44-10.62z" />
      </svg>
    );
  }

  // 3. Adidas: Iconic 3-Stripes
  if (brandCode === 'adidas') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M1.5 19h4.2l3.8-6.5h-4.2L1.5 19zm6.3 0h4.2l5.6-9.7h-4.2L7.8 19zm6.3 0h4.2L22.5 5h-4.2L14.1 19z" />
      </svg>
    );
  }

  // 4. Arc'teryx: Fossil Bird Icon
  if (brandCode === 'arcteryx' || brandCode === "arc'teryx") {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <g fill="#D97706">
          <circle cx="50" cy="50" r="46" fill="#1C1917" />
          <path
            d="M50 20C45 20 40 24 38 28C36 32 37 37 41 40C44 42 48 41 51 38C53 36 54 33 55 30C58 35 63 38 68 36C73 34 76 29 74 24C72 20 67 18 62 20C58 22 55 25 53 28C52 23 51 20 50 20ZM30 45C26 48 24 53 26 58C28 63 33 66 38 64C43 62 45 57 43 52C41 47 36 44 30 45ZM70 45C64 44 59 47 57 52C55 57 57 62 62 64C67 66 72 63 74 58C76 53 74 48 70 45ZM40 68C36 71 35 76 38 80C41 84 46 85 50 82C54 85 59 84 62 80C65 76 64 71 60 68C57 71 53 73 50 71C47 73 43 71 40 68Z"
            fill="#FBBF24"
          />
        </g>
      </svg>
    );
  }

  // 5. Lululemon: Omega / Wave Emblem
  if (brandCode === 'lululemon') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <circle cx="50" cy="50" r="48" fill="#E11D48" />
        <path
          d="M50 22C41 22 34 29 34 38C34 46 39 52 45 56C42 61 38 67 32 72C30 74 31 77 34 78C38 79 44 76 49 70C51 68 53 65 54 62C55 65 57 68 59 70C64 76 70 79 74 78C77 77 78 74 76 72C70 67 66 61 63 56C69 52 74 46 74 38C74 29 67 22 58 22H50ZM50 30C55 30 60 34 60 39C60 44 56 48 50 51C44 48 40 44 40 39C40 34 45 30 50 30Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 6. Salomon: Classic S Shield
  if (brandCode === 'salomon') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <rect width="100" height="100" rx="20" fill="#09090B" />
        <path
          d="M32 30C32 25 37 20 45 20H68L60 34H48C45 34 43 36 43 38C43 40 45 42 48 42H60C69 42 76 49 76 58C76 67 69 74 60 74H32L40 60H56C59 60 61 58 61 56C61 54 59 52 56 52H44C35 52 32 45 32 30Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 7. On Running: Minimal Cloud O-n
  if (brandCode === 'on-running' || brandCode === 'on' || brandCode === 'on 昂跑') {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <circle cx="50" cy="50" r="48" fill="#18181B" />
        <circle cx="38" cy="42" r="14" fill="#FFFFFF" />
        <circle cx="38" cy="42" r="6" fill="#18181B" />
        <path
          d="M62 30C55 30 50 36 50 44V68H62V50C62 46 64 42 68 42C72 42 74 45 74 50V68H86V48C86 38 78 30 62 30Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // Fallback: Elegant 2-letter badge
  return (
    <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-700">
      {(name || code || 'SF').slice(0, 2)}
    </span>
  );
}
