import { NextRequest, NextResponse } from 'next/server';
import storesData from '@/data/stores.json';
import { StoreItem } from '@/lib/types';

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

  const allStores = storesData as unknown as StoreItem[];

  // 1. Filtering
  let filtered = allStores.filter((store) => {
    if (!store.is_active) return false;

    // Brand filter
    if (brand && brand !== 'all') {
      if (store.brand.code !== brand) return false;
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

    // Keyword search
    if (query) {
      const tokens = query.split(/\s+/).filter(Boolean);
      const searchableText = [
        store.store_name,
        store.brand.name,
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

      // All tokens must match
      const matchesAll = tokens.every((token) => searchableText.includes(token));
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
