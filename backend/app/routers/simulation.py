"""Simulation control endpoints."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.data.seed import SeedData
from app.models.domain import MobileActivation
from app.simulation.clock import simulation_clock
from app.simulation.engine import (
    get_recent_activations,
    start_simulation,
    stop_simulation,
)
from app.state.store import app_state

router = APIRouter(prefix="/simulation", tags=["simulation"])


class SpeedRequest(BaseModel):
    multiplier: int


@router.post("/pause")
async def pause_simulation() -> dict[str, str]:
    simulation_clock.pause()
    return {"status": "paused"}


@router.post("/resume")
async def resume_simulation() -> dict[str, str]:
    simulation_clock.resume()
    return {"status": "resumed"}


@router.post("/speed")
async def set_speed(req: SpeedRequest) -> dict[str, object]:
    simulation_clock.set_speed(req.multiplier)
    return {"status": "ok", "multiplier": req.multiplier}


@router.post("/reset")
async def reset_simulation() -> dict[str, str]:
    """Stop simulation, reset all state to seed, restart simulation."""
    stop_simulation()
    simulation_clock.resume()
    simulation_clock.set_speed(1)

    seed = SeedData()
    app_state.initialize(seed)
    start_simulation()

    return {"status": "reset_complete"}


@router.get("/status")
async def simulation_status() -> dict[str, object]:
    return simulation_clock.status()


@router.get("/activations/recent")
async def recent_activations() -> list[MobileActivation]:
    return get_recent_activations()
