import time
import logging
from typing import List, Dict, Any, Optional
import meilisearch
from app.core.config import settings

logger = logging.getLogger(__name__)


class MeiliService:
    def __init__(self):
        self.client: Optional[meilisearch.Client] = None
        self.index_name = settings.MEILISEARCH_INDEX_NAME
        self._last_health_check: float = 0
        self._is_available: bool = False
        self._check_interval: float = 10.0 # Cache health status for 10 seconds to avoid blocking latency
        self._init_client()

    def _init_client(self):
        try:
            self.client = meilisearch.Client(
                settings.MEILISEARCH_URL,
                settings.MEILISEARCH_MASTER_KEY,
                timeout=0.2 # 200ms timeout for instant responsiveness
            )
        except Exception as e:
            logger.warning(f"Failed to initialize Meilisearch client: {e}")
            self.client = None

    def is_healthy(self) -> bool:
        if not self.client:
            return False

        now = time.time()
        # Return cached status if within interval
        if now - self._last_health_check < self._check_interval:
            return self._is_available

        self._last_health_check = now
        try:
            health = self.client.health()
            self._is_available = (health.get("status") == "available")
        except Exception:
            self._is_available = False

        return self._is_available

    def init_index_settings(self):
        if not self.is_healthy():
            logger.warning("Meilisearch not reachable, skipping index setup")
            return

        try:
            index = self.client.index(self.index_name)
            # Update settings
            index.update_searchable_attributes([
                "brand_name",
                "store_name",
                "mall_name",
                "city",
                "province",
                "district",
                "address",
                "floor",
                "tags"
            ])
            index.update_filterable_attributes([
                "brand_code",
                "brand_id",
                "province",
                "city",
                "district",
                "is_active",
                "_geo"
            ])
            index.update_sortable_attributes([
                "updated_at",
                "last_verified_at",
                "_geo"
            ])
            logger.info("Meilisearch index settings updated successfully.")
        except Exception as e:
            logger.error(f"Error configuring Meilisearch index: {e}")

    def format_store_for_index(self, store: Any) -> Dict[str, Any]:
        """Convert a Store ORM object to Meili document format."""
        lat = store.latitude if store.latitude is not None else (store.mall.latitude if store.mall else None)
        lng = store.longitude if store.longitude is not None else (store.mall.longitude if store.mall else None)
        
        doc = {
            "id": store.id,
            "store_name": store.store_name,
            "brand_id": store.brand_id,
            "brand_name": store.brand.name if store.brand else "",
            "brand_code": store.brand.code if store.brand else "",
            "brand_logo": store.brand.logo_url if store.brand else "",
            "mall_id": store.mall_id,
            "mall_name": store.mall.name if store.mall else "",
            "province": store.mall.province if store.mall else "",
            "city": store.mall.city if store.mall else "",
            "district": store.mall.district if store.mall and store.mall.district else "",
            "address": store.mall.address if store.mall and store.mall.address else "",
            "floor": store.floor or "",
            "phone": store.phone or "",
            "business_hours": store.business_hours or "",
            "source_url": store.source_url or "",
            "tags": store.tags or "",
            "is_active": bool(store.is_active),
            "last_verified_at": store.last_verified_at.isoformat() if store.last_verified_at else None,
            "updated_at": store.updated_at.isoformat() if store.updated_at else None,
        }
        if lat is not None and lng is not None:
            doc["_geo"] = {"lat": float(lat), "lng": float(lng)}
        return doc

    def sync_stores(self, docs: List[Dict[str, Any]]):
        if not self.is_healthy() or not docs:
            return
        try:
            index = self.client.index(self.index_name)
            index.add_documents(docs, primary_key="id")
        except Exception as e:
            logger.error(f"Failed to sync stores to Meilisearch: {e}")

    def delete_store(self, store_id: int):
        if not self.is_healthy():
            return
        try:
            index = self.client.index(self.index_name)
            index.delete_document(str(store_id))
        except Exception as e:
            logger.error(f"Failed to delete store {store_id} from Meilisearch: {e}")

    def search(
        self,
        query: str = "",
        province: Optional[str] = None,
        city: Optional[str] = None,
        district: Optional[str] = None,
        brand_code: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Optional[Dict[str, Any]]:
        # Instantly check health without blocking network timeout
        if not self.is_healthy():
            return None

        try:
            filters = ["is_active = true"]
            if province and province != "全部":
                filters.append(f'province = "{province}"')
            if city and city != "全部":
                filters.append(f'city = "{city}"')
            if district and district != "全部":
                filters.append(f'district = "{district}"')
            if brand_code and brand_code != "all":
                filters.append(f'brand_code = "{brand_code}"')

            filter_str = " AND ".join(filters) if filters else None
            offset = (page - 1) * limit

            index = self.client.index(self.index_name)
            res = index.search(query, {
                "offset": offset,
                "limit": limit,
                "filter": filter_str,
                "sort": ["updated_at:desc"]
            })
            return res
        except Exception as e:
            logger.error(f"Meilisearch search error: {e}")
            self._is_available = False
            return None


meili_service = MeiliService()
