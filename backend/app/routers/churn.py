"""Churn alert endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.domain import ChurnAlert, Offer
from app.simulation.engine import create_offer_for_customer
from app.state.store import app_state
from app.ws.manager import ws_manager

router = APIRouter(tags=["churn"])


@router.get("/churn-alerts", response_model=list[ChurnAlert])
async def list_churn_alerts() -> list[ChurnAlert]:
    """All active churn alerts."""
    return app_state.get_active_churn_alerts()


@router.post("/churn-alerts/{alert_id}/trigger-campaign")
async def trigger_campaign(alert_id: str) -> dict[str, object]:
    """
    Create a predictive campaign offer from a churn alert.
    This fires a push notification to the customer's app.
    """
    alert = app_state.churn_alerts.get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status != "ativo":
        raise HTTPException(
            status_code=400,
            detail=f"Alert cannot trigger campaign (status: {alert.status})",
        )

    # Mark alert as campaign triggered
    alert.status = "campanha_disparada"
    app_state.campaigns_triggered_today += 1

    # Create the offer
    offer = await create_offer_for_customer(
        customer_cpf=alert.customer_cpf,
        category=alert.category,
    )

    # Broadcast updated summary
    summary = app_state.get_dashboard_summary()
    await ws_manager.broadcast("dashboard.summary_updated", summary.model_dump(mode="json"))

    return {
        "status": "ok",
        "alert_id": alert.id,
        "offer_id": offer.id,
        "customer_cpf": alert.customer_cpf,
        "category": alert.category,
    }
