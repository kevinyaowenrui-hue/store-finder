from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ---------------------- Brand Schemas ----------------------
class BrandBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    code: str
    logo_url: Optional[str] = None
    official_site: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class BrandCreate(BrandBase):
    pass


class BrandResponse(BrandBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------- Mall Schemas ----------------------
class MallBase(BaseModel):
    name: str
    province: str
    city: str
    district: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class MallCreate(MallBase):
    pass


class MallResponse(MallBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------- Store Schemas ----------------------
class StoreBase(BaseModel):
    store_name: str
    brand_id: Optional[int] = None
    brand_name: Optional[str] = None
    mall_id: Optional[int] = None
    mall_name: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    floor: Optional[str] = None
    phone: Optional[str] = None
    business_hours: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source_url: Optional[str] = None
    tags: Optional[str] = None
    is_active: bool = True


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    store_name: Optional[str] = None
    brand_id: Optional[int] = None
    brand_name: Optional[str] = None
    mall_id: Optional[int] = None
    mall_name: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    floor: Optional[str] = None
    phone: Optional[str] = None
    business_hours: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source_url: Optional[str] = None
    tags: Optional[str] = None
    is_active: Optional[bool] = None


class StoreDetailResponse(BaseModel):
    id: int
    store_name: str
    brand_id: int
    mall_id: int
    floor: Optional[str] = None
    phone: Optional[str] = None
    business_hours: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source_url: Optional[str] = None
    tags: Optional[str] = None
    is_active: bool
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    brand: Optional[BrandResponse] = None
    mall: Optional[MallResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------- Search / Card Item Schema ----------------------
class Coordinates(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None


class BrandSimple(BaseModel):
    id: int
    name: str
    code: str
    logo_url: Optional[str] = None
    store_count: Optional[int] = 0


class MallSimple(BaseModel):
    id: int
    name: str
    province: str
    city: str
    district: Optional[str] = None
    address: Optional[str] = None


class StoreSearchItem(BaseModel):
    id: int
    store_name: str
    brand: BrandSimple
    mall: MallSimple
    floor: Optional[str] = None
    phone: Optional[str] = None
    business_hours: Optional[str] = None
    coordinates: Coordinates
    distance_km: Optional[float] = None
    source_url: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: bool = True
    last_verified_at: Optional[str] = None
    updated_at: Optional[str] = None


class SearchResponse(BaseModel):
    total: int
    page: int
    limit: int
    processing_time_ms: float
    engine: str # "meilisearch" | "database_fallback"
    items: List[StoreSearchItem]


# ---------------------- Location Meta ----------------------
class CityItem(BaseModel):
    name: str
    count: int
    districts: List[str] = []


class ProvinceItem(BaseModel):
    name: str
    count: int
    cities: List[CityItem] = []


class LocationMetaResponse(BaseModel):
    total_stores: int
    provinces: List[ProvinceItem]
    hot_cities: List[str]


# ---------------------- Admin Stats ----------------------
class AdminStatsResponse(BaseModel):
    total_stores: int
    active_stores: int
    total_brands: int
    total_malls: int
    total_cities: int

