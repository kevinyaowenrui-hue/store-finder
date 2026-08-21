import { NextRequest, NextResponse } from 'next/server';
import { getMemoryStores } from '@/lib/storeDb';
import { ProvinceMeta, CityMeta } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const brand = searchParams.get('brand');

  const allStores = getMemoryStores();

  // Filter stores by active & brand
  const activeStores = allStores.filter((s) => {
    if (!s.is_active) return false;
    if (brand && brand !== 'all') {
      const bCode = (s.brand.code || '').toLowerCase().replace(/[-_\s]/g, '');
      const qCode = brand.toLowerCase().replace(/[-_\s]/g, '');
      const bName = (s.brand.name || '').toLowerCase();
      const qName = brand.toLowerCase();
      const matches = bCode === qCode || bName.includes(qName) || qName.includes(bName);
      return matches;
    }
    return true;
  });

  const hierarchy: Record<string, Record<string, { count: number; districts: Set<string> }>> = {};
  const cityCounts: Record<string, number> = {};
  let totalStores = 0;

  for (const store of activeStores) {
    const prov = store.mall.province || '其他';
    const city = store.mall.city || prov;
    const dist = store.mall.district;

    totalStores++;
    cityCounts[city] = (cityCounts[city] || 0) + 1;

    if (!hierarchy[prov]) {
      hierarchy[prov] = {};
    }
    if (!hierarchy[prov][city]) {
      hierarchy[prov][city] = { count: 0, districts: new Set() };
    }

    hierarchy[prov][city].count++;
    if (dist) {
      hierarchy[prov][city].districts.add(dist);
    }
  }

  const provinces: ProvinceMeta[] = [];
  for (const [provName, citiesDict] of Object.entries(hierarchy)) {
    const cities: CityMeta[] = [];
    let provCount = 0;

    for (const [cityName, cityData] of Object.entries(citiesDict)) {
      provCount += cityData.count;
      cities.push({
        name: cityName,
        count: cityData.count,
        districts: Array.from(cityData.districts).sort(),
      });
    }

    provinces.push({
      name: provName,
      count: provCount,
      cities: cities.sort((a, b) => b.count - a.count),
    });
  }

  // Sort provinces by count descending
  provinces.sort((a, b) => b.count - a.count);

  // Top 8 hot cities
  const hotCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([cityName]) => cityName);

  return NextResponse.json({
    total_stores: totalStores,
    provinces,
    hot_cities: hotCities,
  });
}
