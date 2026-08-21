import storesData from '@/data/stores.json';
import { StoreItem, AdminStoreItem, AdminStats, Brand } from '@/lib/types';
import fs from 'fs';
import path from 'path';

// Memory cache for runtime mutations
let memoryStores: StoreItem[] = [...(storesData as unknown as StoreItem[])];

export function getMemoryStores(): StoreItem[] {
  return memoryStores;
}

export function validateAdminKey(key: string | null): boolean {
  if (!key) return false;
  const validKeys = [
    'admin123456',
    process.env.ADMIN_SECRET_KEY,
    process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY,
  ].filter(Boolean);
  return validKeys.includes(key);
}

export function mapToAdminStore(s: StoreItem): AdminStoreItem {
  return {
    id: s.id,
    store_name: s.store_name,
    brand_id: s.brand?.id || 1,
    mall_id: s.mall?.id || 1,
    floor: s.floor || '',
    phone: s.phone || '',
    business_hours: s.business_hours || '10:00 - 22:00',
    latitude: s.coordinates?.lat,
    longitude: s.coordinates?.lng,
    source_url: s.source_url || '',
    tags: Array.isArray(s.tags) ? s.tags.join(', ') : (s.tags as any) || '',
    is_active: s.is_active !== false,
    brand: s.brand,
    mall: s.mall,
    updated_at: s.updated_at || new Date().toISOString(),
    created_at: s.last_verified_at || s.updated_at || new Date().toISOString(),
  };
}

export function getAdminStats(): AdminStats {
  const stores = memoryStores;
  const activeCount = stores.filter((s) => s.is_active).length;
  const brandsSet = new Set<string>();
  const mallsSet = new Set<string>();
  const citiesSet = new Set<string>();

  for (const s of stores) {
    if (s.brand?.name) brandsSet.add(s.brand.name);
    if (s.mall?.name) mallsSet.add(`${s.mall.city}_${s.mall.name}`);
    if (s.mall?.city) citiesSet.add(s.mall.city);
  }

  return {
    total_stores: stores.length,
    active_stores: activeCount,
    total_brands: brandsSet.size,
    total_malls: mallsSet.size,
    total_cities: citiesSet.size,
  };
}

const BRAND_DEFAULTS: Record<number, { name: string; code: string; logo: string }> = {
  1: {
    name: 'New Balance',
    code: 'new-balance',
    logo: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=200&q=80',
  },
  2: {
    name: 'Nike',
    code: 'nike',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png',
  },
  3: {
    name: 'Adidas',
    code: 'adidas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/200px-Adidas_Logo.svg.png',
  },
};

export function createStore(data: any): AdminStoreItem {
  const newId = memoryStores.length > 0 ? Math.max(...memoryStores.map((s) => s.id)) + 1 : 1;
  const brandId = Number(data.brand_id) || 1;
  const brandConfig = BRAND_DEFAULTS[brandId] || BRAND_DEFAULTS[1];

  const newStore: StoreItem = {
    id: newId,
    store_name: data.store_name,
    brand: {
      id: brandId,
      name: brandConfig.name,
      code: brandConfig.code,
      logo_url: brandConfig.logo,
      official_site: null,
    },
    mall: {
      id: newId,
      name: data.mall_name || '自选商场',
      province: data.province || '北京市',
      city: data.city || '北京市',
      district: data.district || '',
      address: data.address || '',
    },
    floor: data.floor || '',
    phone: data.phone || '',
    business_hours: data.business_hours || '10:00 - 22:00',
    coordinates: {
      lat: data.latitude || 39.9,
      lng: data.longitude || 116.4,
    },
    tags: typeof data.tags === 'string' ? data.tags.split(/[,，\s]+/).filter(Boolean) : data.tags || [],
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    source_url: data.source_url || '',
    last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryStores.unshift(newStore);
  return mapToAdminStore(newStore);
}

export function updateStore(id: number, data: any): AdminStoreItem | null {
  const index = memoryStores.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const current = memoryStores[index];
  const brandId = data.brand_id !== undefined ? Number(data.brand_id) : current.brand.id;
  const brandConfig = BRAND_DEFAULTS[brandId] || BRAND_DEFAULTS[1];

  const updated: StoreItem = {
    ...current,
    store_name: data.store_name !== undefined ? data.store_name : current.store_name,
    brand: {
      ...current.brand,
      id: brandId,
      name: brandConfig.name,
      code: brandConfig.code,
    },
    mall: {
      ...current.mall,
      name: data.mall_name !== undefined ? data.mall_name : current.mall.name,
      province: data.province !== undefined ? data.province : current.mall.province,
      city: data.city !== undefined ? data.city : current.mall.city,
      district: data.district !== undefined ? data.district : current.mall.district,
      address: data.address !== undefined ? data.address : current.mall.address,
    },
    floor: data.floor !== undefined ? data.floor : current.floor,
    phone: data.phone !== undefined ? data.phone : current.phone,
    business_hours: data.business_hours !== undefined ? data.business_hours : current.business_hours,
    coordinates: {
      lat: data.latitude !== undefined ? Number(data.latitude) : current.coordinates?.lat,
      lng: data.longitude !== undefined ? Number(data.longitude) : current.coordinates?.lng,
    },
    tags:
      data.tags !== undefined
        ? typeof data.tags === 'string'
          ? data.tags.split(/[,，\s]+/).filter(Boolean)
          : data.tags
        : current.tags,
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : current.is_active,
    source_url: data.source_url !== undefined ? data.source_url : current.source_url,
    updated_at: new Date().toISOString(),
  };

  memoryStores[index] = updated;
  return mapToAdminStore(updated);
}

export function deleteStore(id: number): boolean {
  const initialLength = memoryStores.length;
  memoryStores = memoryStores.filter((s) => s.id !== id);
  return memoryStores.length < initialLength;
}
