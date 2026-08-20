from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_FILE = (BACKEND_DIR / "store_finder.db").as_posix()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Store Finder API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    # Default to sqlite+aiosqlite for zero-config local development, or postgresql+asyncpg://... for production
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DEFAULT_DB_FILE}"

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def resolve_sqlite_path(cls, v: str) -> str:
        if v.startswith("sqlite+aiosqlite:///./") or v.startswith("sqlite+aiosqlite:///.\\"):
            filename = v.replace("sqlite+aiosqlite:///./", "").replace("sqlite+aiosqlite:///.\\", "")
            resolved = (BACKEND_DIR / filename).as_posix()
            return f"sqlite+aiosqlite:///{resolved}"
        return v
    
    # Meilisearch
    MEILISEARCH_URL: str = "http://127.0.0.1:7700"
    MEILISEARCH_MASTER_KEY: str = "masterKey"
    MEILISEARCH_INDEX_NAME: str = "stores_index"
    
    # Admin Security
    ADMIN_API_KEY: str = "admin123456"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://127.0.0.1:5199",
        "http://localhost:5199",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "*"
    ]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
