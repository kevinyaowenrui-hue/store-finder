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
  Calendar,
  Layers,
  Share2,
  Compass,
  Check,
  ChevronDown
} from 'lucide-react';

interface StoreCardProps {
  store: StoreItem;
  onCopyPhone: (phone: string) => void;
  onShowToast?: (message: string) => void;
  onSelectStore?: (store: StoreItem) => void;
}

export function StoreCard({ store, onCopyPhone, onShowToast, onSelectStore }: StoreCardProps) {
  const { brand, mall, coordinates, distance_km } = store;
  const [showMapMenu, setShowMapMenu] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

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

  const baiduMapUrl = lat && lng
    ? `http://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodeURIComponent(storeTitle)}&content=${encodeURIComponent(fullAddress)}&output=html`
    : `https://map.baidu.com/search/${encodeURIComponent(fullAddress + ' ' + store.store_name)}`;

  const tencentMapUrl = lat && lng
    ? `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${encodeURIComponent(storeTitle)};addr:${encodeURIComponent(fullAddress)}`
    : `https://map.qq.com/search/${encodeURIComponent(fullAddress)}`;

  const appleMapUrl = `http://maps.apple.com/?q=${encodeURIComponent(storeTitle)}&ll=${lat},${lng}`;

  // Copy structured WeChat memo
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

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-subtle hover:shadow-elevated transition-all duration-200 flex flex-col justify-between group hover:border-zinc-300 relative">
      <div>
        {/* Top Header: Brand Logo / Name & Dynamic Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2.5">
            <div
              onClick={() => onSelectStore && onSelectStore(store)}
              className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-xs cursor-pointer hover:border-zinc-400 transition-colors"
              title="点击查看全要素详情"
            >
              <BrandLogo code={brand.code} name={brand.name} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">
                  {brand.name}
                </span>
                {formattedDist && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-amber-700">
                    <Compass className="w-2.5 h-2.5 mr-0.5" />
                    距您 {formattedDist}
                  </span>
                )}
              </div>
              <h3
                onClick={() => onSelectStore && onSelectStore(store)}
                className="font-bold text-base text-zinc-900 leading-snug group-hover:text-brand-900 cursor-pointer hover:underline underline-offset-2 decoration-zinc-300"
                title="点击查看门店详情"
              >
                {store.store_name}
              </h3>
            </div>
          </div>


          {/* Dynamic Business Status Badge */}
          <div className="shrink-0 flex flex-col items-end">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                bStatus.statusBadgeColor === 'emerald'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : bStatus.statusBadgeColor === 'amber'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  bStatus.statusBadgeColor === 'emerald'
                    ? 'bg-emerald-500 animate-pulse'
                    : bStatus.statusBadgeColor === 'amber'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-zinc-400'
                }`}
              />
              {bStatus.statusText}
            </span>
            {bStatus.detailNote && (
              <span className="text-[10px] text-zinc-400 mt-0.5 scale-90 origin-right">
                {bStatus.detailNote}
              </span>
            )}
          </div>
        </div>

        {/* Mall & Location Info */}
        <div className="space-y-2 text-xs text-zinc-600 mt-3 pt-3 border-t border-zinc-100/80">
          {/* Mall & City */}
          <div className="flex items-start space-x-2">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
            <span className="font-medium text-zinc-800">
              {mall.province === mall.city ? mall.city : `${mall.province} ${mall.city}`}
              {mall.district ? ` · ${mall.district}` : ''} | {mall.name}
            </span>
          </div>

          {/* Floor */}
          {store.floor && (
            <div className="flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-600">
                商场楼层: <strong className="text-zinc-800 font-semibold">{store.floor}</strong>
              </span>
            </div>
          )}

          {/* Business Hours */}
          {store.business_hours && (
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>营业时间: {store.business_hours}</span>
            </div>
          )}

          {/* Tags */}
          {store.tags && store.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {store.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions & Update Time */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col space-y-2.5">
        {/* Action Buttons Row */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* 1. Call button */}
          {store.phone ? (
            <a
              href={`tel:${store.phone}`}
              className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-sm"
              title={`拨打 ${store.phone}`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>拨号</span>
            </a>
          ) : (
            <button
              disabled
              className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-zinc-100 text-zinc-400 text-xs font-medium cursor-not-allowed"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>暂无电话</span>
            </button>
          )}

          {/* 2. Copy Note / Memo */}
          <button
            onClick={handleCopyNote}
            className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors"
            title="复制店铺完整微信便签"
          >
            {copiedNote ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">已复制便签</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-600" />
                <span>复制便签</span>
              </>
            )}
          </button>

          {/* 3. Open Map Dropdown */}
          <div className="relative">
            <div className="flex rounded-xl overflow-hidden shadow-xs border border-brand-200/80">
              <a
                href={amapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-1 py-2 px-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-medium transition-colors"
                title="默认打开高德地图导航"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>导航</span>
              </a>
              <button
                onClick={() => setShowMapMenu(!showMapMenu)}
                className="px-1.5 bg-brand-100/70 hover:bg-brand-200/80 text-brand-800 flex items-center justify-center border-l border-brand-200 transition-colors"
                title="选择导航应用"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Map Options Modal / Dropdown */}
            {showMapMenu && (
              <div className="absolute right-0 bottom-10 z-20 w-36 bg-white rounded-xl shadow-elevated border border-zinc-200 p-1.5 space-y-1 text-xs animate-fade-in">
                <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 border-b border-zinc-100">
                  选择地图导航
                </div>
                <a
                  href={amapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMapMenu(false)}
                  className="block px-2.5 py-1.5 rounded-lg hover:bg-zinc-50 text-zinc-700 font-medium"
                >
                  🗺️ 高德地图
                </a>
                <a
                  href={baiduMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMapMenu(false)}
                  className="block px-2.5 py-1.5 rounded-lg hover:bg-zinc-50 text-zinc-700 font-medium"
                >
                  📍 百度地图
                </a>
                <a
                  href={tencentMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMapMenu(false)}
                  className="block px-2.5 py-1.5 rounded-lg hover:bg-zinc-50 text-zinc-700 font-medium"
                >
                  🐧 腾讯地图
                </a>
                <a
                  href={appleMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMapMenu(false)}
                  className="block px-2.5 py-1.5 rounded-lg hover:bg-zinc-50 text-zinc-700 font-medium"
                >
                  🍎 Apple Maps
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom meta row: Phone number text, update time, source link */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-0.5">
          <div className="flex items-center space-x-2">
            {store.phone && (
              <button
                onClick={() => onCopyPhone(store.phone!)}
                className="font-mono text-zinc-600 hover:text-zinc-900 underline underline-offset-2 decoration-zinc-200"
                title="点击复制电话号码"
              >
                {store.phone}
              </button>
            )}
            {store.updated_at && (
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-zinc-300" />
                <span>{store.updated_at.split('T')[0]}</span>
              </span>
            )}
          </div>

          {store.source_url && (
            <a
              href={store.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-0.5 text-zinc-400 hover:text-zinc-600 transition-colors"
              title="查看品牌官网来源"
            >
              <span>官网来源</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
