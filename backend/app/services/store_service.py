import io
import csv
import time
import math
import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, update, delete
from sqlalchemy.orm import selectinload

from app.db.models import Brand, Mall, Store
from app.schemas.store import (
    StoreCreate,
    StoreUpdate,
    StoreSearchItem,
    SearchResponse,
    BrandSimple,
    MallSimple,
    Coordinates,
    LocationMetaResponse,
    ProvinceItem,
    CityItem
)
from app.services.meili_service import meili_service

# Brand alias mapping for robust Chinese/English search tolerance
BRAND_ALIAS_MAP: Dict[str, str] = {
    "鸟": "arcteryx",
    "始祖鸟": "arcteryx",
    "arc": "arcteryx",
    "arcteryx": "arcteryx",
    "lulu": "lululemon",
    "露露": "lululemon",
    "露露乐蒙": "lululemon",
    "lululemon": "lululemon",
    "nb": "new-balance",
    "newbalance": "new-balance",
    "new balance": "new-balance",
    "纽巴伦": "new-balance",
    "新百伦": "new-balance",
    "耐克": "nike",
    "钩子": "nike",
    "nike": "nike",
    "阿迪": "adidas",
    "阿迪达斯": "adidas",
    "三叶草": "adidas",
    "adidas": "adidas",
    "萨洛蒙": "salomon",
    "所罗门": "salomon",
    "salomon": "salomon",
    "昂跑": "on-running",
    "云跑": "on-running",
    "on": "on-running",
    "on running": "on-running",
}


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in kilometers between two points."""
    R = 6371.0 # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


class StoreService:
    async def get_or_create_brand(self, db: AsyncSession, name: str, code: Optional[str] = None, logo_url: Optional[str] = None) -> Brand:
        code_val = code or name.lower().replace(" ", "-")
        stmt = select(Brand).where(or_(Brand.name == name, Brand.code == code_val))
        res = await db.execute(stmt)
        brand = res.scalars().first()
        if not brand:
            brand = Brand(name=name, code=code_val, logo_url=logo_url)
            db.add(brand)
            await db.flush()
        return brand

    async def get_or_create_mall(
        self,
        db: AsyncSession,
        name: str,
        province: str,
        city: str,
        district: Optional[str] = None,
        address: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> Mall:
        stmt = select(Mall).where(
            and_(
                Mall.name == name,
                Mall.city == city
            )
        )
        res = await db.execute(stmt)
        mall = res.scalars().first()
        if not mall:
            mall = Mall(
                name=name,
                province=province,
                city=city,
                district=district,
                address=address,
                latitude=latitude,
                longitude=longitude
            )
            db.add(mall)
            await db.flush()
        else:
            # Update address/coords if newly available
            if address and not mall.address:
                mall.address = address
            if latitude and not mall.latitude:
                mall.latitude = latitude
                mall.longitude = longitude
            await db.flush()
        return mall

    async def search_stores(
        self,
        db: AsyncSession,
        query: str = "",
        province: Optional[str] = None,
        city: Optional[str] = None,
        district: Optional[str] = None,
        brand_code: Optional[str] = None,
        user_lat: Optional[float] = None,
        user_lng: Optional[float] = None,
        sort_by_distance: bool = False,
        page: int = 1,
        limit: int = 20
    ) -> SearchResponse:
        start_time = time.time()

        # Check brand alias if brand_code is not specified
        active_brand_code = brand_code
        if (not active_brand_code or active_brand_code == "all") and query:
            q_lower = query.strip().lower()
            for alias, mapped_code in BRAND_ALIAS_MAP.items():
                if alias == q_lower or alias in q_lower.split():
                    active_brand_code = mapped_code
                    break
        
        # 1. Try Meilisearch first (when not strictly sorting by live geo-distance)
        if not sort_by_distance:
            meili_res = meili_service.search(
                query=query,
                province=province,
                city=city,
                district=district,
                brand_code=active_brand_code,
                page=page,
                limit=limit
            )

            if meili_res is not None:
                # Parse Meilisearch hits
                items = []
                hits = meili_res.get("hits", [])
                total = meili_res.get("estimatedTotalHits", len(hits))
                for hit in hits:
                    geo = hit.get("_geo") or {}
                    lat = geo.get("lat")
                    lng = geo.get("lng")
                    dist_km = None
                    if user_lat is not None and user_lng is not None and lat and lng:
                        dist_km = haversine_distance(user_lat, user_lng, float(lat), float(lng))

                    items.append(
                        StoreSearchItem(
                            id=hit["id"],
                            store_name=hit.get("store_name", ""),
                            brand=BrandSimple(
                                id=hit.get("brand_id", 0),
                                name=hit.get("brand_name", ""),
                                code=hit.get("brand_code", ""),
                                logo_url=hit.get("brand_logo")
                            ),
                            mall=MallSimple(
                                id=hit.get("mall_id", 0),
                                name=hit.get("mall_name", ""),
                                province=hit.get("province", ""),
                                city=hit.get("city", ""),
                                district=hit.get("district"),
                                address=hit.get("address")
                            ),
                            floor=hit.get("floor"),
                            phone=hit.get("phone"),
                            business_hours=hit.get("business_hours"),
                            coordinates=Coordinates(lat=lat, lng=lng),
                            distance_km=dist_km,
                            source_url=hit.get("source_url"),
                            tags=[t.strip() for t in hit.get("tags", "").split(",") if t.strip()] if hit.get("tags") else [],
                            is_active=hit.get("is_active", True),
                            last_verified_at=hit.get("last_verified_at"),
                            updated_at=hit.get("updated_at")
                        )
                    )
                
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
                return SearchResponse(
                    total=total,
                    page=page,
                    limit=limit,
                    processing_time_ms=elapsed_ms,
                    engine="meilisearch",
                    items=items
                )

        # 2. Database Search (SQLAlchemy)
        stmt = (
            select(Store)
            .join(Store.brand)
            .join(Store.mall)
            .options(selectinload(Store.brand), selectinload(Store.mall))
            .where(Store.is_active.is_(True))
        )

        conditions = []
        if query:
            tokens = [t.strip() for t in query.strip().split() if t.strip()]
            for token in tokens:
                t_clean = f"%{token}%"
                conditions.append(
                    or_(
                        Store.store_name.ilike(t_clean),
                        Brand.name.ilike(t_clean),
                        Brand.name_en.ilike(t_clean),
                        Mall.name.ilike(t_clean),
                        Mall.city.ilike(t_clean),
                        Mall.province.ilike(t_clean),
                        Mall.district.ilike(t_clean),
                        Mall.address.ilike(t_clean),
                        Store.floor.ilike(t_clean),
                        Store.tags.ilike(t_clean),
                    )
                )

        if province and province != "全部":
            conditions.append(Mall.province == province)
        if city and city != "全部":
            conditions.append(Mall.city == city)
        if district and district != "全部":
            conditions.append(Mall.district == district)
        if active_brand_code and active_brand_code != "all":
            conditions.append(Brand.code == active_brand_code)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Count total
        count_stmt = select(func.count(Store.id)).select_from(Store).join(Store.brand).join(Store.mall)
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        total_res = await db.execute(count_stmt)
        total = total_res.scalar_one()

        if not sort_by_distance:
            stmt = stmt.order_by(Store.updated_at.desc()).offset((page - 1) * limit).limit(limit)
            results = await db.execute(stmt)
            stores = results.scalars().all()
        else:
            # Fetch matching candidate stores for distance calculation
            results = await db.execute(stmt)
            stores = results.scalars().all()

        items = []
        for s in stores:
            lat = s.latitude if s.latitude is not None else (s.mall.latitude if s.mall else None)
            lng = s.longitude if s.longitude is not None else (s.mall.longitude if s.mall else None)
            
            dist_km = None
            if user_lat is not None and user_lng is not None and lat and lng:
                dist_km = haversine_distance(user_lat, user_lng, float(lat), float(lng))

            items.append(
                StoreSearchItem(
                    id=s.id,
                    store_name=s.store_name,
                    brand=BrandSimple(
                        id=s.brand.id,
                        name=s.brand.name,
                        code=s.brand.code,
                        logo_url=s.brand.logo_url
                    ),
                    mall=MallSimple(
                        id=s.mall.id,
                        name=s.mall.name,
                        province=s.mall.province,
                        city=s.mall.city,
                        district=s.mall.district,
                        address=s.mall.address
                    ),
                    floor=s.floor,
                    phone=s.phone,
                    business_hours=s.business_hours,
                    coordinates=Coordinates(lat=lat, lng=lng),
                    distance_km=dist_km,
                    source_url=s.source_url,
                    tags=[t.strip() for t in s.tags.split(",") if t.strip()] if s.tags else [],
                    is_active=s.is_active,
                    last_verified_at=s.last_verified_at.strftime("%Y-%m-%d %H:%M") if s.last_verified_at else None,
                    updated_at=s.updated_at.strftime("%Y-%m-%d %H:%M") if s.updated_at else None,
                )
            )

        # Sort by distance if requested
        if sort_by_distance and user_lat is not None and user_lng is not None:
            # Sort items with valid distance first
            items.sort(key=lambda x: (x.distance_km if x.distance_km is not None else float("inf")))
            # Apply page slicing
            items = items[(page - 1) * limit : page * limit]

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        return SearchResponse(
            total=total,
            page=page,
            limit=limit,
            processing_time_ms=elapsed_ms,
            engine="database_fallback",
            items=items
        )

    async def get_locations_meta(self, db: AsyncSession, brand_code: Optional[str] = None) -> LocationMetaResponse:
        """Dynamically build province/city hierarchy based on stores in database, optionally filtered by brand."""
        stmt = (
            select(
                Mall.province,
                Mall.city,
                Mall.district,
                func.count(Store.id).label("count")
            )
            .join(Store, Store.mall_id == Mall.id)
            .where(Store.is_active.is_(True))
        )

        if brand_code and brand_code != "all":
            stmt = stmt.join(Brand, Brand.id == Store.brand_id).where(Brand.code == brand_code.strip())

        stmt = stmt.group_by(Mall.province, Mall.city, Mall.district)
        res = await db.execute(stmt)
        rows = res.all()

        hierarchy: Dict[str, Dict[str, Dict[str, Any]]] = {}
        total_stores = 0
        city_counts: Dict[str, int] = {}

        for prov, city, dist, cnt in rows:
            total_stores += cnt
            city_counts[city] = city_counts.get(city, 0) + cnt

            if prov not in hierarchy:
                hierarchy[prov] = {}
            if city not in hierarchy[prov]:
                hierarchy[prov][city] = {"count": 0, "districts": set()}

            hierarchy[prov][city]["count"] += cnt
            if dist:
                hierarchy[prov][city]["districts"].add(dist)

        provinces = []
        for prov_name, cities_dict in hierarchy.items():
            cities = []
            prov_count = 0
            for city_name, city_data in cities_dict.items():
                prov_count += city_data["count"]
                cities.append(
                    CityItem(
                        name=city_name,
                        count=city_data["count"],
                        districts=sorted(list(city_data["districts"]))
                    )
                )
            provinces.append(
                ProvinceItem(
                    name=prov_name,
                    count=prov_count,
                    cities=sorted(cities, key=lambda c: c.count, reverse=True)
                )
            )

        provinces.sort(key=lambda p: p.count, reverse=True)
        # Top 8 hot cities
        hot_cities = [c[0] for c in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:8]]

        return LocationMetaResponse(
            total_stores=total_stores,
            provinces=provinces,
            hot_cities=hot_cities
        )

    async def get_all_brands_with_counts(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """Get all active brands with their active store count."""
        stmt = (
            select(
                Brand.id,
                Brand.name,
                Brand.code,
                Brand.logo_url,
                Brand.official_site,
                func.count(Store.id).label("store_count")
            )
            .outerjoin(Store, and_(Store.brand_id == Brand.id, Store.is_active.is_(True)))
            .where(Brand.is_active.is_(True))
            .group_by(Brand.id, Brand.name, Brand.code, Brand.logo_url, Brand.official_site)
            .order_by(func.count(Store.id).desc(), Brand.id.asc())
        )
        res = await db.execute(stmt)
        rows = res.all()
        return [
            {
                "id": r.id,
                "name": r.name,
                "code": r.code,
                "logo_url": r.logo_url,
                "official_site": r.official_site,
                "store_count": r.store_count
            }
            for r in rows
        ]

    async def get_admin_stats(self, db: AsyncSession) -> Dict[str, int]:
        """Get summary metrics for admin dashboard."""
        total_stores_res = await db.execute(select(func.count(Store.id)))
        total_stores = total_stores_res.scalar_one()

        active_stores_res = await db.execute(select(func.count(Store.id)).where(Store.is_active.is_(True)))
        active_stores = active_stores_res.scalar_one()

        total_brands_res = await db.execute(select(func.count(Brand.id)).where(Brand.is_active.is_(True)))
        total_brands = total_brands_res.scalar_one()

        total_malls_res = await db.execute(select(func.count(Mall.id)))
        total_malls = total_malls_res.scalar_one()

        total_cities_res = await db.execute(select(func.count(func.distinct(Mall.city))))
        total_cities = total_cities_res.scalar_one()

        return {
            "total_stores": total_stores,
            "active_stores": active_stores,
            "total_brands": total_brands,
            "total_malls": total_malls,
            "total_cities": total_cities,
        }

    async def get_all_brands(self, db: AsyncSession) -> List[Brand]:
        stmt = select(Brand).where(Brand.is_active.is_(True)).order_by(Brand.id.asc())
        res = await db.execute(stmt)
        return res.scalars().all()

    async def get_store_by_id(self, db: AsyncSession, store_id: int) -> Optional[Store]:
        stmt = (
            select(Store)
            .options(selectinload(Store.brand), selectinload(Store.mall))
            .where(Store.id == store_id)
        )
        res = await db.execute(stmt)
        return res.scalars().first()

    async def create_store(self, db: AsyncSession, store_in: StoreCreate) -> Store:
        # 1. Resolve Brand
        brand_id = store_in.brand_id
        if not brand_id and store_in.brand_name:
            brand = await self.get_or_create_brand(db, name=store_in.brand_name)
            brand_id = brand.id
        elif not brand_id:
            # Fallback to first brand
            brand_res = await db.execute(select(Brand).order_by(Brand.id.asc()).limit(1))
            first_b = brand_res.scalars().first()
            brand_id = first_b.id if first_b else 1

        # 2. Resolve Mall
        mall_id = store_in.mall_id
        if store_in.mall_name and store_in.city:
            mall = await self.get_or_create_mall(
                db,
                name=store_in.mall_name,
                province=store_in.province or store_in.city,
                city=store_in.city,
                district=store_in.district,
                address=store_in.address,
                latitude=store_in.latitude,
                longitude=store_in.longitude
            )
            mall_id = mall.id
        elif not mall_id:
            mall_res = await db.execute(select(Mall).order_by(Mall.id.asc()).limit(1))
            first_m = mall_res.scalars().first()
            mall_id = first_m.id if first_m else 1

        store = Store(
            store_name=store_in.store_name,
            brand_id=brand_id,
            mall_id=mall_id,
            floor=store_in.floor,
            phone=store_in.phone,
            business_hours=store_in.business_hours,
            latitude=store_in.latitude,
            longitude=store_in.longitude,
            source_url=store_in.source_url,
            tags=store_in.tags,
            is_active=store_in.is_active,
        )
        db.add(store)
        await db.commit()
        await db.refresh(store)

        loaded_store = await self.get_store_by_id(db, store.id)
        if loaded_store:
            doc = meili_service.format_store_for_index(loaded_store)
            meili_service.sync_stores([doc])
        return loaded_store

    async def update_store(self, db: AsyncSession, store_id: int, store_in: StoreUpdate) -> Optional[Store]:
        store = await self.get_store_by_id(db, store_id)
        if not store:
            return None

        # Check if mall fields are provided for updating or re-linking mall
        if store_in.mall_name and store_in.city:
            mall = await self.get_or_create_mall(
                db,
                name=store_in.mall_name,
                province=store_in.province or (store.mall.province if store.mall else store_in.city),
                city=store_in.city,
                district=store_in.district or (store.mall.district if store.mall else None),
                address=store_in.address or (store.mall.address if store.mall else None),
                latitude=store_in.latitude,
                longitude=store_in.longitude
            )
            store.mall_id = mall.id

        if store_in.brand_id is not None:
            store.brand_id = store_in.brand_id
        if store_in.store_name is not None:
            store.store_name = store_in.store_name
        if store_in.floor is not None:
            store.floor = store_in.floor
        if store_in.phone is not None:
            store.phone = store_in.phone
        if store_in.business_hours is not None:
            store.business_hours = store_in.business_hours
        if store_in.latitude is not None:
            store.latitude = store_in.latitude
        if store_in.longitude is not None:
            store.longitude = store_in.longitude
        if store_in.source_url is not None:
            store.source_url = store_in.source_url
        if store_in.tags is not None:
            store.tags = store_in.tags
        if store_in.is_active is not None:
            store.is_active = store_in.is_active
        
        store.updated_at = datetime.datetime.utcnow()
        await db.commit()
        await db.refresh(store)

        loaded_store = await self.get_store_by_id(db, store.id)
        if loaded_store:
            doc = meili_service.format_store_for_index(loaded_store)
            meili_service.sync_stores([doc])
        return loaded_store

    async def delete_store(self, db: AsyncSession, store_id: int) -> bool:
        store = await self.get_store_by_id(db, store_id)
        if not store:
            return False

        await db.delete(store)
        await db.commit()
        meili_service.delete_store(store_id)
        return True

    async def import_stores_from_csv(self, db: AsyncSession, csv_content: str) -> Tuple[int, int, List[str]]:
        """Parse CSV and insert/update stores. Returns (success_count, error_count, error_messages)."""
        reader = csv.DictReader(io.StringIO(csv_content.strip()))
        success_count = 0
        error_count = 0
        errors = []

        stores_to_sync = []

        for idx, row in enumerate(reader, start=2):
            try:
                brand_name = row.get("brand_name", "").strip() or "New Balance"
                mall_name = row.get("mall_name", "").strip()
                province = row.get("province", "").strip()
                city = row.get("city", "").strip()
                store_name = row.get("store_name", "").strip()

                if not mall_name or not province or not city or not store_name:
                    errors.append(f"Line {idx}: Missing required fields (mall_name, province, city, store_name)")
                    error_count += 1
                    continue

                district = row.get("district", "").strip() or None
                address = row.get("address", "").strip() or None
                floor = row.get("floor", "").strip() or None
                phone = row.get("phone", "").strip() or None
                business_hours = row.get("business_hours", "").strip() or "10:00 - 22:00"
                source_url = row.get("source_url", "").strip() or None
                tags = row.get("tags", "").strip() or None

                lat = float(row["latitude"]) if row.get("latitude") and row["latitude"].strip() else None
                lng = float(row["longitude"]) if row.get("longitude") and row["longitude"].strip() else None

                # 1. Get or create Brand
                brand = await self.get_or_create_brand(db, brand_name)

                # 2. Get or create Mall
                mall = await self.get_or_create_mall(
                    db,
                    name=mall_name,
                    province=province,
                    city=city,
                    district=district,
                    address=address,
                    latitude=lat,
                    longitude=lng
                )

                # 3. Check if Store already exists in this Mall for this Brand
                stmt = select(Store).where(
                    and_(
                        Store.brand_id == brand.id,
                        Store.mall_id == mall.id,
                        Store.store_name == store_name
                    )
                )
                res = await db.execute(stmt)
                existing_store = res.scalars().first()

                if existing_store:
                    existing_store.floor = floor or existing_store.floor
                    existing_store.phone = phone or existing_store.phone
                    existing_store.business_hours = business_hours or existing_store.business_hours
                    existing_store.source_url = source_url or existing_store.source_url
                    existing_store.tags = tags or existing_store.tags
                    if lat is not None:
                        existing_store.latitude = lat
                        existing_store.longitude = lng
                    existing_store.updated_at = datetime.datetime.utcnow()
                    target_store = existing_store
                else:
                    new_store = Store(
                        brand_id=brand.id,
                        mall_id=mall.id,
                        store_name=store_name,
                        floor=floor,
                        phone=phone,
                        business_hours=business_hours,
                        latitude=lat,
                        longitude=lng,
                        source_url=source_url,
                        tags=tags,
                        is_active=True
                    )
                    db.add(new_store)
                    target_store = new_store

                await db.flush()
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append(f"Line {idx} error: {str(e)}")

        await db.commit()

        # Re-fetch all and sync to Meilisearch
        await self.reindex_all_stores(db)
        return success_count, error_count, errors

    async def export_stores_to_csv(self, db: AsyncSession) -> str:
        stmt = (
            select(Store)
            .join(Store.brand)
            .join(Store.mall)
            .options(selectinload(Store.brand), selectinload(Store.mall))
            .order_by(Store.id.asc())
        )
        res = await db.execute(stmt)
        stores = res.scalars().all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "brand_name",
            "mall_name",
            "province",
            "city",
            "district",
            "address",
            "store_name",
            "floor",
            "phone",
            "business_hours",
            "latitude",
            "longitude",
            "source_url",
            "tags",
            "is_active"
        ])

        for s in stores:
            lat = s.latitude if s.latitude is not None else (s.mall.latitude if s.mall else "")
            lng = s.longitude if s.longitude is not None else (s.mall.longitude if s.mall else "")
            writer.writerow([
                s.brand.name if s.brand else "",
                s.mall.name if s.mall else "",
                s.mall.province if s.mall else "",
                s.mall.city if s.mall else "",
                s.mall.district if s.mall and s.mall.district else "",
                s.mall.address if s.mall and s.mall.address else "",
                s.store_name,
                s.floor or "",
                s.phone or "",
                s.business_hours or "",
                lat,
                lng,
                s.source_url or "",
                s.tags or "",
                "true" if s.is_active else "false"
            ])

        return output.getvalue()

    async def reindex_all_stores(self, db: AsyncSession) -> int:
        if not meili_service.is_healthy():
            return 0

        meili_service.init_index_settings()
        stmt = (
            select(Store)
            .options(selectinload(Store.brand), selectinload(Store.mall))
            .where(Store.is_active.is_(True))
        )
        res = await db.execute(stmt)
        stores = res.scalars().all()

        docs = [meili_service.format_store_for_index(s) for s in stores]
        if docs:
            meili_service.sync_stores(docs)
        return len(docs)


store_service = StoreService()
