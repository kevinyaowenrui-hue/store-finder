import { NextRequest, NextResponse } from 'next/server';
import {
  validateAdminKey,
  updateStore,
  deleteStore,
} from '@/lib/storeDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminKey = request.headers.get('X-Admin-Key') || request.nextUrl.searchParams.get('admin_key');
  if (!validateAdminKey(adminKey)) {
    return NextResponse.json({ detail: 'Unauthorized: Invalid Admin API Key' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  try {
    const body = await request.json();
    const updated = updateStore(id, body);
    if (!updated) {
      return NextResponse.json({ detail: 'Store not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to update store' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminKey = request.headers.get('X-Admin-Key') || request.nextUrl.searchParams.get('admin_key');
  if (!validateAdminKey(adminKey)) {
    return NextResponse.json({ detail: 'Unauthorized: Invalid Admin API Key' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  const deleted = deleteStore(id);
  if (!deleted) {
    return NextResponse.json({ detail: 'Store not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: `Store ${id} deleted` });
}
