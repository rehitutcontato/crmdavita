"""Store and product endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app.models.domain import Product, Store
from app.state.store import app_state

router = APIRouter(tags=["stores"])


@router.get("/stores", response_model=list[Store])
async def list_stores() -> list[Store]:
    """All stores with current daily metrics."""
    return list(app_state.stores.values())


@router.get("/products", response_model=list[Product])
async def list_products() -> list[Product]:
    """Full product catalog."""
    return list(app_state.products.values())
