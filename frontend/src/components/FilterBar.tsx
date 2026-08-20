'use client';

import React from 'react';
import { Brand, LocationMetaResponse } from '../lib/types';
import { BrandLogo } from './BrandLogo';
import { ChevronDown, RotateCcw, Sparkles, Compass, Loader2 } from 'lucide-react';

interface FilterBarProps {
  brands: Brand[];
  selectedBrand: string;
  onSelectBrand: (brandCode: string) => void;

  selectedCategory: string;
  onSelectCategory: (category: string) => void;

  locationMeta: LocationMetaResponse | null;
  selectedProvince: string;
  onSelectProvince: (province: string) => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;

  // Nearby Geo filter
  isNearbyMode: boolean;
  onToggleNearby: () => void;
  isLocating: boolean;

  onReset: () => void;
  isFiltered: boolean;
}

const CATEGORY_TAGS = [
  { label: '全部业态', value: 'all' },
  { label: '✨ Grey概念店', value: 'Grey' },
  { label: '👟 1906潮流店', value: '1906' },
  { label: '🏃 跑步专营店', value: '跑步' },
  { label: '🏷️ 奥莱折扣店', value: '奥莱' },
  { label: '旗舰概念', value: '概念店' },
];

export function FilterBar({
  brands,
  selectedBrand,
  onSelectBrand,
  selectedCategory,
  onSelectCategory,
  locationMeta,
  selectedProvince,
  onSelectProvince,
  selectedCity,
  onSelectCity,
  selectedDistrict,
  onSelectDistrict,
  isNearbyMode,
  onToggleNearby,
  isLocating,
  onReset,
  isFiltered,
}: FilterBarProps) {
  const currentProvinceData = locationMeta?.provinces.find(
    (p) => p.name === selectedProvince
  );

  const availableCities = currentProvinceData ? currentProvinceData.cities : [];
  const currentCityData = availableCities.find((c) => c.name === selectedCity);
  const availableDistricts = currentCityData?.districts || [];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 pt-1">
      {/* 1. Multi-Brand Carousel Cards */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-500 px-0.5">
          <span className="font-medium text-zinc-700 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
            <span>精选品牌生态</span>
          </span>
          <div className="flex items-center space-x-2">
            {/* Proximity Distance Sort Toggle */}
            <button
              onClick={onToggleNearby}
              disabled={isLocating}
              className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all active:scale-95 ${
                isNearbyMode
                  ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/20'
                  : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
              title="按距离您当前位置由近到远排序"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Compass className="w-3.5 h-3.5 text-inherit" />
              )}
              <span>{isNearbyMode ? '📍 已按距离排序' : '📍 附近门店'}</span>
            </button>

            {isFiltered && (
              <button
                onClick={onReset}
                className="flex items-center space-x-1 text-xs text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 px-2.5 py-1.5 rounded-xl transition-colors active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重置</span>
              </button>
            )}
          </div>
        </div>

        {/* Brand Scroll Container */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar -mx-1 px-1">
          {/* All Brands Tab */}
          <button
            onClick={() => onSelectBrand('all')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border active:scale-95 ${
              selectedBrand === 'all'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm ring-2 ring-zinc-900/10'
                : 'bg-white border-zinc-200/90 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-zinc-100 text-zinc-800 flex items-center justify-center text-[10px] font-bold">
              ALL
            </span>
            <span>全部品牌</span>
            {locationMeta?.total_stores ? (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  selectedBrand === 'all' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {locationMeta.total_stores}
              </span>
            ) : null}
          </button>

          {/* Individual Brand Tabs */}
          {brands.map((b) => {
            const isSelected = selectedBrand === b.code;
            return (
              <button
                key={b.code}
                onClick={() => onSelectBrand(b.code)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border active:scale-95 ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm ring-2 ring-zinc-900/10'
                    : 'bg-white border-zinc-200/90 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <div className="w-5 h-5 rounded-md flex items-center justify-center overflow-hidden shrink-0">
                  <BrandLogo code={b.code} name={b.name} className="w-4 h-4" />
                </div>
                <span>{b.name}</span>
                {b.store_count !== undefined && b.store_count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                      isSelected ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {b.store_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Format / Category Filter Pills (Mobile Friendly) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 text-xs">
        {CATEGORY_TAGS.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onSelectCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all text-xs active:scale-95 ${
                isSelected
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white border border-zinc-200/90 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 3. Location Cascading Filter (Mobile 2-Column Responsive Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {/* Province Select */}
        <div className="relative">
          <select
            value={selectedProvince}
            onChange={(e) => {
              onSelectProvince(e.target.value);
              onSelectCity('全部');
              onSelectDistrict('全部');
            }}
            className="w-full appearance-none bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 font-medium py-2 pl-3 pr-8 rounded-xl shadow-xs text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer"
          >
            <option value="全部">全部省份 ({locationMeta?.provinces.length || 34})</option>
            {locationMeta?.provinces.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.count})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-3 pointer-events-none" />
        </div>

        {/* City Select */}
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => {
              onSelectCity(e.target.value);
              onSelectDistrict('全部');
            }}
            disabled={selectedProvince === '全部' && availableCities.length === 0}
            className="w-full appearance-none bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 font-medium py-2 pl-3 pr-8 rounded-xl shadow-xs text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer disabled:bg-zinc-50 disabled:text-zinc-300 disabled:cursor-not-allowed"
          >
            <option value="全部">
              {selectedProvince !== '全部' ? `全部城市 (${availableCities.length})` : '全部城市'}
            </option>
            {availableCities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-3 pointer-events-none" />
        </div>

        {/* District Select */}
        {availableDistricts.length > 0 && (
          <div className="relative col-span-2 sm:col-span-1 animate-fade-in">
            <select
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="w-full appearance-none bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 font-medium py-2 pl-3 pr-8 rounded-xl shadow-xs text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer"
            >
              <option value="全部">全部区县 ({availableDistricts.length})</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}
