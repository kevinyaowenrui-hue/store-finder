import { NextRequest, NextResponse } from 'next/server';
import { getMemoryStores } from '@/lib/storeDb';
import { StoreItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

const SEARCH_SYNONYMS: Record<string, string[]> = {
  'nb': ['new balance', 'nb', '新百伦', '纽巴伦'],
  '新百伦': ['new balance', 'nb', '新百伦'],
  '纽巴伦': ['new balance', 'nb', '纽巴伦'],
  '耐克': ['nike', '耐克'],
  'nike': ['nike', '耐克'],
  '阿迪': ['adidas', '阿迪', '阿迪达斯'],
  '阿迪达斯': ['adidas', '阿迪', '阿迪达斯'],
  'adidas': ['adidas', '阿迪', '阿迪达斯'],
  '三叶草': ['originals', 'adidas originals', '三叶草'],
  'aj': ['jordan', 'air jordan', 'aj'],
  'jordan': ['jordan', 'air jordan', 'aj'],
  '乔丹': ['jordan', 'air jordan'],
  '奥莱': ['奥特莱斯', 'outlet', 'outlets', '奥莱', '特卖'],
  '奥特莱斯': ['奥特莱斯', 'outlet', 'outlets', '奥莱'],
  'outlet': ['奥特莱斯', 'outlet', 'outlets', '奥莱'],
  'outlets': ['奥特莱斯', 'outlet', 'outlets', '奥莱'],
  '国金': ['ifc', '国金'],
  'ifc': ['ifc', '国金'],
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get('q')?.trim().toLowerCase() || '';
  const province = searchParams.get('province');
  const city = searchParams.get('city');
  const district = searchParams.get('district');
  const brand = searchParams.get('brand');
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');
  const sortByDistance = searchParams.get('sort_by_distance') === 'true';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));

  const userLat = latStr ? parseFloat(latStr) : null;
  const userLng = lngStr ? parseFloat(lngStr) : null;

  const allStores = getMemoryStores();

  // 1. Filtering
  let filtered = allStores.filter((store) => {
    if (!store.is_active) return false;

    // Brand filter with fuzzy code/name normalization
    if (brand && brand !== 'all') {
      const bCode = (store.brand.code || '').toLowerCase().replace(/[-_\s]/g, '');
      const qCode = brand.toLowerCase().replace(/[-_\s]/g, '');
      const bName = (store.brand.name || '').toLowerCase();
      const qName = brand.toLowerCase();
      const matches = bCode === qCode || bName.includes(qName) || qName.includes(bName);
      if (!matches) return false;
    }

    // Province filter
    if (province && province !== '全部') {
      if (store.mall.province !== province) return false;
    }

    // City filter
    if (city && city !== '全部') {
      if (store.mall.city !== city) return false;
    }

    // District filter
    if (district && district !== '全部') {
      if (store.mall.district !== district) return false;
    }

    // Keyword search with synonym expansion
    if (query) {
      const tokens = query.split(/\s+/).filter(Boolean);
      const searchableText = [
        store.store_name,
        store.brand.name,
        store.brand.code,
        store.mall.name,
        store.mall.province,
        store.mall.city,
        store.mall.district || '',
        store.mall.address || '',
        store.floor || '',
        store.tags?.join(' ') || '',
      ]
        .join(' ')
        .toLowerCase();

      // All tokens must match (either directly or via synonym expansion)
      const matchesAll = tokens.every((token) => {
        if (searchableText.includes(token)) return true;
        const syns = SEARCH_SYNONYMS[token];
        if (syns && syns.some((syn) => searchableText.includes(syn))) {
          return true;
        }
        return false;
      });
      if (!matchesAll) return false;
    }

    return true;
  });

  // 2. Compute distances if user coordinates available
  const itemsWithDistance = filtered.map((store) => {
    let distance_km: number | null = null;
    const sLat = store.coordinates?.lat || null;
    const sLng = store.coordinates?.lng || null;

    if (userLat !== null && userLng !== null && sLat !== null && sLng !== null) {
      distance_km = haversineDistance(userLat, userLng, sLat, sLng);
    }

    return {
      ...store,
      distance_km,
    };
  });

  // 3. Distance Sorting
  if (sortByDistance && userLat !== null && userLng !== null) {
    itemsWithDistance.sort((a, b) => {
      const distA = a.distance_km ?? Infinity;
      const distB = b.distance_km ?? Infinity;
      return distA - distB;
    });
  }

  const total = itemsWithDistance.length;
  const startIndex = (page - 1) * limit;
  const paginatedItems = itemsWithDistance.slice(startIndex, startIndex + limit);

  const processingTimeMs = Date.now() - startTime;

  return NextResponse.json({
    total,
    page,
    limit,
    processing_time_ms: processingTimeMs,
    engine: 'edge_serverless',
    items: paginatedItems,
  });
}
