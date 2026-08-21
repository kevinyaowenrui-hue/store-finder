import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey, getMemoryStores } from '@/lib/storeDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('X-Admin-Key') || request.nextUrl.searchParams.get('admin_key');
  if (!validateAdminKey(adminKey)) {
    return NextResponse.json({ detail: 'Unauthorized: Invalid Admin API Key' }, { status: 401 });
  }

  const stores = getMemoryStores();
  return NextResponse.json({
    status: 'ok',
    message: `内存索引重建成功，当前共加载 ${stores.length} 家门店`,
    indexed_stores: stores.length,
  });
}
