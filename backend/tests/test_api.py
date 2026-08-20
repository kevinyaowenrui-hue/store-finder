import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "meilisearch" in data


@pytest.mark.asyncio
async def test_search_all():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/search")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["total"] >= 30
        assert len(data["items"]) > 0
        first = data["items"][0]
        assert "brand" in first
        assert "mall" in first
        assert "coordinates" in first


@pytest.mark.asyncio
async def test_search_by_query():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Search for "嘉里"
        response = await ac.get("/api/v1/search?q=嘉里")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        for item in data["items"]:
            match = "嘉里" in item["store_name"] or "嘉里" in item["mall"]["name"]
            assert match


@pytest.mark.asyncio
async def test_search_by_city():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/search?city=上海市")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 6
        for item in data["items"]:
            assert item["mall"]["city"] == "上海市"


@pytest.mark.asyncio
async def test_locations_meta():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/meta/locations")
        assert response.status_code == 200
        data = response.json()
        assert data["total_stores"] >= 30
        assert len(data["provinces"]) > 0
        assert len(data["hot_cities"]) > 0
        assert "上海市" in data["hot_cities"] or "北京市" in data["hot_cities"]


@pytest.mark.asyncio
async def test_brands_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/brands")
        assert response.status_code == 200
        brands = response.json()
        assert any(b["code"] == "new-balance" for b in brands)
        assert any(b.get("store_count", 0) > 0 for b in brands)


@pytest.mark.asyncio
async def test_admin_stats():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"X-Admin-Key": settings.ADMIN_API_KEY}
        response = await ac.get("/api/v1/admin/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_stores"] > 0
        assert data["active_stores"] > 0
        assert data["total_brands"] >= 1
        assert data["total_malls"] >= 1
        assert data["total_cities"] >= 1


@pytest.mark.asyncio
async def test_admin_export_csv():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"X-Admin-Key": settings.ADMIN_API_KEY}
        response = await ac.get("/api/v1/admin/stores/export-csv", headers=headers)
        if response.status_code != 200:
            print("ERROR DETAIL:", response.text)
        assert response.status_code == 200
        assert "brand_name,mall_name,province" in response.text
        assert "New Balance" in response.text

