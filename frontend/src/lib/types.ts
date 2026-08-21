export interface Brand {
  id: number;
  name: string;
  code: string;
  logo_url?: string | null;
  official_site?: string | null;
  store_count?: number;
}

export interface Mall {
  id: number;
  name: string;
  province: string;
  city: string;
  district?: string;
  address?: string;
}

export interface Coordinates {
  lat?: number;
  lng?: number;
}

export interface StoreItem {
  id: number;
  store_name: string;
  brand: {
    id: number;
    name: string;
    code: string;
    logo_url?: string | null;
    official_site?: string | null;
  };
  mall: {
    id: number;
    name: string;
    province: string;
    city: string;
    district?: string;
    address?: string;
  };
  floor?: string;
  phone?: string;
  business_hours?: string;
  coordinates: Coordinates;
  distance_km?: number | null;
  source_url?: string;
  tags?: string[];
  is_active: boolean;
  last_verified_at?: string;
  updated_at?: string;
}

export interface SearchResponse {
  total: number;
  page: number;
  limit: number;
  processing_time_ms: number;
  engine: string;
  items: StoreItem[];
}

export interface CityMeta {
  name: string;
  count: number;
  districts: string[];
}

export interface ProvinceMeta {
  name: string;
  count: number;
  cities: CityMeta[];
}

export interface LocationMetaResponse {
  total_stores: number;
  provinces: ProvinceMeta[];
  hot_cities: string[];
}

export interface AdminStoreItem {
  id: number;
  store_name: string;
  brand_id: number;
  mall_id: number;
  floor?: string;
  phone?: string;
  business_hours?: string;
  latitude?: number;
  longitude?: number;
  source_url?: string;
  tags?: string;
  is_active: boolean;
  brand?: Brand;
  mall?: Mall;
  updated_at: string;
  created_at: string;
}

export interface AdminStats {
  total_stores: number;
  active_stores: number;
  total_brands: number;
  total_malls: number;
  total_cities: number;
}

