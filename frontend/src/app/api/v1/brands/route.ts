import { NextResponse } from 'next/server';
import storesData from '@/data/stores.json';
import { StoreItem, Brand } from '@/lib/types';

export async function GET() {
  const allStores = storesData as StoreItem[];
  const brandMap = new Map<string, { id: number; name: string; code: string; logo_url: string | null; count: number }>();

  for (const s of allStores) {
    if (!s.is_active) continue;
    const b = s.brand;
    const existing = brandMap.get(b.code);
    if (existing) {
      existing.count++;
    } else {
      brandMap.set(b.code, {
        id: b.id,
        name: b.name,
        code: b.code,
        logo_url: b.logo_url || null,
        count: 1,
      });
    }
  }

  const brands: Brand[] = Array.from(brandMap.values())
    .sort((a, b) => b.count - a.count)
    .map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      logo_url: b.logo_url,
      store_count: b.count,
    }));

  return NextResponse.json(brands);
}
