"""Transaction endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app.models.domain import Transaction
from app.state.store import app_state

router = APIRouter(tags=["transactions"])


@router.get("/transactions/recent", response_model=list[Transaction])
async def recent_transactions(limit: int = 5) -> list[Transaction]:
    """Last N transactions, most recent first."""
    return app_state.get_recent_transactions(limit=limit)
