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
  Layers,
  Compass,
  Check,
  Share2,
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

  const tencentMapUrl = lat && lng
    ? `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${encodeURIComponent(storeTitle)};addr:${encodeURIComponent(fullAddress)}`
    : `https://map.qq.com/search/${encodeURIComponent(fullAddress)}`;

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
      onShowToast(`已复制【${store.store_name}】微信便签`);
    }
  };

  const handleCopyPhone = () => {
    if (!store.phone) return;
    navigator.clipboard.writeText(store.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
    if (onShowToast) {
      onShowToast(`已复制电话: ${store.phone}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white rounded-3xl border border-zinc-200 max-w-xl w-full p-6 sm:p-7 shadow-elevated space-y-6 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          title="关闭 (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Brand Logo & Title */}
        <div className="flex items-start space-x-4 pr-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center p-2.5 overflow-hidden shrink-0 shadow-xs">
            <BrandLogo code={brand.code} name={brand.name} className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase">
                {brand.name}
              </span>
              {formattedDist && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                  <Compass className="w-3 h-3 mr-0.5" />
                  距您 {formattedDist}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 leading-snug mt-0.5">
              {store.store_name}
            </h2>
          </div>
        </div>

        {/* Status & Highlights */}
        <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                bStatus.statusBadgeColor === 'emerald'
                  ? 'bg-emerald-500 animate-pulse'
                  : bStatus.statusBadgeColor === 'amber'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-zinc-400'
              }`}
            />
            <div>
              <div className="text-xs font-bold text-zinc-800">{bStatus.statusText}</div>
              {bStatus.detailNote && (
                <div className="text-[11px] text-zinc-400">{bStatus.detailNote}</div>
              )}
            </div>
          </div>
          {store.business_hours && (
            <div className="text-right text-xs text-zinc-500">
              <div className="font-mono text-zinc-700">{store.business_hours}</div>
              <div className="text-[10px] text-zinc-400">今日营业时间</div>
            </div>
          )}
        </div>

        {/* Full Details Section */}
        <div className="space-y-3.5 text-xs text-zinc-700">
          {/* Location & Address */}
          <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-zinc-50/60 border border-zinc-100">
            <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <div className="font-bold text-zinc-900 text-sm">{mall.name}</div>
              <div className="text-zinc-500">
                {mall.province === mall.city ? mall.city : `${mall.province} ${mall.city}`}
                {mall.district ? ` · ${mall.district}` : ''}
              </div>
              {mall.address && (
                <div className="text-zinc-600 font-medium pt-0.5">{mall.address}</div>
              )}
            </div>
          </div>

          {/* Floor & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {store.floor && (
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-50/60 border border-zinc-100">
                <Layers className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-zinc-400 font-medium">商场楼层 / 铺位</div>
                  <div className="font-bold text-zinc-900">{store.floor}</div>
                </div>
              </div>
            )}

            {store.phone ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/60 border border-zinc-100">
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-zinc-400 font-medium">联系电话</div>
                    <div className="font-mono font-bold text-zinc-900">{store.phone}</div>
                  </div>
                </div>
                <button
                  onClick={handleCopyPhone}
                  className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-500 transition-colors"
                  title="复制电话"
                >
                  {copiedPhone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-50/60 border border-zinc-100 text-zinc-400">
                <Phone className="w-4 h-4 shrink-0" />
                <span>暂未收录官方直线电话</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {store.tags && store.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {store.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Multi-Map Direct Routes */}
        <div className="space-y-2 pt-2 border-t border-zinc-100">
          <div className="text-[11px] font-semibold text-zinc-400">一键路线规划导航</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              href={amapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors text-center"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>高德地图</span>
            </a>
            <a
              href={baiduMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold transition-colors text-center"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>百度地图</span>
            </a>
            <a
              href={tencentMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold transition-colors text-center"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>腾讯地图</span>
            </a>
            <a
              href={appleMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors text-center"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Apple Maps</span>
            </a>
          </div>
        </div>

        {/* Primary Action Buttons & Footer */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-[11px] text-zinc-400">
            {store.updated_at && (
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>更新: {store.updated_at.split('T')[0]}</span>
              </span>
            )}
            {store.source_url && (
              <a
                href={store.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-600 underline flex items-center space-x-0.5"
              >
                <span>品牌官方核实</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyNote}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors"
            >
              {copiedNote ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">已复制便签</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>复制微信便签</span>
                </>
              )}
            </button>

            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="flex items-center justify-center space-x-1.5 px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>立即拨打</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
