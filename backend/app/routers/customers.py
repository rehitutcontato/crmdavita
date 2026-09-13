"""Customer endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.domain import Customer, Transaction
from app.simulation.engine import simulate_purchase_for_customer
from app.state.store import app_state

router = APIRouter(tags=["customers"])


@router.get("/customers/{cpf}", response_model=Customer)
async def get_customer(cpf: str) -> Customer:
    """Get customer detail by CPF."""
    customer = app_state.customers.get(cpf)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/customers", response_model=dict[str, str])
async def get_demo_customer_cpf() -> dict[str, str]:
    """Return the demo customer CPF for the App Cliente."""
    return {"demo_cpf": app_state.demo_customer_cpf}


@router.post("/customers/{cpf}/simulate-purchase")
async def simulate_purchase(cpf: str) -> dict[str, object]:
    """
    Force an immediate transaction for this customer.
    Used by the "Simular Compra Agora" button in the App Cliente.
    """
    txn = await simulate_purchase_for_customer(cpf)
    if not txn:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"status": "ok", "transaction_id": txn.id, "total_value": txn.total_value}
