"""Offer endpoints."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.models.domain import Offer
from app.state.store import app_state
from app.ws.manager import ws_manager

router = APIRouter(tags=["offers"])


@router.get("/offers", response_model=list[Offer])
async def list_offers(customer_cpf: str | None = None) -> list[Offer]:
    """List offers, optionally filtered by customer CPF."""
    if customer_cpf:
        return app_state.get_customer_offers(customer_cpf)
    return list(app_state.offers.values())


@router.post("/offers/{offer_id}/activate")
async def activate_offer(offer_id: str) -> dict[str, object]:
    """
    Activate an offer — changes status from 'disparada' to 'ativada'.
    This is the opt-in step where the customer consciously activates the discount.
    """
    offer = app_state.offers.get(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.status != "disparada":
        raise HTTPException(
            status_code=400,
            detail=f"Offer cannot be activated (current status: {offer.status})",
        )

    offer.status = "ativada"
    offer.activated_at = datetime.utcnow()

    app_state.record_offer_activation(offer)

    # Broadcast activation event
    await ws_manager.broadcast("offer.activated", offer.model_dump(mode="json"))

    # Broadcast updated summary
    summary = app_state.get_dashboard_summary()
    await ws_manager.broadcast("dashboard.summary_updated", summary.model_dump(mode="json"))

    return {"status": "ok", "offer_id": offer.id, "new_status": offer.status}
