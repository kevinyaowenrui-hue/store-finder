import { NextRequest, NextResponse } from 'next/server';
import {
  getMemoryStores,
  validateAdminKey,
  mapToAdminStore,
  createStore,
} from '@/lib/storeDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('X-Admin-Key') || request.nextUrl.searchParams.get('admin_key');
  if (!validateAdminKey(adminKey)) {
    return NextResponse.json({ detail: 'Unauthorized: Invalid Admin API Key' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '500', 10);
  const stores = getMemoryStores().slice(0, limit).map(mapToAdminStore);

  return NextResponse.json(stores);
}

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('X-Admin-Key') || request.nextUrl.searchParams.get('admin_key');
  if (!validateAdminKey(adminKey)) {
    return NextResponse.json({ detail: 'Unauthorized: Invalid Admin API Key' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const created = createStore(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to create store' }, { status: 400 });
  }
}
