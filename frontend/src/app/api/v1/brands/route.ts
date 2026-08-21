import { NextResponse } from 'next/server';
import { getMemoryStores } from '@/lib/storeDb';
import { Brand } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const allStores = getMemoryStores();
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

  const BRAND_PRIORITY: Record<string, number> = {
    'new-balance': 1,
    'newbalance': 1,
    'new_balance': 1,
    'nike': 2,
    'adidas': 3,
  };

  const brands: Brand[] = Array.from(brandMap.values())
    .sort((a, b) => {
      const pA = BRAND_PRIORITY[a.code.toLowerCase()] || 99;
      const pB = BRAND_PRIORITY[b.code.toLowerCase()] || 99;
      if (pA !== pB) return pA - pB;
      return b.count - a.count;
    })
    .map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      logo_url: b.logo_url,
      store_count: b.count,
    }));

  return NextResponse.json(brands);
}
