import { SearchResponse, LocationMetaResponse, Brand, AdminStoreItem, AdminStats } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';


export async function searchStores(params: {
  q?: string;
  province?: string;
  city?: string;
  district?: string;
  brand?: string;
  lat?: number;
  lng?: number;
  sort_by_distance?: boolean;
  page?: number;
  limit?: number;
}): Promise<SearchResponse> {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.province && params.province !== '全部') query.append('province', params.province);
  if (params.city && params.city !== '全部') query.append('city', params.city);
  if (params.district && params.district !== '全部') query.append('district', params.district);
  if (params.brand && params.brand !== 'all') query.append('brand', params.brand);
  if (params.lat !== undefined) query.append('lat', params.lat.toString());
  if (params.lng !== undefined) query.append('lng', params.lng.toString());
  if (params.sort_by_distance) query.append('sort_by_distance', 'true');
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/search?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to search stores: ${res.statusText}`);
  }
  return res.json();
}

export async function getLocationMeta(brand?: string): Promise<LocationMetaResponse> {
  const url = brand && brand !== 'all'
    ? `${API_BASE}/meta/locations?brand=${encodeURIComponent(brand)}`
    : `${API_BASE}/meta/locations`;
  const res = await fetch(url, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch location metadata');
  }
  return res.json();
}

export async function getBrands(): Promise<Brand[]> {
  const res = await fetch(`${API_BASE}/brands`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch brands');
  }
  return res.json();
}

export async function getHealthStatus() {
  const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
  if (!res.ok) return { status: 'offline', meilisearch: { status: 'offline' } };
  return res.json();
}

// ---------------- Admin APIs ----------------
export async function adminListStores(adminKey: string): Promise<AdminStoreItem[]> {
  const res = await fetch(`${API_BASE}/admin/stores?limit=200`, {
    headers: { 'X-Admin-Key': adminKey },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Unauthorized or failed to load admin stores');
  return res.json();
}

export async function adminCreateStore(data: any, adminKey: string): Promise<AdminStoreItem> {
  const res = await fetch(`${API_BASE}/admin/stores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create store');
  return res.json();
}

export async function adminUpdateStore(id: number, data: any, adminKey: string): Promise<AdminStoreItem> {
  const res = await fetch(`${API_BASE}/admin/stores/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update store');
  return res.json();
}

export async function adminDeleteStore(id: number, adminKey: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/stores/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  if (!res.ok) throw new Error('Failed to delete store');
  return true;
}

export async function adminImportCSV(file: File, adminKey: string) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/admin/stores/import-csv`, {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Import failed' }));
    throw new Error(err.detail || 'CSV Import failed');
  }
  return res.json();
}

export function getExportCSVUrl(adminKey: string): string {
  return `${API_BASE}/admin/stores/export-csv?admin_key=${encodeURIComponent(adminKey)}`;
}

export async function adminReindex(adminKey: string) {
  const res = await fetch(`${API_BASE}/admin/search/reindex`, {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
  });
  if (!res.ok) throw new Error('Reindex failed');
  return res.json();
}

export async function adminGetStats(adminKey: string): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { 'X-Admin-Key': adminKey },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load admin stats');
  return res.json();
}

