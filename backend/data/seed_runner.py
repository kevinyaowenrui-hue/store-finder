import asyncio
import os
import sys
from pathlib import Path

# Force UTF-8 on Windows console output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.session import engine, Base, AsyncSessionLocal
from app.services.store_service import store_service
from app.services.meili_service import meili_service


# Predefined brands with logos and codes
BRANDS_PRESET = [
    {
        "name": "New Balance",
        "name_en": "New Balance",
        "code": "new-balance",
        "logo_url": "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=200&q=80",
        "official_site": "https://www.newbalance.com.cn",
        "description": "经典复古慢跑与潮流生活方式品牌"
    },
    {
        "name": "Nike",
        "name_en": "Nike",
        "code": "nike",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png",
        "official_site": "https://www.nike.com.cn",
        "description": "全球顶尖运动品牌与科技创新前沿"
    },
    {
        "name": "Adidas",
        "name_en": "Adidas",
        "code": "adidas",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/200px-Adidas_Logo.svg.png",
        "official_site": "https://www.adidas.com.cn",
        "description": "德国专业运动与三叶草潮流经典"
    },
    {
        "name": "Arc'teryx",
        "name_en": "Arc'teryx",
        "code": "arcteryx",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Arcteryx_logo.svg/200px-Arcteryx_logo.svg.png",
        "official_site": "https://www.arcteryx.com",
        "description": "加拿大顶级专业户外高山攀登装备"
    },
    {
        "name": "Lululemon",
        "name_en": "Lululemon",
        "code": "lululemon",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Lululemon_Athletica_logo.svg/200px-Lululemon_Athletica_logo.svg.png",
        "official_site": "https://www.lululemon.cn",
        "description": "加拿大高端运动生活与瑜伽热汗生活方式"
    },
    {
        "name": "Salomon",
        "name_en": "Salomon",
        "code": "salomon",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Salomon_logo.svg/200px-Salomon_logo.svg.png",
        "official_site": "https://www.salomon.com.cn",
        "description": "法国户外越野跑与高街山系潮流美学"
    },
    {
        "name": "On 昂跑",
        "name_en": "On Running",
        "code": "on-running",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/On_Running_Logo.svg/200px-On_Running_Logo.svg.png",
        "official_site": "https://www.on.com",
        "description": "瑞士高端创新科技跑步与日常通勤鞋履"
    }
]


async def run_seed():
    print("[*] Starting multi-brand database initialization and seed data loading...")
    
    # 1. Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[+] Database tables created/verified.")

    # 2. Read seed CSV file
    csv_file = Path(__file__).resolve().parent / "nb_stores_seed.csv"
    if not csv_file.exists():
        print(f"[-] Seed file not found at: {csv_file}")
        return

    csv_content = csv_file.read_text(encoding="utf-8")

    # 3. Seed Brands and Stores into Database
    async with AsyncSessionLocal() as session:
        # Pre-seed Brands
        for b_info in BRANDS_PRESET:
            brand = await store_service.get_or_create_brand(
                session,
                name=b_info["name"],
                code=b_info["code"],
                logo_url=b_info["logo_url"]
            )
            brand.name_en = b_info.get("name_en")
            brand.official_site = b_info.get("official_site")
            brand.description = b_info.get("description")
            brand.logo_url = b_info["logo_url"]

        await session.commit()

        success_count, error_count, errors = await store_service.import_stores_from_csv(session, csv_content)
        print(f"[+] Imported/Updated {success_count} multi-brand stores successfully.")
        if error_count > 0:
            print(f"[!] Encountered {error_count} errors during import:")
            for err in errors:
                print(f"    - {err}")

    # 4. Check Meilisearch sync
    if meili_service.is_healthy():
        print("[*] Meilisearch is online! Setting up index...")
        async with AsyncSessionLocal() as session:
            count = await store_service.reindex_all_stores(session)
            print(f"[+] Synced {count} stores into Meilisearch index.")
    else:
        print("[i] Meilisearch is currently offline. System will operate seamlessly using database search fallback.")

    print("[+] Multi-brand seed data processing complete!")


if __name__ == "__main__":
    asyncio.run(run_seed())
