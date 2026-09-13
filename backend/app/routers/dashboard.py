"""Dashboard endpoints — aggregated metrics for the Diretoria panel."""
from __future__ import annotations

from fastapi import APIRouter

from app.models.domain import DashboardSummary, FunnelCounts, StorePerformance
from app.state.store import app_state

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary() -> DashboardSummary:
    """Full dashboard summary with all computed metrics."""
    return app_state.get_dashboard_summary()


@router.get("/store-performance", response_model=list[StorePerformance])
async def get_store_performance() -> list[StorePerformance]:
    """Performance breakdown by store."""
    return app_state.get_store_performance()


@router.get("/funnel", response_model=FunnelCounts)
async def get_funnel() -> FunnelCounts:
    """Offer funnel: disparadas → ativadas → resgatadas."""
    return app_state.get_funnel()
