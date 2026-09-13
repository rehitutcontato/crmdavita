"""
WebSocket connection manager — maintains active connections and broadcasts events.
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections and broadcasts events to all clients."""

    def __init__(self) -> None:
        self._connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self._connections:
            self._connections.remove(ws)

    async def broadcast(self, event_type: str, payload: dict[str, Any]) -> None:
        """Broadcast an event to all connected clients."""
        message = json.dumps(
            {
                "type": event_type,
                "payload": payload,
                "timestamp": datetime.utcnow().isoformat(),
            },
            default=str,  # handles datetime serialization
        )
        disconnected: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect(ws)

    @property
    def active_count(self) -> int:
        return len(self._connections)


# Global singleton
ws_manager = ConnectionManager()
