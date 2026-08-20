from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import Store, Mall, Brand
from app.schemas.store import (
    StoreCreate,
    StoreUpdate,
    StoreDetailResponse,
    BrandResponse,
    MallResponse,
    AdminStatsResponse
)
from app.core.security import verify_admin_key
from app.services.store_service import store_service

router = APIRouter(dependencies=[Depends(verify_admin_key)])


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_dashboard_stats(
    db: AsyncSession = Depends(get_db)
):
    """Get metrics dashboard stats (stores, brands, malls, cities)."""
    return await store_service.get_admin_stats(db)


@router.get("/stores", response_model=List[StoreDetailResponse])

async def list_admin_stores(
    skip: int = 0,
    limit: int = 100,
    brand_id: Optional[int] = None,
    city: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List stores with pagination for admin table."""
    stmt = (
        select(Store)
        .options(selectinload(Store.brand), selectinload(Store.mall))
        .order_by(Store.id.desc())
    )
    if brand_id:
        stmt = stmt.where(Store.brand_id == brand_id)
    if city:
        stmt = stmt.join(Store.mall).where(Mall.city == city)
    
    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/stores/import-csv")
async def import_stores_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Import stores from CSV file.
    Automatically matches/creates brands and malls, and updates search index.
    """
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    content = await file.read()
    try:
        csv_text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            csv_text = content.decode("gbk")
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to decode CSV file. Please use UTF-8 encoding.")

    success_cnt, err_cnt, errors = await store_service.import_stores_from_csv(db, csv_text)
    return {
        "success": True,
        "imported_or_updated": success_cnt,
        "errors_count": err_cnt,
        "error_messages": errors[:20]
    }


@router.get("/stores/export-csv")
async def export_stores_csv(
    db: AsyncSession = Depends(get_db)
):
    """Export all stores to standard CSV."""
    csv_data = await store_service.export_stores_to_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=stores_export.csv"}
    )


@router.post("/search/reindex")
async def trigger_reindex(
    db: AsyncSession = Depends(get_db)
):
    """Rebuild Meilisearch index from database records."""
    count = await store_service.reindex_all_stores(db)
    return {
        "success": True,
        "message": f"Successfully reindexed {count} stores into Meilisearch."
    }


@router.get("/stores/{store_id}", response_model=StoreDetailResponse)
async def get_admin_store(
    store_id: int,
    db: AsyncSession = Depends(get_db)
):
    store = await store_service.get_store_by_id(db, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@router.post("/stores", response_model=StoreDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_store(
    store_in: StoreCreate,
    db: AsyncSession = Depends(get_db)
):
    return await store_service.create_store(db, store_in)


@router.put("/stores/{store_id}", response_model=StoreDetailResponse)
async def update_admin_store(
    store_id: int,
    store_in: StoreUpdate,
    db: AsyncSession = Depends(get_db)
):
    store = await store_service.update_store(db, store_id, store_in)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@router.delete("/stores/{store_id}")
async def delete_admin_store(
    store_id: int,
    db: AsyncSession = Depends(get_db)
):
    ok = await store_service.delete_store(db, store_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Store not found")
    return {"message": "Store deleted successfully", "id": store_id}
