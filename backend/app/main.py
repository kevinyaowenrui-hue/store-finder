import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.api.v1 import search, admin
from app.services.meili_service import meili_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("store_finder")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized.")

    # Meilisearch setup
    if meili_service.is_healthy():
        logger.info("Meilisearch service is healthy. Configuring index settings...")
        meili_service.init_index_settings()
    else:
        logger.warning("Meilisearch not reachable. Running with SQL fallback search.")

    yield

    # Shutdown
    logger.info("Shutting down Store Finder API...")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Set CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(search.router, prefix=settings.API_V1_STR, tags=["Search & Discovery"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin Operations"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to Brand Store Finder API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
