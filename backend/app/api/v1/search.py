from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.store import (
    SearchResponse,
    LocationMetaResponse,
    BrandResponse,
    BrandSimple
)
from app.services.store_service import store_service
from app.services.meili_service import meili_service

router = APIRouter()


@router.get("/search", response_model=SearchResponse)
async def search_stores(
    q: str = Query("", description="Search keywords (e.g. brand, mall, city, tags, alias)"),
    province: Optional[str] = Query(None, description="Province filter"),
    city: Optional[str] = Query(None, description="City filter"),
    district: Optional[str] = Query(None, description="District filter"),
    brand: Optional[str] = Query(None, description="Brand code filter (e.g. new-balance)"),
    lat: Optional[float] = Query(None, description="User current latitude for nearby store calculation"),
    lng: Optional[float] = Query(None, description="User current longitude for nearby store calculation"),
    sort_by_distance: bool = Query(False, description="Whether to sort stores by proximity"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """
    Unified instant search API with Meilisearch acceleration, database fallback, and live geo-proximity ranking.
    """
    return await store_service.search_stores(
        db=db,
        query=q,
        province=province,
        city=city,
        district=district,
        brand_code=brand,
        user_lat=lat,
        user_lng=lng,
        sort_by_distance=sort_by_distance,
        page=page,
        limit=limit
    )


@router.get("/meta/locations", response_model=LocationMetaResponse)
async def get_locations_meta(
    brand: Optional[str] = Query(None, description="Filter location hierarchy by brand code (e.g. nike, new-balance)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dynamic province/city/district hierarchy and store statistics, optionally filtered by brand.
    """
    return await store_service.get_locations_meta(db=db, brand_code=brand)


@router.get("/brands", response_model=List[BrandSimple])
async def get_brands(
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of all active brands with real-time store count.
    """
    brands = await store_service.get_all_brands_with_counts(db=db)
    return [
        BrandSimple(
            id=b["id"],
            name=b["name"],
            code=b["code"],
            logo_url=b["logo_url"],
            store_count=b["store_count"]
        )
        for b in brands
    ]



@router.get("/health")
async def health_check():
    """
    Check API and Meilisearch health status.
    """
    meili_ok = meili_service.is_healthy()
    return {
        "status": "ok",
        "database": "connected",
        "meilisearch": {
            "status": "online" if meili_ok else "offline (fallback to SQL)",
            "url": meili_service.client.config.url if meili_service.client else None
        }
    }
