'use client';

export interface StoreFavorite {
  storeId: string;
  groupTag?: string; // e.g. '核心合作店' | '奥莱特惠' | '极速留货' | '限量发售'
  createdAt: number;
}

const FAVORITES_STORAGE_KEY = 'store_finder_favorites_v1';

export function getAllFavorites(): Record<string, StoreFavorite> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse favorites storage', err);
    return {};
  }
}

export function isStoreFavorited(storeId: string | number): boolean {
  const all = getAllFavorites();
  return Boolean(all[storeId.toString()]);
}

export function toggleStoreFavorite(storeId: string | number, groupTag: string = '核心合作店'): boolean {
  if (typeof window === 'undefined') return false;
  const key = storeId.toString();
  const all = getAllFavorites();
  let isNowFavorited = false;

  if (all[key]) {
    delete all[key];
    isNowFavorited = false;
  } else {
    all[key] = {
      storeId: key,
      groupTag,
      createdAt: Date.now(),
    };
    isNowFavorited = true;
  }

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save favorites storage', err);
  }

  return isNowFavorited;
}

export function updateFavoriteGroup(storeId: string | number, groupTag: string) {
  if (typeof window === 'undefined') return;
  const key = storeId.toString();
  const all = getAllFavorites();
  if (all[key]) {
    all[key].groupTag = groupTag;
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      console.error('Failed to update favorite group', err);
    }
  }
}

export const COMMON_FAVORITE_GROUPS = [
  '⭐ 核心合作店',
  '🏷️ 奥莱特惠池',
  '⚡ 极速留货',
  '👟 限量抽签店',
  '📦 支持包邮',
];
