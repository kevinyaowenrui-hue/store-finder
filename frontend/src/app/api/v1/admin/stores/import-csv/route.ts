import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey, getMemoryStores, createStore } from '@/lib/storeDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('X-Admin-Key') || request.nextUrl.searchParams.get('admin_key');
  if (!validateAdminKey(adminKey)) {
    return NextResponse.json({ detail: 'Unauthorized: Invalid Admin API Key' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ detail: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json({ detail: 'Empty CSV or header only' }, { status: 400 });
    }

    let importedCount = 0;
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',');
      if (cols.length >= 2) {
        const storeName = cols[1]?.replace(/^"|"$/g, '').trim();
        const brand = cols[2]?.replace(/^"|"$/g, '').trim() || 'New Balance';
        const brandLower = brand.toLowerCase();
        const brandId = brandLower.includes('nb') || brandLower.includes('balance') || brandLower.includes('新百伦') || brandLower.includes('纽巴伦')
          ? 1
          : brandLower.includes('adi') || brandLower.includes('阿迪') || brandLower.includes('三叶草')
          ? 3
          : 2;
        const prov = cols[3]?.replace(/^"|"$/g, '').trim() || '北京市';
        const city = cols[4]?.replace(/^"|"$/g, '').trim() || '北京市';
        const mallName = cols[6]?.replace(/^"|"$/g, '').trim() || '商场';
        const phone = cols[9]?.replace(/^"|"$/g, '').trim() || '';

        if (storeName) {
          createStore({
            store_name: storeName,
            brand_id: brandId,
            province: prov,
            city: city,
            mall_name: mallName,
            phone: phone,
          });
          importedCount++;
        }
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: `成功解析并导入 ${importedCount} 条门店记录`,
      imported_count: importedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Import failed' }, { status: 500 });
  }
}
