"use client";

import React, { useState } from "react";
import { Play, Pause, FastForward, RotateCcw, Activity } from "lucide-react";
import { api } from "@/lib/api";

interface SimulationControlsProps {
  onResetComplete?: () => void;
}

export function SimulationControls({ onResetComplete }: SimulationControlsProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const handleTogglePause = async () => {
    if (loading) return;
    try {
      setLoading(true);
      if (isPaused) {
        await api.resumeSimulation();
        setIsPaused(false);
      } else {
        await api.pauseSimulation();
        setIsPaused(true);
      }
    } catch (err) {
      console.error("Failed to toggle pause:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeedChange = async (speed: number) => {
    if (loading || currentSpeed === speed) return;
    try {
      setLoading(true);
      await api.setSimulationSpeed(speed);
      setCurrentSpeed(speed);
    } catch (err) {
      console.error("Failed to change speed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await api.resetSimulation();
      setIsPaused(false);
      setCurrentSpeed(1);
      if (onResetComplete) {
        onResetComplete();
      }
    } catch (err) {
      console.error("Failed to reset simulation:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-lg">
      {/* Simulation status pulse */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPaused ? "bg-amber-400" : "bg-emerald-400 animate-ping"
            }`}
          />
          <span
            className={`absolute w-2 h-2 rounded-full ${
              isPaused ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
        </div>
        <div className="text-xs">
          <span className="font-semibold text-zinc-200">
            {isPaused ? "Simulação Pausada" : "Motor 24/7 Operando"}
          </span>
          <span className="hidden sm:inline text-zinc-500 ml-1.5 text-[11px]">
            {isPaused ? "(Contadores congelados)" : "(Geração de transações & radar)"}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Pause / Resume */}
        <button
          onClick={handleTogglePause}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
            isPaused
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
              : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
          }`}
          title={isPaused ? "Retomar simulação" : "Pausar simulação"}
        >
          {isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Retomar</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pausar</span>
            </>
          )}
        </button>

        {/* Speed Selector */}
        <div className="flex items-center bg-zinc-850 p-0.5 rounded-xl border border-zinc-750">
          {[1, 2, 4, 8].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              disabled={loading}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                currentSpeed === s
                  ? "bg-zinc-700 text-emerald-400 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
          title="Resetar estado para o início do dia"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Resetar Demo</span>
        </button>
      </div>
    </div>
  );
}
