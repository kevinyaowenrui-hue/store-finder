'use client';

import React from 'react';
import { Brand, LocationMetaResponse } from '../lib/types';
import { BrandLogo } from './BrandLogo';
import { ChevronDown, RotateCcw, Sparkles, Navigation, Compass, Loader2 } from 'lucide-react';

interface FilterBarProps {
  brands: Brand[];
  selectedBrand: string;
  onSelectBrand: (brandCode: string) => void;

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

export function FilterBar({
  brands,
  selectedBrand,
  onSelectBrand,
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
    <div className="w-full max-w-4xl mx-auto space-y-4 pt-3">
      {/* Multi-Brand Carousel Cards */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-500 px-0.5">
          <span className="font-medium text-zinc-700 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>精选品牌生态</span>
          </span>
          <div className="flex items-center space-x-2">
            {/* Proximity Distance Sort Toggle */}
            <button
              onClick={onToggleNearby}
              disabled={isLocating}
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
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
                className="flex items-center space-x-1 text-xs text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 px-2.5 py-1 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重置</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {/* All Brands Tab */}
          <button
            onClick={() => onSelectBrand('all')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
              selectedBrand === 'all'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm ring-2 ring-zinc-900/10'
                : 'bg-white border-zinc-200/90 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
            }`}
          >
            <span className="w-5 h-5 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center text-[10px] font-bold">
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
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm ring-2 ring-zinc-900/10'
                    : 'bg-white border-zinc-200/90 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
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

      {/* Location Cascading Filter & Hot Cities */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
        {/* Province Select */}
        <div className="relative inline-block text-xs">
          <select
            value={selectedProvince}
            onChange={(e) => {
              onSelectProvince(e.target.value);
              onSelectCity('全部');
              onSelectDistrict('全部');
            }}
            className="appearance-none bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-medium py-1.5 pl-3 pr-7 rounded-lg shadow-subtle focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer"
          >
            <option value="全部">全部省份</option>
            {locationMeta?.provinces.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.count})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5 pointer-events-none" />
        </div>

        {/* City Select */}
        <div className="relative inline-block text-xs">
          <select
            value={selectedCity}
            onChange={(e) => {
              onSelectCity(e.target.value);
              onSelectDistrict('全部');
            }}
            disabled={selectedProvince === '全部' && availableCities.length === 0}
            className="appearance-none bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-medium py-1.5 pl-3 pr-7 rounded-lg shadow-subtle focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer disabled:bg-zinc-50 disabled:text-zinc-300 disabled:cursor-not-allowed"
          >
            <option value="全部">全部城市</option>
            {availableCities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5 pointer-events-none" />
        </div>

        {/* District Select */}
        {availableDistricts.length > 0 && (
          <div className="relative inline-block text-xs animate-fade-in">
            <select
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="appearance-none bg-white border border-brand-300 hover:border-brand-400 text-brand-900 font-medium py-1.5 pl-3 pr-7 rounded-lg shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="全部">全部行政区</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-brand-600 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        )}

        {/* Hot Cities Pills */}
        <div className="flex items-center space-x-1.5 ml-auto overflow-x-auto text-xs text-zinc-500">
          <span className="hidden sm:inline text-zinc-400">热门:</span>
          {locationMeta?.hot_cities.slice(0, 7).map((city) => (
            <button
              key={city}
              onClick={() => {
                const prov = locationMeta.provinces.find((p) =>
                  p.cities.some((c) => c.name === city)
                );
                if (prov) onSelectProvince(prov.name);
                onSelectCity(city);
                onSelectDistrict('全部');
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedCity === city
                  ? 'bg-zinc-800 text-white font-medium shadow-xs'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

