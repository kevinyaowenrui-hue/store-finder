import secrets
from typing import Optional
from fastapi import HTTPException, status, Request
from app.core.config import settings


async def verify_admin_key(request: Request) -> bool:
    # Check headers
    key = request.headers.get("X-Admin-Key")
    # Check query params
    if not key:
        key = request.query_params.get("admin_key")
    # Check Authorization header (Bearer ...)
    if not key:
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            key = auth.split(" ")[1]

    # Timing-attack safe constant-time comparison
    if not key or not secrets.compare_digest(str(key), str(settings.ADMIN_API_KEY)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing Admin API Key"
        )
    return True
