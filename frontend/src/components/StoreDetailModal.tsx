'use client';

import React, { useEffect, useState } from 'react';
import { StoreItem } from '../lib/types';
import { BrandLogo } from './BrandLogo';
import { getBusinessStatus } from '../lib/time';
import { formatDistance } from '../lib/geo';
import {
  X,
  Phone,
  Copy,
  Navigation,
  Clock,
  MapPin,
  ExternalLink,
  Calendar,
  Compass,
  Check,
  Share2,
  Building,
  ShieldCheck,
} from 'lucide-react';

interface StoreDetailModalProps {
  store: StoreItem | null;
  onClose: () => void;
  onShowToast?: (message: string) => void;
}

export function StoreDetailModal({
  store,
  onClose,
  onShowToast,
}: StoreDetailModalProps) {
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!store) return null;

  const { brand, mall, coordinates, distance_km } = store;
  const bStatus = getBusinessStatus(store.business_hours);
  const formattedDist = formatDistance(distance_km);

  const lat = coordinates?.lat || 0;
  const lng = coordinates?.lng || 0;
  const storeTitle = `${brand.name} (${mall.name})`;
  const fullAddress = `${mall.province}${mall.city}${mall.district || ''}${mall.address || mall.name}`;

  const amapUrl = lat && lng
    ? `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(storeTitle)}&coordinate=gaode`
    : `https://ditu.amap.com/search?query=${encodeURIComponent(fullAddress + ' ' + store.store_name)}`;

  const baiduMapUrl = lat && lng
    ? `http://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodeURIComponent(storeTitle)}&content=${encodeURIComponent(fullAddress)}&output=html`
    : `https://map.baidu.com/search/${encodeURIComponent(fullAddress + ' ' + store.store_name)}`;

  const appleMapUrl = `http://maps.apple.com/?q=${encodeURIComponent(storeTitle)}&ll=${lat},${lng}`;

  const handleCopyNote = () => {
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
      onShowToast(`已复制【${store.store_name}】全要素便签`);
    }
  };

  const handleCopyPhone = () => {
    if (!store.phone) return;
    navigator.clipboard.writeText(store.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
    if (onShowToast) {
      onShowToast(`已复制电话：${store.phone}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet Content */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up sm:animate-fade-in">
        {/* Mobile Drag Handle */}
        <div className="w-full pt-3 pb-1 flex justify-center sm:hidden" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-zinc-300" />
        </div>

        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/80 p-2 flex items-center justify-center shrink-0">
              <BrandLogo code={brand.code} name={brand.name} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase">{brand.name}</span>
                {formattedDist && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                    <Compass className="w-2.5 h-2.5 mr-0.5" />
                    {formattedDist}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug line-clamp-1">
                {store.store_name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 active:scale-95 text-zinc-400 hover:text-zinc-700 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Status & Hours */}
          <div className="bg-zinc-50/80 rounded-xl p-3.5 border border-zinc-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <div>
                <div className="font-medium text-zinc-800">营业时间</div>
                <div className="text-zinc-500 text-xs">{store.business_hours || '10:00 - 22:00'}</div>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                bStatus.isOpen
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  bStatus.isOpen ? 'bg-emerald-500' : 'bg-zinc-400'
                }`}
              />
              {bStatus.statusText}
            </span>
          </div>

          {/* Location & Floor */}
          <div className="space-y-2.5">
            <div className="flex items-start space-x-2.5 text-zinc-700">
              <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-zinc-900">{mall.name}</div>
                <div className="text-zinc-500 text-xs mt-0.5">
                  {mall.province} · {mall.city} {mall.district ? `· ${mall.district}` : ''}
                </div>
                {mall.address && <div className="text-zinc-400 text-xs mt-0.5">{mall.address}</div>}
              </div>
            </div>

            {store.floor && (
              <div className="flex items-center space-x-2.5 pl-6 text-zinc-700">
                <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="font-medium">铺位楼层：{store.floor}</span>
              </div>
            )}
          </div>

          {/* Phone */}
          {store.phone && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span className="font-mono font-medium text-zinc-800 text-sm">{store.phone}</span>
              </div>
              <button
                onClick={handleCopyPhone}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 active:scale-95 text-zinc-600 font-medium transition-all"
              >
                {copiedPhone ? '已复制' : '复制号码'}
              </button>
            </div>
          )}

          {/* Tags */}
          {store.tags && store.tags.length > 0 && (
            <div>
              <div className="text-xs font-medium text-zinc-400 mb-1.5">业态与特色</div>
              <div className="flex flex-wrap gap-1.5">
                {store.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map Apps Launchers */}
          <div>
            <div className="text-xs font-medium text-zinc-400 mb-2">地图直达</div>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={amapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium text-center transition-all"
              >
                <span>高德地图</span>
              </a>
              <a
                href={baiduMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium text-center transition-all"
              >
                <span>百度地图</span>
              </a>
              <a
                href={appleMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium text-center transition-all"
              >
                <span>Apple 地图</span>
              </a>
            </div>
          </div>

          {/* Official Site Link & Timestamp */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>官方认证实体门店</span>
            </span>
            {store.source_url && (
              <a
                href={store.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 hover:underline flex items-center"
              >
                <span>品牌官网</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="p-3 sm:p-4 bg-zinc-50/90 border-t border-zinc-100 flex items-center space-x-2 pb-safe">
          {store.phone ? (
            <a
              href={`tel:${store.phone.replace(/[^0-9+]/g, '')}`}
              className="flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-sm shadow-sm active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>拨打电话</span>
            </a>
          ) : null}

          <a
            href={amapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-zinc-900 active:bg-zinc-800 text-white font-semibold text-sm shadow-sm active:scale-95 transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>开始导航</span>
          </a>

          <button
            onClick={handleCopyNote}
            className="p-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-700 active:scale-95 transition-all"
            title="复制微信便签"
          >
            {copiedNote ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
