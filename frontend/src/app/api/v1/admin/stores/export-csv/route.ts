import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey, getMemoryStores } from '@/lib/storeDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('X-Admin-Key') || request.nextUrl.searchParams.get('admin_key');
  if (!validateAdminKey(adminKey)) {
    return NextResponse.json({ detail: 'Unauthorized: Invalid Admin API Key' }, { status: 401 });
  }

  const stores = getMemoryStores();
  const headers = [
    'id',
    'store_name',
    'brand',
    'province',
    'city',
    'district',
    'mall_name',
    'address',
    'floor',
    'phone',
    'business_hours',
    'latitude',
    'longitude',
    'tags',
    'is_active',
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = stores.map((s) => [
    s.id,
    escapeCSV(s.store_name),
    escapeCSV(s.brand?.name),
    escapeCSV(s.mall?.province),
    escapeCSV(s.mall?.city),
    escapeCSV(s.mall?.district || ''),
    escapeCSV(s.mall?.name),
    escapeCSV(s.mall?.address || ''),
    escapeCSV(s.floor || ''),
    escapeCSV(s.phone || ''),
    escapeCSV(s.business_hours || ''),
    s.coordinates?.lat || '',
    s.coordinates?.lng || '',
    escapeCSV(Array.isArray(s.tags) ? s.tags.join(';') : s.tags || ''),
    s.is_active !== false ? '1' : '0',
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="store_finder_stores_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
