"""
Davita Intelligence Suite — Backend Entry Point.
FastAPI application with CORS, WebSocket, and simulation engine startup.
"""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.data.seed import SeedData
from app.routers import churn, customers, dashboard, offers, simulation, stores, transactions
from app.simulation.engine import start_simulation, stop_simulation
from app.state.store import app_state
from app.ws.manager import ws_manager

logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan: seed data on startup, start simulation loops,
    and clean up on shutdown.
    """
    logger.info("Initializing Davita Intelligence Suite backend...")

    # Seed the state store
    seed = SeedData()
    app_state.initialize(seed)
    logger.info(
        f"Seed loaded: {len(app_state.stores)} stores, "
        f"{len(app_state.products)} products, "
        f"{len(app_state.customers)} customers"
    )

    # Start simulation loops
    start_simulation()
    logger.info("Simulation engine running")

    yield

    # Shutdown
    stop_simulation()
    logger.info("Simulation engine stopped")


app = FastAPI(
    title="Davita Intelligence Suite API",
    description="CRM Preditivo & Retail Media engine for Davita supermarkets",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server and production deployments (Vercel, localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?:\/\/.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(stores.router)
app.include_router(customers.router)
app.include_router(offers.router)
app.include_router(churn.router)
app.include_router(transactions.router)
app.include_router(simulation.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "davita-intelligence-suite"}


@app.websocket("/ws/live")
async def websocket_endpoint(ws: WebSocket) -> None:
    """
    Real-time event stream.
    All simulation events are broadcast to every connected client.
    Clients receive events in the format:
    { "type": "<event_type>", "payload": {...}, "timestamp": "ISO-8601" }
    """
    await ws_manager.connect(ws)
    logger.info(f"WebSocket client connected (total: {ws_manager.active_count})")
    try:
        while True:
            # Keep connection alive; we don't expect client messages
            # but we must read to detect disconnects
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
        logger.info(f"WebSocket client disconnected (total: {ws_manager.active_count})")
    except Exception:
        ws_manager.disconnect(ws)
