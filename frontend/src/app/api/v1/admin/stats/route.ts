import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey, getAdminStats } from '@/lib/storeDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('X-Admin-Key') || request.nextUrl.searchParams.get('admin_key');
  if (!validateAdminKey(adminKey)) {
    return NextResponse.json({ detail: 'Unauthorized: Invalid Admin API Key' }, { status: 401 });
  }

  const stats = getAdminStats();
  return NextResponse.json(stats);
}
