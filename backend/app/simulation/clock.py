"""
SimulationClock — controls speed, pause/resume for all simulation loops.
"""
from __future__ import annotations

import asyncio


class SimulationClock:
    """
    Global clock that governs the speed of all simulation loops.
    Multiplier divides the base sleep interval: multiplier=2 → half the wait.
    """

    def __init__(self) -> None:
        self._paused: bool = False
        self._multiplier: int = 1
        self._pause_event: asyncio.Event = asyncio.Event()
        self._pause_event.set()  # Start in running state

    @property
    def paused(self) -> bool:
        return self._paused

    @property
    def multiplier(self) -> int:
        return self._multiplier

    def pause(self) -> None:
        self._paused = True
        self._pause_event.clear()

    def resume(self) -> None:
        self._paused = False
        self._pause_event.set()

    def set_speed(self, multiplier: int) -> None:
        if multiplier not in (1, 2, 4, 8):
            raise ValueError("Multiplier must be 1, 2, 4 or 8")
        self._multiplier = multiplier

    async def sleep(self, base_seconds: float) -> None:
        """
        Sleep for base_seconds adjusted by multiplier.
        Respects pause: blocks indefinitely while paused.
        """
        await self._pause_event.wait()
        adjusted = base_seconds / self._multiplier
        await asyncio.sleep(adjusted)

    def status(self) -> dict[str, object]:
        return {
            "paused": self._paused,
            "multiplier": self._multiplier,
        }


# Global singleton
simulation_clock = SimulationClock()
