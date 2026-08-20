'use client';

import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Brand } from '../lib/types';

interface ActiveFilterChipsProps {
  searchTerm: string;
  onClearSearch: () => void;
  selectedBrand: string;
  onClearBrand: () => void;
  brands: Brand[];
  selectedProvince: string;
  onClearProvince: () => void;
  selectedCity: string;
  onClearCity: () => void;
  selectedDistrict: string;
  onClearDistrict: () => void;
  isNearbyMode: boolean;
  onToggleNearby: () => void;
  onResetAll: () => void;
}

export function ActiveFilterChips({
  searchTerm,
  onClearSearch,
  selectedBrand,
  onClearBrand,
  brands,
  selectedProvince,
  onClearProvince,
  selectedCity,
  onClearCity,
  selectedDistrict,
  onClearDistrict,
  isNearbyMode,
  onToggleNearby,
  onResetAll,
}: ActiveFilterChipsProps) {
  const brandObj = brands.find((b) => b.code === selectedBrand);
  const brandName = brandObj ? brandObj.name : selectedBrand;

  const hasAnyFilter = Boolean(
    searchTerm.trim() ||
      selectedBrand !== 'all' ||
      selectedProvince !== '全部' ||
      selectedCity !== '全部' ||
      selectedDistrict !== '全部' ||
      isNearbyMode
  );

  if (!hasAnyFilter) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
      <span className="text-zinc-400 text-[11px] font-medium mr-0.5">当前筛选:</span>

      {/* Brand Chip */}
      {selectedBrand !== 'all' && (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-white font-medium shadow-xs">
          <span>品牌: {brandName}</span>
          <button
            onClick={onClearBrand}
            className="p-0.5 hover:bg-zinc-700 rounded-md transition-colors"
            title="移除品牌筛选"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Search Query Chip */}
      {searchTerm.trim() && (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-200 text-brand-800 font-medium">
          <span>关键词: &ldquo;{searchTerm.trim()}&rdquo;</span>
          <button
            onClick={onClearSearch}
            className="p-0.5 hover:bg-brand-100 rounded-md transition-colors"
            title="清空搜索词"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Province Chip */}
      {selectedProvince !== '全部' && (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 font-medium">
          <span>{selectedProvince}</span>
          <button
            onClick={onClearProvince}
            className="p-0.5 hover:bg-zinc-200 rounded-md transition-colors"
            title="清除省份筛选"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* City Chip */}
      {selectedCity !== '全部' && (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 font-medium">
          <span>{selectedCity}</span>
          <button
            onClick={onClearCity}
            className="p-0.5 hover:bg-zinc-200 rounded-md transition-colors"
            title="清除城市筛选"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* District Chip */}
      {selectedDistrict !== '全部' && (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 font-medium">
          <span>{selectedDistrict}</span>
          <button
            onClick={onClearDistrict}
            className="p-0.5 hover:bg-zinc-200 rounded-md transition-colors"
            title="清除行政区筛选"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Nearby Sort Chip */}
      {isNearbyMode && (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-medium">
          <span>📍 距我最近</span>
          <button
            onClick={onToggleNearby}
            className="p-0.5 hover:bg-amber-100 rounded-md transition-colors"
            title="取消距离排序"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Reset All Action */}
      <button
        onClick={onResetAll}
        className="inline-flex items-center space-x-1 px-2 py-1 text-zinc-400 hover:text-zinc-700 hover:underline transition-colors ml-1 text-[11px]"
      >
        <RotateCcw className="w-2.5 h-2.5" />
        <span>清空全部</span>
      </button>
    </div>
  );
}
