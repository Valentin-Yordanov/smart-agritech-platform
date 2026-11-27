"""Service-to-service authentication: only the NestJS backend may call inference and RAG routes."""

import hmac
from typing import Optional

from fastapi import Header, HTTPException, status

from app.core.config import get_settings

INTERNAL_KEY_HEADER = "X-Internal-API-Key"


def require_internal_key(
    x_internal_api_key: Optional[str] = Header(default=None, alias=INTERNAL_KEY_HEADER),
) -> None:
    settings = get_settings()
    expected = settings.INTERNAL_API_KEY

    # Without a configured key only local development/test runs stay open; production fails closed
    if not expected:
        if settings.ENV.lower() in ("development", "test"):
            return
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service authentication is not configured.",
        )

    provided = x_internal_api_key or ""
    if not hmac.compare_digest(provided.encode("utf-8"), expected.encode("utf-8")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid internal API key.",
        )
