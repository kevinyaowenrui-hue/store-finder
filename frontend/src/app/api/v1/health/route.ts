import { NextResponse } from 'next/server';
import storesData from '@/data/stores.json';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'edge_serverless',
    total_stores: storesData.length,
    deployment: 'Vercel Serverless',
  });
}
