'use client';

import React, { useState } from 'react';
import { StoreItem } from '../lib/types';
import { BrandLogo } from './BrandLogo';
import { getBusinessStatus } from '../lib/time';
import { formatDistance } from '../lib/geo';
import {
  Phone,
  Copy,
  Navigation,
  Clock,
  MapPin,
  ExternalLink,
  Compass,
  Check,
  ChevronRight,
  Share2,
} from 'lucide-react';

interface StoreCardProps {
  store: StoreItem;
  onCopyPhone: (phone: string) => void;
  onShowToast?: (message: string) => void;
  onSelectStore?: (store: StoreItem) => void;
}

export function StoreCard({ store, onCopyPhone, onShowToast, onSelectStore }: StoreCardProps) {
  const { brand, mall, coordinates, distance_km } = store;
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Dynamic business status
  const bStatus = getBusinessStatus(store.business_hours);
  const formattedDist = formatDistance(distance_km);

  // Map links
  const lat = coordinates?.lat || 0;
  const lng = coordinates?.lng || 0;
  const storeTitle = `${brand.name} (${mall.name})`;
  const fullAddress = `${mall.province}${mall.city}${mall.district || ''}${mall.address || mall.name}`;

  const amapUrl = lat && lng
    ? `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(storeTitle)}&coordinate=gaode`
    : `https://ditu.amap.com/search?query=${encodeURIComponent(fullAddress + ' ' + store.store_name)}`;

  // Copy structured WeChat memo
  const handleCopyNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const note = [
      `🏪 【${brand.name} · ${store.store_name}】`,
      `📍 地址：${mall.province} ${mall.city} ${mall.district ? mall.district + ' ' : ''}${mall.name}`,
      store.floor ? `🏢 铺位：${store.floor}` : null,
      store.phone ? `📞 电话：${store.phone}` : null,
      store.business_hours ? `⏰ 营业时间：${store.business_hours}` : null,
      `🗺️ 高德导航：${amapUrl}`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(note);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
    if (onShowToast) {
      onShowToast(`已复制【${store.store_name}】便签`);
    }
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!store.phone) return;
    navigator.clipboard.writeText(store.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
    if (onShowToast) {
      onShowToast(`已复制电话：${store.phone}`);
    }
  };

  return (
    <div
      onClick={() => onSelectStore && onSelectStore(store)}
      className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-subtle hover:shadow-elevated transition-all duration-200 flex flex-col justify-between group hover:border-zinc-300 relative cursor-pointer active:scale-[0.99]"
    >
      <div>
        {/* Top Header: Brand & Status & Distance */}
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-xs">
              <BrandLogo code={brand.code} name={brand.name} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-semibold text-zinc-500 tracking-wide uppercase truncate">
                  {brand.name}
                </span>
                {formattedDist && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-amber-700 shrink-0">
                    <Compass className="w-2.5 h-2.5 mr-0.5" />
                    {formattedDist}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-zinc-900 text-sm sm:text-base leading-snug group-hover:text-zinc-800 line-clamp-1">
                {store.store_name}
              </h3>
            </div>
          </div>

          {/* Business Status Badge */}
          <div className="shrink-0">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                bStatus.isOpen
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1 ${
                  bStatus.isOpen ? 'bg-emerald-500' : 'bg-zinc-400'
                }`}
              />
              {bStatus.statusText}
            </span>
          </div>
        </div>

        {/* Mall & Location Info */}
        <div className="space-y-1.5 text-xs text-zinc-600 my-2.5">
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-medium text-zinc-800 line-clamp-1">
              {mall.province} · {mall.city} {mall.district ? `· ${mall.district}` : ''} · {mall.name}
            </span>
          </div>

          {store.floor && (
            <div className="flex items-center space-x-1.5 pl-5">
              <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium text-[11px]">
                🏢 {store.floor}
              </span>
            </div>
          )}

          {store.business_hours && (
            <div className="flex items-center space-x-1.5 text-zinc-500 pl-5 text-[11px]">
              <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
              <span>{store.business_hours}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {store.tags && store.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {store.tags.map((tag, idx) => {
              const isGrey = tag.toLowerCase().includes('grey');
              const is1906 = tag.includes('1906');
              const isOutlet = tag.includes('奥莱') || tag.includes('折扣');
              const isRunning = tag.includes('跑');

              let badgeStyle = 'bg-zinc-100/90 text-zinc-600 border-zinc-200/60';
              if (isGrey) badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200/80 font-semibold';
              else if (is1906) badgeStyle = 'bg-purple-50 text-purple-800 border-purple-200/80 font-semibold';
              else if (isOutlet) badgeStyle = 'bg-orange-50 text-orange-800 border-orange-200/80 font-semibold';
              else if (isRunning) badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200/80 font-semibold';

              return (
                <span
                  key={idx}
                  className={`text-[10px] px-2 py-0.5 rounded-md border ${badgeStyle}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile-First Action Bar */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
        {/* Direct Call Button (Large touch target) */}
        {store.phone ? (
          <a
            href={`tel:${store.phone.replace(/[^0-9+]/g, '')}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-medium text-xs shadow-xs active:scale-95 transition-all"
            title="拨打门店直线电话"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>呼叫门店</span>
          </a>
        ) : (
          <button
            onClick={handleCopyNote}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-zinc-100 text-zinc-700 font-medium text-xs active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>分享门店</span>
          </button>
        )}

        {/* Map Navigation Button */}
        <a
          href={amapUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-zinc-900 active:bg-zinc-800 text-white font-medium text-xs shadow-xs active:scale-95 transition-all"
          title="高德地图精准导航"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>地图导航</span>
        </a>

        {/* Copy Note Button */}
        <button
          onClick={handleCopyNote}
          className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 text-zinc-600 active:scale-95 transition-all shrink-0"
          title="复制微信便签"
        >
          {copiedNote ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
